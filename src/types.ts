/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// ==========================================
// PACKAGE UTILISATEURS
// ==========================================

export type StatutCompte = 'Actif' | 'Suspendu';

export interface Utilisateur {
  id: string; // UUID
  nom: string;
  email: string;
  telephone: string;
  motDePasse?: string; // Opt for client-side
  dateInscription: string | Date;
  statutCompte: StatutCompte;
}

export interface Acheteur extends Utilisateur {
  idAppareil?: string;
}

export interface Vendeur extends Utilisateur {
  pieceIdentiteUrl?: string;
  statutVerification: boolean;
}

export type RoleAdmin = 'SuperAdmin' | 'Moderateur' | 'Commercial';

export interface Administrateur extends Utilisateur {
  role: RoleAdmin;
}

// ==========================================
// PACKAGE CATALOGUE & BOUTIQUES
// ==========================================

export type StatutModeration = 'EnAttente' | 'Approuvee' | 'Rejetee';

export interface Boutique {
  id: string; // UUID
  vendeur_id: string; // ForeignKey
  nom: string;
  description: string;
  localisation: string;
  logoUrl?: string;
  dateCreation: string | Date;
  statutModeration: StatutModeration;
}

export interface Categorie {
  id: string; // UUID
  nom: string;
  iconeUrl?: string;
}

export type StatutProduit = 'Actif' | 'Vendu' | 'Bloque' | 'Brouillon';

export interface Produit {
  id: string; // UUID
  boutique_id: string; // ForeignKey
  categorie_id: string; // ForeignKey
  titre: string;
  description: string;
  prix: number;
  images: string[];
  datePublication: string | Date;
  statut: StatutProduit;
}

export interface ConfigurationQuota {
  id: string; // UUID
  nbArticlesGratuitsMax: number;
  estActif: boolean;
}

// ==========================================
// PACKAGE MONÉTISATION & STATISTIQUES
// ==========================================

export interface PlanSponsorisation {
  id: string; // UUID
  nomPlan: string;
  dureeEnJours: number;
  prixUnitaire: number;
  multiplicateurVisibilite: number;
}

export type StatutCampagne = 'EnCours' | 'Expire' | 'EnAttente';

export interface CampagneBoost {
  id: string; // UUID
  produit_id: string; // ForeignKey
  plan_id: string; // ForeignKey
  dateDebut: string | Date;
  dateFin: string | Date;
  statut: StatutCampagne;
}

export type OperateurPaiement = 'MoMo' | 'OM' | 'Carte';
export type StatutPaiement = 'Reussi' | 'Echoue' | 'EnAttente';

export interface Paiement {
  id: string; // UUID
  vendeur_id: string; // ForeignKey
  campagne_id: string; // ForeignKey
  referenceTransaction: string;
  montant: number;
  operateur: OperateurPaiement;
  datePaiement: string | Date;
  statut: StatutPaiement;
}

export type EmplacementPub = 'Accueil' | 'Categorie' | 'TopRecherche';

export interface PubliciteExterne {
  id: string; // UUID
  nomEntreprise: string;
  imageBanniereUrl: string;
  lienRedirection: string;
  emplacement: EmplacementPub;
  dateDebut: string | Date;
  dateFin: string | Date;
  statut: boolean;
}

export type TypeAction = 'VueProfil' | 'ClicWhatsApp' | 'AppelDirect' | 'VueProduit';

export interface StatistiqueInteraction {
  id: string; // UUID
  boutique_id?: string; // ForeignKey
  produit_id?: string; // ForeignKey
  typeAction: TypeAction;
  dateAction: string | Date;
  adresseIP: string;
}

// ---------------------------------------------------------
// Types étendus pour l'Interface Utilisateur (UI)
// ---------------------------------------------------------

export interface VendeurUI extends Partial<Vendeur> {
  nom: string;
  rating?: number;
  hasBadge?: boolean;
  avatar?: string;
  description?: string;
  localisation?: string;
  whatsapp?: string; // Simplification UI
}

export interface ProduitUI extends Produit {
  rating?: number;
  reviewsCount?: number;
  isSponsorised?: boolean;
  sponsorisedTag?: 'SPONSORISÉ' | 'ELITE';
  telephone_contact?: string;
  whatsapp_contact?: string;
  localisation?: string;
  nom_boutique?: string;
  hasBadge?: boolean;
}

// ---------------------------------------------------------
// Ancien types gardés pour la compatibilité (temporaire)
// ---------------------------------------------------------
export interface Product {
  id: string;
  title: string;
  category: string;
  price: number;
  image: string;
  seller: string;
  hasBadge: boolean;
  rating?: number;
  reviewsCount?: number;
  isSponsorised?: boolean;
  sponsorisedTag?: 'SPONSORISÉ' | 'ELITE';
  description?: string;
  phoneNumber?: string;
  whatsappNumber?: string;
  location?: string;
}

export interface Seller {
  name: string;
  rating: number;
  hasBadge: boolean;
  avatar: string;
  phone: string;
  whatsapp: string;
  location: string;
  description: string;
}

export interface Message {
  sender: 'user' | 'seller';
  text: string;
  timestamp: string;
}
