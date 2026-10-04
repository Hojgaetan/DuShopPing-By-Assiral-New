ALTER TABLE public.statistiques_interactions
  ADD COLUMN IF NOT EXISTS acteur_cle TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS statistiques_interactions_unique_actor_action_idx
  ON public.statistiques_interactions (
    boutique_id,
    COALESCE(produit_id, '00000000-0000-0000-0000-000000000000'::UUID),
    type_action,
    acteur_cle
  )
  WHERE acteur_cle IS NOT NULL;

DROP FUNCTION IF EXISTS public.record_public_interaction(UUID, UUID, TEXT);
DROP FUNCTION IF EXISTS public.record_public_interaction(UUID, UUID, TEXT, UUID);

CREATE FUNCTION public.record_public_interaction(
  product_uuid UUID,
  boutique_uuid UUID,
  action_name TEXT,
  visitor_token UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  resolved_boutique UUID;
  actor_key TEXT;
  inserted_count INTEGER;
BEGIN
  IF action_name NOT IN ('VueProfil', 'ClicWhatsApp', 'AppelDirect', 'VueProduit') THEN
    RAISE EXCEPTION 'Type d''interaction invalide';
  END IF;

  IF product_uuid IS NOT NULL THEN
    SELECT boutique_id INTO resolved_boutique
    FROM public.produits
    WHERE id = product_uuid AND statut = 'Actif';

    IF resolved_boutique IS NULL THEN RAISE EXCEPTION 'Produit actif introuvable'; END IF;
    IF action_name = 'VueProfil' THEN RAISE EXCEPTION 'Action incompatible avec un produit'; END IF;
  ELSE
    IF action_name <> 'VueProfil' OR boutique_uuid IS NULL THEN
      RAISE EXCEPTION 'Boutique ou action invalide';
    END IF;

    SELECT id INTO resolved_boutique
    FROM public.boutiques
    WHERE id = boutique_uuid AND statut_moderation = 'Approuvee';

    IF resolved_boutique IS NULL THEN RAISE EXCEPTION 'Boutique publique introuvable'; END IF;
  END IF;

  IF auth.uid() IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.boutiques
    WHERE id = resolved_boutique AND vendeur_id = auth.uid()
  ) THEN
    RETURN false;
  END IF;

  IF auth.uid() IS NOT NULL THEN
    actor_key := 'user:' || auth.uid()::TEXT;
  ELSIF visitor_token IS NOT NULL THEN
    actor_key := 'visitor:' || visitor_token::TEXT;
  ELSE
    RAISE EXCEPTION 'Identifiant visiteur requis';
  END IF;

  INSERT INTO public.statistiques_interactions (
    produit_id, boutique_id, type_action, adresse_ip, acteur_cle
  ) VALUES (
    product_uuid, resolved_boutique, action_name, NULL, actor_key
  )
  ON CONFLICT DO NOTHING;

  GET DIAGNOSTICS inserted_count = ROW_COUNT;

  IF inserted_count = 1 AND action_name = 'VueProduit' THEN
    UPDATE public.produits SET vues_count = vues_count + 1 WHERE id = product_uuid;
  END IF;

  RETURN inserted_count = 1;
END;
$$;

REVOKE ALL ON FUNCTION public.record_public_interaction(UUID, UUID, TEXT, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.record_public_interaction(UUID, UUID, TEXT, UUID) TO anon, authenticated;

NOTIFY pgrst, 'reload schema';
