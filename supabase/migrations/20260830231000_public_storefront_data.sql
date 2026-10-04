CREATE OR REPLACE FUNCTION public.get_public_storefront(store_reference TEXT)
RETURNS JSONB
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'id', b.id,
    'nom', b.nom,
    'description', b.description,
    'localisation', b.localisation,
    'logo_url', b.logo_url,
    'verified', COALESCE(v.statut_verification, false)
  )
  FROM public.boutiques b
  JOIN public.vendeurs v ON v.utilisateur_id = b.vendeur_id
  WHERE b.statut_moderation = 'Approuvee'
    AND (
      b.id::TEXT = store_reference
      OR lower(b.nom) = lower(store_reference)
    )
  ORDER BY (b.id::TEXT = store_reference) DESC
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.get_public_storefront(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_storefront(TEXT) TO anon, authenticated;
