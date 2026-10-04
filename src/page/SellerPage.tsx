/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { AlertCircle, ArrowLeft, MapPin, BadgeCheck, HelpCircle, Loader2, Store } from 'lucide-react';
import { ProduitUI } from '../types';
import ProductCard from '../components/ProductCard';
import { fetchPublicStorefront, incrementBoutiqueVues, PublicStorefront } from '../lib/services';

interface SellerPageProps {
  customProducts: ProduitUI[];
  onCallSeller: (product: ProduitUI) => void;
  onChatSeller: (product: ProduitUI) => void;
}

export default function SellerPage({
  customProducts,
  onCallSeller,
  onChatSeller
}: SellerPageProps) {
  const { sellerName } = useParams<{ sellerName: string }>();
  const navigate = useNavigate();

  const storeReference = sellerName ? decodeURIComponent(sellerName) : '';
  const [boutique, setBoutique] = React.useState<PublicStorefront | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [loadError, setLoadError] = React.useState('');

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as any });
    
    setLoading(true);
    setLoadError('');
    fetchPublicStorefront(storeReference).then(found => {
      setBoutique(found);
      if (found) void incrementBoutiqueVues(found.id);
    }).catch(() => setLoadError('Impossible de charger cette boutique.'))
      .finally(() => setLoading(false));
  }, [storeReference]);

  const sellerProducts = boutique
    ? customProducts.filter(product => product.boutique_id === boutique.id)
    : [];

  if (loading) return <div className="py-20 text-center text-slate-500"><Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 text-emerald-600" />Chargement de la boutique...</div>;
  if (loadError || !boutique) return <div className="max-w-xl mx-auto py-16 text-center"><AlertCircle className="w-12 h-12 text-rose-500 mx-auto mb-4" /><h2 className="text-2xl font-extrabold text-slate-900">Boutique introuvable</h2><p className="text-slate-500 mt-2">{loadError || "Cette boutique n’existe pas ou n’est pas encore approuvée."}</p><Link to="/" className="inline-block mt-6 bg-emerald-600 text-white px-6 py-3 rounded-xl font-bold">Retour à l’accueil</Link></div>;

  return (
    <div className="space-y-8" id="seller-profile-view">
      {/* Navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-500">
          <Link to="/" className="hover:text-emerald-700 font-medium transition-colors">Accueil</Link>
          <span>/</span>
          <span className="text-slate-850 font-semibold">Artisans</span>
          <span>/</span>
          <span className="text-slate-850 font-semibold">{boutique.nom}</span>
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
            {boutique.logo_url ? <img src={boutique.logo_url} alt={boutique.nom} className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover border-4 border-white/10 shadow-lg shrink-0" /> : <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-white/10 border-4 border-white/10 flex items-center justify-center"><Store className="w-10 h-10 text-white/70" /></div>}
            <div className="space-y-2">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <h1 className="text-2xl sm:text-3xl font-black font-display tracking-tight text-white">{boutique.nom}</h1>
                {boutique.verified && (
                  <span className="bg-emerald-450/20 text-emerald-300 border border-emerald-450/40 text-[10px] font-black px-2 py-0.5 rounded-md uppercase flex items-center gap-1 tracking-wider">
                    <BadgeCheck className="w-3.5 h-3.5 fill-current text-emerald-450" />
                    <span>CERTIFIÉ</span>
                  </span>
                )}
              </div>

              <p className="text-slate-300 text-xs sm:text-sm max-w-xl leading-relaxed">
                {boutique.description || 'Cette boutique n’a pas encore ajouté de description.'}
              </p>

              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 text-xs text-slate-400">
                {boutique.localisation && <span className="flex items-center gap-1">
                  <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                  <span>{boutique.localisation}</span>
                </span>}
              </div>
            </div>
          </div>

          <div className="w-full md:w-auto bg-white/5 backdrop-blur-xs border border-white/15 p-4 rounded-2xl text-center md:text-left shrink-0">
            <h4 className="text-xs text-slate-400 uppercase tracking-widest font-black">Performance</h4>
            <div className="flex items-baseline gap-1 mt-1 justify-center md:justify-start">
              <span className="text-3xl font-black font-display text-white">{sellerProducts.length}</span>
              <span className="text-xs text-slate-400">articles actifs</span>
            </div>
          </div>
        </div>
      </div>

      {/* Seller's Products Grid */}
      <div className="space-y-6">
        <div className="border-b border-slate-100 pb-3">
          <h3 className="text-xl font-bold text-slate-900 font-display">
            Vitrine de {boutique.nom}
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
                onCallSeller={onCallSeller}
                onChatSeller={onChatSeller}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
