-- Restaure l'accès admin nécessaire à l'écran Paiements Boost.
-- Le listing des paiements joint `paiements` à `vendeurs` puis `utilisateurs` ;
-- ces lectures doivent être autorisées à tout administrateur.

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

DROP POLICY IF EXISTS admin_manage_payments ON public.paiements;
CREATE POLICY admin_manage_payments
ON public.paiements
FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE OR REPLACE FUNCTION public.review_boost_payment(payment_uuid UUID, approve_payment BOOLEAN)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  payment_record public.paiements%ROWTYPE;
  plan_duration INTEGER;
  campaign_uuid UUID;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Accès administrateur requis';
  END IF;

  SELECT * INTO payment_record
  FROM public.paiements
  WHERE id = payment_uuid
  FOR UPDATE;

  IF NOT FOUND OR payment_record.statut <> 'EnAttente' THEN
    RAISE EXCEPTION 'Demande absente ou déjà traitée';
  END IF;

  IF NOT approve_payment THEN
    UPDATE public.paiements SET statut = 'Echoue' WHERE id = payment_uuid;
    RETURN NULL;
  END IF;

  IF payment_record.produit_id IS NULL OR payment_record.plan_id IS NULL THEN
    RAISE EXCEPTION 'Produit ou plan manquant';
  END IF;

  SELECT duree_en_jours INTO plan_duration
  FROM public.plan_sponsorisations
  WHERE id = payment_record.plan_id;

  IF plan_duration IS NULL THEN
    RAISE EXCEPTION 'Plan introuvable';
  END IF;

  INSERT INTO public.campagnes_boost (produit_id, plan_id, date_debut, date_fin, statut)
  VALUES (payment_record.produit_id, payment_record.plan_id, now(), now() + make_interval(days => plan_duration), 'EnCours')
  RETURNING id INTO campaign_uuid;

  UPDATE public.paiements
  SET statut = 'Reussi', campagne_id = campaign_uuid
  WHERE id = payment_uuid;

  UPDATE public.produits SET est_sponsorise = true WHERE id = payment_record.produit_id;
  RETURN campaign_uuid;
END;
$$;

REVOKE ALL ON FUNCTION public.review_boost_payment(UUID, BOOLEAN) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.review_boost_payment(UUID, BOOLEAN) TO authenticated;

NOTIFY pgrst, 'reload schema';

