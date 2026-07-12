/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { X, Heart, MessageSquare, Trash2, Phone } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ProduitUI } from '../types';

interface FavoritesDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  favorites: ProduitUI[];
  onRemove: (id: string) => void;
  onCallSeller: (product: ProduitUI) => void;
  onChatSeller: (product: ProduitUI) => void;
}

export default function FavoritesDrawer({
  isOpen,
  onClose,
  favorites,
  onRemove,
  onCallSeller,
  onChatSeller
}: FavoritesDrawerProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden" id="favorites-drawer-overlay">
          <div className="absolute inset-0 overflow-hidden">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="absolute inset-0 bg-slate-900/45 backdrop-blur-xs transition-opacity"
            />

            <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10 sm:pl-16">
              <motion.div
                initial={{ translateX: '100%' }}
                animate={{ translateX: '0%' }}
                exit={{ translateX: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 220 }}
                className="pointer-events-auto w-screen max-w-md"
              >
                <div className="flex h-full flex-col overflow-y-scroll bg-white shadow-2xl themes-cyan">
                  {/* Drawer Header */}
                  <div className="bg-brand text-white p-6 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Heart className="w-5 h-5 fill-white" />
                      <h2 className="text-lg font-bold font-display">Mes Favoris ({favorites.length})</h2>
                    </div>
                    <button
                      onClick={onClose}
                      className="text-white hover:text-slate-200 p-1 rounded-full hover:bg-white/10 cursor-pointer"
                      title="Fermer"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Drawer Body */}
                  <div className="flex-1 py-6 px-4 sm:px-6">
                    {favorites.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4">
                        <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center text-rose-500 border border-rose-100">
                          <Heart className="w-8 h-8" />
                        </div>
                        <div>
                          <h3 className="font-bold text-slate-800 text-sm">Aucun favori pour le moment</h3>
                          <p className="text-xs text-slate-400 mt-1 max-w-[240px]">
                            Cliquez sur le cœur d'un produit qui vous plaît sur la place du marché pour le sauvegarder ici !
                          </p>
                        </div>
                        <button
                          onClick={onClose}
                          className="bg-brand hover:bg-brand-hover text-white text-xs font-semibold py-2 px-5 rounded-xl cursor-pointer"
                        >
                          Parcourir les produits
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {favorites.map((product) => (
                          <motion.div
                            layout
                            key={product.id}
                            className="flex gap-4 p-3 rounded-2xl border border-slate-100 bg-slate-50 relative group"
                          >
                            <img
                              src={product.images[0]}
                              alt={product.titre}
                              className="w-20 h-20 rounded-xl object-cover bg-white shrink-0"
                            />
                            
                            <div className="flex-1 flex flex-col justify-between min-w-0">
                              <div>
                                <div className="flex items-start justify-between gap-1.5">
                                  <h4 className="text-xs sm:text-sm font-bold text-slate-800 line-clamp-1">
                                    {product.titre}
                                  </h4>
                                  <button
                                    onClick={() => onRemove(product.id)}
                                    className="text-slate-400 hover:text-rose-500 p-0.5 rounded cursor-pointer"
                                    title="Supprimer"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                                <p className="text-[10px] text-slate-400 mt-0.5">Par {product.nom_boutique}</p>
                              </div>

                              <div className="flex items-center justify-between gap-2 mt-2">
                                <span className="font-mono text-xs sm:text-sm font-bold text-brand">
                                  {new Intl.NumberFormat('fr-FR').format(product.prix)} F
                                </span>
                                
                                <div className="flex items-center gap-1.5">
                                  <button
                                    onClick={() => onCallSeller(product)}
                                    className="p-1 px-2 text-xs bg-white text-slate-600 hover:text-brand hover:border-brand-hover rounded-lg border border-slate-200 flex items-center gap-1 cursor-pointer"
                                    title="Appeler l'artisan"
                                  >
                                    <Phone className="w-3.5 h-3.5" />
                                    <span className="hidden sm:inline">Appel</span>
                                  </button>
                                  <button
                                    onClick={() => onChatSeller(product)}
                                    className="p-1 px-2 text-xs bg-brand text-white hover:bg-brand-hover rounded-lg flex items-center gap-1 cursor-pointer"
                                    title="Échanger direct"
                                  >
                                    <MessageSquare className="w-3.5 h-3.5" />
                                    <span className="hidden sm:inline">Écrire</span>
                                  </button>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}
