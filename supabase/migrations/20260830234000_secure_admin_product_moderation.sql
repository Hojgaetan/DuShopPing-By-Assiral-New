CREATE OR REPLACE FUNCTION public.moderate_product(product_uuid UUID, moderation_status TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Accès administrateur requis'; END IF;
  IF moderation_status = 'Actif' THEN
    UPDATE public.produits SET statut = 'Actif' WHERE id = product_uuid;
  ELSIF moderation_status = 'Bloque' THEN
    UPDATE public.produits SET statut = 'Bloque' WHERE id = product_uuid;
  ELSE
    RAISE EXCEPTION 'Statut de modération produit invalide';
  END IF;
  IF NOT FOUND THEN RAISE EXCEPTION 'Produit introuvable'; END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.moderate_product(UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.moderate_product(UUID, TEXT) TO authenticated;
