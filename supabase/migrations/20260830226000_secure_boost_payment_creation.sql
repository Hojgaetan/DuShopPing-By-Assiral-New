CREATE OR REPLACE FUNCTION public.create_pending_boost_payment(
  product_uuid UUID,
  plan_uuid UUID,
  payment_phone TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  authenticated_seller UUID := auth.uid();
  plan_price NUMERIC(10, 2);
  transaction_reference TEXT;
BEGIN
  IF authenticated_seller IS NULL THEN RAISE EXCEPTION 'Authentification requise'; END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.produits p
    JOIN public.boutiques b ON b.id = p.boutique_id
    WHERE p.id = product_uuid
      AND p.statut = 'Actif'
      AND b.vendeur_id = authenticated_seller
  ) THEN
    RAISE EXCEPTION 'Produit actif introuvable ou accès refusé';
  END IF;

  SELECT prix_unitaire INTO plan_price
  FROM public.plan_sponsorisations
  WHERE id = plan_uuid;

  IF plan_price IS NULL OR plan_price <= 0 THEN RAISE EXCEPTION 'Formule Boost invalide'; END IF;

  PERFORM pg_advisory_xact_lock(
    hashtextextended(authenticated_seller::TEXT || product_uuid::TEXT || plan_uuid::TEXT, 0)
  );

  IF EXISTS (
    SELECT 1 FROM public.paiements
    WHERE vendeur_id = authenticated_seller
      AND produit_id = product_uuid
      AND plan_id = plan_uuid
      AND statut = 'EnAttente'
  ) THEN
    RAISE EXCEPTION 'Une demande identique est déjà en attente de validation';
  END IF;

  transaction_reference := 'BOOST-' || upper(replace(gen_random_uuid()::TEXT, '-', ''));

  INSERT INTO public.paiements (
    vendeur_id, produit_id, plan_id, reference_transaction, montant,
    operateur, telephone_paiement, statut
  ) VALUES (
    authenticated_seller, product_uuid, plan_uuid, transaction_reference,
    plan_price, 'OM', NULLIF(trim(payment_phone), ''), 'EnAttente'
  );

  RETURN jsonb_build_object(
    'success', true,
    'transactionId', transaction_reference,
    'status', 'EnAttente',
    'amount', plan_price
  );
END;
$$;

DROP POLICY IF EXISTS insert_own_pending_payment ON public.paiements;

REVOKE ALL ON FUNCTION public.create_pending_boost_payment(UUID, UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_pending_boost_payment(UUID, UUID, TEXT) TO authenticated;

NOTIFY pgrst, 'reload schema';
