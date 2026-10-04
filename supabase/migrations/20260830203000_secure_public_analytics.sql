-- Point d'entrée contrôlé pour les interactions publiques.
CREATE OR REPLACE FUNCTION public.record_public_interaction(
  product_uuid UUID,
  boutique_uuid UUID,
  action_name TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  resolved_boutique UUID;
BEGIN
  IF action_name NOT IN ('VueProfil', 'ClicWhatsApp', 'AppelDirect', 'VueProduit') THEN
    RAISE EXCEPTION 'Type d''interaction invalide';
  END IF;

  IF product_uuid IS NOT NULL THEN
    SELECT boutique_id INTO resolved_boutique
    FROM public.produits
    WHERE id = product_uuid
      AND statut = 'Actif';

    IF resolved_boutique IS NULL THEN
      RAISE EXCEPTION 'Produit actif introuvable';
    END IF;

    IF action_name = 'VueProfil' THEN
      RAISE EXCEPTION 'Action incompatible avec un produit';
    END IF;
  ELSE
    IF action_name <> 'VueProfil' OR boutique_uuid IS NULL THEN
      RAISE EXCEPTION 'Boutique ou action invalide';
    END IF;

    SELECT id INTO resolved_boutique
    FROM public.boutiques
    WHERE id = boutique_uuid
      AND statut_moderation = 'Approuvee';

    IF resolved_boutique IS NULL THEN
      RAISE EXCEPTION 'Boutique publique introuvable';
    END IF;
  END IF;

  INSERT INTO public.statistiques_interactions (
    produit_id, boutique_id, type_action, adresse_ip
  ) VALUES (
    product_uuid, resolved_boutique, action_name, NULL
  );

  IF action_name = 'VueProduit' THEN
    UPDATE public.produits
    SET vues_count = vues_count + 1
    WHERE id = product_uuid;
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.record_public_interaction(UUID, UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.record_public_interaction(UUID, UUID, TEXT) TO anon, authenticated;

-- Le vendeur peut consulter uniquement les interactions de sa boutique.
DROP POLICY IF EXISTS seller_read_own_interactions ON public.statistiques_interactions;

CREATE POLICY seller_read_own_interactions
ON public.statistiques_interactions
FOR SELECT
TO authenticated
USING (
  boutique_id IN (
    SELECT id
    FROM public.boutiques
    WHERE vendeur_id = auth.uid()
  )
);

DROP POLICY IF EXISTS admin_read_interactions ON public.statistiques_interactions;
CREATE POLICY admin_read_interactions
ON public.statistiques_interactions
FOR SELECT
TO authenticated
USING (public.is_admin());
