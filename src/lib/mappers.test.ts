import { describe, expect, it } from 'vitest';
import { isDatabaseUuid, isPublishingQuotaExceeded, mapProductRow, resolveProfileRole } from './mappers';

const baseProduct = {
  id: '11111111-1111-4111-8111-111111111111',
  boutique_id: '22222222-2222-4222-8222-222222222222',
  categorie_id: '33333333-3333-4333-8333-333333333333',
  titre: 'Panier artisanal',
  description: null,
  prix: '12500.00',
  images: [],
  date_publication: '2026-08-30T10:00:00Z',
  statut: 'Actif',
  est_sponsorise: true,
  telephone_contact: '+237600000000',
  whatsapp_contact: null,
};

describe('mapProductRow', () => {
  it('normalise un produit et ses relations objet', () => {
    const product = mapProductRow({
      ...baseProduct,
      boutiques: { nom: 'Atelier Assiral', localisation: 'Douala' },
      categories: { nom: 'Artisanat' },
    });

    expect(product.prix).toBe(12500);
    expect(product.nom_boutique).toBe('Atelier Assiral');
    expect(product.categorie_id).toBe('Artisanat');
    expect(product.images).toEqual([]);
    expect(product.sponsorisedTag).toBe('SPONSORISÉ');
  });

  it('accepte les relations Supabase sous forme de tableaux', () => {
    const product = mapProductRow({
      ...baseProduct,
      boutiques: [{ nom: 'Boutique Tableau' }],
      categories: [{ nom: 'Mode' }],
    });
    expect(product.nom_boutique).toBe('Boutique Tableau');
    expect(product.categorie_id).toBe('Mode');
  });
});

describe('resolveProfileRole', () => {
  it('donne la priorité à la spécialisation administrateur', () => {
    expect(resolveProfileRole('Acheteur', { role: 'SuperAdmin' })).toBe('Admin');
  });

  it('refuse de promouvoir une valeur de rôle inconnue', () => {
    expect(resolveProfileRole('Admin', null)).toBe('Acheteur');
    expect(resolveProfileRole('Vendeur', null)).toBe('Vendeur');
  });
});

describe('isDatabaseUuid', () => {
  it('distingue les UUID Supabase des identifiants de démonstration', () => {
    expect(isDatabaseUuid(baseProduct.id)).toBe(true);
    expect(isDatabaseUuid('une-1')).toBe(false);
    expect(isDatabaseUuid('xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx')).toBe(false);
  });
});

describe('isPublishingQuotaExceeded', () => {
  it('bloque à la limite mais jamais avec un Boost ou un quota désactivé', () => {
    expect(isPublishingQuotaExceeded({ used: 5, max: 5, unlimited: false, enabled: true })).toBe(true);
    expect(isPublishingQuotaExceeded({ used: 5, max: 5, unlimited: true, enabled: true })).toBe(false);
    expect(isPublishingQuotaExceeded({ used: 50, max: 5, unlimited: false, enabled: false })).toBe(false);
  });
});
