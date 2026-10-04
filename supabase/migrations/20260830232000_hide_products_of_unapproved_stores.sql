DROP POLICY IF EXISTS select_produits_actifs ON public.produits;
DROP POLICY IF EXISTS "Les produits actifs sont publics" ON public.produits;
DROP POLICY IF EXISTS public_select_approved_store_products ON public.produits;

CREATE POLICY public_select_approved_store_products ON public.produits
FOR SELECT TO anon, authenticated
USING (statut = 'Actif' AND EXISTS (
  SELECT 1 FROM public.boutiques b
  WHERE b.id = boutique_id AND b.statut_moderation = 'Approuvee'
));

CREATE OR REPLACE FUNCTION public.record_public_interaction(
  product_uuid UUID, boutique_uuid UUID, action_name TEXT, visitor_token UUID
)
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE resolved_boutique UUID; actor_key TEXT; inserted_count INTEGER;
BEGIN
  IF action_name NOT IN ('VueProfil', 'ClicWhatsApp', 'AppelDirect', 'VueProduit') THEN RAISE EXCEPTION 'Type d''interaction invalide'; END IF;
  IF product_uuid IS NOT NULL THEN
    SELECT p.boutique_id INTO resolved_boutique FROM public.produits p JOIN public.boutiques b ON b.id = p.boutique_id
    WHERE p.id = product_uuid AND p.statut = 'Actif' AND b.statut_moderation = 'Approuvee';
    IF resolved_boutique IS NULL THEN RAISE EXCEPTION 'Produit public introuvable'; END IF;
    IF action_name = 'VueProfil' THEN RAISE EXCEPTION 'Action incompatible avec un produit'; END IF;
  ELSE
    IF action_name <> 'VueProfil' OR boutique_uuid IS NULL THEN RAISE EXCEPTION 'Boutique ou action invalide'; END IF;
    SELECT id INTO resolved_boutique FROM public.boutiques WHERE id = boutique_uuid AND statut_moderation = 'Approuvee';
    IF resolved_boutique IS NULL THEN RAISE EXCEPTION 'Boutique publique introuvable'; END IF;
  END IF;
  IF auth.uid() IS NOT NULL AND EXISTS (SELECT 1 FROM public.boutiques WHERE id = resolved_boutique AND vendeur_id = auth.uid()) THEN RETURN false; END IF;
  IF auth.uid() IS NOT NULL THEN actor_key := 'user:' || auth.uid()::TEXT;
  ELSIF visitor_token IS NOT NULL THEN actor_key := 'visitor:' || visitor_token::TEXT;
  ELSE RAISE EXCEPTION 'Identifiant visiteur requis'; END IF;
  INSERT INTO public.statistiques_interactions (produit_id, boutique_id, type_action, adresse_ip, acteur_cle)
  VALUES (product_uuid, resolved_boutique, action_name, NULL, actor_key) ON CONFLICT DO NOTHING;
  GET DIAGNOSTICS inserted_count = ROW_COUNT;
  IF inserted_count = 1 AND action_name = 'VueProduit' THEN UPDATE public.produits SET vues_count = vues_count + 1 WHERE id = product_uuid; END IF;
  RETURN inserted_count = 1;
END;
$$;

REVOKE ALL ON FUNCTION public.record_public_interaction(UUID, UUID, TEXT, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.record_public_interaction(UUID, UUID, TEXT, UUID) TO anon, authenticated;
NOTIFY pgrst, 'reload schema';
