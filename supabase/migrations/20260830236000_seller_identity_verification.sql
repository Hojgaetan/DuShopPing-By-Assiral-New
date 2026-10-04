INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('seller-verification', 'seller-verification', false, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf'])
ON CONFLICT (id) DO UPDATE SET public = false, file_size_limit = EXCLUDED.file_size_limit, allowed_mime_types = EXCLUDED.allowed_mime_types;

CREATE TABLE IF NOT EXISTS public.dossiers_verification_vendeurs (
  vendeur_id UUID PRIMARY KEY REFERENCES public.vendeurs(utilisateur_id) ON DELETE CASCADE,
  type_document TEXT NOT NULL CHECK (type_document IN ('CNI', 'Passeport', 'Permis')),
  document_recto_path TEXT NOT NULL,
  document_verso_path TEXT,
  statut TEXT NOT NULL DEFAULT 'EnAttente' CHECK (statut IN ('EnAttente', 'Approuve', 'Rejete')),
  motif_decision TEXT,
  soumis_le TIMESTAMPTZ NOT NULL DEFAULT now(),
  examine_le TIMESTAMPTZ,
  examine_par UUID REFERENCES public.administrateurs(utilisateur_id)
);

ALTER TABLE public.dossiers_verification_vendeurs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS seller_read_own_verification ON public.dossiers_verification_vendeurs;
CREATE POLICY seller_read_own_verification ON public.dossiers_verification_vendeurs
FOR SELECT TO authenticated USING (vendeur_id = auth.uid());

DROP POLICY IF EXISTS admin_read_verifications ON public.dossiers_verification_vendeurs;
CREATE POLICY admin_read_verifications ON public.dossiers_verification_vendeurs
FOR SELECT TO authenticated USING (public.is_admin());

DROP POLICY IF EXISTS seller_upload_verification_files ON storage.objects;
CREATE POLICY seller_upload_verification_files ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'seller-verification' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS seller_read_own_verification_files ON storage.objects;
CREATE POLICY seller_read_own_verification_files ON storage.objects
FOR SELECT TO authenticated
USING (bucket_id = 'seller-verification' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS admin_read_verification_files ON storage.objects;
CREATE POLICY admin_read_verification_files ON storage.objects
FOR SELECT TO authenticated
USING (bucket_id = 'seller-verification' AND public.is_admin());

CREATE OR REPLACE FUNCTION public.submit_seller_verification(document_type TEXT, recto_path TEXT, verso_path TEXT DEFAULT NULL)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL OR NOT EXISTS (SELECT 1 FROM public.vendeurs WHERE utilisateur_id = auth.uid()) THEN RAISE EXCEPTION 'Accès vendeur requis'; END IF;
  IF document_type NOT IN ('CNI', 'Passeport', 'Permis') THEN RAISE EXCEPTION 'Type de document invalide'; END IF;
  IF recto_path IS NULL OR recto_path NOT LIKE auth.uid()::text || '/%' THEN RAISE EXCEPTION 'Chemin du recto invalide'; END IF;
  IF verso_path IS NOT NULL AND verso_path NOT LIKE auth.uid()::text || '/%' THEN RAISE EXCEPTION 'Chemin du verso invalide'; END IF;
  INSERT INTO public.dossiers_verification_vendeurs(vendeur_id, type_document, document_recto_path, document_verso_path, statut, motif_decision, soumis_le, examine_le, examine_par)
  VALUES (auth.uid(), document_type, recto_path, verso_path, 'EnAttente', NULL, now(), NULL, NULL)
  ON CONFLICT (vendeur_id) DO UPDATE SET type_document = EXCLUDED.type_document, document_recto_path = EXCLUDED.document_recto_path,
    document_verso_path = EXCLUDED.document_verso_path, statut = 'EnAttente', motif_decision = NULL, soumis_le = now(), examine_le = NULL, examine_par = NULL;
  UPDATE public.vendeurs SET statut_verification = false WHERE utilisateur_id = auth.uid();
  UPDATE public.boutiques SET statut_moderation = 'EnAttente' WHERE vendeur_id = auth.uid();
END;
$$;

CREATE OR REPLACE FUNCTION public.review_seller_verification(seller_uuid UUID, approve_verification BOOLEAN, decision_reason TEXT DEFAULT NULL)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Accès administrateur requis'; END IF;
  IF NOT approve_verification AND NULLIF(trim(decision_reason), '') IS NULL THEN RAISE EXCEPTION 'Le motif du rejet est obligatoire'; END IF;
  UPDATE public.dossiers_verification_vendeurs SET statut = CASE WHEN approve_verification THEN 'Approuve' ELSE 'Rejete' END,
    motif_decision = NULLIF(trim(decision_reason), ''), examine_le = now(), examine_par = auth.uid()
  WHERE vendeur_id = seller_uuid;
  IF NOT FOUND THEN RAISE EXCEPTION 'Dossier introuvable'; END IF;
  UPDATE public.vendeurs SET statut_verification = approve_verification WHERE utilisateur_id = seller_uuid;
  UPDATE public.boutiques SET statut_moderation = CASE WHEN approve_verification THEN 'Approuvee' ELSE 'Rejetee' END WHERE vendeur_id = seller_uuid;
END;
$$;

REVOKE ALL ON FUNCTION public.submit_seller_verification(TEXT, TEXT, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.review_seller_verification(UUID, BOOLEAN, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.submit_seller_verification(TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.review_seller_verification(UUID, BOOLEAN, TEXT) TO authenticated;
