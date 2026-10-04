CREATE OR REPLACE FUNCTION public.get_my_boost_requests()
RETURNS JSONB
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'id', pay.id,
        'reference', pay.reference_transaction,
        'amount', pay.montant,
        'operator', pay.operateur,
        'phone', pay.telephone_paiement,
        'status', pay.statut,
        'requestedAt', pay.date_paiement,
        'productTitle', p.titre,
        'planName', sp.nom_plan,
        'startsAt', cb.date_debut,
        'endsAt', cb.date_fin,
        'campaignStatus', cb.statut
      )
      ORDER BY pay.date_paiement DESC
    ),
    '[]'::jsonb
  )
  FROM public.paiements pay
  JOIN public.produits p ON p.id = pay.produit_id
  JOIN public.plan_sponsorisations sp ON sp.id = pay.plan_id
  LEFT JOIN public.campagnes_boost cb ON cb.id = pay.campagne_id
  WHERE pay.vendeur_id = auth.uid();
$$;

REVOKE ALL ON FUNCTION public.get_my_boost_requests() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_my_boost_requests() TO authenticated;
