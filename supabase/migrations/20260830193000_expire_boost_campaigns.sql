-- Maintient les campagnes et le marqueur produit en cohérence avec le temps.
CREATE OR REPLACE FUNCTION public.refresh_expired_boosts()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  expired_count INTEGER;
BEGIN
  UPDATE public.campagnes_boost
  SET statut = 'Expire'
  WHERE statut = 'EnCours'
    AND date_fin <= now();

  GET DIAGNOSTICS expired_count = ROW_COUNT;

  -- Active le marqueur lorsqu'au moins une campagne valide existe.
  UPDATE public.produits p
  SET est_sponsorise = true
  WHERE est_sponsorise = false
    AND EXISTS (
      SELECT 1
      FROM public.campagnes_boost c
      WHERE c.produit_id = p.id
        AND c.statut = 'EnCours'
        AND c.date_debut <= now()
        AND c.date_fin > now()
    );

  -- Retire le marqueur seulement lorsqu'aucune autre campagne valide ne reste.
  UPDATE public.produits p
  SET est_sponsorise = false
  WHERE est_sponsorise = true
    AND NOT EXISTS (
      SELECT 1
      FROM public.campagnes_boost c
      WHERE c.produit_id = p.id
        AND c.statut = 'EnCours'
        AND c.date_debut <= now()
        AND c.date_fin > now()
    );

  RETURN expired_count;
END;
$$;

REVOKE ALL ON FUNCTION public.refresh_expired_boosts() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.refresh_expired_boosts() TO anon, authenticated;
