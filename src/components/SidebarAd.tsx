/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Eye, X, Zap, Target, Rocket, MessageCircle, ChevronRight, Store } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../context/AuthContext';

interface SidebarAdProps {
  position: 'left' | 'right';
  variant?: 'vertical' | 'horizontal';
  searchQuery?: string;
}

interface BoostedProduct {
  id: string;
  titre: string;
  image_url: string;
  prix: number;
  categorie_id: string;
  boutique_id: string;
  sellerName: string;
  boostType: 'automatise' | 'limite';
}

// Helper to get all boosted products from localStorage
function getBoostedProducts(): BoostedProduct[] {
  return JSON.parse(localStorage.getItem('dushop_boosted_products') || '[]');
}

// Helper to get seller's products from localStorage
function getSellerProducts(boutiqueId: string) {
  const produits = JSON.parse(localStorage.getItem('dushop_produits_db') || '[]');
  return produits.filter((p: any) => p.boutique_id === boutiqueId);
}

// Helper to get boutique name
function getBoutiqueName(boutiqueId: string): string {
  const boutiques = JSON.parse(localStorage.getItem('dushop_boutiques_db') || '[]');
  const b = boutiques.find((bt: any) => bt.id === boutiqueId);
  return b ? b.nom : 'Boutique';
}

export default function SidebarAd({ position, variant = 'vertical', searchQuery = '' }: SidebarAdProps) {
  const { user } = useAuth();
  const [showBoostPopup, setShowBoostPopup] = useState(false);
  const [boostStep, setBoostStep] = useState<'choice' | 'success'>('choice');
  const [selectedBoostType, setSelectedBoostType] = useState<'automatise' | 'limite' | null>(null);

  // Rotating boosted product state
  const [currentBoostedProduct, setCurrentBoostedProduct] = useState<BoostedProduct | null>(null);
  const [boostedProducts, setBoostedProducts] = useState<BoostedProduct[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Default ads
  const ads = {
    left: {
      tag: "DÉCOREZ",
      title: "Vannerie Fine & Authentique",
      description: "Apportez l'élégance naturelle à votre intérieur. -10% immédiats sur les paniers tressés d'exception.",
      image: "https://images.unsplash.com/photo-1595428774223-ef52624120d2?w=160&fit=crop&q=80",
      cta: "Découvrir"
    },
    right: {
      tag: "MODE DUSHOP",
      title: "Indigo & Coton Organique",
      description: "Découvrez notre collection capsule tisseurs de Kumasi. Des vêtements d'exception faits main.",
      image: "https://images.unsplash.com/photo-1544441893-675973e31985?w=160&fit=crop&q=80",
      cta: 'Parcourir'
    }
  };

  const ad = ads[position];

  // Load boosted products for this position
  useEffect(() => {
    const loadBoosted = () => {
      const allBoosted = getBoostedProducts();
      let filtered: BoostedProduct[];

      if (position === 'left') {
        // Left sidebar shows automatisé boosts (visible to all)
        filtered = allBoosted.filter(bp => bp.boostType === 'automatise');
      } else {
        // Right sidebar shows limité boosts (only when searching similar)
        if (searchQuery.trim()) {
          filtered = allBoosted.filter(bp => bp.boostType === 'limite');
        } else {
          filtered = [];
        }
      }
      setBoostedProducts(filtered);
    };

    loadBoosted();
    // Listen for new boosts
    window.addEventListener('boost_activated', loadBoosted);
    window.addEventListener('product_published', loadBoosted);
    return () => {
      window.removeEventListener('boost_activated', loadBoosted);
      window.removeEventListener('product_published', loadBoosted);
    };
  }, [position, searchQuery]);

  // Rotate through boosted products every 4 seconds
  useEffect(() => {
    if (boostedProducts.length === 0) {
      setCurrentBoostedProduct(null);
      return;
    }

    setCurrentBoostedProduct(boostedProducts[currentIndex % boostedProducts.length]);

    const timer = setInterval(() => {
      setCurrentIndex(prev => {
        const next = (prev + 1) % boostedProducts.length;
        setCurrentBoostedProduct(boostedProducts[next]);
        return next;
      });
    }, 4000);

    return () => clearInterval(timer);
  }, [boostedProducts, currentIndex]);

  // Handle CTA click
  const handleCtaClick = () => {
    if (!user) {
      alert('Veuillez vous connecter pour accéder aux options de publicité.');
      return;
    }

    if (!user.boutiqueId) {
      alert('Vous devez d\'abord créer votre boutique dans votre Dashboard pour faire de la publicité.');
      return;
    }

    // Check if user has products
    const products = getSellerProducts(user.boutiqueId);
    if (products.length === 0) {
      alert('Vous n\'avez aucun produit publié. Publiez d\'abord un produit avant de le booster.');
      return;
    }

    setShowBoostPopup(true);
    setBoostStep('choice');
    setSelectedBoostType(null);
  };

  // Handle boost selection
  const handleBoostSelect = (type: 'automatise' | 'limite') => {
    if (!user?.boutiqueId) return;

    const products = getSellerProducts(user.boutiqueId);
    const sellerName = getBoutiqueName(user.boutiqueId);

    // Get existing boosts and remove old ones from this seller
    let existing = getBoostedProducts().filter(bp => bp.boutique_id !== user.boutiqueId);

    // Add all seller's products as boosted
    const newBoosts: BoostedProduct[] = products.map((p: any) => ({
      id: p.id,
      titre: p.titre,
      image_url: p.image_url || 'https://images.unsplash.com/photo-1595428774223-ef52624120d2?w=300&fit=crop&q=80',
      prix: p.prix,
      categorie_id: p.categorie_id,
      boutique_id: p.boutique_id,
      sellerName: sellerName,
      boostType: type,
    }));

    localStorage.setItem('dushop_boosted_products', JSON.stringify([...existing, ...newBoosts]));
    window.dispatchEvent(new Event('boost_activated'));

    setSelectedBoostType(type);
    setBoostStep('success');

    setTimeout(() => {
      setShowBoostPopup(false);
      setBoostStep('choice');
    }, 3000);
  };

  // Render boosted product card
  const renderBoostedProduct = (product: BoostedProduct) => (
    <motion.div
      key={product.id + '-' + Date.now()}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.5 }}
      className="w-full h-full flex flex-col"
    >
      {/* Header */}
      <div>
        <div className="flex items-center justify-between border-b border-amber-200/50 pb-2 mb-3">
          <span className="text-[9px] font-bold text-amber-600 tracking-widest uppercase">
            BOOST {product.boostType === 'automatise' ? '🚀' : '🎯'}
          </span>
        </div>
        <span className="bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[8px] font-bold px-2 py-0.5 rounded-full inline-block mb-2">
          SPONSORISÉ
        </span>
        <h4 className="text-xs font-bold text-slate-800 leading-tight mb-1 line-clamp-2">
          {product.titre}
        </h4>
        <p className="text-[11px] font-extrabold text-emerald-700 mb-2">
          {product.prix?.toLocaleString('fr-FR')} FCFA
        </p>
        <p className="text-[10px] text-slate-500 leading-normal mb-1">
          Par <span className="font-semibold text-slate-700">{product.sellerName}</span>
        </p>
      </div>

      {/* Image */}
      <div className="my-2 rounded-lg overflow-hidden border border-slate-100 flex-1 relative max-h-[220px]">
        <img
          src={product.image_url}
          alt={product.titre}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 to-transparent" />
      </div>

      {/* CTA Contact Button */}
      <div className="pt-2 border-t border-amber-200/50">
        <motion.button
          whileTap={{ scale: 0.95 }}
          className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white text-xs font-bold py-2.5 rounded-xl flex items-center justify-center gap-1.5 shadow-sm cursor-pointer transition-all"
        >
          <MessageCircle className="w-3.5 h-3.5" />
          <span>Contacter</span>
        </motion.button>
      </div>
    </motion.div>
  );

  // Render boosted product in horizontal mode
  const renderBoostedProductHorizontal = (product: BoostedProduct) => (
    <motion.div
      key={product.id + '-h-' + Date.now()}
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.5 }}
      className="w-full flex flex-col sm:flex-row items-center justify-between gap-4"
    >
      <div className="flex flex-col sm:flex-row items-center gap-4 flex-1 w-full min-w-0">
        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden border border-amber-200 shrink-0">
          <img src={product.image_url} alt={product.titre} className="w-full h-full object-cover" />
        </div>
        <div className="space-y-1 text-center sm:text-left min-w-0 flex-1">
          <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
            <span className="text-[9px] font-bold text-amber-600 tracking-widest uppercase">
              BOOST {product.boostType === 'automatise' ? '🚀' : '🎯'}
            </span>
            <span className="bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[8px] font-bold px-2 py-0.5 rounded-full inline-block">
              SPONSORISÉ
            </span>
          </div>
          <h4 className="text-xs sm:text-sm font-bold text-slate-800 truncate">{product.titre}</h4>
          <p className="text-[10px] sm:text-xs text-slate-500">
            {product.prix?.toLocaleString('fr-FR')} FCFA • <span className="font-semibold">{product.sellerName}</span>
          </p>
        </div>
      </div>
      <div className="shrink-0 w-full sm:w-auto">
        <motion.button
          whileTap={{ scale: 0.95 }}
          className="w-full sm:w-auto bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white text-xs font-bold py-2 px-4 rounded-xl flex items-center justify-center gap-1 shadow-xs cursor-pointer"
        >
          <MessageCircle className="w-3.5 h-3.5" />
          <span>Contacter</span>
        </motion.button>
      </div>
    </motion.div>
  );

  // =================== BOOST POPUP MODAL ===================
  const boostPopupContent = (
    <AnimatePresence>
      {showBoostPopup && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[99999] flex items-center justify-center p-4"
          onClick={() => setShowBoostPopup(false)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="bg-white rounded-[2rem] shadow-2xl w-full max-w-lg overflow-hidden border border-slate-100"
            onClick={e => e.stopPropagation()}
          >
            {boostStep === 'choice' ? (
              <>
                {/* Header */}
                <div className="bg-white p-6 border-b border-slate-100 relative">
                  <button
                    onClick={() => setShowBoostPopup(false)}
                    className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                      <Rocket className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-xl font-extrabold text-slate-900 font-display">Boostez vos Produits</h3>
                      <p className="text-slate-500 text-sm">Choisissez votre type de boost publicitaire</p>
                    </div>
                  </div>
                </div>

                {/* Options */}
                <div className="p-6 space-y-4">
                  {/* Boost Automatisé */}
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleBoostSelect('automatise')}
                    className="w-full p-5 rounded-2xl border-2 border-emerald-200 hover:border-emerald-400 bg-emerald-50/50 hover:bg-emerald-50 transition-all text-left cursor-pointer group"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 group-hover:bg-emerald-200 transition-colors">
                        <Zap className="w-6 h-6" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="text-base font-extrabold text-slate-900">Boost Automatisé</h4>
                          <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-emerald-500 transition-colors" />
                        </div>
                        <p className="text-sm text-slate-600 leading-relaxed">
                          Vos produits s'affichent <strong>automatiquement</strong> dans la section publicité à <strong>tous les utilisateurs</strong> sur la page d'accueil. Rotation toutes les 4 secondes avec bouton « Contacter ».
                        </p>
                        <div className="flex items-center gap-2 mt-3">
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-1 rounded-full">🚀 Visibilité maximale</span>
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-1 rounded-full">👁️ Tous les visiteurs</span>
                        </div>
                      </div>
                    </div>
                  </motion.button>

                  {/* Boost Limité */}
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleBoostSelect('limite')}
                    className="w-full p-5 rounded-2xl border-2 border-purple-200 hover:border-purple-400 bg-purple-50/50 hover:bg-purple-50 transition-all text-left cursor-pointer group"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center shrink-0 group-hover:bg-purple-200 transition-colors">
                        <Target className="w-6 h-6" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="text-base font-extrabold text-slate-900">Boost Limité</h4>
                          <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-purple-500 transition-colors" />
                        </div>
                        <p className="text-sm text-slate-600 leading-relaxed">
                          Vos produits s'affichent uniquement aux utilisateurs qui <strong>recherchent des produits similaires</strong> aux vôtres. Ciblage intelligent par catégorie.
                        </p>
                        <div className="flex items-center gap-2 mt-3">
                          <span className="text-[10px] font-bold text-purple-700 bg-purple-100 px-2 py-1 rounded-full">🎯 Ciblage précis</span>
                          <span className="text-[10px] font-bold text-purple-700 bg-purple-100 px-2 py-1 rounded-full">🔍 Recherches similaires</span>
                        </div>
                      </div>
                    </div>
                  </motion.button>
                </div>
              </>
            ) : (
              /* Success State */
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-10 text-center"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', delay: 0.1 }}
                  className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 ${
                    selectedBoostType === 'automatise'
                      ? 'bg-emerald-100 text-emerald-600'
                      : 'bg-purple-100 text-purple-600'
                  }`}
                >
                  {selectedBoostType === 'automatise' ? <Zap className="w-10 h-10" /> : <Target className="w-10 h-10" />}
                </motion.div>
                <h3 className="text-2xl font-extrabold text-slate-900 mb-2">
                  🎉 Boost Activé !
                </h3>
                <p className="text-slate-600 max-w-sm mx-auto">
                  {selectedBoostType === 'automatise'
                    ? 'Vos produits sont maintenant visibles par tous les visiteurs dans la section publicité !'
                    : 'Vos produits apparaîtront aux utilisateurs recherchant des produits similaires !'
                  }
                </p>
              </motion.div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  const boostPopup = typeof document !== 'undefined' ? createPortal(boostPopupContent, document.body) : null;

  // =================== HORIZONTAL VARIANT ===================
  if (variant === 'horizontal') {
    const hasBoosted = currentBoostedProduct !== null;

    return (
      <>
        <div
          className={`w-full ${hasBoosted ? 'bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200' : 'bg-[#f0f4fc] border-blue-105'} border p-3 sm:p-4 rounded-2xl shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4`}
          id={`${position}-horizontal-ad`}
        >
          {hasBoosted ? (
            <AnimatePresence mode="wait">
              {renderBoostedProductHorizontal(currentBoostedProduct!)}
            </AnimatePresence>
          ) : (
            <>
              <div className="flex flex-col sm:flex-row items-center gap-4 flex-1 w-full min-w-0">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden border border-slate-100 shrink-0">
                  <img src={ad.image} alt={ad.title} className="w-full h-full object-cover" />
                </div>
                <div className="space-y-1 text-center sm:text-left min-w-0 flex-1">
                  <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
                    <span className="text-[9px] font-bold text-blue-500 tracking-widest uppercase">PUBLICITÉ</span>
                    <span className="bg-brand text-white text-[8px] font-bold px-2 py-0.5 rounded-full inline-block">{ad.tag}</span>
                  </div>
                  <h4 className="text-xs sm:text-sm font-bold text-slate-800 truncate">{ad.title}</h4>
                  <p className="text-[10px] sm:text-xs text-slate-500 line-clamp-2">{ad.description}</p>
                </div>
              </div>
              <div className="shrink-0 w-full sm:w-auto">
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={handleCtaClick}
                  className="w-full sm:w-auto bg-[#02603c] hover:bg-brand-hover text-white text-xs font-bold py-2 px-4 rounded-xl flex items-center justify-center gap-1 shadow-xs cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>{ad.cta}</span>
                </motion.button>
              </div>
            </>
          )}
        </div>
        {boostPopup}
      </>
    );
  }

  // =================== VERTICAL VARIANT (DEFAULT) ===================
  const hasBoosted = currentBoostedProduct !== null;

  return (
    <>
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className={`w-[160px] ${hasBoosted ? 'bg-gradient-to-b from-amber-50 to-orange-50 border-amber-200' : 'bg-[#f0f4fc] border-blue-100'} border h-[600px] flex flex-col justify-between p-4 rounded-2xl shrink-0 shadow-xs relative`}
          id={`${position}-sidebar-ad`}
        >
          {hasBoosted ? (
            <AnimatePresence mode="wait">
              {renderBoostedProduct(currentBoostedProduct!)}
            </AnimatePresence>
          ) : (
            <>
              {/* Header Ad Marker */}
              <div>
                <div className="flex items-center justify-between border-b border-blue-100/50 pb-2 mb-3">
                  <span className="text-[9px] font-bold text-blue-500 tracking-widest uppercase">PUBLICITÉ</span>
                </div>
                <span className="bg-brand text-white text-[8px] font-bold px-2 py-0.5 rounded-full inline-block mb-2">{ad.tag}</span>
                <h4 className="text-xs font-bold text-slate-800 leading-tight mb-2">{ad.title}</h4>
                <p className="text-[10px] text-slate-500 leading-normal mb-3">{ad.description}</p>
              </div>

              {/* Decorative Ad Image */}
              <div className="my-2 rounded-lg overflow-hidden border border-slate-100 flex-1 relative max-h-[220px]">
                <img src={ad.image} alt={ad.title} className="w-full h-full object-cover grayscale-25" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 to-transparent" />
              </div>

              {/* CTA Button */}
              <div className="pt-2 border-t border-blue-100/50">
                <p className="text-[10px] text-center text-slate-400 mb-2 font-mono">160 x 600 px</p>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={handleCtaClick}
                  className="w-full bg-[#02603c] hover:bg-brand-hover text-white text-xs font-bold py-2 rounded-xl flex items-center justify-center gap-1 shadow-xs cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>{ad.cta}</span>
                </motion.button>
              </div>
            </>
          )}
        </motion.div>
      </AnimatePresence>
      {boostPopup}
    </>
  );
}
