import React, { useEffect, useState } from 'react';
import { Eye, MessageCircle, Rocket } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { ExternalAdRecord, fetchActiveBoostedProducts, fetchActiveExternalAds } from '../lib/services';
import { ProduitUI } from '../types';

interface SidebarAdProps {
  position: 'left' | 'right';
  variant?: 'vertical' | 'horizontal';
  searchQuery?: string;
}

export default function SidebarAd({ position, variant = 'vertical', searchQuery = '' }: SidebarAdProps) {
  const navigate = useNavigate();
  const [products, setProducts] = useState<ProduitUI[]>([]);
  const [externalAd, setExternalAd] = useState<ExternalAdRecord | null>(null);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    let mounted = true;
    Promise.all([fetchActiveBoostedProducts(), fetchActiveExternalAds('Accueil')])
      .then(([boosted, ads]) => {
        if (!mounted) return;
        const filtered = searchQuery.trim()
          ? boosted.filter(product => `${product.titre} ${product.categorie_id}`.toLowerCase().includes(searchQuery.toLowerCase()))
          : boosted;
        setProducts(filtered);
        const adIndex = position === 'left' ? 0 : 1;
        setExternalAd(ads[adIndex] || ads[0] || null);
      })
      .catch(error => console.warn('Encarts publicitaires indisponibles:', error));
    return () => { mounted = false; };
  }, [position, searchQuery]);

  useEffect(() => {
    if (products.length < 2) return;
    const timer = window.setInterval(() => setIndex(current => (current + 1) % products.length), 4000);
    return () => window.clearInterval(timer);
  }, [products.length]);

  const product = products[index % Math.max(products.length, 1)];
  if (!product && !externalAd) return null;

  const openMainAction = () => {
    if (product) navigate(`/product/${product.id}`);
    else if (externalAd) window.open(externalAd.lien_redirection, '_blank', 'noopener,noreferrer');
  };

  if (variant === 'horizontal') {
    return (
      <div className="w-full bg-[#f0f4fc] border border-blue-100 p-3 sm:p-4 rounded-2xl shadow-xs flex items-center justify-between gap-4">
        <AnimatePresence mode="wait">
          <motion.div key={product?.id || externalAd?.id || position} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-4 min-w-0 flex-1">
            {(product?.images[0] || externalAd?.image_banniere_url) && <img src={product?.images[0] || externalAd?.image_banniere_url} alt={product?.titre || externalAd?.nom_entreprise || 'Publicité'} className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg object-cover shrink-0" />}
            <div className="min-w-0">
              <span className="text-[9px] font-bold text-blue-500 tracking-widest uppercase">{product ? 'PRODUIT SPONSORISÉ' : 'PUBLICITÉ'}</span>
              <h4 className="text-sm font-bold text-slate-800 truncate">{product?.titre || externalAd?.nom_entreprise}</h4>
              <p className="text-xs text-slate-500 truncate">{product ? `${product.prix.toLocaleString('fr-FR')} FCFA · ${product.nom_boutique}` : 'Annonce partenaire'}</p>
            </div>
          </motion.div>
        </AnimatePresence>
        <button onClick={openMainAction} className="bg-brand text-white text-xs font-bold py-2 px-4 rounded-xl flex items-center gap-1 shrink-0"><Eye className="w-4 h-4" />Découvrir</button>
      </div>
    );
  }

  return (
    <motion.aside initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-[160px] bg-[#f0f4fc] border border-blue-100 h-[600px] flex flex-col justify-between p-4 rounded-2xl shrink-0 shadow-xs">
      <AnimatePresence mode="wait">
        <motion.div key={product?.id || externalAd?.id || position} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="h-full flex flex-col">
          <div>
            <span className="text-[9px] font-bold text-blue-500 tracking-widest uppercase">{product ? 'SPONSORISÉ' : 'PUBLICITÉ'}</span>
            <h4 className="text-xs font-bold text-slate-800 leading-tight mt-3">{product?.titre || externalAd?.nom_entreprise}</h4>
            <p className="text-[10px] text-slate-500 mt-2">{product ? `${product.prix.toLocaleString('fr-FR')} FCFA` : 'Annonce partenaire'}</p>
            {product?.nom_boutique && <p className="text-[10px] font-bold text-emerald-700 mt-1">{product.nom_boutique}</p>}
          </div>
          {(product?.images[0] || externalAd?.image_banniere_url) && <img src={product?.images[0] || externalAd?.image_banniere_url} alt={product?.titre || externalAd?.nom_entreprise || 'Publicité'} className="w-full flex-1 max-h-[300px] my-4 rounded-lg object-cover" />}
          <button onClick={openMainAction} className="w-full bg-brand text-white text-xs font-bold py-2.5 rounded-xl flex items-center justify-center gap-1.5">
            {product ? <MessageCircle className="w-4 h-4" /> : <Rocket className="w-4 h-4" />}
            Découvrir
          </button>
        </motion.div>
      </AnimatePresence>
    </motion.aside>
  );
}
