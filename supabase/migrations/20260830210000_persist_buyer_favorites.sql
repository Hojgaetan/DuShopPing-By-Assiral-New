-- Lecture des favoris du compte acheteur connecté.
CREATE OR REPLACE FUNCTION public.get_my_favorites()
RETURNS UUID[]
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(favoris, '{}'::UUID[])
  FROM public.acheteurs
  WHERE id = auth.uid();
$$;

-- Ajout/retrait atomique d'un produit actif dans les favoris.
CREATE OR REPLACE FUNCTION public.toggle_my_favorite(product_uuid UUID)
RETURNS UUID[]
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  updated_favorites UUID[];
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentification requise';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.utilisateurs
    WHERE id = auth.uid() AND type_utilisateur = 'Acheteur'
  ) THEN
    RAISE EXCEPTION 'Compte acheteur requis';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.produits
    WHERE id = product_uuid AND statut = 'Actif'
  ) THEN
    RAISE EXCEPTION 'Produit actif introuvable';
  END IF;

  INSERT INTO public.acheteurs (id, favoris)
  VALUES (auth.uid(), ARRAY[product_uuid])
  ON CONFLICT (id) DO UPDATE
  SET favoris = CASE
    WHEN product_uuid = ANY(COALESCE(acheteurs.favoris, '{}'::UUID[]))
      THEN array_remove(acheteurs.favoris, product_uuid)
    ELSE array_append(COALESCE(acheteurs.favoris, '{}'::UUID[]), product_uuid)
  END
  RETURNING favoris INTO updated_favorites;

  RETURN COALESCE(updated_favorites, '{}'::UUID[]);
END;
$$;

REVOKE ALL ON FUNCTION public.get_my_favorites() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.toggle_my_favorite(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_my_favorites() TO authenticated;
GRANT EXECUTE ON FUNCTION public.toggle_my_favorite(UUID) TO authenticated;

DROP POLICY IF EXISTS buyer_read_own_record ON public.acheteurs;
CREATE POLICY buyer_read_own_record
ON public.acheteurs
FOR SELECT
TO authenticated
USING (id = auth.uid());

DROP POLICY IF EXISTS buyer_update_own_record ON public.acheteurs;
CREATE POLICY buyer_update_own_record
ON public.acheteurs
FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());
