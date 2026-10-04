CREATE OR REPLACE FUNCTION public.get_admin_dashboard_overview()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE result JSONB;
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Accès administrateur requis'; END IF;
  SELECT jsonb_build_object(
    'vendeurs_total', (SELECT count(*) FROM public.vendeurs),
    'boutiques_total', (SELECT count(*) FROM public.boutiques),
    'boutiques_en_attente', (SELECT count(*) FROM public.boutiques WHERE statut_moderation = 'EnAttente'),
    'boutiques_approuvees', (SELECT count(*) FROM public.boutiques WHERE statut_moderation = 'Approuvee'),
    'produits_total', (SELECT count(*) FROM public.produits),
    'produits_actifs', (SELECT count(*) FROM public.produits WHERE statut = 'Actif'),
    'produits_bloques', (SELECT count(*) FROM public.produits WHERE statut = 'Bloque'),
    'paiements_en_attente', (SELECT count(*) FROM public.paiements WHERE statut = 'EnAttente'),
    'revenus_boost', COALESCE((SELECT sum(montant) FROM public.paiements WHERE statut = 'Reussi'), 0),
    'paiements_valides', (SELECT count(*) FROM public.paiements WHERE statut = 'Reussi'),
    'derniers_paiements', COALESCE((SELECT jsonb_agg(row_data ORDER BY date_paiement DESC) FROM (
      SELECT jsonb_build_object('id', p.id, 'reference_transaction', p.reference_transaction, 'montant', p.montant, 'statut', p.statut, 'date_paiement', p.date_paiement) AS row_data, p.date_paiement
      FROM public.paiements p ORDER BY p.date_paiement DESC LIMIT 5
    ) recent), '[]'::jsonb)
  ) INTO result;
  RETURN result;
END;
$$;
REVOKE ALL ON FUNCTION public.get_admin_dashboard_overview() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_admin_dashboard_overview() TO authenticated;
