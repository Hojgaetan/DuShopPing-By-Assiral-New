-- ==========================================
-- Diagramme de Classes et Base de Données Sécurisée (Supabase/PostgreSQL)
-- Projet: Marketplace Cameroun (Vitrine & Boost)
-- Version: 1.0.0
-- Auteur: IA Coding Agent
-- Accent: Sécurité de niveau production, Performance & Contraintes Métier
-- ==========================================

-- Active toutes les extensions nécessaires
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =========================================================================
-- 1. ENUMS & ENUM-LIKE CONSTRAINTS (Secured via Domain or check constraints)
-- =========================================================================

-- Note: En utilisant CHECK constraints, nous assurons flexibilité et conformité aux spécifications.

-- =========================================================================
-- 2. TABLES - GESTION DES UTILISATEURS
-- =========================================================================

-- Table de base : Utilisateur
CREATE TABLE IF NOT EXISTS public.utilisateurs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nom VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    telephone VARCHAR(50),
    mot_de_passe TEXT NOT NULL, -- Stocké de manière sécurisée (hashé)
    photo_profil_url TEXT, -- URL de la photo de profil (ex: depuis Cloudinary)
    date_inscription TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    statut_compte VARCHAR(20) DEFAULT 'Actif' NOT NULL,
    role VARCHAR(20) DEFAULT 'Acheteur' NOT NULL,
    CONSTRAINT chk_statut_compte CHECK (statut_compte IN ('Actif', 'Suspendu', 'Banni')),
    CONSTRAINT chk_role CHECK (role IN ('Acheteur', 'Vendeur'))
);

-- Table spécialisée : Acheteur (Héritage de Utilisateur)
CREATE TABLE IF NOT EXISTS public.acheteurs (
    id UUID PRIMARY KEY REFERENCES public.utilisateurs(id) ON DELETE CASCADE,
    id_appareil VARCHAR(255),
    favoris UUID[] DEFAULT '{}' -- Références de produits favoris
);

-- Table spécialisée : Vendeur (Héritage de Utilisateur)
CREATE TABLE IF NOT EXISTS public.vendeurs (
    id UUID PRIMARY KEY REFERENCES public.utilisateurs(id) ON DELETE CASCADE,
    piece_identite_url TEXT,
    statut_verification BOOLEAN DEFAULT FALSE NOT NULL
);

-- Table spécialisée : Administrateur (Héritage de Utilisateur)
CREATE TABLE IF NOT EXISTS public.administrateurs (
    id UUID PRIMARY KEY REFERENCES public.utilisateurs(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL,
    CONSTRAINT chk_role_admin CHECK (role IN ('SuperAdmin', 'Moderateur', 'Commercial'))
);

-- =========================================================================
-- 3. TABLES - CATALOGUE & VITRINES
-- =========================================================================

-- ConfigurationQuota
CREATE TABLE IF NOT EXISTS public.configuration_quota (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nb_articles_gratuits_max INTEGER DEFAULT 5 NOT NULL,
    est_actif BOOLEAN DEFAULT TRUE NOT NULL
);

-- Boutique
CREATE TABLE IF NOT EXISTS public.boutiques (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vendeur_id UUID UNIQUE NOT NULL REFERENCES public.vendeurs(id) ON DELETE CASCADE, -- Relation 1 à 0..1 (Un vendeur gère une boutique)
    nom VARCHAR(255) NOT NULL,
    description TEXT,
    localisation VARCHAR(255),
    logo_url TEXT,
    date_creation TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    statut_moderation VARCHAR(20) DEFAULT 'EnAttente' NOT NULL,
    configuration_quota_id UUID REFERENCES public.configuration_quota(id) ON DELETE SET NULL,
    CONSTRAINT chk_statut_moderation CHECK (statut_moderation IN ('EnAttente', 'Approuvee', 'Rejetee'))
);

-- Categorie
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nom VARCHAR(255) UNIQUE NOT NULL,
    icone_url TEXT
);

-- Produit
CREATE TABLE IF NOT EXISTS public.produits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    boutique_id UUID NOT NULL REFERENCES public.boutiques(id) ON DELETE CASCADE,
    categorie_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    titre VARCHAR(255) NOT NULL,
    description TEXT,
    prix DECIMAL(15, 2) NOT NULL CHECK (prix >= 0),
    images TEXT[] DEFAULT '{}' NOT NULL, -- List<String>
    date_publication TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    statut VARCHAR(20) DEFAULT 'Brouillon' NOT NULL,
    est_sponsorise BOOLEAN DEFAULT FALSE NOT NULL,
    vues_count INTEGER DEFAULT 0 NOT NULL,
    CONSTRAINT chk_statut_produit CHECK (statut IN ('Actif', 'Vendu', 'Bloque', 'Brouillon'))
);

-- =========================================================================
-- 4. TABLES - MONÉTISATION & VISIBILITÉ
-- =========================================================================

-- PlanSponsorisation
CREATE TABLE IF NOT EXISTS public.plan_sponsorisations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nom_plan VARCHAR(255) NOT NULL,
    duree_en_jours INTEGER NOT NULL CHECK (duree_en_jours > 0),
    prix_unitaire DECIMAL(15, 2) NOT NULL CHECK (prix_unitaire >= 0),
    multiplicateur_visibilite DECIMAL(5, 2) DEFAULT 1.00 NOT NULL CHECK (multiplicateur_visibilite >= 1.00)
);

-- CampagneBoost
CREATE TABLE IF NOT EXISTS public.campagnes_boost (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    produit_id UUID NOT NULL REFERENCES public.produits(id) ON DELETE CASCADE,
    plan_id UUID NOT NULL REFERENCES public.plan_sponsorisations(id) ON DELETE RESTRICT,
    date_debut TIMESTAMPTZ NOT NULL,
    date_fin TIMESTAMPTZ NOT NULL,
    statut VARCHAR(20) DEFAULT 'EnAttente' NOT NULL,
    CONSTRAINT chk_statut_boost CHECK (statut IN ('EnCours', 'Expire', 'EnAttente')),
    CONSTRAINT chk_dates CHECK (date_fin > date_debut)
);

-- Paiement
CREATE TABLE IF NOT EXISTS public.paiements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vendeur_id UUID NOT NULL REFERENCES public.vendeurs(id) ON DELETE CASCADE,
    campagne_id UUID REFERENCES public.campagnes_boost(id) ON DELETE SET NULL,
    reference_transaction VARCHAR(255) UNIQUE NOT NULL,
    montant DECIMAL(15, 2) NOT NULL CHECK (montant >= 0),
    date_paiement TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    operateur VARCHAR(20) NOT NULL,
    statut VARCHAR(20) DEFAULT 'EnAttente' NOT NULL,
    CONSTRAINT chk_operateur CHECK (operateur IN ('MoMo', 'OM', 'Carte')),
    CONSTRAINT chk_statut_paiement CHECK (statut IN ('Reussi', 'Echoue', 'EnAttente'))
);

-- PubliciteExterne
CREATE TABLE IF NOT EXISTS public.publicites_externes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nom_entreprise VARCHAR(255) NOT NULL,
    image_banniere_url TEXT NOT NULL,
    lien_redirection TEXT NOT NULL,
    date_debut TIMESTAMPTZ NOT NULL,
    date_fin TIMESTAMPTZ NOT NULL,
    statut BOOLEAN DEFAULT TRUE NOT NULL,
    emplacement VARCHAR(20) NOT NULL,
    CONSTRAINT chk_emplacement CHECK (emplacement IN ('Accueil', 'Categorie', 'TopRecherche')),
    CONSTRAINT chk_dates_pub CHECK (date_fin > date_debut)
);

-- StatistiqueInteraction
CREATE TABLE IF NOT EXISTS public.statistiques_interactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    produit_id UUID REFERENCES public.produits(id) ON DELETE SET NULL,
    boutique_id UUID REFERENCES public.boutiques(id) ON DELETE SET NULL,
    date_action TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    adresse_ip VARCHAR(45),
    type_action VARCHAR(50) NOT NULL,
    CONSTRAINT chk_type_action CHECK (type_action IN ('VueProfil', 'ClicWhatsApp', 'AppelDirect', 'VueProduit'))
);

-- =========================================================================
-- 5. SÉCURITÉ & ROW LEVEL SECURITY (RLS) - ACCENT ACCRU SUR LA SÉCURITÉ
-- =========================================================================

-- Activer la sécurité au niveau des lignes (RLS) pour toutes les tables critiques
ALTER TABLE public.utilisateurs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.acheteurs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendeurs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.administrateurs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.boutiques ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.produits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.configuration_quota ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plan_sponsorisations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campagnes_boost ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.paiements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.publicites_externes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.statistiques_interactions ENABLE ROW LEVEL SECURITY;

-- POLITIQUES DE SÉCURITÉ :

-- 5.1 Tables Publiques en Lecture, Restreintes en Écriture
-- Categories: Tout le monde peut voir, seuls les administrateurs peuvent modifier
CREATE POLICY select_categories ON public.categories 
    FOR SELECT TO public USING (true);

-- Produits: Tout le monde peut voir les produits 'Actif', les vendeurs gèrent les leurs
CREATE POLICY select_produits_actifs ON public.produits 
    FOR SELECT TO public USING (statut = 'Actif');

CREATE POLICY manage_own_produits ON public.produits 
    FOR ALL TO public 
    USING (
        boutique_id IN (
            SELECT id FROM public.boutiques WHERE vendeur_id = auth.uid()
        )
    );

-- Boutiques: Lecture publique, Écriture réservée au vendeur propriétaire
CREATE POLICY select_boutiques ON public.boutiques 
    FOR SELECT TO public USING (true);

CREATE POLICY manage_own_boutique ON public.boutiques 
    FOR ALL TO public 
    USING (vendeur_id = auth.uid());

-- Utilisateurs: Un utilisateur ne peut voir et modifier que son propre profil
CREATE POLICY manage_own_utilisateur ON public.utilisateurs 
    FOR ALL TO public 
    USING (id = auth.uid());

-- Paiements & Campagnes: Uniquement visibles par le vendeur qui les effectue
CREATE POLICY view_own_paiement ON public.paiements 
    FOR SELECT TO public 
    USING (vendeur_id = auth.uid());

CREATE POLICY view_own_campagnes ON public.campagnes_boost 
    FOR SELECT TO public 
    USING (
        produit_id IN (
            SELECT p.id FROM public.produits p 
            JOIN public.boutiques b ON p.boutique_id = b.id 
            WHERE b.vendeur_id = auth.uid()
        )
    );

-- =========================================================================
-- 6. INDEXES DE PERFORMANCE (OPTIMISATION DES REQUÊTES)
-- =========================================================================

CREATE INDEX IF NOT EXISTS idx_produits_boutique ON public.produits(boutique_id);
CREATE INDEX IF NOT EXISTS idx_produits_categorie ON public.produits(categorie_id);
CREATE INDEX IF NOT EXISTS idx_produits_statut ON public.produits(statut);
CREATE INDEX IF NOT EXISTS idx_boutique_vendeur ON public.boutiques(vendeur_id);
CREATE INDEX IF NOT EXISTS idx_campagnes_produit ON public.campagnes_boost(produit_id);
CREATE INDEX IF NOT EXISTS idx_paiements_vendeur ON public.paiements(vendeur_id);
CREATE INDEX IF NOT EXISTS idx_statistiques_produit ON public.statistiques_interactions(produit_id);

-- =========================================================================
-- 7. TRIGGERS & PROCEDURES STOCKÉES DE VUES ET STATISTIQUES
-- =========================================================================

-- Fonction pour incrémenter de manière atomique les vues d'un produit (Secured endpoint)
CREATE OR REPLACE FUNCTION public.incrementer_vues_produit(produit_uuid UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE public.produits
    SET vues_count = vues_count + 1
    WHERE id = produit_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Procédure pour lier automatiquement la création d'un utilisateur Supabase Auth à notre table utilisateurs publique
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER AS $$
DECLARE
    user_role VARCHAR(20);
BEGIN
    user_role := coalesce(new.raw_user_meta_data->>'role', 'Acheteur');

    INSERT INTO public.utilisateurs (id, nom, email, mot_de_passe, statut_compte, role)
    VALUES (
        new.id,
        coalesce(new.raw_user_meta_data->>'nom', 'Utilisateur ' || substring(new.id::text, 1, 8)),
        new.email,
        'SUPABASE_AUTH_MANAGED', -- Géré par le système d'authentification centralisé de Supabase
        'Actif',
        user_role
    );
    
    IF user_role = 'Vendeur' THEN
        INSERT INTO public.vendeurs (id) VALUES (new.id);
        -- Auto-créer une boutique vide pour le vendeur
        INSERT INTO public.boutiques (vendeur_id, nom) VALUES (new.id, 'Ma Boutique');
    ELSE
        INSERT INTO public.acheteurs (id, id_appareil) VALUES (new.id, 'WEB_APP_AUTO');
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- S'active lors de la création d'un compte Supabase Auth
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();

-- =========================================================================
-- 8. DONNÉES DE DÉMARRAGE (SEED DATA - SEULEMENT SI VIDE)
-- =========================================================================

-- Note: Permet d'avoir des catégories initiales prêtes à l'emploi.
INSERT INTO public.categories (id, nom, icone_url)
VALUES 
    ('c1111111-1111-1111-1111-111111111111', 'Artisanat', 'Package'),
    ('c2222222-2222-2222-2222-222222222222', 'Mode', 'Shirt'),
    ('c3333333-3333-3333-3333-333333333333', 'Saveurs & Épicerie', 'Flame'),
    ('c4444444-4444-4444-4444-444444444444', 'Cosmétiques', 'Sparkles')
ON CONFLICT (nom) DO NOTHING;

INSERT INTO public.plan_sponsorisations (id, nom_plan, duree_en_jours, prix_unitaire, multiplicateur_visibilite)
VALUES
    ('p1111111-1111-1111-1111-111111111111', 'PLAN DE BASE', 7, 5000.00, 1.20),
    ('p2222222-2222-2222-2222-222222222222', 'PLAN BOOST ÉLITE', 14, 15000.00, 1.80),
    ('p3333333-3333-3333-3333-333333333333', 'PLAN IMPÉRIAL', 30, 35000.00, 2.50)
ON CONFLICT DO NOTHING;



--dans le footer, fais que si on clique sur l'icone de facebook, ou instagram sa dirige vers les lien facebook.com ou instagram.com ,  dans la partie PUBLICITÉ que on vois dans ll'accueil il faut que si on clique sur parcourir ou découvrir, une popup doit s'afficher si l'utilisateur a deja créer sa boutique proposant a l'utilisateur de faire la publicité de ses produits quil post.  il devra choisi soit l'option boost automatisé, ou boost limité. Le boost automatiqué, sa va afficher les images de ses différents produits quil a poster soit a gauche soit a droite dans la partie publicité aux différents utilisateurs qui seront sur la partie home. et cela pendant 4s avec un bouton contacter en bas. L'option boost limité sa va afficher aussi de la meme façon mais seulement aux utulisateurs qui vont rechercher des produits similaires a ceux d'un vendeur. maintenant dans dashbord de l'utilisateur, fais en sorte que pour formule boost, si l'utilisateur choisi un formule, une popup apparait avec les information de la formule selectionner, si il clique sur ok, des pétar apparaissent on lui dit formule selectionner. 