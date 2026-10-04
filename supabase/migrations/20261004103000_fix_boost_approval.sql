BEGIN;
-- Certaines installations historiques référencent plans_sponsorisation alors que
-- les paiements et le catalogue utilisent plan_sponsorisations.
DO $$
DECLARE constraint_record RECORD;
BEGIN
  FOR constraint_record IN
    SELECT c.conname FROM pg_constraint c
    JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = ANY(c.conkey)
    WHERE c.conrelid = 'public.campagnes_boost'::regclass AND c.contype = 'f' AND a.attname = 'plan_id'
      AND c.confrelid <> 'public.plan_sponsorisations'::regclass
  LOOP
    EXECUTE format('ALTER TABLE public.campagnes_boost DROP CONSTRAINT %I', constraint_record.conname);
  END LOOP;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint c JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = ANY(c.conkey)
    WHERE c.conrelid = 'public.campagnes_boost'::regclass AND c.contype = 'f' AND a.attname = 'plan_id'
      AND c.confrelid = 'public.plan_sponsorisations'::regclass) THEN
    ALTER TABLE public.campagnes_boost ADD CONSTRAINT campagnes_boost_plan_id_fkey
      FOREIGN KEY (plan_id) REFERENCES public.plan_sponsorisations(id) ON DELETE RESTRICT;
  END IF;
END; $$;
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
  starts_at TIMESTAMPTZ;
BEGIN
  IF NOT public.admin_has_permission('commercial') THEN
    RAISE EXCEPTION 'Permission commerciale requise';
  END IF;

  IF approve_payment IS NULL THEN RAISE EXCEPTION 'Décision de paiement obligatoire'; END IF;

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

  IF plan_duration IS NULL OR plan_duration <= 0 THEN
    RAISE EXCEPTION 'Plan introuvable';
  END IF;

  -- Verrouille le produit pour sérialiser les approbations et préserver un Boost actif.
  PERFORM 1 FROM public.produits p JOIN public.boutiques b ON b.id = p.boutique_id
  WHERE p.id = payment_record.produit_id AND b.vendeur_id = payment_record.vendeur_id AND p.statut = 'Actif'
  FOR UPDATE OF p;
  IF NOT FOUND THEN RAISE EXCEPTION 'Produit actif introuvable ou propriétaire invalide'; END IF;
  SELECT GREATEST(now(), COALESCE(max(date_fin), now())) INTO starts_at
  FROM public.campagnes_boost WHERE produit_id = payment_record.produit_id AND statut = 'EnCours';

  INSERT INTO public.campagnes_boost (produit_id, plan_id, date_debut, date_fin, statut)
  VALUES (payment_record.produit_id, payment_record.plan_id, starts_at, starts_at + make_interval(days => plan_duration), 'EnCours')
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


COMMIT;
