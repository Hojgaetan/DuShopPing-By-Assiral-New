-- =================================================================================
-- SCHEMA DE BASE DE DONNÉES - MARKETPLACE DUSHOPPING (Modèle Vitrine & Boost)
-- PostgreSQL / Supabase
-- =================================================================================

-- Activation des extensions (si nécessaire)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- TYPES ENUMÉRÉS (ENUMS)
-- ==========================================

DO $$ BEGIN
    CREATE TYPE statut_compte AS ENUM ('Actif', 'Suspendu');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE role_admin AS ENUM ('SuperAdmin', 'Moderateur', 'Commercial');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE statut_moderation AS ENUM ('EnAttente', 'Approuvee', 'Rejetee');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE statut_produit AS ENUM ('Actif', 'Vendu', 'Bloque', 'Brouillon');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE statut_campagne AS ENUM ('EnCours', 'Expire', 'EnAttente');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE operateur_paiement AS ENUM ('MoMo', 'OM', 'Carte');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE statut_paiement AS ENUM ('Reussi', 'Echoue', 'EnAttente');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE emplacement_pub AS ENUM ('Accueil', 'Categorie', 'TopRecherche');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE type_action_stat AS ENUM ('VueProfil', 'ClicWhatsApp', 'AppelDirect', 'VueProduit');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;


-- ==========================================
-- TABLES : UTILISATEURS
-- ==========================================

-- Table générique pour tous les utilisateurs
CREATE TABLE IF NOT EXISTS utilisateurs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nom VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    telephone VARCHAR(50),
    mot_de_passe VARCHAR(255), -- Peut être nul si auth via OAuth ou géré côté Auth de Supabase (auth.users)
    date_inscription TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    statut_compte statut_compte DEFAULT 'Actif',
    type_utilisateur VARCHAR(50) NOT NULL -- 'Acheteur', 'Vendeur' ou 'Administrateur' pour la gestion d'héritage simple
);

-- Spécificité Vendeur (Relation 1-1 avec utilisateurs où type = 'Vendeur')
CREATE TABLE IF NOT EXISTS vendeurs (
    utilisateur_id UUID PRIMARY KEY REFERENCES utilisateurs(id) ON DELETE CASCADE,
    piece_identite_url TEXT,
    statut_verification BOOLEAN DEFAULT FALSE
);

-- Spécificité Administrateur (Relation 1-1 avec utilisateurs où type = 'Administrateur')
CREATE TABLE IF NOT EXISTS administrateurs (
    utilisateur_id UUID PRIMARY KEY REFERENCES utilisateurs(id) ON DELETE CASCADE,
    role role_admin NOT NULL DEFAULT 'Moderateur'
);


-- ==========================================
-- TABLES : CATALOGUE & BOUTIQUES
-- ==========================================

CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nom VARCHAR(255) NOT NULL,
    icone_url TEXT
);

CREATE TABLE IF NOT EXISTS boutiques (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vendeur_id UUID NOT NULL REFERENCES vendeurs(utilisateur_id) ON DELETE CASCADE,
    nom VARCHAR(255) NOT NULL,
    description TEXT,
    localisation VARCHAR(255),
    logo_url TEXT,
    date_creation TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    statut_moderation statut_moderation DEFAULT 'EnAttente'
);

CREATE TABLE IF NOT EXISTS produits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    boutique_id UUID NOT NULL REFERENCES boutiques(id) ON DELETE CASCADE,
    categorie_id UUID NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
    titre VARCHAR(255) NOT NULL,
    description TEXT,
    prix DECIMAL(10, 2) NOT NULL,
    images JSONB DEFAULT '[]', -- Liste d'URLs d'images
    date_publication TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    statut statut_produit DEFAULT 'Actif'
);

CREATE TABLE IF NOT EXISTS configurations_quotas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nb_articles_gratuits_max INTEGER NOT NULL DEFAULT 5,
    est_actif BOOLEAN DEFAULT TRUE,
    date_creation TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);


-- ==========================================
-- TABLES : MONÉTISATION & STATISTIQUES
-- ==========================================

CREATE TABLE IF NOT EXISTS plans_sponsorisation (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nom_plan VARCHAR(255) NOT NULL,
    duree_en_jours INTEGER NOT NULL,
    prix_unitaire DECIMAL(10, 2) NOT NULL,
    multiplicateur_visibilite DECIMAL(5, 2) DEFAULT 1.0
);

CREATE TABLE IF NOT EXISTS campagnes_boost (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    produit_id UUID NOT NULL REFERENCES produits(id) ON DELETE CASCADE,
    plan_id UUID NOT NULL REFERENCES plans_sponsorisation(id) ON DELETE RESTRICT,
    date_debut TIMESTAMP WITH TIME ZONE NOT NULL,
    date_fin TIMESTAMP WITH TIME ZONE NOT NULL,
    statut statut_campagne DEFAULT 'EnAttente'
);

CREATE TABLE IF NOT EXISTS paiements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vendeur_id UUID NOT NULL REFERENCES vendeurs(utilisateur_id) ON DELETE CASCADE,
    campagne_id UUID REFERENCES campagnes_boost(id) ON DELETE SET NULL, -- Le paiement peut être lié à un boost
    reference_transaction VARCHAR(255) UNIQUE NOT NULL,
    montant DECIMAL(10, 2) NOT NULL,
    operateur operateur_paiement NOT NULL,
    date_paiement TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    statut statut_paiement DEFAULT 'EnAttente'
);

CREATE TABLE IF NOT EXISTS publicites_externes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nom_entreprise VARCHAR(255) NOT NULL,
    image_banniere_url TEXT NOT NULL,
    lien_redirection TEXT NOT NULL,
    emplacement emplacement_pub NOT NULL,
    date_debut TIMESTAMP WITH TIME ZONE NOT NULL,
    date_fin TIMESTAMP WITH TIME ZONE NOT NULL,
    statut BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS statistiques_interactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    boutique_id UUID REFERENCES boutiques(id) ON DELETE CASCADE,
    produit_id UUID REFERENCES produits(id) ON DELETE CASCADE,
    type_action type_action_stat NOT NULL,
    date_action TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    adresse_ip VARCHAR(45)
);

-- ==========================================
-- INDEX POUR OPTIMISATION
-- ==========================================

CREATE INDEX IF NOT EXISTS idx_produits_boutique ON produits(boutique_id);
CREATE INDEX IF NOT EXISTS idx_produits_categorie ON produits(categorie_id);
CREATE INDEX IF NOT EXISTS idx_produits_statut ON produits(statut);
CREATE INDEX IF NOT EXISTS idx_campagnes_produit ON campagnes_boost(produit_id);
CREATE INDEX IF NOT EXISTS idx_campagnes_statut ON campagnes_boost(statut);
CREATE INDEX IF NOT EXISTS idx_stats_produit ON statistiques_interactions(produit_id);
CREATE INDEX IF NOT EXISTS idx_stats_boutique ON statistiques_interactions(boutique_id);

-- ==========================================
-- ROW LEVEL SECURITY (RLS) - Configurations de base (Supabase)
-- ==========================================

-- Par défaut, activer le RLS sur toutes les tables
ALTER TABLE utilisateurs ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendeurs ENABLE ROW LEVEL SECURITY;
ALTER TABLE administrateurs ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE boutiques ENABLE ROW LEVEL SECURITY;
ALTER TABLE produits ENABLE ROW LEVEL SECURITY;
ALTER TABLE configurations_quotas ENABLE ROW LEVEL SECURITY;
ALTER TABLE plans_sponsorisation ENABLE ROW LEVEL SECURITY;
ALTER TABLE campagnes_boost ENABLE ROW LEVEL SECURITY;
ALTER TABLE paiements ENABLE ROW LEVEL SECURITY;
ALTER TABLE publicites_externes ENABLE ROW LEVEL SECURITY;
ALTER TABLE statistiques_interactions ENABLE ROW LEVEL SECURITY;

-- Exemples de politiques de base (à adapter selon auth.users de Supabase)

-- Les produits actifs sont visibles par tout le monde
DROP POLICY IF EXISTS "Les produits actifs sont publics" ON produits;
CREATE POLICY "Les produits actifs sont publics" ON produits FOR SELECT USING (statut = 'Actif');

-- Les boutiques approuvées sont visibles par tout le monde
DROP POLICY IF EXISTS "Les boutiques approuvées sont publiques" ON boutiques;
CREATE POLICY "Les boutiques approuvées sont publiques" ON boutiques FOR SELECT USING (statut_moderation = 'Approuvee');

-- Les catégories sont publiques
DROP POLICY IF EXISTS "Les catégories sont publiques" ON categories;
CREATE POLICY "Les catégories sont publiques" ON categories FOR SELECT USING (true);


-- ==========================================
-- TRIGGER POUR SYNCHRONISER AUTH.USERS ET PUBLIC.UTILISATEURS
-- ==========================================

-- Fonction pour gérer la création de l'utilisateur
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- 1. Nettoyage de sécurité : si un ancien compte de test a la même adresse email, on le supprime
  -- pour éviter de violer la contrainte UNIQUE sur l'email dans public.utilisateurs
  DELETE FROM public.utilisateurs WHERE email = new.email AND id != new.id;

  -- 2. Insérer le profil
  INSERT INTO public.utilisateurs (id, nom, email, telephone, type_utilisateur)
  VALUES (
    new.id,
    COALESCE(NULLIF(new.raw_user_meta_data->>'nom', ''), split_part(new.email, '@', 1)),
    new.email,
    new.raw_user_meta_data->>'telephone',
    COALESCE(NULLIF(new.raw_user_meta_data->>'role', ''), 'Acheteur')
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    nom = EXCLUDED.nom,
    telephone = EXCLUDED.telephone,
    type_utilisateur = EXCLUDED.type_utilisateur;

  -- 3. Si le rôle est Vendeur, créer le vendeur et la boutique
  IF (new.raw_user_meta_data->>'role' = 'Vendeur') THEN
    INSERT INTO public.vendeurs (utilisateur_id, statut_verification)
    VALUES (new.id, false)
    ON CONFLICT (utilisateur_id) DO NOTHING;

    -- Initialiser la boutique (sans ON CONFLICT car id est généré)
    INSERT INTO public.boutiques (id, vendeur_id, nom, localisation)
    VALUES (
      gen_random_uuid(),
      new.id, 
      COALESCE(NULLIF(new.raw_user_meta_data->>'nom_boutique', ''), 'Boutique de ' || split_part(new.email, '@', 1)),
      new.raw_user_meta_data->>'localisation'
    );
  END IF;

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Création du Trigger (Idempotent: DROP puis CREATE)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
