/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Phone, MessageSquare, Star, BadgeCheck, Heart, MapPin, Image as ImageIcon } from 'lucide-react';
import { motion } from 'motion/react';
import { ProduitUI } from '../types';

interface ProductCardProps {
  key?: any;
  product: ProduitUI;
  variant: 'detailed' | 'minimal';
  isFavorite: boolean;
  onToggleFavorite: (id: string) => void;
  onCallSeller: (product: ProduitUI) => void;
  onChatSeller: (product: ProduitUI) => void;
}

export default function ProductCard({
  product,
  variant,
  isFavorite,
  onToggleFavorite,
  onCallSeller,
  onChatSeller
}: ProductCardProps) {
  const navigate = useNavigate();
  
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR').format(price) + ' FCFA';
  };

  const handleCardClick = () => {
    navigate(`/product/${product.id}`);
  };

  if (variant === 'detailed') {
    // Elegant frame matching Produits A La une and Sponsorisés in visual structure
    return (
      <motion.div
        whileHover={{ y: -6, transition: { duration: 0.15 } }}
        onClick={handleCardClick}
        className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-xs hover:shadow-md transition-shadow flex flex-col h-full relative cursor-pointer"
        id={`product-card-${product.id}`}
      >
        {/* Favorite Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite(product.id);
          }}
          className="absolute top-3 right-3 z-10 bg-white/90 backdrop-blur-xs p-2 rounded-full hover:bg-white text-slate-500 hover:text-rose-500 shadow-xs transition-colors cursor-pointer"
          title={isFavorite ? "Retirer des favoris" : "Ajouter aux favoris"}
          aria-label="Ajouter aux favoris"
        >
          <Heart className={`w-4 h-4 transition-all ${isFavorite ? 'fill-rose-500 text-rose-500 scale-110' : ''}`} />
        </button>

        {/* Sponsor Tag */}
        {product.isSponsorised && (
          <div className="absolute top-3 left-3 z-10">
            <span className={`text-[9px] font-bold tracking-widest px-2.5 py-1 rounded-md shadow-xs ${
              product.sponsorisedTag === 'ELITE'
                ? 'bg-amber-500 text-white border border-amber-400'
                : 'bg-orange-100 text-orange-850 border border-orange-200'
            }`}>
              {product.sponsorisedTag}
            </span>
          </div>
        )}

        {/* Image frame */}
        <div className="aspect-[4/3] bg-slate-50 w-full overflow-hidden relative group">
          {product.images[0] ? <img
            src={product.images[0]}
            alt={product.titre}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          /> : <div className="w-full h-full flex flex-col items-center justify-center text-slate-300 gap-2"><ImageIcon className="w-8 h-8" /><span className="text-xs">Aucune image</span></div>}
        </div>

        {/* Card Body */}
        <div className="p-4 flex flex-col flex-1 justify-between gap-3">
          
          <div>
            {/* Seller profile Bar */}
            <div className="flex items-center justify-between gap-2 mb-2 text-xs">
              <div 
                className="flex items-center gap-1 font-semibold text-slate-800 hover:text-emerald-750 hover:underline"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/seller/${encodeURIComponent(product.boutique_id || product.nom_boutique)}`);
                }}
              >
                <span className="truncate max-w-[120px]">{product.nom_boutique}</span>
                {product.hasBadge && (
                  <BadgeCheck className="w-4 h-4 text-emerald-600 shrink-0" title="Vendeur Vérifié" />
                )}
              </div>
              
              {product.rating && (
                <div className="flex items-center gap-0.5 text-amber-500 font-bold shrink-0">
                  <Star className="w-3.5 h-3.5 fill-amber-500" />
                  <span>{product.rating.toFixed(1)}</span>
                  {product.reviewsCount !== undefined && (
                    <span className="text-slate-400 text-[10px] font-normal ml-0.5">({product.reviewsCount})</span>
                  )}
                </div>
              )}
            </div>

            {/* Product Title */}
            <h3 className="font-display font-medium text-slate-900 text-sm sm:text-base line-clamp-1 mb-1">
              {product.titre}
            </h3>

            {/* Location (if any) */}
            {product.localisation && (
              <p className="text-[10px] text-slate-400 flex items-center gap-0.5 mb-1.5">
                <MapPin className="w-3 h-3 text-slate-300" />
                <span>{product.localisation}</span>
              </p>
            )}
          </div>

          <div>
            {/* Price section */}
            <div className="text-lg sm:text-xl font-bold text-slate-900 font-mono tracking-tight mb-3">
              {formatPrice(product.prix)}
            </div>

            {/* Action Buttons as requested */}
            <div className="grid grid-cols-2 gap-2">
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={(e) => {
                  e.stopPropagation();
                  onCallSeller(product);
                }}
                className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl border border-slate-200 hover:border-brand text-slate-700 hover:text-brand text-xs font-semibold hover:bg-slate-50 transition-colors cursor-pointer"
              >
                <Phone className="w-4 h-4 shrink-0" />
                <span>Appel</span>
              </motion.button>

              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={(e) => {
                  e.stopPropagation();
                  onChatSeller(product);
                }}
                className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-brand hover:bg-brand-hover text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              >
                <MessageSquare className="w-4 h-4 shrink-0" />
                <span>Message</span>
              </motion.button>
            </div>
          </div>

        </div>
      </motion.div>
    );
  } else {
    // Compact style or minimal card for "Sélections Populaires" and "Les Mieux Notés"
    return (
      <motion.div
        whileHover={{ y: -5, transition: { duration: 0.15 } }}
        onClick={handleCardClick}
        className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-xs hover:shadow-md transition-shadow flex flex-col h-full relative cursor-pointer"
        id={`product-card-pop-${product.id}`}
      >
        {/* Favorite Trigger */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite(product.id);
          }}
          className="absolute top-2 right-2 z-10 bg-white/90 backdrop-blur-xs p-1.5 rounded-full hover:bg-white text-slate-500 hover:text-rose-500 shadow-xs transition-colors cursor-pointer"
          title="Préférences"
        >
          <Heart className={`w-3.5 h-3.5 ${isFavorite ? 'fill-rose-500 text-rose-500' : ''}`} />
        </button>

        {/* Large backplane pricing as watermark effect if requested, or clean product aspect ratio */}
        <div className="aspect-[4/3] bg-slate-50 overflow-hidden relative group">
          {product.images[0] ? <img
            src={product.images[0]}
            alt={product.titre}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-300"
          /> : <div className="w-full h-full flex items-center justify-center text-slate-300"><ImageIcon className="w-7 h-7" /></div>}
          {/* Subtle watermark in image to hint at original design feel but kept extremely readable */}
          <div 
            className="absolute bottom-2 left-2 bg-black/40 hover:bg-black/65 backdrop-blur-xs px-2 py-0.5 rounded text-[10px] text-white font-semibold z-10"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/seller/${encodeURIComponent(product.boutique_id || product.nom_boutique)}`);
            }}
          >
            {product.nom_boutique}
          </div>
        </div>

        {/* Body */}
        <div className="p-3.5 flex flex-col flex-grow justify-between gap-2 bg-slate-50/40">
          <div>
            {/* Category */}
            <p className="text-[10px] font-semibold text-brand tracking-widest uppercase mb-0.5">
              {product.categorie_id}
            </p>
            {/* Title */}
            <h4 className="text-slate-800 font-display font-semibold text-xs sm:text-sm leading-tight line-clamp-1">
              {product.titre}
            </h4>
          </div>

          {/* Price with interaction icons directly aligned inline */}
          <div className="flex items-center justify-between border-t border-slate-100 pt-2.5">
            <span className="text-xs sm:text-sm font-bold text-slate-900 font-mono">
              {formatPrice(product.prix)}
            </span>
            <div className="flex items-center gap-1 text-slate-400">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onCallSeller(product);
                }}
                className="p-1 px-1.5 text-slate-600 hover:text-brand hover:bg-brand-light rounded transition-all cursor-pointer"
                title="Consulter le numéro"
                aria-label="Appeler le vendeur"
              >
                <Phone className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onChatSeller(product);
                }}
                className="p-1 px-1.5 text-slate-600 hover:text-brand hover:bg-brand-light rounded transition-all cursor-pointer"
                title="Ouvrir le chat interactif"
                aria-label="Discuter avec le vendeur"
              >
                <MessageSquare className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }
}
