/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { X, Check, Copy, Phone, MapPin, BadgeCheck, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ProduitUI, VendeurUI } from '../types';
import { SELLERS } from '../data';

interface ContactModalProps {
  product: ProduitUI | null;
  onClose: () => void;
  onOpenChat: (product: ProduitUI) => void;
}

export default function ContactModal({ product, onClose, onOpenChat }: ContactModalProps) {
  const [copied, setCopied] = useState(false);
  const [isCalling, setIsCalling] = useState(false);

  if (!product) return null;

  const seller: VendeurUI = SELLERS[product.nom_boutique] || {
    nom: product.nom_boutique,
    rating: 4.8,
    hasBadge: product.hasBadge,
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&fit=crop&q=80',
    telephone: product.telephone_contact || '+221 77 000 00 00',
    whatsapp: product.whatsapp_contact || '+221770000000',
    localisation: product.localisation || 'Dakar, Sénégal',
    description: 'Vendeur de produits artisanaux sur DuShopPing.'
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(seller.telephone);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const startCallSim = () => {
    setIsCalling(true);
    setTimeout(() => {
      setIsCalling(false);
    }, 4000);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4" id="contact-modal-overlay">
        {/* Backdrop overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-900/45 backdrop-blur-xs"
        />

        {/* Modal panel */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 15 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 15 }}
          className="relative bg-white w-full max-w-md rounded-3xl overflow-hidden shadow-2xl border border-slate-100 z-10"
        >
          {/* Header section */}
          <div className="bg-brand text-white p-6 relative">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-white/80 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors cursor-pointer"
              title="Fermer"
            >
              <X className="w-5 h-5" />
            </button>
            
            <div className="flex items-center gap-4">
              <img
                src={seller.avatar}
                alt={seller.nom}
                className="w-16 h-16 rounded-full object-cover border-2 border-white/40 shadow-md"
              />
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="font-display font-bold text-lg leading-tight">{seller.nom}</h3>
                  {seller.hasBadge && (
                    <BadgeCheck className="w-5 h-5 text-emerald-200 fill-brand shrink-0" title="Vendeur certifié" />
                  )}
                </div>
                <p className="text-xs text-brand-light flex items-center gap-1 mt-1">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>{seller.localisation}</span>
                </p>
              </div>
            </div>
          </div>

          {/* Body Content */}
          <div className="p-6 space-y-5">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">
                À propos de l'artisan
              </p>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                {seller.description}
              </p>
            </div>

            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Article d'intérêt
                </span>
                <span className="text-xs font-semibold text-brand bg-brand-light px-2.5 py-0.5 rounded-full">
                  {product.categorie_id}
                </span>
              </div>
              <div className="flex gap-3">
                <img
                  src={product.images[0]}
                  alt={product.titre}
                  className="w-12 h-12 rounded-lg object-cover shrink-0"
                />
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-slate-800 line-clamp-1">{product.titre}</h4>
                  <p className="text-xs font-bold text-slate-900 font-mono mt-0.5">
                    {new Intl.NumberFormat('fr-FR').format(product.prix)} FCFA
                  </p>
                </div>
              </div>
            </div>

            {/* VendeurUI Contact Trigger */}
            <div className="space-y-3">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                Coordonnées Directes
              </p>

              {/* Phone display with copy option */}
              <div className="flex items-center justify-between bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl p-3.5 transition-colors">
                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-brand" />
                  <span className="font-mono text-sm sm:text-base font-bold text-slate-800">
                    {seller.telephone}
                  </span>
                </div>
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1 text-xs text-brand hover:text-brand-dark font-semibold px-2.5 py-1.5 bg-white rounded-lg border border-slate-200 transition-all cursor-pointer"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                      <span className="text-emerald-600">Copié</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copier</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Quick action triggers */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={startCallSim}
                disabled={isCalling}
                className="w-full bg-brand hover:bg-brand-hover disabled:bg-slate-250 text-white font-bold py-3 px-4 rounded-xl text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
              >
                <Phone className={`w-4 h-4 ${isCalling ? 'animate-bounce' : ''}`} />
                <span>{isCalling ? 'Appel en cours...' : 'Appeler Direct'}</span>
              </motion.button>

              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  onClose();
                  onOpenChat(product);
                }}
                className="w-full bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 text-emerald-800 font-bold py-3 px-4 rounded-xl text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Ouvrir le chat</span>
              </motion.button>
            </div>

            {isCalling && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="bg-emerald-50 text-emerald-800 border-l-4 border-emerald-500 rounded p-3 text-xs flex flex-col items-center justify-center text-center font-medium mt-2"
              >
                <p className="animate-pulse">📞 Simulation d'appel vocal vers {seller.nom}...</p>
                <p className="text-[10px] text-slate-400 mt-1">Sur téléphone réel, cela composerait le {seller.telephone}</p>
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
