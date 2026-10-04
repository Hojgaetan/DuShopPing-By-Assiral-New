ALTER TABLE public.journal_administration
  ADD COLUMN IF NOT EXISTS auteur_nom TEXT,
  ADD COLUMN IF NOT EXISTS auteur_email TEXT,
  ADD COLUMN IF NOT EXISTS auteur_role TEXT,
  ADD COLUMN IF NOT EXISTS action_metier TEXT,
  ADD COLUMN IF NOT EXISTS resume TEXT,
  ADD COLUMN IF NOT EXISTS valeur_avant JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS valeur_apres JSONB NOT NULL DEFAULT '{}'::jsonb;

CREATE OR REPLACE FUNCTION public.record_admin_audit()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  new_row JSONB := CASE WHEN TG_OP = 'DELETE' THEN '{}'::jsonb ELSE to_jsonb(NEW) END;
  old_row JSONB := CASE WHEN TG_OP = 'INSERT' THEN '{}'::jsonb ELSE to_jsonb(OLD) END;
  actor_name TEXT; actor_email TEXT; actor_role TEXT;
  target_id TEXT; target_name TEXT; business_action TEXT; readable_summary TEXT;
  before_values JSONB := '{}'::jsonb; after_values JSONB := '{}'::jsonb;
  seller_name TEXT; store_name TEXT; product_name TEXT;
BEGIN
  IF auth.uid() IS NULL OR NOT public.is_admin() THEN RETURN COALESCE(NEW, OLD); END IF;
  SELECT u.nom, u.email, a.role::text INTO actor_name, actor_email, actor_role
  FROM public.utilisateurs u JOIN public.administrateurs a ON a.utilisateur_id = u.id
  WHERE u.id = auth.uid();

  target_id := COALESCE(new_row->>'id', old_row->>'id', new_row->>'utilisateur_id', old_row->>'utilisateur_id',
    new_row->>'vendeur_id', old_row->>'vendeur_id', new_row->>'singleton', old_row->>'singleton');

  IF TG_TABLE_NAME = 'produits' THEN
    IF TG_OP = 'UPDATE' AND old_row->>'statut' IS NOT DISTINCT FROM new_row->>'statut' THEN RETURN COALESCE(NEW, OLD); END IF;
    target_name := COALESCE(new_row->>'titre', old_row->>'titre');
    SELECT b.nom, u.nom INTO store_name, seller_name FROM public.boutiques b JOIN public.utilisateurs u ON u.id = b.vendeur_id
    WHERE b.id = COALESCE((new_row->>'boutique_id')::uuid, (old_row->>'boutique_id')::uuid);
    business_action := CASE WHEN new_row->>'statut' = 'Bloque' THEN 'Blocage d’article' WHEN old_row->>'statut' = 'Bloque' THEN 'Réactivation d’article' ELSE 'Modification d’article' END;
    readable_summary := business_action || ' « ' || COALESCE(target_name, 'Sans titre') || ' » — boutique « ' || COALESCE(store_name, 'Inconnue') || ' », vendeur ' || COALESCE(seller_name, 'inconnu');
    before_values := jsonb_build_object('statut', old_row->>'statut'); after_values := jsonb_build_object('statut', new_row->>'statut');
  ELSIF TG_TABLE_NAME = 'boutiques' THEN
    IF TG_OP = 'UPDATE' AND old_row->>'statut_moderation' IS NOT DISTINCT FROM new_row->>'statut_moderation' THEN RETURN COALESCE(NEW, OLD); END IF;
    target_name := COALESCE(new_row->>'nom', old_row->>'nom');
    SELECT nom INTO seller_name FROM public.utilisateurs WHERE id = COALESCE((new_row->>'vendeur_id')::uuid, (old_row->>'vendeur_id')::uuid);
    business_action := CASE new_row->>'statut_moderation' WHEN 'Approuvee' THEN 'Approbation de boutique' WHEN 'Rejetee' THEN 'Rejet de boutique' ELSE 'Mise en attente de boutique' END;
    readable_summary := business_action || ' « ' || COALESCE(target_name, 'Sans nom') || ' » — vendeur ' || COALESCE(seller_name, 'inconnu');
    before_values := jsonb_build_object('statut', old_row->>'statut_moderation'); after_values := jsonb_build_object('statut', new_row->>'statut_moderation');
  ELSIF TG_TABLE_NAME = 'dossiers_verification_vendeurs' THEN
    IF TG_OP = 'UPDATE' AND old_row->>'statut' IS NOT DISTINCT FROM new_row->>'statut' THEN RETURN COALESCE(NEW, OLD); END IF;
    SELECT u.nom, b.nom INTO seller_name, store_name FROM public.utilisateurs u LEFT JOIN public.boutiques b ON b.vendeur_id = u.id
    WHERE u.id = COALESCE((new_row->>'vendeur_id')::uuid, (old_row->>'vendeur_id')::uuid);
    business_action := CASE new_row->>'statut' WHEN 'Approuve' THEN 'Approbation d’identité' WHEN 'Rejete' THEN 'Rejet de vérification' ELSE 'Examen de vérification' END;
    readable_summary := business_action || ' de ' || COALESCE(seller_name, 'vendeur inconnu') || ' — boutique « ' || COALESCE(store_name, 'Inconnue') || ' »';
    IF NULLIF(new_row->>'motif_decision', '') IS NOT NULL THEN readable_summary := readable_summary || '. Motif : ' || (new_row->>'motif_decision'); END IF;
    before_values := jsonb_build_object('statut', old_row->>'statut'); after_values := jsonb_strip_nulls(jsonb_build_object('statut', new_row->>'statut', 'motif', new_row->>'motif_decision'));
  ELSIF TG_TABLE_NAME = 'paiements' THEN
    IF TG_OP = 'UPDATE' AND old_row->>'statut' IS NOT DISTINCT FROM new_row->>'statut' THEN RETURN COALESCE(NEW, OLD); END IF;
    SELECT u.nom INTO seller_name FROM public.utilisateurs u WHERE u.id = COALESCE((new_row->>'vendeur_id')::uuid, (old_row->>'vendeur_id')::uuid);
    SELECT titre INTO product_name FROM public.produits WHERE id = COALESCE((new_row->>'produit_id')::uuid, (old_row->>'produit_id')::uuid);
    business_action := CASE new_row->>'statut' WHEN 'Reussi' THEN 'Validation de paiement Boost' WHEN 'Echoue' THEN 'Rejet de paiement Boost' ELSE 'Enregistrement de paiement Boost' END;
    readable_summary := business_action || ' ' || COALESCE(new_row->>'reference_transaction', old_row->>'reference_transaction', '') || ' — ' || COALESCE(seller_name, 'vendeur inconnu') || ', article « ' || COALESCE(product_name, 'Inconnu') || ' », ' || COALESCE(new_row->>'montant', old_row->>'montant', '0') || ' FCFA';
    before_values := jsonb_build_object('statut', old_row->>'statut'); after_values := jsonb_build_object('statut', new_row->>'statut');
  ELSIF TG_TABLE_NAME = 'administrateurs' THEN
    SELECT nom INTO target_name FROM public.utilisateurs WHERE id = COALESCE((new_row->>'utilisateur_id')::uuid, (old_row->>'utilisateur_id')::uuid);
    business_action := CASE TG_OP WHEN 'INSERT' THEN 'Attribution d’un rôle administrateur' WHEN 'DELETE' THEN 'Retrait des accès administrateur' ELSE 'Changement de rôle administrateur' END;
    readable_summary := business_action || ' pour ' || COALESCE(target_name, 'utilisateur inconnu') || ' : ' || COALESCE(old_row->>'role', 'aucun') || ' → ' || COALESCE(new_row->>'role', 'aucun');
    before_values := jsonb_build_object('role', old_row->>'role'); after_values := jsonb_build_object('role', new_row->>'role');
  ELSIF TG_TABLE_NAME = 'categories' THEN
    target_name := COALESCE(new_row->>'nom', old_row->>'nom'); business_action := CASE TG_OP WHEN 'INSERT' THEN 'Création de catégorie' WHEN 'DELETE' THEN 'Suppression de catégorie' ELSE 'Modification de catégorie' END;
    readable_summary := business_action || ' « ' || COALESCE(target_name, 'Sans nom') || ' »'; before_values := jsonb_build_object('nom', old_row->>'nom'); after_values := jsonb_build_object('nom', new_row->>'nom');
  ELSIF TG_TABLE_NAME = 'plan_sponsorisations' THEN
    target_name := COALESCE(new_row->>'nom_plan', old_row->>'nom_plan'); business_action := CASE TG_OP WHEN 'INSERT' THEN 'Création de plan Boost' WHEN 'DELETE' THEN 'Suppression de plan Boost' ELSE 'Modification de plan Boost' END;
    readable_summary := business_action || ' « ' || COALESCE(target_name, 'Sans nom') || ' »'; before_values := old_row - ARRAY['id']; after_values := new_row - ARRAY['id'];
  ELSIF TG_TABLE_NAME = 'publicites_externes' THEN
    target_name := COALESCE(new_row->>'nom_entreprise', old_row->>'nom_entreprise'); business_action := CASE TG_OP WHEN 'INSERT' THEN 'Création de publicité' WHEN 'DELETE' THEN 'Suppression de publicité' ELSE 'Modification de publicité' END;
    readable_summary := business_action || ' pour « ' || COALESCE(target_name, 'Entreprise inconnue') || ' »'; before_values := old_row - ARRAY['id', 'image_banniere_url']; after_values := new_row - ARRAY['id', 'image_banniere_url'];
  ELSIF TG_TABLE_NAME = 'configuration_publication' THEN
    business_action := 'Modification des quotas'; readable_summary := 'Quota gratuit modifié : ' || COALESCE(old_row->>'max_produits_gratuits', '—') || ' → ' || COALESCE(new_row->>'max_produits_gratuits', '—') || ' articles';
    before_values := jsonb_build_object('maximum', old_row->>'max_produits_gratuits', 'actif', old_row->>'est_actif'); after_values := jsonb_build_object('maximum', new_row->>'max_produits_gratuits', 'actif', new_row->>'est_actif');
  ELSE
    business_action := TG_OP || ' ' || TG_TABLE_NAME; readable_summary := business_action;
  END IF;

  INSERT INTO public.journal_administration(administrateur_id, auteur_nom, auteur_email, auteur_role, action, action_metier, table_cible, cible_id, resume, details, valeur_avant, valeur_apres)
  VALUES (auth.uid(), actor_name, actor_email, actor_role, TG_OP, business_action, TG_TABLE_NAME, target_id, readable_summary,
    jsonb_strip_nulls(jsonb_build_object('ressource', target_name, 'boutique', store_name, 'vendeur', seller_name)),
    jsonb_strip_nulls(before_values), jsonb_strip_nulls(after_values));
  RETURN COALESCE(NEW, OLD);
END; $$;
