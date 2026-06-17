// Services locaux utilisant localStorage comme base de données
// Prêt à être remplacé par Supabase quand les clés seront configurées

export async function fetchUserBoutique(vendeurId: string) {
  const boutiques = JSON.parse(localStorage.getItem('dushop_boutiques_db') || '[]');
  return boutiques.find((b: any) => b.vendeur_id === vendeurId) || null;
}

export async function createOrUpdateBoutique(vendeurId: string, boutiqueData: any) {
  const boutiques = JSON.parse(localStorage.getItem('dushop_boutiques_db') || '[]');
  const index = boutiques.findIndex((b: any) => b.vendeur_id === vendeurId);

  if (index >= 0) {
    boutiques[index] = { ...boutiques[index], ...boutiqueData };
  } else {
    boutiques.push({ id: 'boutique-' + Date.now(), vendeur_id: vendeurId, ...boutiqueData });
  }

  localStorage.setItem('dushop_boutiques_db', JSON.stringify(boutiques));
  return boutiques[index >= 0 ? index : boutiques.length - 1];
}

export async function checkPublishingQuota(boutiqueId: string) {
  const produits = JSON.parse(localStorage.getItem('dushop_produits_db') || '[]');
  const count = produits.filter((p: any) => p.boutique_id === boutiqueId).length;
  return { used: count, max: 5 };
}

export async function createProduct(boutiqueId: string, productData: any) {
  const produits = JSON.parse(localStorage.getItem('dushop_produits_db') || '[]');
  
  const newProduct = {
    id: 'prod-' + Date.now(),
    boutique_id: boutiqueId,
    titre: productData.titre,
    description: productData.description,
    prix: productData.prix,
    categorie_id: productData.categorie_id,
    image_url: productData.image_url || '',
    date_publication: new Date().toISOString(),
    statut: 'Actif',
    vues: 0,
  };

  produits.push(newProduct);
  localStorage.setItem('dushop_produits_db', JSON.stringify(produits));
  return newProduct;
}

export async function subscribeToBoost(boutiqueId: string, planId: string, operateur: 'MoMo' | 'OM', numero: string, montant: number) {
  const paiements = JSON.parse(localStorage.getItem('dushop_paiements_db') || '[]');

  const paiement = {
    id: 'pay-' + Date.now(),
    boutique_id: boutiqueId,
    plan_id: planId,
    reference_transaction: `TXN-${Date.now()}`,
    montant,
    operateur,
    numero,
    statut: 'Reussi',
    date: new Date().toISOString(),
  };

  paiements.push(paiement);
  localStorage.setItem('dushop_paiements_db', JSON.stringify(paiements));
  return { success: true, transactionId: paiement.reference_transaction };
}

export async function getSellerStats(boutiqueId: string) {
  const produits = JSON.parse(localStorage.getItem('dushop_produits_db') || '[]');
  const mesProduits = produits.filter((p: any) => p.boutique_id === boutiqueId);
  const totalVues = mesProduits.reduce((acc: number, p: any) => acc + (p.vues || 0), 0);

  return {
    vuesBoutique: Math.floor(Math.random() * 50) + mesProduits.length * 10,
    vuesProduits: totalVues || mesProduits.length * 5,
    clics: Math.floor(Math.random() * 10) + mesProduits.length,
  };
}
