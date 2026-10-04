import { supabase } from './supabase';
import { Boutique, Produit, Paiement, CampagneBoost } from '../types';
import type { ProduitUI } from '../types';
import { mapProductRow } from './mappers';

// ============================================================================
// SERVICES SUPABASE (Remplaçant l'ancien localStorage)
// Les données sont traduites pour garder la compatibilité avec l'UI actuelle
// ============================================================================

export async function fetchPublicProducts(): Promise<ProduitUI[]> {
  // Synchronisation déterministe des campagnes expirées avant d'afficher le catalogue.
  // En production, cette RPC pourra aussi être appelée périodiquement par Supabase Cron.
  const { error: refreshError } = await supabase.rpc('refresh_expired_boosts');
  if (refreshError) {
    console.warn('Impossible de synchroniser les campagnes Boost:', refreshError.message);
  }

  const { data, error } = await supabase
    .from('produits')
    .select(`
      id,
      boutique_id,
      categorie_id,
      titre,
      description,
      prix,
      images,
      date_publication,
      statut,
      est_sponsorise,
      telephone_contact,
      whatsapp_contact,
      boutiques!inner (nom, localisation, statut_moderation),
      categories (nom)
    `)
    .eq('statut', 'Actif')
    .eq('boutiques.statut_moderation', 'Approuvee')
    .order('date_publication', { ascending: false });

  if (error) {
    throw error;
  }

  return (data || []).map(mapProductRow);
}

export async function fetchProductById(productId: string): Promise<ProduitUI | null> {
  const { data, error } = await supabase
    .from('produits')
    .select(`
      id,
      boutique_id,
      categorie_id,
      titre,
      description,
      prix,
      images,
      date_publication,
      statut,
      est_sponsorise,
      telephone_contact,
      whatsapp_contact,
      boutiques!inner (nom, localisation, statut_moderation),
      categories (nom)
    `)
    .eq('id', productId)
    .eq('boutiques.statut_moderation', 'Approuvee')
    .maybeSingle();

  if (error) {
    console.warn('Impossible de charger le produit:', error.message);
    throw error;
  }

  return data ? mapProductRow(data) : null;
}

export async function fetchActiveBoostedProducts(): Promise<ProduitUI[]> {
  const { data, error } = await supabase
    .from('produits')
    .select(`
      id, boutique_id, categorie_id, titre, description, prix, images,
      date_publication, statut, est_sponsorise, telephone_contact,
      whatsapp_contact, boutiques!inner (nom, localisation, statut_moderation), categories (nom)
    `)
    .eq('statut', 'Actif')
    .eq('boutiques.statut_moderation', 'Approuvee')
    .eq('est_sponsorise', true)
    .order('date_publication', { ascending: false });

  if (error) {
    console.warn('Impossible de charger les produits sponsorisés:', error.message);
    return [];
  }

  return (data || []).map(mapProductRow);
}

export async function fetchUserBoutique(vendeurId: string) {
  const { data, error } = await supabase
    .from('boutiques')
    .select('*')
    .eq('vendeur_id', vendeurId)
    .single();

  // PGRST116 signifie qu'aucune ligne n'a été trouvée, ce qui est normal si la boutique n'existe pas encore
  if (error && error.code !== 'PGRST116') {
    console.error('Erreur lors de la récupération de la boutique:', error);
    return null;
  }

  // Compatibilité ascendante avec l'ancien format
  if (data) {
    return {
      id: data.id,
      vendeur_id: data.vendeur_id,
      nom: data.nom,
      description: data.description,
      logo_url: data.logo_url,
      localisation: data.localisation,
      statut_moderation: data.statut_moderation,
    };
  }
  
  return null;
}

export async function createOrUpdateBoutique(vendeurId: string, boutiqueData: any) {
  const payload = {
    vendeur_id: vendeurId,
    nom: boutiqueData.nom.trim(),
    description: boutiqueData.description?.trim() || '',
    localisation: boutiqueData.localisation?.trim() || '',
    logo_url: boutiqueData.logo_url || boutiqueData.logoUrl || '',
  };

  const { data, error } = await supabase
    .from('boutiques')
    .upsert(payload, { onConflict: 'vendeur_id' })
    .select()
    .single();

  if (error) {
    console.error('Erreur création/mise à jour boutique:', error);
    throw error;
  }

  return {
    id: data.id,
    vendeur_id: data.vendeur_id,
    nom: data.nom,
    description: data.description,
    logo_url: data.logo_url,
    localisation: data.localisation,
    statut_moderation: data.statut_moderation,
  };
}

export async function checkPublishingQuota(boutiqueId: string) {
  const { data, error } = await supabase.rpc('get_publishing_quota', { boutique_uuid: boutiqueId });
  if (error) {
    console.error('Erreur lors de la vérification du quota:', error);
    return { used: 0, max: 5, unlimited: false, enabled: true };
  }
  return {
    used: Number(data?.used || 0),
    max: Number(data?.max || 5),
    unlimited: Boolean(data?.unlimited),
    enabled: data?.enabled !== false,
  };
}

export async function fetchPublicationQuotaConfig() {
  const { data, error } = await supabase.rpc('get_publication_configuration');
  if (error) throw error;
  return { max: Number(data.max), enabled: Boolean(data.enabled), updatedAt: data.updated_at as string };
}

export async function updatePublicationQuotaConfig(max: number, enabled: boolean) {
  const { data, error } = await supabase.rpc('update_publication_configuration', {
    max_products: max,
    quota_enabled: enabled,
  });
  if (error) throw error;
  return data;
}

export async function createProduct(boutiqueId: string, productData: any) {
  const images = (productData.images || []).filter((image: string) => image.trim() !== '');

  const { data, error } = await supabase
    .from('produits')
    .insert([{
      boutique_id: boutiqueId,
      categorie_id: productData.categorie_id,
      sous_categorie: productData.sous_categorie || null,
      titre: productData.titre,
      description: productData.description,
      prix: productData.prix,
      images,
      telephone_contact: productData.telephone_contact || null,
      whatsapp_contact: productData.whatsapp_contact || productData.telephone_contact || null,
      statut: 'Actif'
    }])
    .select()
    .single();

  if (error) {
    console.error('Erreur lors de la création du produit:', JSON.stringify({ code: error.code, message: error.message, details: error.details, hint: error.hint }));
    throw error;
  }

  // Compatibilité UI : renvoi au format attendu par les états React
  return {
    id: data.id,
    boutique_id: boutiqueId,
    titre: data.titre,
    description: data.description,
    prix: data.prix,
    categorie_id: data.categorie_id,
    image_url: data.images && data.images.length > 0 ? data.images[0] : '',
    telephone_contact: data.telephone_contact,
    whatsapp_contact: data.whatsapp_contact,
    date_publication: data.date_publication,
    statut: data.statut,
    vues: 0,
    clics_contact: 0,
  };
}

export interface SellerProductSummary {
  id: string;
  titre: string;
  prix: number;
  images: string[];
  statut: 'Actif' | 'Vendu' | 'Bloque' | 'Brouillon';
  vues: number;
  datePublication: string;
}

export async function fetchBoutiqueProducts(boutiqueId: string): Promise<SellerProductSummary[]> {
  const { data, error } = await supabase
    .from('produits')
    .select('id, titre, prix, images, statut, vues_count, date_publication')
    .eq('boutique_id', boutiqueId)
    .order('date_publication', { ascending: false });

  if (error) {
    console.error('Erreur lors du chargement des produits de la boutique:', error);
    throw error;
  }

  return (data || []).map((product: any) => ({
    id: product.id,
    titre: product.titre,
    prix: Number(product.prix),
    images: product.images || [],
    statut: product.statut,
    vues: product.vues_count || 0,
    datePublication: product.date_publication,
  }));
}

export interface SellerProductEditRecord extends SellerProductSummary {
  boutique_id: string;
  categorie_id: string;
  sous_categorie: string | null;
  description: string;
  telephone_contact: string | null;
  whatsapp_contact: string | null;
}

export async function fetchSellerProduct(productId: string): Promise<SellerProductEditRecord> {
  const { data, error } = await supabase
    .from('produits')
    .select('id, boutique_id, categorie_id, sous_categorie, titre, description, prix, images, statut, vues_count, date_publication, telephone_contact, whatsapp_contact')
    .eq('id', productId)
    .single();
  if (error) throw error;
  return {
    id: data.id,
    boutique_id: data.boutique_id,
    categorie_id: data.categorie_id,
    sous_categorie: data.sous_categorie,
    titre: data.titre,
    description: data.description || '',
    prix: Number(data.prix),
    images: data.images || [],
    statut: data.statut,
    vues: data.vues_count || 0,
    datePublication: data.date_publication,
    telephone_contact: data.telephone_contact,
    whatsapp_contact: data.whatsapp_contact,
  };
}

export async function updateSellerProduct(productId: string, input: {
  titre: string; description: string; prix: number; categorie_id: string;
  sous_categorie?: string | null; images: string[]; statut: 'Actif' | 'Vendu' | 'Brouillon';
  telephone_contact?: string | null; whatsapp_contact?: string | null;
}) {
  const { data, error } = await supabase.from('produits').update(input).eq('id', productId).select().single();
  if (error) throw error;
  return data;
}

export async function deleteSellerProduct(productId: string) {
  const { error } = await supabase.from('produits').delete().eq('id', productId);
  if (error) throw error;
}

export async function subscribeToBoost(productId: string, planId: string, numero: string) {
  const { data, error: paymentError } = await supabase.rpc('create_pending_boost_payment', {
    product_uuid: productId,
    plan_uuid: planId,
    payment_phone: numero.trim() || null,
  });

  if (paymentError) {
    console.error('Erreur lors du paiement:', paymentError);
    return { success: false, error: paymentError.message };
  }

  return {
    success: true,
    transactionId: data.transactionId as string,
    status: data.status as string,
    amount: Number(data.amount),
  };
}

export interface SellerBoostRequest {
  id: string;
  reference: string;
  amount: number;
  operator: string;
  phone: string | null;
  status: 'Reussi' | 'Echoue' | 'EnAttente';
  requestedAt: string;
  productTitle: string;
  planName: string;
  startsAt: string | null;
  endsAt: string | null;
  campaignStatus: string | null;
}

export async function fetchMyBoostRequests(): Promise<SellerBoostRequest[]> {
  const { data, error } = await supabase.rpc('get_my_boost_requests');
  if (error) throw error;
  return (data || []).map((request: any) => ({
    ...request,
    amount: Number(request.amount),
  }));
}

export async function getSellerStats(boutiqueId: string) {
  const startDate = new Date();
  startDate.setUTCHours(0, 0, 0, 0);
  startDate.setUTCDate(startDate.getUTCDate() - 6);

  const { data: statsData, error: statsError } = await supabase
    .from('statistiques_interactions')
    .select('type_action, date_action')
    .eq('boutique_id', boutiqueId)
    .order('date_action', { ascending: true });

  if (statsError) throw statsError;

  let clics = 0;
  let vuesBoutique = 0;
  let vuesProduits = 0;

  if (statsData) {
    clics = statsData.filter(s => s.type_action === 'ClicWhatsApp' || s.type_action === 'AppelDirect').length;
    vuesBoutique = statsData.filter(s => s.type_action === 'VueProfil').length;
    vuesProduits = statsData.filter(s => s.type_action === 'VueProduit').length;
  }

  const evolution = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(startDate);
    date.setUTCDate(startDate.getUTCDate() + index);
    return {
      date: date.toISOString().slice(0, 10),
      label: new Intl.DateTimeFormat('fr-FR', { weekday: 'short' }).format(date).replace('.', ''),
      vues: 0,
      clics: 0,
    };
  });

  const days = new Map(evolution.map(day => [day.date, day]));
  for (const interaction of statsData || []) {
    const day = days.get(new Date(interaction.date_action).toISOString().slice(0, 10));
    if (!day) continue;
    if (interaction.type_action === 'VueProfil' || interaction.type_action === 'VueProduit') day.vues += 1;
    if (interaction.type_action === 'ClicWhatsApp' || interaction.type_action === 'AppelDirect') day.clics += 1;
  }

  return {
    vuesBoutique,
    vuesProduits,
    clics,
    evolution,
  };
}

const VISITOR_TOKEN_KEY = 'dushopping_analytics_visitor_id';

function getAnalyticsVisitorToken(): string {
  const existingToken = window.localStorage.getItem(VISITOR_TOKEN_KEY);
  if (existingToken) return existingToken;
  const token = crypto.randomUUID();
  window.localStorage.setItem(VISITOR_TOKEN_KEY, token);
  return token;
}

export async function incrementBoutiqueVues(boutiqueId: string) {
  await supabase.rpc('record_public_interaction', {
    product_uuid: null,
    boutique_uuid: boutiqueId,
    action_name: 'VueProfil',
    visitor_token: getAnalyticsVisitorToken(),
  });
}

export async function incrementProductClics(productId: string, action: 'ClicWhatsApp' | 'AppelDirect') {
  await supabase.rpc('record_public_interaction', {
    product_uuid: productId,
    boutique_uuid: null,
    action_name: action,
    visitor_token: getAnalyticsVisitorToken(),
  });
}

export async function incrementProductViews(productId: string) {
  await supabase.rpc('record_public_interaction', {
    product_uuid: productId,
    boutique_uuid: null,
    action_name: 'VueProduit',
    visitor_token: getAnalyticsVisitorToken(),
  });
}

export interface PublicStorefront {
  id: string;
  nom: string;
  description: string | null;
  localisation: string | null;
  logo_url: string | null;
  verified: boolean;
}

export async function fetchPublicStorefront(reference: string): Promise<PublicStorefront | null> {
  const { data, error } = await supabase.rpc('get_public_storefront', {
    store_reference: reference,
  });
  if (error) throw error;
  return data || null;
}

export async function fetchMyFavoriteProductIds(): Promise<string[]> {
  const { data, error } = await supabase.rpc('get_my_favorites');
  if (error) return [];
  return data || [];
}

export async function toggleMyFavorite(productId: string): Promise<string[]> {
  const { data, error } = await supabase.rpc('toggle_my_favorite', {
    product_uuid: productId,
  });
  if (error) throw error;
  return data || [];
}

// ============================================================================
// SERVICES CATEGORIES
// ============================================================================

export async function fetchCategories() {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('nom');
  
  if (error) {
    console.error('Erreur lors de la récupération des catégories:', error);
    return [];
  }
  return data;
}

export async function createCategory(catData: { nom: string; icone_url?: string; sous_categories?: string[] }) {
  const { data, error } = await supabase
    .from('categories')
    .insert([catData])
    .select()
    .single();

  if (error) {
    console.error('Erreur création catégorie:', error);
    throw error;
  }
  return data;
}

export async function updateCategory(id: string, catData: { nom: string; icone_url?: string; sous_categories?: string[] }) {
  const { data, error } = await supabase
    .from('categories')
    .update(catData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Erreur maj catégorie:', error);
    throw error;
  }
  return data;
}

export async function deleteCategory(id: string) {
  const { error } = await supabase
    .from('categories')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Erreur suppression catégorie:', error);
    throw error;
  }
  return true;
}

export async function fetchMegaMenuData() {
  // Récupère les catégories et pour chaque sous-catégorie, essaie de trouver jusqu'à 2 produits populaires
  // Pour l'instant, faisons 2 requêtes : une pour les catégories, une pour les produits (limités)
  const categories = await fetchCategories();
  
  // Dans un MVP, on va faire simple : récupérer les X derniers produits et les associer en frontend
  const { data: produits } = await supabase
    .from('produits')
    .select('*, boutiques!inner(nom, statut_moderation)')
    .eq('boutiques.statut_moderation', 'Approuvee')
    .eq('statut', 'Actif')
    .order('date_publication', { ascending: false })
    .limit(50);
    
  return { categories, produits: produits || [] };
}

// ============================================================================
// SERVICES ADMIN (Vendeurs & Annonces)
// ============================================================================

export interface AdminDashboardOverview {
  vendeurs_total: number; boutiques_total: number; boutiques_en_attente: number;
  boutiques_approuvees: number; produits_total: number; produits_actifs: number;
  produits_bloques: number; paiements_en_attente: number; revenus_boost: number;
  paiements_valides: number;
  derniers_paiements: Array<{ id: string; reference_transaction: string; montant: number; statut: 'Reussi' | 'Echoue' | 'EnAttente'; date_paiement: string }>;
}

export async function fetchAdminDashboardOverview(): Promise<AdminDashboardOverview> {
  const { data, error } = await supabase.rpc('get_admin_dashboard_overview');
  if (error) throw error;
  return data as AdminDashboardOverview;
}

export type VerificationStatus = 'EnAttente' | 'Approuve' | 'Rejete';
export interface SellerVerificationRecord {
  vendeur_id: string; type_document: 'CNI' | 'Passeport' | 'Permis';
  document_recto_path: string; document_verso_path: string | null; document_rcc_path?: string | null;
  statut: VerificationStatus; motif_decision: string | null; soumis_le: string;
  examine_le: string | null;
}

export async function fetchMySellerVerification(): Promise<SellerVerificationRecord | null> {
  const { data, error } = await supabase.from('dossiers_verification_vendeurs').select('*').maybeSingle();
  if (error) throw error;
  return data as SellerVerificationRecord | null;
}

export async function submitSellerVerification(type: SellerVerificationRecord['type_document'], recto: File, verso?: File | null, rcc?: File | null) {
  const { data: authData } = await supabase.auth.getUser();
  const userId = authData.user?.id;
  if (!userId) throw new Error('Session expirée.');
  const upload = async (file: File, side: string) => {
    if (file.size > 5 * 1024 * 1024) throw new Error('Chaque fichier doit peser au maximum 5 Mo.');
    if (!['image/jpeg', 'image/png', 'image/webp', 'application/pdf'].includes(file.type)) throw new Error('Utilisez un fichier JPG, PNG, WEBP ou PDF.');
    const extension = file.name.split('.').pop()?.toLowerCase() || 'bin';
    const path = `${userId}/${side}-${Date.now()}.${extension}`;
    const { error } = await supabase.storage.from('seller-verification').upload(path, file, { contentType: file.type });
    if (error) throw error;
    return path;
  };
  for (const file of [recto, verso, rcc]) {
    if (file && (file.size > 5 * 1024 * 1024 || !['image/jpeg', 'image/png', 'image/webp', 'application/pdf'].includes(file.type))) throw new Error('Utilisez un JPG, PNG, WEBP ou PDF de 5 Mo maximum.');
  }
  const rectoPath = await upload(recto, 'recto');
  const versoPath = verso ? await upload(verso, 'verso') : null;
  const rccPath = rcc ? await upload(rcc, 'rcc') : null;
  const { error } = await supabase.rpc('submit_seller_verification', { document_type: type, recto_path: rectoPath, verso_path: versoPath, rcc_path: rccPath });
  if (error) throw error;
}

export interface AdminVerificationRecord extends SellerVerificationRecord {
  vendeur_nom: string; vendeur_email: string; boutique_nom: string; type_profil?: string;
}

export async function fetchAdminSellerVerifications(): Promise<AdminVerificationRecord[]> {
  const { data, error } = await supabase.from('dossiers_verification_vendeurs')
    .select('*, vendeurs(utilisateurs(nom, email, type_utilisateur), boutiques(nom))').order('soumis_le', { ascending: false });
  if (error) throw error;
  return (data || []).map((item: any) => ({
    ...item,
    type_profil: item.vendeurs?.utilisateurs?.type_utilisateur || 'Vendeur',
    vendeur_nom: item.vendeurs?.utilisateurs?.nom || 'Vendeur inconnu',
    vendeur_email: item.vendeurs?.utilisateurs?.email || '',
    boutique_nom: item.vendeurs?.boutiques?.[0]?.nom || item.vendeurs?.boutiques?.nom || 'Boutique inconnue',
  }));
}

export async function createVerificationDocumentUrl(path: string) {
  const { data, error } = await supabase.storage.from('seller-verification').createSignedUrl(path, 300);
  if (error) throw error;
  return data.signedUrl;
}

export async function reviewSellerVerification(sellerId: string, approve: boolean, reason?: string) {
  const { error } = await supabase.rpc('review_seller_verification', { seller_uuid: sellerId, approve_verification: approve, decision_reason: reason || null });
  if (error) throw error;
}

export interface AdministratorRecord { utilisateur_id: string; nom: string; email: string; role: 'SuperAdmin' | 'Moderateur' | 'Commercial' }
export async function fetchAdministrators(): Promise<AdministratorRecord[]> {
  const { data, error } = await supabase.rpc('list_administrators');
  if (error) throw error;
  return (data || []) as AdministratorRecord[];
}
export async function manageAdministrator(email: string, role: AdministratorRecord['role'], remove = false) {
  const { error } = await supabase.rpc('manage_administrator', { target_email: email, requested_role: role, remove_access: remove });
  if (error) throw error;
}

export interface NotificationRecord {
  id: string; titre: string; message: string; type: string; lien: string | null;
  est_lue: boolean; date_creation: string;
}
export async function fetchMyNotifications(limit = 20): Promise<NotificationRecord[]> {
  const { data, error } = await supabase.from('notifications').select('id, titre, message, type, lien, est_lue, date_creation')
    .order('date_creation', { ascending: false }).limit(limit);
  if (error) throw error;
  return (data || []) as NotificationRecord[];
}
export async function markNotificationRead(notificationId?: string) {
  const { error } = await supabase.rpc('mark_notification_read', { notification_uuid: notificationId || null });
  if (error) throw error;
}

export interface AdminAuditRecord {
  id: string; action: 'INSERT' | 'UPDATE' | 'DELETE'; table_cible: string;
  cible_id: string | null; details: Record<string, string>; date_action: string;
  auteur_nom: string | null; auteur_email: string | null; auteur_role: string | null;
  action_metier: string | null; resume: string | null;
  valeur_avant: Record<string, unknown>; valeur_apres: Record<string, unknown>;
  utilisateurs: { nom: string; email: string } | null;
}
export async function fetchAdminAuditLog(limit = 100): Promise<AdminAuditRecord[]> {
  const { data, error } = await supabase.from('journal_administration')
    .select('id, action, table_cible, cible_id, details, date_action, auteur_nom, auteur_email, auteur_role, action_metier, resume, valeur_avant, valeur_apres, utilisateurs(nom, email)')
    .order('date_action', { ascending: false }).limit(limit);
  if (error) throw error;
  return (data || []) as unknown as AdminAuditRecord[];
}

export async function subscribeNewsletter(email: string) {
  const { error } = await supabase.rpc('subscribe_newsletter', { subscriber_email: email });
  if (error) throw error;
}

export async function fetchAdminBoutiques() {
  const { data, error } = await supabase
    .from('boutiques')
    .select(`
      *,
      vendeurs (
        statut_verification,
        utilisateurs (
          nom,
          email,
          statut_compte
        )
      ),
      produits (count)
    `);

  if (error) {
    console.error('Erreur fetchAdminBoutiques:', error);
    return [];
  }

  return data.map(b => ({
    id: b.id,
    vendeur_id: b.vendeur_id,
    nom: b.nom,
    statut_moderation: b.statut_moderation,
    nom_vendeur: b.vendeurs?.utilisateurs?.nom || 'Inconnu',
    email: b.vendeurs?.utilisateurs?.email || 'Inconnu',
    statut_compte: b.vendeurs?.utilisateurs?.statut_compte || 'Actif',
    statut_verification: b.vendeurs?.statut_verification,
    nb_produits: b.produits?.[0]?.count || 0
  }));
}

export async function updateBoutiqueStatus(boutiqueId: string, statut: 'EnAttente' | 'Approuvee' | 'Rejetee') {
  const { error } = await supabase.rpc('review_boutique', {
    boutique_uuid: boutiqueId,
    moderation_status: statut,
  });

  if (error) throw error;
  return true;
}

export async function updateSellerAccountStatus(sellerId: string, statut: 'Actif' | 'Suspendu') {
  const { error } = await supabase.rpc('set_seller_account_status', {
    seller_uuid: sellerId,
    account_status: statut,
  });
  if (error) throw error;
  return true;
}

export async function fetchAdminBoutiqueProducts(boutiqueId: string) {
  const { data, error } = await supabase
    .from('produits')
    .select('*')
    .eq('boutique_id', boutiqueId)
    .order('date_publication', { ascending: false });

  if (error) throw error;
  return data;
}

export async function updateProductStatus(productId: string, statut: 'Actif' | 'Bloque') {
  const { error } = await supabase.rpc('moderate_product', {
    product_uuid: productId,
    moderation_status: statut,
  });

  if (error) throw error;
  return true;
}

export interface AdminProductRecord {
  id: string;
  titre: string;
  description: string;
  prix: number;
  images: string[];
  statut: 'Actif' | 'Bloque' | 'Brouillon' | 'Vendu';
  date_publication: string;
  boutique_nom: string;
  boutique_statut: string;
  categorie_nom: string;
}

export async function fetchAdminProducts(): Promise<AdminProductRecord[]> {
  const { data, error } = await supabase
    .from('produits')
    .select('id, titre, description, prix, images, statut, date_publication, boutiques(nom, statut_moderation), categories(nom)')
    .order('date_publication', { ascending: false });
  if (error) throw error;
  return (data || []).map((product: any) => ({
    id: product.id,
    titre: product.titre,
    description: product.description || '',
    prix: Number(product.prix),
    images: product.images || [],
    statut: product.statut,
    date_publication: product.date_publication,
    boutique_nom: product.boutiques?.nom || 'Boutique inconnue',
    boutique_statut: product.boutiques?.statut_moderation || 'Inconnu',
    categorie_nom: product.categories?.nom || 'Sans catégorie',
  }));
}

export interface SponsoringPlanRecord {
  id: string;
  nom_plan: string;
  duree_en_jours: number;
  prix_unitaire: number;
  multiplicateur_visibilite: number;
}

export type SponsoringPlanInput = Omit<SponsoringPlanRecord, 'id'>;

export async function fetchSponsoringPlans(): Promise<SponsoringPlanRecord[]> {
  const { data, error } = await supabase
    .from('plan_sponsorisations')
    .select('*')
    .order('prix_unitaire', { ascending: true });

  if (error) throw error;
  return (data || []).map((plan: any) => ({
    ...plan,
    prix_unitaire: Number(plan.prix_unitaire),
    multiplicateur_visibilite: Number(plan.multiplicateur_visibilite),
  }));
}

export async function createSponsoringPlan(input: SponsoringPlanInput) {
  const { data, error } = await supabase
    .from('plan_sponsorisations')
    .insert([input])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateSponsoringPlan(id: string, input: SponsoringPlanInput) {
  const { data, error } = await supabase
    .from('plan_sponsorisations')
    .update(input)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteSponsoringPlan(id: string) {
  const { error } = await supabase
    .from('plan_sponsorisations')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

export interface ExternalAdRecord {
  id: string;
  nom_entreprise: string;
  image_banniere_url: string;
  lien_redirection: string;
  date_debut: string;
  date_fin: string;
  statut: boolean;
  emplacement: 'Accueil' | 'Categorie' | 'TopRecherche';
}

export type ExternalAdInput = Omit<ExternalAdRecord, 'id'>;

export async function fetchExternalAds(): Promise<ExternalAdRecord[]> {
  const { data, error } = await supabase
    .from('publicites_externes')
    .select('*')
    .order('date_debut', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function fetchActiveExternalAds(emplacement?: ExternalAdRecord['emplacement']): Promise<ExternalAdRecord[]> {
  const now = new Date().toISOString();
  let query = supabase
    .from('publicites_externes')
    .select('*')
    .eq('statut', true)
    .lte('date_debut', now)
    .gte('date_fin', now)
    .order('date_debut', { ascending: false });

  if (emplacement) query = query.eq('emplacement', emplacement);
  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function createExternalAd(input: ExternalAdInput) {
  const { data, error } = await supabase.from('publicites_externes').insert([input]).select().single();
  if (error) throw error;
  return data;
}

export async function updateExternalAd(id: string, input: Partial<ExternalAdInput>) {
  const { data, error } = await supabase.from('publicites_externes').update(input).eq('id', id).select().single();
  if (error) throw error;
  return data;
}

export async function deleteExternalAd(id: string) {
  const { error } = await supabase.from('publicites_externes').delete().eq('id', id);
  if (error) throw error;
}

export interface BoostPaymentReviewRecord {
  id: string;
  reference_transaction: string;
  montant: number;
  operateur: string;
  telephone_paiement: string | null;
  statut: 'Reussi' | 'Echoue' | 'EnAttente';
  date_paiement: string;
  vendeur_nom: string;
  vendeur_email: string;
  produit_titre: string;
  plan_nom: string;
}

export async function fetchBoostPayments(): Promise<BoostPaymentReviewRecord[]> {
  const { data, error } = await supabase
    .from('paiements')
    .select(`
      id, reference_transaction, montant, operateur, telephone_paiement, statut, date_paiement,
      vendeurs (utilisateurs (nom, email)),
      produits (titre),
      plan_sponsorisations (nom_plan)
    `)
    .order('date_paiement', { ascending: false });

  if (error) throw error;
  return (data || []).map((payment: any) => ({
    id: payment.id,
    reference_transaction: payment.reference_transaction,
    montant: Number(payment.montant),
    operateur: payment.operateur,
    telephone_paiement: payment.telephone_paiement,
    statut: payment.statut,
    date_paiement: payment.date_paiement,
    vendeur_nom: payment.vendeurs?.utilisateurs?.nom || 'Vendeur inconnu',
    vendeur_email: payment.vendeurs?.utilisateurs?.email || '',
    produit_titre: payment.produits?.titre || 'Produit inconnu',
    plan_nom: payment.plan_sponsorisations?.nom_plan || 'Plan inconnu',
  }));
}

export async function reviewBoostPayment(paymentId: string, approve: boolean) {
  const { data, error } = await supabase.rpc('review_boost_payment', {
    payment_uuid: paymentId,
    approve_payment: approve,
  });
  if (error) throw error;
  return data;
}
