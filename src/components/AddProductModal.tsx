/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, FormEvent } from 'react';
import { X, Sparkles, Check, Image as ImageIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ProduitUI } from '../types';
import { IMAGES } from '../data';

interface AddProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddProduct: (product: ProduitUI) => void;
}

export default function AddProductModal({ isOpen, onClose, onAddProduct }: AddProductModalProps) {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Artisanat');
  const [price, setPrice] = useState('');
  const [seller, setSeller] = useState('Mon Atelier');
  const [description, setDescription] = useState('');
  const [selectedImage, setSelectedImage] = useState(IMAGES.basket);
  const [success, setSuccess] = useState(false);

  const imagesList = [
    { label: 'Panier Tressé', url: IMAGES.basket },
    { label: 'Sweating Indigo', url: IMAGES.hoodie },
    { label: 'Poteries Africaines', url: IMAGES.vases },
    { label: 'Flacons Miel/Huiles', url: IMAGES.cosmetics },
    { label: 'Épices de Prestige', url: IMAGES.spices },
    { label: 'Brocart de Soie', url: IMAGES.silk },
  ];

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !price || !seller.trim()) return;

    const newProduct: ProduitUI = {
      id: `custom-${Date.now()}`,
      title,
      category,
      price: parseFloat(price),
      image: selectedImage,
      seller,
      hasBadge: true,
      rating: 5.0,
      reviewsCount: 1,
      isSponsorised: true,
      sponsorisedTag: 'SPONSORISÉ',
      description: description || 'Une création originale proposée en circuit court sur la place de marché DuShopPing.',
      phoneNumber: '+221 77 123 45 67',
      whatsappNumber: '+221771234567',
      location: 'Dakar, Sénégal'
    };

    onAddProduct(newProduct);
    setSuccess(true);
    setTimeout(() => {
      setSuccess(false);
      setTitle('');
      setPrice('');
      setDescription('');
      onClose();
    }, 2000);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4" id="add-product-overlay">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs"
        />

        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 15 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 15 }}
          className="relative bg-white w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl border border-slate-100 z-10"
        >
          {success ? (
            <div className="p-8 text-center flex flex-col items-center justify-center space-y-4">
              <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-500 border border-emerald-100 animate-pulse">
                <Check className="w-8 h-8" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-lg">Article Publié avec Succès !</h3>
                <p className="text-xs sm:text-sm text-slate-400 mt-1">
                  Votre article "{title}" a été mis en vente sur la Place du Marché DuShopPing.
                </p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="bg-brand text-white p-5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5" />
                  <h3 className="font-display font-bold text-base sm:text-lg">Mettre en vente sur DuShopPing</h3>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="text-white hover:text-slate-200 p-1 rounded-full hover:bg-white/10 cursor-pointer"
                  title="Fermer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-4 max-h-[500px] overflow-y-auto">
                {/* Product Title */}
                <div>
                  <label htmlFor="prod-title" className="block text-xs font-bold text-slate-500 uppercase mb-1.5">
                    Nom de l'article *
                  </label>
                  <input
                    id="prod-title"
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Ex: Tunique Fila ou Sac en Raphia..."
                    className="w-full bg-slate-50 border border-slate-200 text-xs sm:text-sm p-3 rounded-xl focus:bg-white focus:outline-hidden focus:border-brand text-slate-800"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {/* Category select */}
                  <div>
                    <label htmlFor="prod-cat" className="block text-xs font-bold text-slate-500 uppercase mb-1.5">
                      Catégorie *
                    </label>
                    <select
                      id="prod-cat"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 text-xs sm:text-sm p-3 rounded-xl focus:bg-white focus:outline-hidden focus:border-brand text-slate-800 cursor-pointer"
                    >
                      <option value="Artisanat">Artisanat / Déco</option>
                      <option value="Mode">Mode / Textile</option>
                      <option value="Épicerie">Épicerie</option>
                      <option value="Saveurs">Soins & Saveurs</option>
                    </select>
                  </div>

                  {/* Price in FCFA */}
                  <div>
                    <label htmlFor="prod-price" className="block text-xs font-bold text-slate-500 uppercase mb-1.5">
                      Prix (FCFA) *
                    </label>
                    <input
                      id="prod-price"
                      type="number"
                      required
                      min="100"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      placeholder="Ex: 35000"
                      className="w-full bg-slate-50 border border-slate-200 text-xs sm:text-sm p-3 rounded-xl focus:bg-white focus:outline-hidden focus:border-brand text-slate-800"
                    />
                  </div>
                </div>

                {/* Seller & Country */}
                <div>
                  <label htmlFor="prod-seller" className="block text-xs font-bold text-slate-500 uppercase mb-1.5">
                    Nom de votre marque / Boutique *
                  </label>
                  <input
                    id="prod-seller"
                    type="text"
                    required
                    value={seller}
                    onChange={(e) => setSeller(e.target.value)}
                    placeholder="Ex: Artisanat d'Afrique"
                    className="w-full bg-slate-50 border border-slate-200 text-xs sm:text-sm p-3 rounded-xl focus:bg-white focus:outline-hidden focus:border-brand text-slate-800"
                  />
                </div>

                {/* Description */}
                <div>
                  <label htmlFor="prod-desc" className="block text-xs font-bold text-slate-500 uppercase mb-1.5">
                    Description de la création
                  </label>
                  <textarea
                    id="prod-desc"
                    rows={2}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Détaillez le matériau, la fabrication, la provenance..."
                    className="w-full bg-slate-50 border border-slate-200 text-xs sm:text-sm p-3 rounded-xl focus:bg-white focus:outline-hidden focus:border-brand text-slate-800 resize-none"
                  />
                </div>

                {/* Image presets selector */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2 flex items-center gap-1.5">
                    <ImageIcon className="w-3.5 h-3.5 text-brand" />
                    <span>Choisir une photo de démonstration</span>
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {imagesList.map((img) => (
                      <button
                        key={img.url}
                        type="button"
                        onClick={() => setSelectedImage(img.url)}
                        className={`p-1.5 rounded-xl border text-left flex flex-col items-center gap-1.5 transition-all text-[10px] cursor-pointer ${
                          selectedImage === img.url
                            ? 'border-brand bg-brand-light ring-2 ring-brand-light font-bold text-brand'
                            : 'border-slate-100 hover:bg-slate-50 text-slate-600'
                        }`}
                      >
                        <img
                          src={img.url}
                          alt={img.label}
                          className="w-full h-11 object-cover rounded-lg"
                        />
                        <span className="truncate w-full text-center">{img.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-4 bg-slate-50 border-t border-slate-100 flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 bg-white text-slate-600 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold hover:bg-slate-100 cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-brand text-white hover:bg-brand-hover rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Publier l'Article</span>
                </button>
              </div>
            </form>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
