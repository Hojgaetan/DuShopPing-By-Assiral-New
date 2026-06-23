/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Search, Bell, Heart, ChevronDown, Sparkles, ShoppingBag, ArrowRight, Store } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../context/AuthContext';
import { fetchUserBoutique } from '../lib/services';

interface HeaderProps {
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  selectedCategory: string;
  setSelectedCategory: (cat: string) => void;
  favoritesCount: number;
  openFavorites: () => void;
  onAddProductClick: () => void;
}

interface ProductVignette {
  id: string;
  title: string;
  price: number;
  image: string;
  seller: string;
}

interface Subcategory {
  name: string;
  products: ProductVignette[];
}

interface MegaCategory {
  label: string;
  value: string;
  subcategories: Subcategory[];
}

export default function Header({
  searchQuery,
  setSearchQuery,
  selectedCategory,
  setSelectedCategory,
  favoritesCount,
  openFavorites,
  onAddProductClick
}: HeaderProps) {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [boutiqueLogo, setBoutiqueLogo] = useState<string | null>(null);

  useEffect(() => {
    if (user && user.role === 'Vendeur') {
      fetchUserBoutique(user.id).then(b => {
        if (b && b.logo_url) {
          setBoutiqueLogo(b.logo_url);
        } else {
          setBoutiqueLogo(null);
        }
      });
    } else {
      setBoutiqueLogo(null);
    }
  }, [user]);
  
  // Mega menu states
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);
  const [hoveredSubcategory, setHoveredSubcategory] = useState<string | null>(null);

  // Hardcoded real images referencing the exact public asset paths to avoid broken assets page
  const IMAGES = {
    basket: '/src/assets/images/pannier_tisse_1781282354068.jpg',
    hoodie: '/src/assets/images/tunique_indigo_1781282369664.jpg',
    vases: '/src/assets/images/statuettes_vases_1781282386709.jpg',
    cosmetics: '/src/assets/images/mielles_cosmetiques_1781282401828.jpg',
    spices: '/src/assets/images/epices_1781282418024.jpg',
    silk: '/src/assets/images/echarpe_soie_1781282435673.jpg',
  };

  const megaCategories: MegaCategory[] = [
    {
      label: 'Artisanat & Décoration',
      value: 'Artisanat',
      subcategories: [
        {
          name: 'Paniers & Vanneries',
          products: [
            { id: 'une-1', title: 'Panier Tiss Premium', price: 29500, image: IMAGES.basket, seller: 'Amara Studio' },
            { id: 'spon1-1', title: 'Vase Traditionnel', price: 27500, image: IMAGES.basket, seller: 'Savana Decor' }
          ]
        },
        {
          name: 'Poteries & Céramiques',
          products: [
            { id: 'pop-1', title: 'Vase en Terre Cuite', price: 23000, image: IMAGES.basket, seller: 'Amara Studio' },
            { id: 'une-3', title: 'Statuette Bronze Royale', price: 98400, image: IMAGES.vases, seller: 'Mama Africa' }
          ]
        },
        {
          name: 'Sculptures d\'Afrique',
          products: [
            { id: 'notes-1', title: 'Statuette Bronze', price: 78700, image: IMAGES.vases, seller: 'Mama Africa' },
            { id: 'spon2-1', title: 'Masque Tribal', price: 55800, image: IMAGES.vases, seller: 'Benin Arts' }
          ]
        }
      ]
    },
    {
      label: 'Mode & Textiles',
      value: 'Mode',
      subcategories: [
        {
          name: 'Tuniques & Vestes',
          products: [
            { id: 'une-2', title: 'Tunique Indigo Artisanale', price: 42600, image: IMAGES.hoodie, seller: 'Kente Masters' },
            { id: 'pop-2', title: 'Tunique Brodée', price: 36000, image: IMAGES.hoodie, seller: 'Kente Masters' }
          ]
        },
        {
          name: 'Boubous & Caftans',
          products: [
            { id: 'spon1-2', title: 'Boubou Indigo', price: 51200, image: IMAGES.hoodie, seller: 'Loom Heritage' }
          ]
        },
        {
          name: 'Écharpes & Étoffes',
          products: [
            { id: 'notes-3', title: 'Écharpe en Soie', price: 26200, image: IMAGES.silk, seller: 'Dushop General Seller' },
            { id: 'spon2-3', title: 'Soie de Tana', price: 32000, image: IMAGES.silk, seller: 'Dushop General Seller' }
          ]
        }
      ]
    },
    {
      label: 'Épicerie & Épices',
      value: 'Épicerie',
      subcategories: [
        {
          name: 'Épices Rares',
          products: [
            { id: 'notes-2', title: 'Épices Berbère', price: 5600, image: IMAGES.spices, seller: 'Épices du Sahel' }
          ]
        },
        {
          name: 'Assortiments & Coffrets',
          products: [
            { id: 'spon2-2', title: 'Coffret Épices', price: 16400, image: IMAGES.spices, seller: 'Épices du Sahel' }
          ]
        }
      ]
    },
    {
      label: 'Soins & Saveurs',
      value: 'Saveurs',
      subcategories: [
        {
          name: 'Miels Purs d\'Altitude',
          products: [
            { id: 'pop-3-variant', title: 'Miel Pur 1kg', price: 12100, image: IMAGES.cosmetics, seller: 'Miel d\'Or' },
            { id: 'pop-3', title: 'Miel de Forêt', price: 7900, image: IMAGES.cosmetics, seller: 'Miel d\'Or' }
          ]
        },
        {
          name: 'Cosmétiques de la Ruche',
          products: [
            { id: 'pop-3', title: 'Miel de Forêt Cosme', price: 7900, image: IMAGES.cosmetics, seller: 'Miel d\'Or' }
          ]
        }
      ]
    }
  ];

  // Automatically reset hovered subcategory to the first option when category hover shifts
  useEffect(() => {
    if (hoveredCategory) {
      const activeCatObj = megaCategories.find(c => c.value === hoveredCategory);
      if (activeCatObj && activeCatObj.subcategories.length > 0) {
        setHoveredSubcategory(activeCatObj.subcategories[0].name);
      }
    } else {
      setHoveredSubcategory(null);
    }
  }, [hoveredCategory]);

  const notifications = [
    { id: 1, text: "💬 Amara l'Artisan a lu votre message.", time: "Il y a 5 min", unread: true },
    { id: 2, text: "✨ Nouveau : Les Épices Berbère de retour en stock !", time: "Il y a 1 h", unread: true },
    { id: 3, text: "⭐ Événement : Exposition Virtuelle de Statuettes Royales.", time: "Il y a 1 jour", unread: false },
  ];

  // Get active items belonging to subcategory
  const getSubcategoryProducts = () => {
    if (!hoveredCategory || !hoveredSubcategory) return [];
    const activeCatObj = megaCategories.find(c => c.value === hoveredCategory);
    if (!activeCatObj) return [];
    const activeSubObj = activeCatObj.subcategories.find(s => s.name === hoveredSubcategory);
    return activeSubObj ? activeSubObj.products : [];
  };

  return (
    <header className="w-full bg-white border-b border-slate-100 shadow-xs" id="main-header">
      
      {/* LEVEL 1: Top Navigation Level (Logo, Search Bar, Profil & Actions) */}
      <div className="border-b border-slate-100/75">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between gap-4">
          
          {/* Logo Brand */}
          <div className="shrink-0 animate-fade-in">
            <motion.div 
              whileHover={{ scale: 1.02 }}
              onClick={() => { 
                setSearchQuery(''); 
                setSelectedCategory('Tous'); 
                navigate('/');
              }}
              className="text-2xl sm:text-3xl font-extrabold font-display text-[#02603c] flex items-center gap-1.5 cursor-pointer select-none"
              id="brand-logo"
            >
              <ShoppingBag className="w-6 h-6 sm:w-7 sm:h-7 stroke-[2.5] text-[#02603c]" />
              <span>DuShopPing</span>
            </motion.div>
          </div>

          {/* Centered Search Bar */}
          <div className="flex-1 max-w-xl mx-2 sm:mx-6 md:mx-12">
            <div className="relative">
              <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-slate-400">
                <Search className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  navigate('/');
                }}
                placeholder="Rechercher un article, un artisan, ou un mot-clé..."
                className="w-full text-xs sm:text-sm pl-9 pr-14 py-2.5 bg-slate-50 border border-slate-100 focus:bg-white focus:ring-2 focus:ring-brand focus:border-brand rounded-2xl placeholder:text-slate-400 transition-all text-slate-800"
                id="search-input"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute inset-y-0 right-3 flex items-center text-xs text-rose-500 hover:text-rose-700 font-bold cursor-pointer"
                >
                  Effacer
                </button>
              )}
            </div>
          </div>

          {/* Visitor Auth Access Links or User Menu */}
          <div className="flex items-center gap-4 shrink-0 font-sans" id="auth-visitor-links">
            {user ? (
              <div className="flex items-center gap-4">
                <span className="hidden sm:block text-sm font-bold text-slate-700">
                  {user.role === 'Vendeur' ? 'Compte Vendeur' : 'Acheteur'}
                </span>

                <div className="relative">
                  <button
                    onClick={() => setShowProfileMenu(!showProfileMenu)}
                    className="flex items-center gap-2 hover:bg-slate-50 p-1.5 rounded-full transition-colors cursor-pointer"
                  >
                    <div className="w-9 h-9 rounded-full bg-[#02603c] text-white flex items-center justify-center font-bold text-sm overflow-hidden border-2 border-transparent hover:border-emerald-200 transition-colors">
                      {boutiqueLogo ? (
                        <img src={boutiqueLogo} alt="Logo" className="w-full h-full object-cover" />
                      ) : (
                        user.nom.charAt(0).toUpperCase()
                      )}
                    </div>
                  </button>

                  <AnimatePresence>
                    {showProfileMenu && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50"
                      >
                        <div className="px-4 py-2 border-b border-slate-50">
                          <p className="text-sm font-bold text-slate-800 truncate">{user.nom}</p>
                          <p className="text-xs text-slate-500 truncate">{user.email}</p>
                        </div>
                        {user.role === 'Vendeur' && (
                          <button
                            onClick={() => {
                              setShowProfileMenu(false);
                              navigate('/dashboard');
                            }}
                            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-slate-700 font-extrabold hover:bg-emerald-50 hover:text-[#02603c] transition-colors"
                          >
                            <Store className="w-4 h-4" />
                            Ma Boutique
                          </button>
                        )}
                        <button
                          onClick={() => {
                            logout();
                            setShowProfileMenu(false);
                            navigate('/');
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-rose-600 hover:bg-rose-50 transition-colors"
                        >
                          Déconnexion
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            ) : (
              <>
                <button
                  onClick={() => navigate('/login')}
                  className="text-xs sm:text-sm font-bold text-slate-600 hover:text-[#02603c] transition-colors cursor-pointer"
                >
                  Connexion
                </button>
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={() => navigate('/register')}
                  className="bg-[#02603c] text-white hover:bg-[#01482c] px-4.5 py-2.5 rounded-2xl text-xs sm:text-sm font-extrabold transition-all shadow-xs cursor-pointer"
                >
                  S'inscrire
                </motion.button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* LEVEL 2: Mega Menu & Category Navigation level */}
      <div className="bg-[#fcfdff] border-b border-slate-100/90 relative" id="bottom-header-row">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-12 flex items-center justify-center relative">
          
          {/* List of categories with interactive hover */}
          <div className="flex items-center justify-center gap-1 sm:gap-4 overflow-x-auto md:overflow-visible scrollbar-hide py-1">
 
            {/* Categories iteration representing active category with mega menu hover */}
            <div className="flex items-center justify-center gap-1.5 md:gap-4 h-full md:overflow-visible">
              {megaCategories.map((cat) => {
                const isActive = selectedCategory === cat.value;
                return (
                  <div
                    key={cat.value}
                    onMouseEnter={() => setHoveredCategory(cat.value)}
                    onMouseLeave={() => setHoveredCategory(null)}
                    className="shrink-0 h-10 flex items-center"
                  >
                    <button
                      onClick={() => {
                        setSelectedCategory(cat.value);
                        setHoveredCategory(null);
                        navigate('/');
                      }}
                      className={`px-1 py-2 text-xs sm:text-sm font-extrabold transition-all flex items-center gap-1 cursor-pointer border-b-2 h-full ${
                        isActive
                          ? 'border-[#02603c] text-[#02603c]'
                          : 'border-transparent text-slate-650 hover:text-slate-900'
                      }`}
                    >
                      <span>{cat.label}</span>
                      <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                    </button>
 
                    {/* INTERACTIVE MEGA MENU dropdown block onHover */}
                    <AnimatePresence>
                      {hoveredCategory === cat.value && (
                        <div 
                          className="absolute inset-x-0 top-full mt-0.5 w-full bg-white rounded-3xl shadow-2xl p-8 z-50 flex gap-8 md:gap-12 animate-fade-in" 
                          id="mega-dropdown"
                          onMouseEnter={() => setHoveredCategory(cat.value)}
                          onMouseLeave={() => setHoveredCategory(null)}
                        >
                          
                          {/* Left Column: Subcategories list - spaced and aired out */}
                          <div className="w-[260px] shrink-0 border-r border-slate-100/90 pr-8 space-y-6">
                            <div>
                              <h4 className="text-[11px] font-black text-slate-400 tracking-wider uppercase mb-3">
                                Sous-Catégories
                              </h4>
                              <div className="space-y-2 text-left">
                                {cat.subcategories.map((sub) => (
                                  <button
                                    key={sub.name}
                                    onMouseEnter={() => setHoveredSubcategory(sub.name)}
                                    onClick={() => {
                                      setSelectedCategory(cat.value);
                                      setSearchQuery('');
                                      setHoveredCategory(null);
                                      navigate('/');
                                    }}
                                    className={`w-full text-left px-4 py-3 rounded-2xl text-xs sm:text-sm font-extrabold transition-all duration-250 flex items-center justify-between border ${
                                      hoveredSubcategory === sub.name
                                        ? 'bg-emerald-50/40 text-[#02603c] border-emerald-100 shadow-xs'
                                        : 'text-slate-600 border-transparent hover:bg-slate-50 hover:text-slate-900'
                                    }`}
                                  >
                                    <span>{sub.name}</span>
                                    <ArrowRight className={`w-3.5 h-3.5 transition-transform duration-300 ${hoveredSubcategory === sub.name ? 'translate-x-1 text-[#02603c]' : 'text-slate-350'}`} />
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>

                          {/* Right Column: Display Vignettes of active subcategory products - extremely airy */}
                          <div className="flex-1 min-w-0 flex flex-col justify-between">
                            <div>
                              <h4 className="text-[11px] font-black text-slate-400 tracking-wider uppercase mb-4 text-left">
                                Aperçu de la sélection : {hoveredSubcategory || 'Tout afficher'}
                              </h4>

                              {getSubcategoryProducts().length === 0 ? (
                                <div className="h-48 flex flex-col items-center justify-center text-center p-6 text-slate-300 bg-slate-50/40 rounded-2xl border border-dashed border-slate-100">
                                  <ShoppingBag className="w-10 h-10 opacity-30 mb-2" />
                                  <span className="text-xs">Aucun aperçu disponible</span>
                                </div>
                              ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                  {getSubcategoryProducts().map((prod) => (
                                    <Link
                                      key={prod.id}
                                      to={`/product/${prod.id}`}
                                      onClick={() => setHoveredCategory(null)}
                                      className="group/vignette flex items-center gap-4 p-3.5 rounded-2xl border border-slate-100/70 hover:border-emerald-200 hover:bg-emerald-50/10 hover:shadow-xs transition-all text-left bg-slate-50/30"
                                    >
                                      {/* Product Image */}
                                      <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-100 shrink-0 border border-slate-100 shadow-xs">
                                        <img
                                          src={prod.image}
                                          alt={prod.title}
                                          className="w-full h-full object-cover transition-transform duration-500 group-hover/vignette:scale-108"
                                          referrerPolicy="no-referrer"
                                        />
                                      </div>
                                      {/* Product text metadata */}
                                      <div className="min-w-0 flex-1 space-y-1">
                                        <h5 className="text-xs sm:text-sm font-extrabold text-slate-800 truncate group-hover/vignette:text-[#02603c] transition-colors">
                                          {prod.title}
                                        </h5>
                                        <p className="text-[10px] text-slate-400 truncate">{prod.seller}</p>
                                        <p className="text-xs font-black text-emerald-800 font-mono">
                                          {prod.price.toLocaleString('fr-FR')} FCFA
                                        </p>
                                      </div>
                                    </Link>
                                  ))}
                                </div>
                              )}
                            </div>

                            {/* bottom dynamic banner inside menu */}
                            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                              <span className="text-[11px] text-slate-400">
                                Vous hésitez ? Vous pouvez contacter l'artisan en un clic pour personnaliser votre pièce.
                              </span>
                              <Link
                                to="/"
                                onClick={() => {
                                  setSelectedCategory(cat.value);
                                  setHoveredCategory(null);
                                }}
                                className="text-xs font-black text-[#02603c] hover:underline flex items-center gap-1.5 shrink-0 bg-emerald-50/65 px-4 py-2 rounded-xl transition-all hover:bg-emerald-100"
                              >
                                <span>Explorer tout le rayon {cat.label}</span>
                                <ArrowRight className="w-3.5 h-3.5" />
                              </Link>
                            </div>
                          </div>

                        </div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>

          </div>
        </div>
      </div>
      
    </header>
  );
}
