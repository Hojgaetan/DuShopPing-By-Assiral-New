/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, HelpCircle } from 'lucide-react';
import { ProduitUI } from '../types';
import { ALL_PRODUCTS } from '../data';
import ProductCard from '../components/ProductCard';

interface CategoryPageProps {
  customProducts: ProduitUI[];
  favorites: ProduitUI[];
  handleToggleFavorite: (id: string) => void;
  triggerCallSimulation: (product: ProduitUI) => void;
  triggerChatSimulation: (product: ProduitUI) => void;
}

export default function CategoryPage({
  customProducts,
  favorites,
  handleToggleFavorite,
  triggerCallSimulation,
  triggerChatSimulation
}: CategoryPageProps) {
  const { categoryName } = useParams<{ categoryName: string }>();
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as any });
  }, [categoryName]);

  const categoryDecoded = categoryName ? decodeURIComponent(categoryName) : 'Tous';

  // Merge datasets
  const combined = [...customProducts, ...ALL_PRODUCTS];
  
  // Filter products by category
  const filteredProducts = combined.filter(p => 
    categoryDecoded === 'Tous' || p.categorie_id.toLowerCase() === categoryDecoded.toLowerCase()
  );

  return (
    <div className="space-y-8" id="category-page-view">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-500">
          <Link to="/" className="hover:text-emerald-700 font-medium transition-colors">Accueil</Link>
          <span>/</span>
          <span className="text-slate-850 font-semibold">{categoryDecoded}</span>
        </div>
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 text-xs text-slate-600 hover:text-emerald-800 font-bold transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4" />
          <span>Retour</span>
        </button>
      </div>

      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-100 shadow-xs space-y-6">
        <div className="flex items-center gap-2.5">
          <div className="w-1.5 h-6 bg-emerald-600 rounded-full" />
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 font-display">
            Catégorie: {categoryDecoded}
          </h2>
          <span className="text-xs bg-emerald-50 text-emerald-800 font-bold px-2.5 py-1 rounded-lg border border-emerald-100">
            {filteredProducts.length} articles
          </span>
        </div>

        {filteredProducts.length === 0 ? (
          <div className="text-center py-16 px-4 space-y-4">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 mx-auto">
              <HelpCircle className="w-8 h-8" />
            </div>
            <div>
              <p className="font-bold text-slate-700 font-display">Aucun produit dans cette catégorie</p>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                De nouvelles créations artisanales seront bientôt mises en ligne par nos collaborateurs camerounais !
              </p>
            </div>
            <Link
              to="/"
              className="inline-block bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-6 py-2.5 rounded-xl transition-all"
            >
              Retourner à l'accueil
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {filteredProducts.map(product => (
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
      </div>
    </div>
  );
}
