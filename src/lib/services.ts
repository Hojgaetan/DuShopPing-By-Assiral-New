import { supabase } from './supabase';
import { Boutique, Produit, Paiement, CampagneBoost } from '../types';

// ============================================================================
// SERVICES SUPABASE (Remplaçant l'ancien localStorage)
// Les données sont traduites pour garder la compatibilité avec l'UI actuelle
// ============================================================================

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
    };
  }
  
  return null;
}

export async function createOrUpdateBoutique(vendeurId: string, boutiqueData: any) {
  const payload = {
    vendeur_id: vendeurId,
    nom: boutiqueData.nom,
    description: boutiqueData.description,
    localisation: boutiqueData.localisation || '',
    logo_url: boutiqueData.logo_url || boutiqueData.logoUrl || '',
    statut_moderation: 'Approuvee' // Simplification temporaire pour le frontend
  };

  const { data, error } = await supabase
    .from('boutiques')
    .update(payload)
    .eq('vendeur_id', vendeurId)
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
  };
}

export async function checkPublishingQuota(boutiqueId: string) {
  // On vérifie dynamiquement le nombre de produits de cette boutique
  const { count, error } = await supabase
    .from('produits')
    .select('*', { count: 'exact', head: true })
    .eq('boutique_id', boutiqueId);

  if (error) {
    console.error('Erreur lors de la vérification du quota:', error);
    return { used: 0, max: 5 };
  }

  return { used: count || 0, max: 5 };
}

export async function createProduct(boutiqueId: string, productData: any) {
  const { data, error } = await supabase
    .from('produits')
    .insert([{
      boutique_id: boutiqueId,
      categorie_id: productData.categorie_id || '11111111-1111-1111-1111-111111111111', // ID statique fallback
      sous_categorie: productData.sous_categorie || null,
      titre: productData.titre,
      description: productData.description,
      prix: productData.prix,
      images: productData.images && productData.images.length > 0 ? productData.images : (productData.image_url ? [productData.image_url] : []),
      statut: 'Actif'
    }])
    .select()
    .single();

  if (error) {
    console.error('Erreur lors de la création du produit:', error);
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
    date_publication: data.date_publication,
    statut: data.statut,
    vues: 0,
    clics_contact: 0,
  };
}

export async function subscribeToBoost(boutiqueId: string, planId: string, operateur: 'MoMo' | 'OM', numero: string, montant: number) {
  // 1. Récupérer le vendeur_id à partir de la boutique
  const { data: boutique } = await supabase
    .from('boutiques')
    .select('vendeur_id')
    .eq('id', boutiqueId)
    .single();

  if (!boutique) {
    return { success: false, error: "Boutique introuvable" };
  }

  // 2. Créer le paiement dans Supabase
  const { data: paiement, error: paymentError } = await supabase
    .from('paiements')
    .insert([{
      vendeur_id: boutique.vendeur_id,
      reference_transaction: `TXN-${Date.now()}`,
      montant: montant,
      operateur: operateur,
      statut: 'Reussi'
    }])
    .select()
    .single();

  if (paymentError) {
    console.error('Erreur lors du paiement:', paymentError);
    return { success: false, error: paymentError.message };
  }

  return { success: true, transactionId: paiement.reference_transaction };
}

export async function getSellerStats(boutiqueId: string) {
  // Récupération des stats via la table statistiques_interactions
  const { data: statsData, error: statsError } = await supabase
    .from('statistiques_interactions')
    .select('type_action')
    .eq('boutique_id', boutiqueId);

  let clics = 0;
  let vuesBoutique = 0;

  if (!statsError && statsData) {
    clics = statsData.filter(s => s.type_action === 'ClicWhatsApp' || s.type_action === 'AppelDirect').length;
    vuesBoutique = statsData.filter(s => s.type_action === 'VueProfil').length;
  }

  return {
    vuesBoutique,
    clics,
  };
}

export async function incrementBoutiqueVues(boutiqueId: string) {
  await supabase
    .from('statistiques_interactions')
    .insert([{
      boutique_id: boutiqueId,
      type_action: 'VueProfil',
      adresse_ip: 'CLIENT_IP' // En vrai géré par RLS
    }]);
}

export async function incrementProductClics(productId: string) {
  // Pour un clic produit, on cherche d'abord la boutique associée (optionnel mais utile pour les stats)
  const { data: produit } = await supabase
    .from('produits')
    .select('boutique_id')
    .eq('id', productId)
    .single();

  await supabase
    .from('statistiques_interactions')
    .insert([{
      produit_id: productId,
      boutique_id: produit?.boutique_id || null,
      type_action: 'ClicWhatsApp', // ou AppelDirect
      adresse_ip: 'CLIENT_IP'
    }]);
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
    .select('*, boutiques(nom)')
    .order('date_publication', { ascending: false })
    .limit(50);
    
  return { categories, produits: produits || [] };
}

// ============================================================================
// SERVICES ADMIN (Vendeurs & Annonces)
// ============================================================================

export async function fetchAdminBoutiques() {
  const { data, error } = await supabase
    .from('boutiques')
    .select(`
      *,
      vendeurs (
        statut_verification,
        utilisateurs (
          nom,
          email
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
    statut_verification: b.vendeurs?.statut_verification,
    nb_produits: b.produits?.[0]?.count || 0
  }));
}

export async function updateBoutiqueStatus(boutiqueId: string, statut: string) {
  const { error } = await supabase
    .from('boutiques')
    .update({ statut_moderation: statut })
    .eq('id', boutiqueId);

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

export async function updateProductStatus(productId: string, statut: string) {
  const { error } = await supabase
    .from('produits')
    .update({ statut: statut })
    .eq('id', productId);

  if (error) throw error;
  return true;
}
