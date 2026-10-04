CREATE OR REPLACE FUNCTION public.review_boutique(
  boutique_uuid UUID,
  moderation_status TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Accès administrateur requis'; END IF;
  IF moderation_status NOT IN ('EnAttente', 'Approuvee', 'Rejetee') THEN
    RAISE EXCEPTION 'Statut de modération invalide';
  END IF;
  IF moderation_status = 'Approuvee' THEN
    UPDATE public.boutiques SET statut_moderation = 'Approuvee' WHERE id = boutique_uuid;
  ELSIF moderation_status = 'Rejetee' THEN
    UPDATE public.boutiques SET statut_moderation = 'Rejetee' WHERE id = boutique_uuid;
  ELSE
    UPDATE public.boutiques SET statut_moderation = 'EnAttente' WHERE id = boutique_uuid;
  END IF;
  IF NOT FOUND THEN RAISE EXCEPTION 'Boutique introuvable'; END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.set_seller_account_status(
  seller_uuid UUID,
  account_status TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Accès administrateur requis'; END IF;
  IF account_status NOT IN ('Actif', 'Suspendu') THEN RAISE EXCEPTION 'Statut de compte invalide'; END IF;
  IF account_status = 'Suspendu' THEN
    UPDATE public.utilisateurs u SET statut_compte = 'Suspendu'
    WHERE u.id = seller_uuid AND EXISTS (SELECT 1 FROM public.vendeurs v WHERE v.utilisateur_id = u.id);
  ELSE
    UPDATE public.utilisateurs u SET statut_compte = 'Actif'
    WHERE u.id = seller_uuid AND EXISTS (SELECT 1 FROM public.vendeurs v WHERE v.utilisateur_id = u.id);
  END IF;
  IF NOT FOUND THEN RAISE EXCEPTION 'Vendeur introuvable'; END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.review_boutique(UUID, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.set_seller_account_status(UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.review_boutique(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_seller_account_status(UUID, TEXT) TO authenticated;
