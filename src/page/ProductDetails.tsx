/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Phone, MessageSquare, MapPin, ArrowLeft, Shield, Sparkles, AlertCircle, ChevronLeft, ChevronRight, Store } from 'lucide-react';
import { ProduitUI } from '../types';
import ProductCard from '../components/ProductCard';
import { fetchProductById, incrementProductClics, incrementProductViews } from '../lib/services';

interface ProductDetailsProps {
  customProducts: ProduitUI[];
  onCallSeller: (product: ProduitUI) => void;
  onChatSeller: (product: ProduitUI) => void;
}

export default function ProductDetails({
  customProducts,
  onCallSeller,
  onChatSeller
}: ProductDetailsProps) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // Scroll to top when page displays
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as any });
  }, [id]);

  const cachedProduct = customProducts.find(p => p.id === id);
  const [loadedProduct, setLoadedProduct] = useState<ProduitUI | null>(null);
  const [loadingProduct, setLoadingProduct] = useState(!cachedProduct);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const product = cachedProduct || loadedProduct;

  useEffect(() => {
    setSelectedImageIndex(0);
  }, [product?.id]);

  useEffect(() => {
    let active = true;
    setLoadedProduct(null);

    if (!id || cachedProduct) {
      setLoadingProduct(false);
      return () => { active = false; };
    }

    setLoadingProduct(true);
    void fetchProductById(id)
      .then(result => {
        if (active) setLoadedProduct(result);
      })
      .catch(() => {
        if (active) setLoadedProduct(null);
      })
      .finally(() => {
        if (active) setLoadingProduct(false);
      });

    return () => { active = false; };
  }, [id, cachedProduct]);

  useEffect(() => {
    if (product?.id && product.id.length === 36) void incrementProductViews(product.id);
  }, [product?.id]);

  if (loadingProduct) {
    return (
      <div className="max-w-xl mx-auto py-16 px-4 text-center text-slate-500">
        Chargement de l'article...
      </div>
    );
  }

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

  const galleryImages = (product.images || []).filter(Boolean);
  const selectedImage = galleryImages[selectedImageIndex] || galleryImages[0];

  const openSellerWhatsApp = (intent: 'call' | 'message') => {
    const whatsappNumber = (product.whatsapp_contact || product.telephone_contact || '').replace(/\D/g, '');
    if (!whatsappNumber) return;
    const text = intent === 'call'
      ? 'Bonjour, je souhaite échanger par appel au sujet de votre article « ' + product.titre + ' » sur DuShopPing.'
      : 'Bonjour, je suis intéressé(e) par votre article « ' + product.titre + ' » sur DuShopPing. Est-il toujours disponible ?';
    void incrementProductClics(product.id, intent === 'call' ? 'AppelDirect' : 'ClicWhatsApp');
    window.open('https://wa.me/' + whatsappNumber + '?text=' + encodeURIComponent(text), '_blank', 'noopener,noreferrer');
  };

  // Find similar products in the same category (excluding current)
  const similarProducts = customProducts
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
            {selectedImage ? (
              <img
                src={selectedImage}
                alt={product.titre + ' — photo ' + (selectedImageIndex + 1)}
                className="w-full h-full object-cover transition-all duration-500 group-hover/image:scale-105"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-400">Image indisponible</div>
            )}

            {galleryImages.length > 1 && (
              <>
                <button type="button" onClick={() => setSelectedImageIndex(index => (index - 1 + galleryImages.length) % galleryImages.length)} aria-label="Image précédente" className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 text-slate-800 shadow-md flex items-center justify-center hover:bg-white"><ChevronLeft className="w-5 h-5" /></button>
                <button type="button" onClick={() => setSelectedImageIndex(index => (index + 1) % galleryImages.length)} aria-label="Image suivante" className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/90 text-slate-800 shadow-md flex items-center justify-center hover:bg-white"><ChevronRight className="w-5 h-5" /></button>
                <span className="absolute bottom-3 right-3 bg-slate-900/70 text-white text-xs font-bold px-2.5 py-1 rounded-full">{selectedImageIndex + 1}/{galleryImages.length}</span>
              </>
            )}
            
            {/* Absolute Badges over image */}
            <div className="absolute top-4 left-4 flex flex-col gap-2">
              {product.isSponsorised && (
                <span className="bg-orange-500 text-white font-black text-[10px] tracking-wider px-3 py-1 rounded-lg uppercase shadow-md flex items-center gap-1">
                  <Sparkles className="w-3 h-3 animate-pulse" />
                  <span>{product.sponsorisedTag || 'SPONSORISÉ'}</span>
                </span>
              )}
            </div>

          </div>

          {galleryImages.length > 1 && (
            <div className="grid grid-cols-3 gap-3" aria-label="Galerie du produit">
              {galleryImages.map((image, index) => (
                <button key={image + index} type="button" onClick={() => setSelectedImageIndex(index)} className={'aspect-[4/3] rounded-xl overflow-hidden border-2 transition-all ' + (selectedImageIndex === index ? 'border-emerald-600 ring-2 ring-emerald-100' : 'border-slate-100 hover:border-slate-300')} aria-label={'Afficher la photo ' + (index + 1)}>
                  <img src={image} alt={product.titre + ' miniature ' + (index + 1)} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
          
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
                <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center border border-emerald-200"><Store className="w-6 h-6" /></div>
                <div>
                  <div className="flex items-center gap-1">
                    <Link to={`/seller/${encodeURIComponent(product.boutique_id || product.nom_boutique)}`} className="font-bold text-sm text-slate-900 hover:text-emerald-700 hover:underline">
                      {product.nom_boutique}
                    </Link>
                  </div>
                  {product.localisation && <div className="flex items-center gap-2 text-slate-500 text-xs mt-0.5"><span className="flex items-center gap-0.5">
                      <MapPin className="w-3" />
                      <span>{product.localisation}</span>
                    </span></div>}
                </div>
              </div>

              <Link
                to={`/seller/${encodeURIComponent(product.boutique_id || product.nom_boutique)}`}
                className="bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 text-xs font-bold px-3 py-1.5 rounded-xl transition-all"
              >
                Visiter la Boutique
              </Link>
            </div>

            {/* CTA Contact Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <button
                onClick={() => openSellerWhatsApp('call')}
                disabled={!product.whatsapp_contact && !product.telephone_contact}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm py-3.5 rounded-xl transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
              >
                <Phone className="w-4 h-4 shrink-0" />
                <span>Appeler le Vendeur</span>
              </button>

              <button
                onClick={() => openSellerWhatsApp('message')}
                disabled={!product.whatsapp_contact && !product.telephone_contact}
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
                onCallSeller={onCallSeller}
                onChatSeller={onChatSeller}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
