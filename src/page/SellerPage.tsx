/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowLeft, Star, MapPin, BadgeCheck, Phone, Mail, Globe, ArrowRight, HelpCircle } from 'lucide-react';
import { Product } from '../types';
import { ALL_PRODUCTS, SELLERS } from '../data';
import ProductCard from '../components/ProductCard';
import { incrementBoutiqueVues } from '../lib/services';

interface SellerPageProps {
  customProducts: Product[];
  favorites: Product[];
  handleToggleFavorite: (id: string) => void;
  triggerCallSimulation: (product: Product) => void;
  triggerChatSimulation: (product: Product) => void;
}

export default function SellerPage({
  customProducts,
  favorites,
  handleToggleFavorite,
  triggerCallSimulation,
  triggerChatSimulation
}: SellerPageProps) {
  const { sellerName } = useParams<{ sellerName: string }>();
  const navigate = useNavigate();

  const decodedName = sellerName ? decodeURIComponent(sellerName) : 'Artisan Inconnu';
  
  const [realBoutique, setRealBoutique] = React.useState<any>(null);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as any });
    
    // Find real boutique by name
    const boutiques = JSON.parse(localStorage.getItem('dushop_boutiques_db') || '[]');
    const found = boutiques.find((b: any) => b.nom.toLowerCase() === decodedName.toLowerCase());
    if (found) {
      setRealBoutique(found);
      incrementBoutiqueVues(found.id);
    }
  }, [decodedName]);

  // Get matching seller details or fallback
  const sellerInfo = SELLERS[decodedName] || {
    name: decodedName,
    rating: 4.8,
    hasBadge: true,
    avatar: realBoutique?.logo_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&fit=crop&q=80',
    phone: '+237 600 00 00 00',
    whatsapp: '237600000000',
    location: 'Douala, Cameroun',
    description: realBoutique?.description || 'Artisan et créateur de la vitrine locale, engagé dans la promotion équitable des talents du continent camerounais.'
  };

  // Find all products by seller
  const combined = [...customProducts, ...ALL_PRODUCTS];
  const sellerProducts = combined.filter(p => p.seller.toLowerCase() === decodedName.toLowerCase());

  return (
    <div className="space-y-8" id="seller-profile-view">
      {/* Navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-500">
          <Link to="/" className="hover:text-emerald-700 font-medium transition-colors">Accueil</Link>
          <span>/</span>
          <span className="text-slate-850 font-semibold">Artisans</span>
          <span>/</span>
          <span className="text-slate-850 font-semibold">{decodedName}</span>
        </div>
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 text-xs text-slate-600 hover:text-emerald-800 font-bold transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4" />
          <span>Retour</span>
        </button>
      </div>

      {/* Seller Hero Card Banner */}
      <div className="bg-gradient-to-r from-emerald-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white relative overflow-hidden">
        {/* Background lights decoration */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 left-1/3 w-48 h-48 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 text-center sm:text-left">
            <img
              src={sellerInfo.avatar}
              alt={decodedName}
              className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover border-4 border-white/10 shadow-lg shrink-0"
              referrerPolicy="no-referrer"
            />
            <div className="space-y-2">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <h1 className="text-2xl sm:text-3xl font-black font-display tracking-tight text-white">{decodedName}</h1>
                {sellerInfo.hasBadge && (
                  <span className="bg-emerald-450/20 text-emerald-300 border border-emerald-450/40 text-[10px] font-black px-2 py-0.5 rounded-md uppercase flex items-center gap-1 tracking-wider">
                    <BadgeCheck className="w-3.5 h-3.5 fill-current text-emerald-450" />
                    <span>CERTIFIÉ</span>
                  </span>
                )}
              </div>

              <p className="text-slate-300 text-xs sm:text-sm max-w-xl leading-relaxed">
                {sellerInfo.description}
              </p>

              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 text-xs text-slate-400">
                <span className="flex items-center gap-1 text-amber-400 font-bold">
                  <Star className="w-4 h-4 fill-current shrink-0" />
                  <span>{sellerInfo.rating} d'évaluation</span>
                </span>
                <span className="hidden sm:inline">•</span>
                <span className="flex items-center gap-1">
                  <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                  <span>{sellerInfo.location}</span>
                </span>
              </div>
            </div>
          </div>

          <div className="w-full md:w-auto bg-white/5 backdrop-blur-xs border border-white/15 p-4 rounded-2xl text-center md:text-left shrink-0">
            <h4 className="text-xs text-slate-400 uppercase tracking-widest font-black">Performance</h4>
            <div className="flex items-baseline gap-1 mt-1 justify-center md:justify-start">
              <span className="text-3xl font-black font-display text-white">{sellerProducts.length}</span>
              <span className="text-xs text-slate-400">articles actifs</span>
            </div>
            <div className="text-[10px] text-slate-400 mt-1">Évaluation supérieure à 98%</div>
          </div>
        </div>
      </div>

      {/* Seller's Products Grid */}
      <div className="space-y-6">
        <div className="border-b border-slate-100 pb-3">
          <h3 className="text-xl font-bold text-slate-900 font-display">
            Vitrines d'articles de {decodedName}
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Découvrez toutes les créations artisanales de ce vendeur.
          </p>
        </div>

        {sellerProducts.length === 0 ? (
          <div className="text-center py-16 bg-white border border-slate-100 rounded-3xl space-y-4">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 mx-auto">
              <HelpCircle className="w-8 h-8" />
            </div>
            <div>
              <p className="font-bold text-slate-700 font-display">Aucun produit actif pour le moment</p>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                Ce vendeur n'a pas d'autres produits de disponible actuellement.
              </p>
            </div>
            <Link
              to="/"
              className="inline-block bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-6 py-2.5 rounded-xl transition-all"
            >
              Découvrir d'autres artisans
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {sellerProducts.map(product => (
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
