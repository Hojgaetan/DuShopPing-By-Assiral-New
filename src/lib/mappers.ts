import type { ProduitUI } from '../types';

function firstRelation<T>(relation: T | T[] | null | undefined): T | undefined {
  return Array.isArray(relation) ? relation[0] : relation || undefined;
}

export function mapProductRow(product: any): ProduitUI {
  const boutique = firstRelation<{ nom?: string; localisation?: string }>(product.boutiques);
  const category = firstRelation<{ nom?: string }>(product.categories);
  const sponsored = Boolean(product.est_sponsorise);

  return {
    id: product.id,
    boutique_id: product.boutique_id,
    categorie_id: category?.nom || product.categorie_id || 'Autres',
    titre: product.titre,
    description: product.description || '',
    prix: Number(product.prix),
    images: product.images?.length ? product.images : [],
    datePublication: product.date_publication,
    statut: product.statut,
    nom_boutique: boutique?.nom || 'Boutique indépendante',
    localisation: boutique?.localisation || undefined,
    telephone_contact: product.telephone_contact || undefined,
    whatsapp_contact: product.whatsapp_contact || undefined,
    hasBadge: false,
    isSponsorised: sponsored,
    sponsorisedTag: sponsored ? 'SPONSORISÉ' : undefined,
  };
}

export function resolveProfileRole(
  typeUtilisateur: unknown,
  adminRelation: unknown | unknown[] | null | undefined,
): 'Vendeur' | 'Entreprise' | 'Admin' {
  const admin = firstRelation(adminRelation);
  if (admin) return 'Admin';
  if (typeUtilisateur === 'Entreprise') return 'Entreprise';
  return 'Vendeur';
}

export function isDatabaseUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

export function isPublishingQuotaExceeded(quota: { used: number; max: number; unlimited: boolean; enabled: boolean }): boolean {
  return quota.enabled && !quota.unlimited && quota.used >= quota.max;
}
