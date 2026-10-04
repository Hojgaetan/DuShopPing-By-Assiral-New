CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  destinataire_id UUID NOT NULL REFERENCES public.utilisateurs(id) ON DELETE CASCADE,
  titre TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'Information',
  lien TEXT,
  est_lue BOOLEAN NOT NULL DEFAULT false,
  date_creation TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS notifications_recipient_date_idx ON public.notifications(destinataire_id, date_creation DESC);
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS read_own_notifications ON public.notifications;
CREATE POLICY read_own_notifications ON public.notifications FOR SELECT TO authenticated USING (destinataire_id = auth.uid());

CREATE OR REPLACE FUNCTION public.mark_notification_read(notification_uuid UUID DEFAULT NULL)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.notifications SET est_lue = true
  WHERE destinataire_id = auth.uid() AND (notification_uuid IS NULL OR id = notification_uuid);
END; $$;
REVOKE ALL ON FUNCTION public.mark_notification_read(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.mark_notification_read(UUID) TO authenticated;

CREATE OR REPLACE FUNCTION public.notify_admin_role(role_name TEXT, notification_title TEXT, notification_message TEXT, notification_link TEXT)
RETURNS VOID LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  INSERT INTO public.notifications(destinataire_id, titre, message, type, lien)
  SELECT utilisateur_id, notification_title, notification_message, 'ActionRequise', notification_link
  FROM public.administrateurs WHERE role::text IN ('SuperAdmin', role_name);
$$;
REVOKE ALL ON FUNCTION public.notify_admin_role(TEXT, TEXT, TEXT, TEXT) FROM PUBLIC;

CREATE OR REPLACE FUNCTION public.handle_verification_notification()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.statut = 'EnAttente' AND (TG_OP = 'INSERT' OR OLD.statut IS DISTINCT FROM NEW.statut OR OLD.soumis_le IS DISTINCT FROM NEW.soumis_le) THEN
    PERFORM public.notify_admin_role('Moderateur', 'Nouveau dossier vendeur', 'Un vendeur a soumis des pièces à vérifier.', '/admin/verifications');
  ELSIF TG_OP = 'UPDATE' AND OLD.statut IS DISTINCT FROM NEW.statut AND NEW.statut IN ('Approuve', 'Rejete') THEN
    INSERT INTO public.notifications(destinataire_id, titre, message, type, lien)
    VALUES (NEW.vendeur_id,
      CASE WHEN NEW.statut = 'Approuve' THEN 'Identité approuvée' ELSE 'Vérification rejetée' END,
      CASE WHEN NEW.statut = 'Approuve' THEN 'Votre identité et votre boutique ont été approuvées.'
           ELSE 'Votre dossier a été rejeté. Consultez le motif et soumettez de nouvelles pièces.' END,
      'Verification', '/dashboard/profile');
  END IF;
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS verification_notification_trigger ON public.dossiers_verification_vendeurs;
CREATE TRIGGER verification_notification_trigger AFTER INSERT OR UPDATE ON public.dossiers_verification_vendeurs
FOR EACH ROW EXECUTE FUNCTION public.handle_verification_notification();

CREATE OR REPLACE FUNCTION public.handle_product_moderation_notification()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE seller_id UUID;
BEGIN
  IF OLD.statut IS DISTINCT FROM NEW.statut AND (NEW.statut = 'Bloque' OR OLD.statut = 'Bloque') THEN
    SELECT vendeur_id INTO seller_id FROM public.boutiques WHERE id = NEW.boutique_id;
    IF seller_id IS NOT NULL THEN
      INSERT INTO public.notifications(destinataire_id, titre, message, type, lien)
      VALUES (seller_id, CASE WHEN NEW.statut = 'Bloque' THEN 'Article bloqué' ELSE 'Article réactivé' END,
        CASE WHEN NEW.statut = 'Bloque' THEN 'Votre article « ' || NEW.titre || ' » a été bloqué par la modération.'
             ELSE 'Votre article « ' || NEW.titre || ' » a été réactivé.' END,
        'Moderation', '/dashboard/products');
    END IF;
  END IF;
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS product_moderation_notification_trigger ON public.produits;
CREATE TRIGGER product_moderation_notification_trigger AFTER UPDATE OF statut ON public.produits
FOR EACH ROW EXECUTE FUNCTION public.handle_product_moderation_notification();

CREATE OR REPLACE FUNCTION public.handle_payment_notification()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.statut = 'EnAttente' THEN
    PERFORM public.notify_admin_role('Commercial', 'Paiement Boost à vérifier', 'Une nouvelle preuve de paiement Boost a été soumise.', '/admin/payments');
  ELSIF TG_OP = 'UPDATE' AND OLD.statut IS DISTINCT FROM NEW.statut AND NEW.statut IN ('Reussi', 'Echoue') THEN
    INSERT INTO public.notifications(destinataire_id, titre, message, type, lien)
    VALUES (NEW.vendeur_id, CASE WHEN NEW.statut = 'Reussi' THEN 'Boost activé' ELSE 'Paiement Boost rejeté' END,
      CASE WHEN NEW.statut = 'Reussi' THEN 'Votre paiement a été validé et votre campagne Boost est activée.'
           ELSE 'Votre demande de paiement Boost a été rejetée. Vérifiez votre référence et vos preuves.' END,
      'Paiement', '/dashboard/boost');
  END IF;
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS payment_notification_trigger ON public.paiements;
CREATE TRIGGER payment_notification_trigger AFTER INSERT OR UPDATE OF statut ON public.paiements
FOR EACH ROW EXECUTE FUNCTION public.handle_payment_notification();
