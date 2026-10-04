CREATE OR REPLACE FUNCTION public.admin_has_permission(permission_name TEXT)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.administrateurs
    WHERE utilisateur_id = auth.uid() AND (
      role::text = 'SuperAdmin'
      OR (permission_name = 'moderation' AND role::text = 'Moderateur')
      OR (permission_name = 'commercial' AND role::text = 'Commercial')
    )
  );
$$;
REVOKE ALL ON FUNCTION public.admin_has_permission(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_has_permission(TEXT) TO authenticated;

DROP POLICY IF EXISTS admin_manage_categories ON public.categories;
CREATE POLICY admin_manage_categories ON public.categories FOR ALL TO authenticated
USING (public.admin_has_permission('moderation')) WITH CHECK (public.admin_has_permission('moderation'));
DROP POLICY IF EXISTS admin_manage_boutiques ON public.boutiques;
CREATE POLICY admin_manage_boutiques ON public.boutiques FOR ALL TO authenticated
USING (public.admin_has_permission('moderation')) WITH CHECK (public.admin_has_permission('moderation'));
DROP POLICY IF EXISTS admin_manage_products ON public.produits;
CREATE POLICY admin_manage_products ON public.produits FOR ALL TO authenticated
USING (public.admin_has_permission('moderation')) WITH CHECK (public.admin_has_permission('moderation'));
DROP POLICY IF EXISTS admin_select_users ON public.utilisateurs;
CREATE POLICY admin_select_users ON public.utilisateurs FOR SELECT TO authenticated USING (public.admin_has_permission('moderation'));
DROP POLICY IF EXISTS admin_select_sellers ON public.vendeurs;
CREATE POLICY admin_select_sellers ON public.vendeurs FOR SELECT TO authenticated USING (public.admin_has_permission('moderation'));
DROP POLICY IF EXISTS admin_read_verifications ON public.dossiers_verification_vendeurs;
CREATE POLICY admin_read_verifications ON public.dossiers_verification_vendeurs FOR SELECT TO authenticated USING (public.admin_has_permission('moderation'));
DROP POLICY IF EXISTS admin_read_verification_files ON storage.objects;
CREATE POLICY admin_read_verification_files ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'seller-verification' AND public.admin_has_permission('moderation'));

DROP POLICY IF EXISTS admin_manage_sponsoring_plans ON public.plan_sponsorisations;
CREATE POLICY admin_manage_sponsoring_plans ON public.plan_sponsorisations FOR ALL TO authenticated
USING (public.admin_has_permission('commercial')) WITH CHECK (public.admin_has_permission('commercial'));
DROP POLICY IF EXISTS admin_manage_external_ads ON public.publicites_externes;
CREATE POLICY admin_manage_external_ads ON public.publicites_externes FOR ALL TO authenticated
USING (public.admin_has_permission('commercial')) WITH CHECK (public.admin_has_permission('commercial'));
DROP POLICY IF EXISTS admin_manage_payments ON public.paiements;
CREATE POLICY admin_manage_payments ON public.paiements FOR ALL TO authenticated
USING (public.admin_has_permission('commercial')) WITH CHECK (public.admin_has_permission('commercial'));

CREATE OR REPLACE FUNCTION public.manage_administrator(target_email TEXT, requested_role TEXT, remove_access BOOLEAN DEFAULT false)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE target_id UUID; current_role TEXT;
BEGIN
  IF NOT public.admin_has_permission('superadmin') THEN RAISE EXCEPTION 'Accès SuperAdmin requis'; END IF;
  SELECT id INTO target_id FROM public.utilisateurs WHERE lower(email) = lower(trim(target_email));
  IF target_id IS NULL THEN RAISE EXCEPTION 'Utilisateur introuvable'; END IF;
  SELECT role::text INTO current_role FROM public.administrateurs WHERE utilisateur_id = target_id;
  IF remove_access THEN
    IF target_id = auth.uid() THEN RAISE EXCEPTION 'Vous ne pouvez pas retirer votre propre accès'; END IF;
    IF current_role = 'SuperAdmin' AND (SELECT count(*) FROM public.administrateurs WHERE role::text = 'SuperAdmin') <= 1 THEN RAISE EXCEPTION 'Le dernier SuperAdmin ne peut pas être supprimé'; END IF;
    DELETE FROM public.administrateurs WHERE utilisateur_id = target_id;
    RETURN;
  END IF;
  IF requested_role NOT IN ('SuperAdmin', 'Moderateur', 'Commercial') THEN RAISE EXCEPTION 'Rôle administrateur invalide'; END IF;
  IF target_id = auth.uid() AND current_role = 'SuperAdmin' AND requested_role <> 'SuperAdmin' AND
    (SELECT count(*) FROM public.administrateurs WHERE role::text = 'SuperAdmin') <= 1 THEN RAISE EXCEPTION 'Le dernier SuperAdmin ne peut pas être rétrogradé'; END IF;
  INSERT INTO public.administrateurs(utilisateur_id, role) VALUES (target_id, requested_role::role_admin)
  ON CONFLICT (utilisateur_id) DO UPDATE SET role = EXCLUDED.role;
END;
$$;

CREATE OR REPLACE FUNCTION public.list_administrators()
RETURNS TABLE(utilisateur_id UUID, nom TEXT, email TEXT, role TEXT)
LANGUAGE sql SECURITY DEFINER SET search_path = public
AS $$
  SELECT a.utilisateur_id, u.nom, u.email, a.role::text
  FROM public.administrateurs a JOIN public.utilisateurs u ON u.id = a.utilisateur_id
  WHERE public.admin_has_permission('superadmin') ORDER BY u.nom;
$$;
REVOKE ALL ON FUNCTION public.manage_administrator(TEXT, TEXT, BOOLEAN) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.list_administrators() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.manage_administrator(TEXT, TEXT, BOOLEAN) TO authenticated;
GRANT EXECUTE ON FUNCTION public.list_administrators() TO authenticated;

CREATE OR REPLACE FUNCTION public.review_boutique(boutique_uuid UUID, moderation_status TEXT) RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.admin_has_permission('moderation') THEN RAISE EXCEPTION 'Permission de modération requise'; END IF;
  IF moderation_status NOT IN ('EnAttente', 'Approuvee', 'Rejetee') THEN RAISE EXCEPTION 'Statut de modération invalide'; END IF;
  IF moderation_status = 'Approuvee' THEN UPDATE public.boutiques SET statut_moderation = 'Approuvee' WHERE id = boutique_uuid;
  ELSIF moderation_status = 'Rejetee' THEN UPDATE public.boutiques SET statut_moderation = 'Rejetee' WHERE id = boutique_uuid;
  ELSE UPDATE public.boutiques SET statut_moderation = 'EnAttente' WHERE id = boutique_uuid; END IF;
  IF NOT FOUND THEN RAISE EXCEPTION 'Boutique introuvable'; END IF;
END; $$;

CREATE OR REPLACE FUNCTION public.set_seller_account_status(seller_uuid UUID, account_status TEXT) RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $body$
BEGIN
  IF NOT public.admin_has_permission('moderation') THEN RAISE EXCEPTION 'Permission de modération requise'; END IF;
  IF account_status NOT IN ('Actif', 'Suspendu') THEN RAISE EXCEPTION 'Statut de compte invalide'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.vendeurs WHERE utilisateur_id = seller_uuid) THEN RAISE EXCEPTION 'Vendeur introuvable'; END IF;
  IF account_status = 'Suspendu' THEN UPDATE public.utilisateurs SET statut_compte = 'Suspendu' WHERE id = seller_uuid;
  ELSE UPDATE public.utilisateurs SET statut_compte = 'Actif' WHERE id = seller_uuid; END IF;
END; $body$;

CREATE OR REPLACE FUNCTION public.update_publication_configuration(max_products INTEGER, quota_enabled BOOLEAN)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $body$
BEGIN
  IF NOT public.admin_has_permission('superadmin') THEN RAISE EXCEPTION 'Accès SuperAdmin requis'; END IF;
  IF max_products < 1 OR max_products > 1000 THEN RAISE EXCEPTION 'Limite invalide'; END IF;
  UPDATE public.configuration_publication SET max_produits_gratuits = max_products, est_actif = quota_enabled, updated_at = now() WHERE singleton = true;
  RETURN public.get_publication_configuration();
END; $body$;

CREATE OR REPLACE FUNCTION public.review_boost_payment(payment_uuid UUID, approve_payment BOOLEAN)
RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $body$
DECLARE payment_record public.paiements%ROWTYPE; plan_duration INTEGER; campaign_uuid UUID;
BEGIN
  IF NOT public.admin_has_permission('commercial') THEN RAISE EXCEPTION 'Permission commerciale requise'; END IF;
  SELECT * INTO payment_record FROM public.paiements WHERE id = payment_uuid FOR UPDATE;
  IF NOT FOUND OR payment_record.statut <> 'EnAttente' THEN RAISE EXCEPTION 'Demande absente ou déjà traitée'; END IF;
  IF NOT approve_payment THEN UPDATE public.paiements SET statut = 'Echoue' WHERE id = payment_uuid; RETURN NULL; END IF;
  IF payment_record.produit_id IS NULL OR payment_record.plan_id IS NULL THEN RAISE EXCEPTION 'Produit ou plan manquant'; END IF;
  SELECT duree_en_jours INTO plan_duration FROM public.plan_sponsorisations WHERE id = payment_record.plan_id;
  IF plan_duration IS NULL THEN RAISE EXCEPTION 'Plan introuvable'; END IF;
  INSERT INTO public.campagnes_boost(produit_id, plan_id, date_debut, date_fin, statut)
  VALUES (payment_record.produit_id, payment_record.plan_id, now(), now() + make_interval(days => plan_duration), 'EnCours') RETURNING id INTO campaign_uuid;
  UPDATE public.paiements SET statut = 'Reussi', campagne_id = campaign_uuid WHERE id = payment_uuid;
  UPDATE public.produits SET est_sponsorise = true WHERE id = payment_record.produit_id;
  RETURN campaign_uuid;
END; $body$;

CREATE OR REPLACE FUNCTION public.moderate_product(product_uuid UUID, moderation_status TEXT) RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.admin_has_permission('moderation') THEN RAISE EXCEPTION 'Permission de modération requise'; END IF;
  IF moderation_status NOT IN ('Actif', 'Bloque') THEN RAISE EXCEPTION 'Statut invalide'; END IF;
  IF moderation_status = 'Actif' THEN UPDATE public.produits SET statut = 'Actif' WHERE id = product_uuid;
  ELSE UPDATE public.produits SET statut = 'Bloque' WHERE id = product_uuid; END IF;
  IF NOT FOUND THEN RAISE EXCEPTION 'Produit introuvable'; END IF;
END; $$;

CREATE OR REPLACE FUNCTION public.review_seller_verification(seller_uuid UUID, approve_verification BOOLEAN, decision_reason TEXT DEFAULT NULL) RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.admin_has_permission('moderation') THEN RAISE EXCEPTION 'Permission de modération requise'; END IF;
  IF NOT approve_verification AND NULLIF(trim(decision_reason), '') IS NULL THEN RAISE EXCEPTION 'Le motif du rejet est obligatoire'; END IF;
  UPDATE public.dossiers_verification_vendeurs SET statut = CASE WHEN approve_verification THEN 'Approuve' ELSE 'Rejete' END,
    motif_decision = NULLIF(trim(decision_reason), ''), examine_le = now(), examine_par = auth.uid() WHERE vendeur_id = seller_uuid;
  IF NOT FOUND THEN RAISE EXCEPTION 'Dossier introuvable'; END IF;
  UPDATE public.vendeurs SET statut_verification = approve_verification WHERE utilisateur_id = seller_uuid;
  IF approve_verification THEN UPDATE public.boutiques SET statut_moderation = 'Approuvee' WHERE vendeur_id = seller_uuid;
  ELSE UPDATE public.boutiques SET statut_moderation = 'Rejetee' WHERE vendeur_id = seller_uuid; END IF;
END; $$;
