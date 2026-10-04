CREATE TABLE IF NOT EXISTS public.journal_administration (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  administrateur_id UUID NOT NULL REFERENCES public.utilisateurs(id),
  action TEXT NOT NULL,
  table_cible TEXT NOT NULL,
  cible_id TEXT,
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  date_action TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS admin_audit_date_idx ON public.journal_administration(date_action DESC);
ALTER TABLE public.journal_administration ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS superadmin_read_audit_log ON public.journal_administration;
CREATE POLICY superadmin_read_audit_log ON public.journal_administration FOR SELECT TO authenticated
USING (public.admin_has_permission('superadmin'));

CREATE OR REPLACE FUNCTION public.record_admin_audit()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE row_data JSONB; old_data JSONB; target_id TEXT; detail_data JSONB;
BEGIN
  IF auth.uid() IS NULL OR NOT public.is_admin() THEN
    RETURN COALESCE(NEW, OLD);
  END IF;
  row_data := CASE WHEN TG_OP = 'DELETE' THEN '{}'::jsonb ELSE to_jsonb(NEW) END;
  old_data := CASE WHEN TG_OP = 'INSERT' THEN '{}'::jsonb ELSE to_jsonb(OLD) END;
  target_id := COALESCE(row_data->>'id', old_data->>'id', row_data->>'utilisateur_id', old_data->>'utilisateur_id', row_data->>'vendeur_id', old_data->>'vendeur_id', row_data->>'singleton', old_data->>'singleton');
  detail_data := jsonb_strip_nulls(jsonb_build_object(
    'nom', COALESCE(row_data->>'nom', row_data->>'nom_plan', row_data->>'nom_entreprise'),
    'ancien_statut', COALESCE(old_data->>'statut', old_data->>'statut_moderation', old_data->>'statut_compte'),
    'nouveau_statut', COALESCE(row_data->>'statut', row_data->>'statut_moderation', row_data->>'statut_compte'),
    'ancien_role', old_data->>'role', 'nouveau_role', row_data->>'role',
    'reference', COALESCE(row_data->>'reference_transaction', old_data->>'reference_transaction'),
    'montant', COALESCE(row_data->>'montant', old_data->>'montant'),
    'quota', row_data->>'max_produits_gratuits'
  ));
  INSERT INTO public.journal_administration(administrateur_id, action, table_cible, cible_id, details)
  VALUES (auth.uid(), TG_OP, TG_TABLE_NAME, target_id, detail_data);
  RETURN COALESCE(NEW, OLD);
END; $$;
REVOKE ALL ON FUNCTION public.record_admin_audit() FROM PUBLIC;

DROP TRIGGER IF EXISTS audit_boutiques ON public.boutiques;
CREATE TRIGGER audit_boutiques AFTER INSERT OR UPDATE OR DELETE ON public.boutiques FOR EACH ROW EXECUTE FUNCTION public.record_admin_audit();
DROP TRIGGER IF EXISTS audit_produits ON public.produits;
CREATE TRIGGER audit_produits AFTER INSERT OR UPDATE OR DELETE ON public.produits FOR EACH ROW EXECUTE FUNCTION public.record_admin_audit();
DROP TRIGGER IF EXISTS audit_verifications ON public.dossiers_verification_vendeurs;
CREATE TRIGGER audit_verifications AFTER INSERT OR UPDATE OR DELETE ON public.dossiers_verification_vendeurs FOR EACH ROW EXECUTE FUNCTION public.record_admin_audit();
DROP TRIGGER IF EXISTS audit_paiements ON public.paiements;
CREATE TRIGGER audit_paiements AFTER INSERT OR UPDATE OR DELETE ON public.paiements FOR EACH ROW EXECUTE FUNCTION public.record_admin_audit();
DROP TRIGGER IF EXISTS audit_administrateurs ON public.administrateurs;
CREATE TRIGGER audit_administrateurs AFTER INSERT OR UPDATE OR DELETE ON public.administrateurs FOR EACH ROW EXECUTE FUNCTION public.record_admin_audit();
DROP TRIGGER IF EXISTS audit_categories ON public.categories;
CREATE TRIGGER audit_categories AFTER INSERT OR UPDATE OR DELETE ON public.categories FOR EACH ROW EXECUTE FUNCTION public.record_admin_audit();
DROP TRIGGER IF EXISTS audit_plans ON public.plan_sponsorisations;
CREATE TRIGGER audit_plans AFTER INSERT OR UPDATE OR DELETE ON public.plan_sponsorisations FOR EACH ROW EXECUTE FUNCTION public.record_admin_audit();
DROP TRIGGER IF EXISTS audit_publicites ON public.publicites_externes;
CREATE TRIGGER audit_publicites AFTER INSERT OR UPDATE OR DELETE ON public.publicites_externes FOR EACH ROW EXECUTE FUNCTION public.record_admin_audit();
DROP TRIGGER IF EXISTS audit_quotas ON public.configuration_publication;
CREATE TRIGGER audit_quotas AFTER UPDATE ON public.configuration_publication FOR EACH ROW EXECUTE FUNCTION public.record_admin_audit();
