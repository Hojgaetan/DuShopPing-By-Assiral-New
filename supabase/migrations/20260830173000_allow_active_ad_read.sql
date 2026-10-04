-- Les visiteurs peuvent lire uniquement les campagnes actives dans leur
-- période de diffusion. Les autres opérations restent réservées aux admins.
DROP POLICY IF EXISTS select_active_external_ads ON public.publicites_externes;

CREATE POLICY select_active_external_ads
ON public.publicites_externes
FOR SELECT
TO public
USING (
  statut = true
  AND date_debut <= now()
  AND date_fin >= now()
);
