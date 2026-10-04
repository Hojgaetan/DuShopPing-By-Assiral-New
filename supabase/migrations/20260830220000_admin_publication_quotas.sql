CREATE TABLE IF NOT EXISTS public.configuration_publication (
  singleton BOOLEAN PRIMARY KEY DEFAULT true CHECK (singleton = true),
  max_produits_gratuits INTEGER NOT NULL DEFAULT 5 CHECK (max_produits_gratuits > 0),
  est_actif BOOLEAN NOT NULL DEFAULT true,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO public.configuration_publication (singleton)
VALUES (true) ON CONFLICT (singleton) DO NOTHING;

ALTER TABLE public.configuration_publication ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.get_publication_configuration()
RETURNS JSONB LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT jsonb_build_object('max', max_produits_gratuits, 'enabled', est_actif, 'updated_at', updated_at)
  FROM public.configuration_publication WHERE singleton = true;
$$;

CREATE OR REPLACE FUNCTION public.update_publication_configuration(max_products INTEGER, quota_enabled BOOLEAN)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.is_admin() THEN RAISE EXCEPTION 'Accès administrateur requis'; END IF;
  IF max_products < 1 OR max_products > 1000 THEN RAISE EXCEPTION 'Limite invalide'; END IF;
  UPDATE public.configuration_publication SET max_produits_gratuits = max_products, est_actif = quota_enabled, updated_at = now() WHERE singleton = true;
  RETURN public.get_publication_configuration();
END;
$$;

CREATE OR REPLACE FUNCTION public.get_publishing_quota(boutique_uuid UUID)
RETURNS JSONB LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE quota_max INTEGER; quota_enabled BOOLEAN; used_count INTEGER; has_boost BOOLEAN;
BEGIN
  IF NOT public.is_admin() AND NOT EXISTS (SELECT 1 FROM public.boutiques WHERE id = boutique_uuid AND vendeur_id = auth.uid()) THEN RAISE EXCEPTION 'Accès refusé'; END IF;
  SELECT max_produits_gratuits, est_actif INTO quota_max, quota_enabled FROM public.configuration_publication WHERE singleton = true;
  SELECT count(*) INTO used_count FROM public.produits WHERE boutique_id = boutique_uuid AND statut <> 'Vendu';
  SELECT EXISTS (SELECT 1 FROM public.campagnes_boost c JOIN public.produits p ON p.id = c.produit_id WHERE p.boutique_id = boutique_uuid AND c.statut = 'EnCours' AND c.date_debut <= now() AND c.date_fin > now()) INTO has_boost;
  RETURN jsonb_build_object('used', used_count, 'max', quota_max, 'enabled', quota_enabled, 'unlimited', (NOT quota_enabled OR has_boost));
END;
$$;

CREATE OR REPLACE FUNCTION public.enforce_publishing_quota()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE quota_max INTEGER; quota_enabled BOOLEAN; used_count INTEGER; has_boost BOOLEAN;
BEGIN
  IF NEW.statut = 'Vendu' THEN RETURN NEW; END IF;
  IF TG_OP = 'UPDATE' AND OLD.statut <> 'Vendu' THEN RETURN NEW; END IF;
  SELECT max_produits_gratuits, est_actif INTO quota_max, quota_enabled FROM public.configuration_publication WHERE singleton = true;
  IF NOT quota_enabled THEN RETURN NEW; END IF;
  SELECT EXISTS (SELECT 1 FROM public.campagnes_boost c JOIN public.produits p ON p.id = c.produit_id WHERE p.boutique_id = NEW.boutique_id AND c.statut = 'EnCours' AND c.date_debut <= now() AND c.date_fin > now()) INTO has_boost;
  IF has_boost THEN RETURN NEW; END IF;
  SELECT count(*) INTO used_count FROM public.produits WHERE boutique_id = NEW.boutique_id AND statut <> 'Vendu';
  IF used_count >= quota_max THEN RAISE EXCEPTION 'Quota de publication atteint (% produits)', quota_max; END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_publishing_quota_trigger ON public.produits;
CREATE TRIGGER enforce_publishing_quota_trigger BEFORE INSERT OR UPDATE OF statut ON public.produits FOR EACH ROW EXECUTE FUNCTION public.enforce_publishing_quota();

REVOKE ALL ON FUNCTION public.get_publication_configuration() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.update_publication_configuration(INTEGER, BOOLEAN) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_publishing_quota(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_publication_configuration() TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_publication_configuration(INTEGER, BOOLEAN) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_publishing_quota(UUID) TO authenticated;
