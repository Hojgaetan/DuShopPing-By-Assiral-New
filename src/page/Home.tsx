/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ChevronLeft, ChevronRight, HelpCircle } from 'lucide-react';
import ProductCard from '../components/ProductCard';
import SidebarAd from '../components/SidebarAd';
import SupabaseMigrationConsole from '../components/SupabaseMigrationConsole';
import { Product } from '../types';
import {
  PRODUCTS_A_LA_UNE as initialFeatured,
  SELECTIONS_POPULAIRES as initialPopular,
  PRODUITS_SPONSORISES_1 as initialSponsorised1,
  LES_MIEUX_NOTES as initialHighlyRated,
  PRODUITS_SPONSORISES_2 as initialSponsorised2
} from '../data';

interface HomeProps {
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  selectedCategory: string;
  setSelectedCategory: (val: string) => void;
  customProducts: Product[];
  favorites: Product[];
  handleToggleFavorite: (id: string) => void;
  triggerCallSimulation: (product: Product) => void;
  triggerChatSimulation: (product: Product) => void;
}

export default function Home({
  searchQuery,
  setSearchQuery,
  selectedCategory,
  setSelectedCategory,
  customProducts,
  favorites,
  handleToggleFavorite,
  triggerCallSimulation,
  triggerChatSimulation
}: HomeProps) {
  // Carousel pagination states
  const [featuredPage, setFeaturedPage] = useState(0);
  const [popularPage, setPopularPage] = useState(0);
  const [highlyRatedPage, setHighlyRatedPage] = useState(0);

  // Dynamic filter products
  const getFeaturedProducts = () => {
    const list = [...customProducts.filter(p => p.isSponsorised && p.sponsorisedTag === 'SPONSORISÉ'), ...initialFeatured];
    if (selectedCategory !== 'Tous') {
      return list.filter(p => p.category === selectedCategory);
    }
    return list;
  };

  const getPopularProducts = () => {
    const list = [...initialPopular];
    if (selectedCategory !== 'Tous') {
      return list.filter(p => p.category === selectedCategory);
    }
    return list;
  };

  const getSponsorised1Products = () => {
    const list = [...initialSponsorised1];
    if (selectedCategory !== 'Tous') {
      return list.filter(p => p.category === selectedCategory);
    }
    return list;
  };

  const getHighlyRatedProducts = () => {
    const list = [...initialHighlyRated];
    if (selectedCategory !== 'Tous') {
      return list.filter(p => p.category === selectedCategory);
    }
    return list;
  };

  const getSponsorised2Products = () => {
    const list = [...initialSponsorised2];
    if (selectedCategory !== 'Tous') {
      return list.filter(p => p.category === selectedCategory);
    }
    return list;
  };

  const isFiltering = searchQuery.trim() !== '' || selectedCategory !== 'Tous';

  const getFilteredAll = () => {
    const combined = [
      ...customProducts,
      ...initialFeatured,
      ...initialPopular,
      ...initialSponsorised1,
      ...initialHighlyRated,
      ...initialSponsorised2
    ];

    const uniqueMap = new Map<string, Product>();
    combined.forEach(p => uniqueMap.set(p.id, p));
    const uniqueList = Array.from(uniqueMap.values());

    return uniqueList.filter(p => {
      const matchSearch =
        p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.seller.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.category.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchCat = selectedCategory === 'Tous' || p.category === selectedCategory;
      return matchSearch && matchCat;
    });
  };

  return (
    <div className="space-y-8" id="home-page-container">

      {/* Dynamic Filtering Breadcrumbs / Badge feedback */}
      {isFiltering && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs flex flex-wrap items-center justify-between gap-4"
        >
          <div className="flex items-center gap-2 text-xs sm:text-sm">
            <span className="text-slate-400">Filtrage actif :</span>
            {selectedCategory !== 'Tous' && (
              <span className="bg-emerald-50 text-emerald-800 font-semibold px-3 py-1 rounded-xl border border-emerald-105">
                Catégorie: {selectedCategory}
              </span>
            )}
            {searchQuery && (
              <span className="bg-blue-50 text-blue-800 font-semibold px-3 py-1 rounded-xl border border-blue-100">
                Recherche: "{searchQuery}"
              </span>
            )}
            <span className="text-slate-400 font-mono">({getFilteredAll().length} articles trouvés)</span>
          </div>
          
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('Tous');
            }}
            className="text-xs text-rose-600 hover:text-rose-800 font-bold underline cursor-pointer"
          >
            Réinitialiser tous les filtres
          </button>
        </motion.div>
      )}

      <div className="flex gap-6 items-start justify-center">
        {/* Left Vertical Ad Banner - 160x600 px */}
        <div className="hidden xl:block shrink-0 sticky top-[210px] self-start">
          <SidebarAd position="left" searchQuery={searchQuery} />
        </div>

        {/* Center feed containing rows */}
        <div className="flex-1 max-w-4xl min-w-0 space-y-12">
          {isFiltering ? (
            <section className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xs">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-1.5 h-6 bg-emerald-600 rounded-full" />
                <h2 className="text-xl sm:text-2xl font-bold text-slate-800 font-display">
                  Résultats de votre recherche
                </h2>
              </div>

              {getFilteredAll().length === 0 ? (
                <div className="text-center py-16 px-4 space-y-4">
                  <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 mx-auto">
                    <HelpCircle className="w-8 h-8" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-700">Aucun produit ne correspond à vos critères</p>
                    <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                      Essayez de saisir des termes différents ou explorez une de nos catégories.
                    </p>
                  </div>
                  <button
                    onClick={() => { setSearchQuery(''); setSelectedCategory('Tous'); }}
                    className="bg-emerald-650 hover:bg-emerald-700 text-white font-semibold text-xs px-4 py-2 rounded-xl transition-colors cursor-pointer"
                  >
                    Retourner à la boutique
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {getFilteredAll().map(product => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      variant={product.isSponsorised ? 'detailed' : 'minimal'}
                      isFavorite={favorites.some(f => f.id === product.id)}
                      onToggleFavorite={handleToggleFavorite}
                      onCallSeller={triggerCallSimulation}
                      onChatSeller={triggerChatSimulation}
                    />
                  ))}
                </div>
              )}
            </section>
          ) : (
            <>
              {/* Row 1: Produits A la une */}
              <section className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2.5">
                    <h2 className="text-xl sm:text-2xl font-bold text-slate-900 font-display">
                      Produits À la une
                    </h2>
                    <span className="text-[10px] bg-orange-100 text-orange-800 border border-orange-200 font-bold px-2 py-0.5 rounded-md tracking-wider uppercase">
                      SPONSORISÉ
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setFeaturedPage(p => Math.max(0, p - 1))}
                      disabled={featuredPage === 0}
                      className="p-1 px-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
                    >
                      <ChevronLeft className="w-4 h-4 text-slate-600" />
                    </button>
                    <button
                      onClick={() => setFeaturedPage(p => p + 1)}
                      disabled={getFeaturedProducts().length <= (featuredPage + 1) * 3}
                      className="p-1 px-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
                    >
                      <ChevronRight className="w-4 h-4 text-slate-600" />
                    </button>
                  </div>
                </div>

                {getFeaturedProducts().length === 0 ? (
                  <p className="text-xs text-slate-400">Aucun produit en vedette.</p>
                ) : (
                  <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                    {getFeaturedProducts().slice(featuredPage * 3, (featuredPage * 3) + 3).map(product => (
                      <ProductCard
                        key={product.id}
                        product={product}
                        variant="detailed"
                        isFavorite={favorites.some(f => f.id === product.id)}
                        onToggleFavorite={handleToggleFavorite}
                        onCallSeller={triggerCallSimulation}
                        onChatSeller={triggerChatSimulation}
                      />
                    ))}
                  </motion.div>
                )}
              </section>

              {/* Responsive Inline Ad 1 (visible only on mobile/tablet screens when the vertical sidebars are hidden) */}
              <div className="xl:hidden my-2">
                <SidebarAd position="left" variant="horizontal" searchQuery={searchQuery} />
              </div>

              {/* Row 2: Sélections Populaires */}
              <section className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h2 className="text-xl sm:text-2xl font-bold text-slate-900 font-display">
                      Sélections Populaires
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Les articles les plus appréciés du moment.
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setPopularPage(p => Math.max(0, p - 1))}
                      disabled={popularPage === 0}
                      className="p-1 px-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
                    >
                      <ChevronLeft className="w-4 h-4 text-slate-600" />
                    </button>
                    <button
                      onClick={() => setPopularPage(p => p + 1)}
                      disabled={getPopularProducts().length <= (popularPage + 1) * 3}
                      className="p-1 px-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
                    >
                      <ChevronRight className="w-4 h-4 text-slate-600" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                  {getPopularProducts().slice(popularPage * 3, (popularPage * 3) + 3).map(product => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      variant="minimal"
                      isFavorite={favorites.some(f => f.id === product.id)}
                      onToggleFavorite={handleToggleFavorite}
                      onCallSeller={triggerCallSimulation}
                      onChatSeller={triggerChatSimulation}
                    />
                  ))}
                </div>
              </section>

              {/* Row 3: Produits Sponsorisés 1 */}
              <section className="space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                  <h2 className="text-xl sm:text-2xl font-bold text-slate-900 font-display">
                    Produits Sponsorisés
                  </h2>
                  <span className="text-[10px] bg-amber-500 text-white font-bold px-2.5 py-0.5 rounded-md tracking-widest uppercase">
                    ELITE
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                  {getSponsorised1Products().map(product => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      variant="detailed"
                      isFavorite={favorites.some(f => f.id === product.id)}
                      onToggleFavorite={handleToggleFavorite}
                      onCallSeller={triggerCallSimulation}
                      onChatSeller={triggerChatSimulation}
                    />
                  ))}
                </div>
              </section>

              {/* Responsive Inline Ad 2 (visible only on mobile/tablet screens when the vertical sidebars are hidden) */}
              <div className="xl:hidden my-2">
                <SidebarAd position="right" variant="horizontal" searchQuery={searchQuery} />
              </div>

              {/* Row 4: Les Mieux Notés */}
              <section className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h2 className="text-xl sm:text-2xl font-bold text-slate-900 font-display">
                      Les Mieux Notés
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5">
                      L'excellence validée par notre communauté.
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setHighlyRatedPage(p => Math.max(0, p - 1))}
                      disabled={highlyRatedPage === 0}
                      className="p-1 px-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
                    >
                      <ChevronLeft className="w-4 h-4 text-slate-600" />
                    </button>
                    <button
                      onClick={() => setHighlyRatedPage(p => p + 1)}
                      disabled={getHighlyRatedProducts().length <= (highlyRatedPage + 1) * 3}
                      className="p-1 px-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
                    >
                      <ChevronRight className="w-4 h-4 text-slate-600" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                  {getHighlyRatedProducts().slice(highlyRatedPage * 3, (highlyRatedPage * 3) + 3).map(product => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      variant="minimal"
                      isFavorite={favorites.some(f => f.id === product.id)}
                      onToggleFavorite={handleToggleFavorite}
                      onCallSeller={triggerCallSimulation}
                      onChatSeller={triggerChatSimulation}
                    />
                  ))}
                </div>
              </section>

              {/* Row 5: Produits Sponsorisés 2 */}
              <section className="space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                  <h2 className="text-xl sm:text-2xl font-bold text-slate-900 font-display">
                    Produits Sponsorisés
                  </h2>
                  <span className="text-[10px] bg-amber-500 text-white font-bold px-2.5 py-0.5 rounded-md tracking-widest uppercase">
                    ELITE
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                  {getSponsorised2Products().map(product => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      variant="detailed"
                      isFavorite={favorites.some(f => f.id === product.id)}
                      onToggleFavorite={handleToggleFavorite}
                      onCallSeller={triggerCallSimulation}
                      onChatSeller={triggerChatSimulation}
                    />
                  ))}
                </div>
              </section>
            </>
          )}
        </div>

        {/* Right Vertical Ad Banner - 160x600 px */}
        <div className="hidden xl:block shrink-0 sticky top-[210px] self-start">
          <SidebarAd position="right" searchQuery={searchQuery} />
        </div>
      </div>
    </div>
  );
}
