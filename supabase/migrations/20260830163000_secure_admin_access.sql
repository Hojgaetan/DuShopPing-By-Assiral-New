-- Centralise la vérification administrateur sans dépendre des métadonnées
-- modifiables du navigateur.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.administrateurs
    WHERE utilisateur_id = auth.uid()
  );
$$;

REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

-- Un administrateur doit pouvoir lire sa spécialisation afin que le frontend
-- établisse son rôle à la restauration de session.
DROP POLICY IF EXISTS select_own_admin_profile ON public.administrateurs;
CREATE POLICY select_own_admin_profile
ON public.administrateurs
FOR SELECT
TO authenticated
USING (utilisateur_id = auth.uid());

-- Gestion du catalogue par les administrateurs.
DROP POLICY IF EXISTS admin_manage_categories ON public.categories;
CREATE POLICY admin_manage_categories
ON public.categories
FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS admin_manage_boutiques ON public.boutiques;
CREATE POLICY admin_manage_boutiques
ON public.boutiques
FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS admin_manage_products ON public.produits;
CREATE POLICY admin_manage_products
ON public.produits
FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Les jointures de l'écran de modération nécessitent ces lectures.
DROP POLICY IF EXISTS admin_select_users ON public.utilisateurs;
CREATE POLICY admin_select_users
ON public.utilisateurs
FOR SELECT
TO authenticated
USING (public.is_admin());

DROP POLICY IF EXISTS admin_select_sellers ON public.vendeurs;
CREATE POLICY admin_select_sellers
ON public.vendeurs
FOR SELECT
TO authenticated
USING (public.is_admin());

-- Prépare également les écrans de monétisation et de publicité.
DROP POLICY IF EXISTS admin_manage_sponsoring_plans ON public.plan_sponsorisations;
CREATE POLICY admin_manage_sponsoring_plans
ON public.plan_sponsorisations
FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS admin_manage_external_ads ON public.publicites_externes;
CREATE POLICY admin_manage_external_ads
ON public.publicites_externes
FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());
