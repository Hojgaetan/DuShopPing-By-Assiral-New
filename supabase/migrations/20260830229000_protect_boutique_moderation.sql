CREATE OR REPLACE FUNCTION public.protect_boutique_moderation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Une nouvelle boutique commence toujours en attente.
    IF NOT public.is_admin() THEN NEW.statut_moderation := 'EnAttente'; END IF;
    RETURN NEW;
  END IF;

  IF public.is_admin() THEN RETURN NEW; END IF;

  IF NEW.vendeur_id IS DISTINCT FROM OLD.vendeur_id THEN
    RAISE EXCEPTION 'Le propriétaire de la boutique ne peut pas être modifié';
  END IF;

  IF NEW.nom IS DISTINCT FROM OLD.nom
    OR NEW.description IS DISTINCT FROM OLD.description
    OR NEW.localisation IS DISTINCT FROM OLD.localisation
    OR NEW.logo_url IS DISTINCT FROM OLD.logo_url
  THEN
    NEW.statut_moderation := 'EnAttente';
  ELSIF NEW.statut_moderation IS DISTINCT FROM OLD.statut_moderation THEN
    RAISE EXCEPTION 'Le statut de modération est réservé à l’administration';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_boutique_moderation_trigger ON public.boutiques;
CREATE TRIGGER protect_boutique_moderation_trigger
BEFORE INSERT OR UPDATE ON public.boutiques
FOR EACH ROW EXECUTE FUNCTION public.protect_boutique_moderation();
