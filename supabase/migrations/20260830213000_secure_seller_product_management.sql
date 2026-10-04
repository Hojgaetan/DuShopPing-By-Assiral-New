-- Remplace la politique trop large par des opérations vendeur explicites.
DROP POLICY IF EXISTS manage_own_produits ON public.produits;
DROP POLICY IF EXISTS seller_insert_own_products ON public.produits;
DROP POLICY IF EXISTS seller_update_own_products ON public.produits;
DROP POLICY IF EXISTS seller_delete_own_products ON public.produits;

CREATE POLICY seller_insert_own_products ON public.produits
FOR INSERT TO authenticated
WITH CHECK (boutique_id IN (SELECT id FROM public.boutiques WHERE vendeur_id = auth.uid()));

CREATE POLICY seller_update_own_products ON public.produits
FOR UPDATE TO authenticated
USING (boutique_id IN (SELECT id FROM public.boutiques WHERE vendeur_id = auth.uid()))
WITH CHECK (boutique_id IN (SELECT id FROM public.boutiques WHERE vendeur_id = auth.uid()));

CREATE POLICY seller_delete_own_products ON public.produits
FOR DELETE TO authenticated
USING (
  statut <> 'Bloque'
  AND boutique_id IN (SELECT id FROM public.boutiques WHERE vendeur_id = auth.uid())
);

-- Protège les champs pilotés par l'administration et les campagnes Boost.
CREATE OR REPLACE FUNCTION public.protect_product_system_fields()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  -- Les fonctions SECURITY DEFINER de validation/expiration Boost s'exécutent
  -- avec le rôle propriétaire de la fonction, jamais comme anon/authenticated.
  IF current_user NOT IN ('anon', 'authenticated') THEN RETURN NEW; END IF;
  IF public.is_admin() THEN RETURN NEW; END IF;
  IF OLD.statut = 'Bloque' THEN RAISE EXCEPTION 'Produit bloqué par la modération'; END IF;
  IF NEW.est_sponsorise IS DISTINCT FROM OLD.est_sponsorise THEN RAISE EXCEPTION 'Le sponsoring est géré par le système'; END IF;
  IF NEW.boutique_id IS DISTINCT FROM OLD.boutique_id THEN RAISE EXCEPTION 'Transfert de boutique interdit'; END IF;
  IF NEW.statut = 'Bloque' THEN RAISE EXCEPTION 'Statut réservé à la modération'; END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_product_system_fields_trigger ON public.produits;
CREATE TRIGGER protect_product_system_fields_trigger
BEFORE UPDATE ON public.produits
FOR EACH ROW EXECUTE FUNCTION public.protect_product_system_fields();
