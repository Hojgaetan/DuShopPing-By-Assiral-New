-- Empêche l'élévation de privilèges par raw_user_meta_data.role.
-- Les administrateurs sont reconnus exclusivement via public.administrateurs.

-- Normalise les éventuels anciens profils Admin sans spécialisation admin.
UPDATE public.utilisateurs u
SET type_utilisateur = 'Acheteur'
WHERE type_utilisateur = 'Admin'
  AND NOT EXISTS (
    SELECT 1
    FROM public.administrateurs a
    WHERE a.utilisateur_id = u.id
  );

-- Une boutique maximum par vendeur, nécessaire à l'upsert frontend.
CREATE UNIQUE INDEX IF NOT EXISTS boutiques_vendeur_id_unique
ON public.boutiques (vendeur_id);

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
    WHEN new.raw_user_meta_data->>'role' = 'Vendeur' THEN 'Vendeur'
    ELSE 'Acheteur'
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

  IF requested_role = 'Vendeur' THEN
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
  ELSE
    INSERT INTO public.acheteurs (id, id_appareil)
    VALUES (new.id, 'WEB')
    ON CONFLICT (id) DO NOTHING;
  END IF;

  RETURN new;
END;
$$;

-- Retire les anciennes autorisations qui faisaient confiance à une chaîne
-- type_utilisateur = Admin contrôlable lors de l'inscription.
DROP POLICY IF EXISTS "Admins peuvent modifier les boutiques" ON public.boutiques;
DROP POLICY IF EXISTS "Admins voient toutes les boutiques" ON public.boutiques;

-- Les politiques modernes utilisent public.is_admin(), fondée sur la table
-- public.administrateurs et non sur les métadonnées du client.
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC;
