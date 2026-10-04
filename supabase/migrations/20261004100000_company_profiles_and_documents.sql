BEGIN;
-- Préserve les anciens comptes acheteurs en les convertissant en vendeurs.
UPDATE public.utilisateurs SET type_utilisateur = 'Vendeur' WHERE type_utilisateur = 'Acheteur';
INSERT INTO public.vendeurs(utilisateur_id, statut_verification)
SELECT id, false FROM public.utilisateurs WHERE type_utilisateur IN ('Vendeur', 'Entreprise')
ON CONFLICT (utilisateur_id) DO NOTHING;
INSERT INTO public.boutiques(vendeur_id, nom, statut_moderation)
SELECT u.id, 'Boutique de ' || u.nom, 'EnAttente' FROM public.utilisateurs u
WHERE u.type_utilisateur IN ('Vendeur', 'Entreprise')
ON CONFLICT (vendeur_id) DO NOTHING;

ALTER TABLE public.dossiers_verification_vendeurs ADD COLUMN IF NOT EXISTS document_rcc_path TEXT;
DROP FUNCTION IF EXISTS public.submit_seller_verification(TEXT, TEXT, TEXT);
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  requested_role TEXT;
BEGIN
  requested_role := CASE
    WHEN new.raw_user_meta_data->>'role' = 'Entreprise' THEN 'Entreprise'
    ELSE 'Vendeur'
  END;

  INSERT INTO public.utilisateurs (id, nom, email, telephone, type_utilisateur)
  VALUES (
    new.id,
    COALESCE(NULLIF(new.raw_user_meta_data->>'nom', ''), split_part(new.email, '@', 1)),
    new.email,
    NULLIF(new.raw_user_meta_data->>'telephone', ''),
    requested_role
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    nom = EXCLUDED.nom,
    telephone = EXCLUDED.telephone,
    type_utilisateur = EXCLUDED.type_utilisateur;

  IF requested_role IN ('Vendeur', 'Entreprise') THEN
    INSERT INTO public.vendeurs (utilisateur_id, statut_verification)
    VALUES (new.id, false)
    ON CONFLICT (utilisateur_id) DO NOTHING;

    INSERT INTO public.boutiques (vendeur_id, nom, localisation)
    VALUES (
      new.id,
      COALESCE(NULLIF(new.raw_user_meta_data->>'nom_boutique', ''), 'Boutique de ' || split_part(new.email, '@', 1)),
      NULLIF(new.raw_user_meta_data->>'localisation', '')
    )
    ON CONFLICT (vendeur_id) DO NOTHING;
  END IF;

  RETURN new;
END;
$$;


CREATE OR REPLACE FUNCTION public.submit_seller_verification(document_type TEXT, recto_path TEXT, verso_path TEXT DEFAULT NULL, rcc_path TEXT DEFAULT NULL)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL OR NOT EXISTS (SELECT 1 FROM public.vendeurs WHERE utilisateur_id = auth.uid()) THEN RAISE EXCEPTION 'Accès vendeur requis'; END IF;
  IF document_type IS NULL OR document_type NOT IN ('CNI', 'Passeport', 'Permis') THEN RAISE EXCEPTION 'Type de document invalide'; END IF;
  IF recto_path IS NULL OR recto_path NOT LIKE auth.uid()::text || '/%' THEN RAISE EXCEPTION 'Chemin du recto invalide'; END IF;
  IF verso_path IS NOT NULL AND verso_path NOT LIKE auth.uid()::text || '/%' THEN RAISE EXCEPTION 'Chemin du verso invalide'; END IF;
  IF document_type = 'CNI' AND verso_path IS NULL THEN RAISE EXCEPTION 'Le verso de la CNI est obligatoire'; END IF;
  IF EXISTS (SELECT 1 FROM public.utilisateurs WHERE id = auth.uid() AND type_utilisateur = 'Entreprise')
     AND (document_type <> 'CNI' OR rcc_path IS NULL) THEN RAISE EXCEPTION 'La CNI et le RCC sont obligatoires pour une entreprise'; END IF;
  IF rcc_path IS NOT NULL AND rcc_path NOT LIKE auth.uid()::text || '/%' THEN RAISE EXCEPTION 'Chemin du RCC invalide'; END IF;
  IF NOT EXISTS (SELECT 1 FROM storage.objects WHERE bucket_id = 'seller-verification' AND name = recto_path)
    OR (verso_path IS NOT NULL AND NOT EXISTS (SELECT 1 FROM storage.objects WHERE bucket_id = 'seller-verification' AND name = verso_path))
    OR (rcc_path IS NOT NULL AND NOT EXISTS (SELECT 1 FROM storage.objects WHERE bucket_id = 'seller-verification' AND name = rcc_path))
    THEN RAISE EXCEPTION 'Document absent du stockage privé'; END IF;
  INSERT INTO public.dossiers_verification_vendeurs(vendeur_id, type_document, document_recto_path, document_verso_path, document_rcc_path, statut, motif_decision, soumis_le, examine_le, examine_par)
  VALUES (auth.uid(), document_type, recto_path, verso_path, rcc_path, 'EnAttente', NULL, now(), NULL, NULL)
  ON CONFLICT (vendeur_id) DO UPDATE SET type_document = EXCLUDED.type_document, document_recto_path = EXCLUDED.document_recto_path,
    document_verso_path = EXCLUDED.document_verso_path, document_rcc_path = EXCLUDED.document_rcc_path, statut = 'EnAttente', motif_decision = NULL, soumis_le = now(), examine_le = NULL, examine_par = NULL;
  UPDATE public.vendeurs SET statut_verification = false WHERE utilisateur_id = auth.uid();
  UPDATE public.boutiques SET statut_moderation = 'EnAttente' WHERE vendeur_id = auth.uid();
END;
$$;


CREATE OR REPLACE FUNCTION public.protect_boutique_moderation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  IF NEW.statut_moderation = 'Approuvee' AND EXISTS (
    SELECT 1 FROM public.utilisateurs WHERE id = NEW.vendeur_id AND type_utilisateur = 'Entreprise'
  ) AND NOT EXISTS (
    SELECT 1 FROM public.dossiers_verification_vendeurs WHERE vendeur_id = NEW.vendeur_id
      AND statut = 'Approuve' AND type_document = 'CNI' AND document_verso_path IS NOT NULL AND document_rcc_path IS NOT NULL
  ) THEN RAISE EXCEPTION 'Le dossier CNI et RCC doit être approuvé avant la boutique entreprise'; END IF;
  -- Autorise la remise en attente depuis la RPC de soumission, sans ouvrir les écritures du navigateur.
  IF current_user NOT IN ('anon', 'authenticated') THEN RETURN NEW; END IF;
  IF TG_OP = 'INSERT' THEN
    -- Une nouvelle boutique commence toujours en attente.
    IF NOT public.is_admin() THEN NEW.statut_moderation := 'EnAttente'; END IF;
    RETURN NEW;
  END IF;

  IF public.is_admin() THEN RETURN NEW; END IF;

  IF NEW.vendeur_id IS DISTINCT FROM OLD.vendeur_id THEN
    RAISE EXCEPTION 'Le propriétaire de la boutique ne peut pas être modifié';
  END IF;

  IF NEW.nom IS DISTINCT FROM OLD.nom
    OR NEW.description IS DISTINCT FROM OLD.description
    OR NEW.localisation IS DISTINCT FROM OLD.localisation
    OR NEW.logo_url IS DISTINCT FROM OLD.logo_url
  THEN
    NEW.statut_moderation := 'EnAttente';
  ELSIF NEW.statut_moderation IS DISTINCT FROM OLD.statut_moderation THEN
    RAISE EXCEPTION 'Le statut de modération est réservé à l’administration';
  END IF;

  RETURN NEW;
END;
$$;


CREATE OR REPLACE FUNCTION public.update_my_profile(profile_name TEXT, profile_phone TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  normalized_name TEXT := trim(COALESCE(profile_name, ''));
  normalized_phone TEXT := regexp_replace(COALESCE(profile_phone, ''), '[^0-9]', '', 'g');
  user_type TEXT;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Authentification requise'; END IF;
  IF length(normalized_name) < 2 OR length(normalized_name) > 100 THEN
    RAISE EXCEPTION 'Le nom doit contenir entre 2 et 100 caractères';
  END IF;

  SELECT type_utilisateur::TEXT INTO user_type
  FROM public.utilisateurs WHERE id = auth.uid();

  IF user_type IN ('Vendeur', 'Entreprise') AND normalized_phone !~ '^2376[0-9]{8}$' THEN
    RAISE EXCEPTION 'Le téléphone doit être au format +237 6XXXXXXXX';
  END IF;

  UPDATE public.utilisateurs
  SET nom = normalized_name,
      telephone = CASE WHEN normalized_phone = '' THEN NULL ELSE '+' || normalized_phone END
  WHERE id = auth.uid();

  RETURN jsonb_build_object(
    'nom', normalized_name,
    'telephone', CASE WHEN normalized_phone = '' THEN NULL ELSE '+' || normalized_phone END
  );
END;
$$;

REVOKE ALL ON FUNCTION public.update_my_profile(TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.update_my_profile(TEXT, TEXT) TO authenticated;

REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.submit_seller_verification(TEXT, TEXT, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.submit_seller_verification(TEXT, TEXT, TEXT, TEXT) TO authenticated;
NOTIFY pgrst, 'reload schema';
COMMIT;
