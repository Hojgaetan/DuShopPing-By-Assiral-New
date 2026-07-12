/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Phone, MessageSquare, Star, BadgeCheck, Heart, MapPin, ArrowLeft, Shield, Sparkles, AlertCircle } from 'lucide-react';
import { ProduitUI } from '../types';
import { ALL_PRODUCTS, SELLERS } from '../data';
import ProductCard from '../components/ProductCard';

interface ProductDetailsProps {
  customProducts: ProduitUI[];
  favorites: ProduitUI[];
  handleToggleFavorite: (id: string) => void;
  triggerCallSimulation: (product: ProduitUI) => void;
  triggerChatSimulation: (product: ProduitUI) => void;
}

export default function ProductDetails({
  customProducts,
  favorites,
  handleToggleFavorite,
  triggerCallSimulation,
  triggerChatSimulation
}: ProductDetailsProps) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // Scroll to top when page displays
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as any });
  }, [id]);

  // Merge default data and custom ones to search for product
  const combined = [...customProducts, ...ALL_PRODUCTS];
  const product = combined.find(p => p.id === id);

  if (!product) {
    return (
      <div className="max-w-xl mx-auto py-16 px-4 text-center space-y-6" id="product-not-found">
        <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto">
          <AlertCircle className="w-8 h-8" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-slate-800 font-display">Produit introuvable</h2>
          <p className="text-sm text-slate-500 mt-2">
            L'article que vous recherchez n'existe pas ou a été retiré de la marketplace par son auteur.
          </p>
        </div>
        <Link
          to="/"
          className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-3 rounded-2xl transition-all shadow-md hover:shadow-lg text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Retourner à l'accueil</span>
        </Link>
      </div>
    );
  }

  // Get matching seller details or fallback
  const sellerInfo = SELLERS[product.nom_boutique] || {
    nom: product.nom_boutique,
    rating: 4.8,
    hasBadge: product.hasBadge,
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&fit=crop&q=80',
    telephone: product.telephone_contact || '+237 600 00 00 00',
    whatsapp: product.whatsapp_contact || '237600000000',
    localisation: product.localisation || 'Douala, Cameroun',
    description: 'Vendeur vérifié de la communauté DuShopPing engagé pour la qualité locale.'
  };

  const isFav = favorites.some(f => f.id === product.id);

  // Find similar products in the same category (excluding current)
  const similarProducts = combined
    .filter(p => p.categorie_id === product.categorie_id && p.id !== product.id)
    .slice(0, 3);

  return (
    <div className="space-y-12" id="product-detail-view">
      {/* Breadcrumbs */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-500">
          <Link to="/" className="hover:text-emerald-700 font-medium transition-colors">Accueil</Link>
          <span>/</span>
          <Link to={`/category/${product.categorie_id}`} className="hover:text-emerald-700 font-medium transition-colors">{product.categorie_id}</Link>
          <span>/</span>
          <span className="text-slate-850 font-semibold truncate max-w-[150px] sm:max-w-[300px]">{product.titre}</span>
        </div>
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 text-xs text-slate-600 hover:text-emerald-800 font-bold transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4" />
          <span>Retour</span>
        </button>
      </div>

      {/* Main product presentation card */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-xs overflow-hidden grid grid-cols-1 md:grid-cols-12 gap-8 p-6 sm:p-8">
        
        {/* Left Column: Visual Area (5 Cols) */}
        <div className="md:col-span-5 space-y-4">
          <div className="relative aspect-square rounded-2xl overflow-hidden bg-slate-50 border border-slate-100/60 group/image">
            <img
              src={product.images[0]}
              alt={product.titre}
              className="w-full h-full object-cover transition-all duration-500 group-hover/image:scale-105"
              referrerPolicy="no-referrer"
            />
            
            {/* Absolute Badges over image */}
            <div className="absolute top-4 left-4 flex flex-col gap-2">
              {product.isSponsorised && (
                <span className="bg-orange-500 text-white font-black text-[10px] tracking-wider px-3 py-1 rounded-lg uppercase shadow-md flex items-center gap-1">
                  <Sparkles className="w-3 h-3 animate-pulse" />
                  <span>{product.sponsorisedTag || 'SPONSORISÉ'}</span>
                </span>
              )}
            </div>

            <button
              onClick={() => handleToggleFavorite(product.id)}
              className={`absolute top-4 right-4 p-3 rounded-full shadow-md transition-all cursor-pointer ${
                isFav
                  ? 'bg-rose-500 text-white hover:bg-rose-600'
                  : 'bg-white/90 backdrop-blur-xs text-slate-500 hover:text-rose-500 hover:bg-white'
              }`}
              title={isFav ? 'Retirer des favoris' : 'Ajouter aux favoris'}
            >
              <Heart className={`w-5 h-5 ${isFav ? 'fill-current' : ''}`} />
            </button>
          </div>
          
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100/40 text-[11px] text-slate-500 flex items-start gap-2">
            <Shield className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <p>
              Pour votre sécurité, effectuez toujours la transaction dans un lieu public fréquenté et n'envoyez jamais d'argent à l'avance sans vérification physique de l'objet.
            </p>
          </div>
        </div>

        {/* Right Column: Spec Area (7 Cols) */}
        <div className="md:col-span-7 flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            
            {/* Category Title */}
            <span className="text-xs uppercase bg-emerald-50 text-emerald-800 font-extrabold px-3 py-1.5 rounded-lg border border-emerald-100 self-start inline-block">
              {product.categorie_id}
            </span>

            {/* Main Title heading with layout flow */}
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-display leading-tight">
              {product.titre}
            </h1>

            {/* Price section */}
            <div className="flex items-baseline gap-2 py-2">
              <span className="text-3xl font-black font-display text-emerald-800">
                {product.prix.toLocaleString('fr-FR')} FCFA
              </span>
              <span className="text-xs text-slate-400 font-normal">TVA incluse / Prix négociable</span>
            </div>

            <hr className="border-slate-100" />

            {/* Description segment */}
            <div className="space-y-2">
              <h4 className="font-bold text-slate-800 text-sm font-display">Description de l'article :</h4>
              <p className="text-sm text-slate-600 leading-relaxed font-sans whitespace-pre-line">
                {product.description || "Cet artisanat africain d'excellence a été créé de manière écoresponsable. Chaque détail célèbre la beauté et la richesse d'un héritage culturel d'Afrique, en employant des matériaux de premier choix. Contactez directement le vendeur pour organiser un rendez-vous ou obtenir plus de détails."}
              </p>
            </div>
          </div>

          {/* Seller / Contact Info Block */}
          <div className="bg-slate-50 rounded-2xl p-4 sm:p-5 border border-slate-100 space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <img
                  src={sellerInfo.avatar}
                  alt={sellerInfo.nom}
                  className="w-12 h-12 rounded-xl object-cover border border-slate-200"
                  referrerPolicy="no-referrer"
                />
                <div>
                  <div className="flex items-center gap-1">
                    <Link to={`/seller/${encodeURIComponent(sellerInfo.nom)}`} className="font-bold text-sm text-slate-900 hover:text-emerald-700 hover:underline">
                      {sellerInfo.nom}
                    </Link>
                    {sellerInfo.hasBadge && (
                      <BadgeCheck className="w-4 h-4 text-emerald-600 fill-emerald-100" />
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-slate-500 text-xs mt-0.5">
                    <div className="flex items-center gap-0.5 text-amber-500">
                      <Star className="w-3.5 h-3.5 fill-current" />
                      <span className="font-bold">{sellerInfo.rating}</span>
                    </div>
                    <span>•</span>
                    <span className="flex items-center gap-0.5">
                      <MapPin className="w-3" />
                      <span>{sellerInfo.localisation}</span>
                    </span>
                  </div>
                </div>
              </div>

              <Link
                to={`/seller/${encodeURIComponent(sellerInfo.nom)}`}
                className="bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 text-xs font-bold px-3 py-1.5 rounded-xl transition-all"
              >
                Visiter la Boutique
              </Link>
            </div>

            <p className="text-xs text-slate-500 italic">
              "{sellerInfo.description}"
            </p>

            {/* CTA Contact Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <button
                onClick={() => triggerCallSimulation(product)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm py-3.5 rounded-xl transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
              >
                <Phone className="w-4 h-4 shrink-0" />
                <span>Appeler le Vendeur</span>
              </button>

              <button
                onClick={() => triggerChatSimulation(product)}
                className="bg-emerald-950 hover:bg-slate-900 text-white font-extrabold text-sm py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer border border-emerald-900"
              >
                <MessageSquare className="w-4 h-4 text-emerald-450 shrink-0" />
                <span>Discuter instantanément</span>
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* Row: Similar items */}
      {similarProducts.length > 0 && (
        <section className="space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="text-xl font-bold text-slate-900 font-display">
              Vous aimerez aussi
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Articles similaires issus de la même catégorie ({product.categorie_id})
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {similarProducts.map(prod => (
              <ProductCard
                key={prod.id}
                product={prod}
                variant="minimal"
                isFavorite={favorites.some(f => f.id === prod.id)}
                onToggleFavorite={handleToggleFavorite}
                onCallSeller={triggerCallSimulation}
                onChatSeller={triggerChatSimulation}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
