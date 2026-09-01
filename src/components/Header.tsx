/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Search, Bell, Heart, ChevronDown, ShoppingBag, ArrowRight, Store, ShieldCheck, Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../context/AuthContext';
import { fetchUserBoutique, fetchMegaMenuData, fetchMyNotifications, markNotificationRead, NotificationRecord } from '../lib/services';
import brandLogo from '../assets/images/logo-Dushopping.jpeg';

interface HeaderProps {
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  selectedCategory: string;
  setSelectedCategory: (cat: string) => void;
  favoritesCount: number;
  openFavorites: () => void;
}

interface ProductVignette {
  id: string;
  titre: string;
  prix: number;
  images: string[];
  nom_boutique: string;
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
  openFavorites
}: HeaderProps) {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [boutiqueLogo, setBoutiqueLogo] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<NotificationRecord[]>([]);
  const [notificationsLoading, setNotificationsLoading] = useState(false);

  const loadNotifications = useCallback(async () => {
    if (!user) { setNotifications([]); return; }
    setNotificationsLoading(true);
    try { setNotifications(await fetchMyNotifications()); } catch { setNotifications([]); }
    finally { setNotificationsLoading(false); }
  }, [user]);

  useEffect(() => {
    void loadNotifications();
    if (!user) return;
    const timer = window.setInterval(() => void loadNotifications(), 60000);
    return () => window.clearInterval(timer);
  }, [user, loadNotifications]);

  const openNotification = async (notification: NotificationRecord) => {
    if (!notification.est_lue) {
      await markNotificationRead(notification.id).catch(() => undefined);
      setNotifications(current => current.map(item => item.id === notification.id ? { ...item, est_lue: true } : item));
    }
    setShowNotifications(false);
    if (notification.lien) navigate(notification.lien);
  };

  const markAllNotifications = async () => {
    await markNotificationRead().catch(() => undefined);
    setNotifications(current => current.map(item => ({ ...item, est_lue: true })));
  };

  useEffect(() => {
    const loadBoutique = () => {
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
    };

    loadBoutique();

    window.addEventListener('boutique-updated', loadBoutique);
    return () => window.removeEventListener('boutique-updated', loadBoutique);
  }, [user]);
  
  // Mega menu states
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);
  const [hoveredSubcategory, setHoveredSubcategory] = useState<string | null>(null);

  // Mobile states
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showMobileSearch, setShowMobileSearch] = useState(false);

  // Hardcoded real images referencing the exact public asset paths to avoid broken assets page
  const IMAGES = {
    basket: '/src/assets/images/pannier_tisse_1781282354068.jpg',
    hoodie: '/src/assets/images/tunique_indigo_1781282369664.jpg',
    vases: '/src/assets/images/statuettes_vases_1781282386709.jpg',
    cosmetics: '/src/assets/images/mielles_cosmetiques_1781282401828.jpg',
    spices: '/src/assets/images/epices_1781282418024.jpg',
    silk: '/src/assets/images/echarpe_soie_1781282435673.jpg',
  };

  const [megaCategories, setMegaCategories] = useState<MegaCategory[]>([]);

  const loadMegaMenu = useCallback(() => {
    void fetchMegaMenuData().then(({ categories, produits }) => {
      const formatted: MegaCategory[] = categories.map((cat: any) => ({
        label: cat.nom,
        value: cat.nom,
        subcategories: (cat.sous_categories || []).map((subName: string) => {
          // Find up to 2 products matching this subcategory
          const matchingProds = produits.filter((p: any) => p.sous_categorie === subName).slice(0, 2);
          return {
            name: subName,
            products: matchingProds.map((p: any) => ({
              id: p.id,
              titre: p.titre,
              prix: p.prix,
              images: p.images || [],
              nom_boutique: p.boutiques?.nom || 'Vendeur inconnu'
            }))
          };
        })
      }));
      setMegaCategories(formatted);
    });
  }, []);

  useEffect(() => {
    loadMegaMenu();
    window.addEventListener('product_published', loadMegaMenu);
    return () => window.removeEventListener('product_published', loadMegaMenu);
  }, [loadMegaMenu]);

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
              className="cursor-pointer select-none"
              id="brand-logo"
            >
              <img 
                src={brandLogo} 
                alt="DuShopPing Logo" 
                className="h-12 sm:h-14 w-auto object-contain" 
              />
            </motion.div>
          </div>

          {/* Centered Search Bar (Desktop) */}
          <div className="flex-1 max-w-xl mx-2 sm:mx-6 md:mx-12 hidden md:block">
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
          <div className="flex items-center gap-3 sm:gap-4 shrink-0 font-sans" id="auth-visitor-links">
            
            {/* Mobile Search Toggle */}
            <button 
              className="md:hidden p-2 text-slate-600 hover:text-brand"
              onClick={() => setShowMobileSearch(!showMobileSearch)}
            >
              <Search className="w-5 h-5" />
            </button>

            {user ? (
              <div className="flex items-center gap-2 sm:gap-4">
                <span className="hidden lg:block text-sm font-bold text-slate-700">
                  {user.role === 'Admin' ? 'Administrateur' : user.role === 'Vendeur' ? 'Compte Vendeur' : 'Acheteur'}
                </span>

                <button onClick={openFavorites} className="relative p-2 rounded-full text-slate-600 hover:bg-rose-50 hover:text-rose-600" aria-label="Mes favoris">
                  <Heart className="w-5 h-5" />
                  {favoritesCount > 0 && <span className="absolute -top-0.5 -right-0.5 min-w-4 h-4 px-1 rounded-full bg-rose-500 text-white text-[9px] font-black flex items-center justify-center">{Math.min(favoritesCount, 99)}</span>}
                </button>

                <div className="relative">
                  <button onClick={() => { setShowNotifications(value => !value); setShowProfileMenu(false); void loadNotifications(); }} className="relative p-2 rounded-full text-slate-600 hover:bg-slate-100 hover:text-indigo-600" aria-label="Notifications">
                    <Bell className="w-5 h-5" />
                    {notifications.some(item => !item.est_lue) && <span className="absolute -top-0.5 -right-0.5 min-w-4 h-4 px-1 rounded-full bg-rose-500 text-white text-[9px] font-black flex items-center justify-center">{Math.min(notifications.filter(item => !item.est_lue).length, 99)}</span>}
                  </button>
                  <AnimatePresence>
                    {showNotifications && <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="absolute right-0 mt-2 w-[min(22rem,calc(100vw-2rem))] bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden z-[70]">
                      <div className="p-4 border-b border-slate-100 flex items-center justify-between"><div><p className="font-extrabold text-slate-900">Notifications</p><p className="text-[11px] text-slate-400">{notifications.filter(item => !item.est_lue).length} non lue(s)</p></div>{notifications.some(item => !item.est_lue) && <button onClick={() => void markAllNotifications()} className="text-xs font-bold text-indigo-600">Tout marquer comme lu</button>}</div>
                      <div className="max-h-96 overflow-y-auto">{notificationsLoading && notifications.length === 0 ? <div className="p-8 text-center text-sm text-slate-400">Chargement…</div> : notifications.length === 0 ? <div className="p-8 text-center text-sm text-slate-400">Aucune notification.</div> : notifications.map(notification => <button key={notification.id} onClick={() => void openNotification(notification)} className={`w-full text-left p-4 border-b border-slate-50 hover:bg-slate-50 flex gap-3 ${notification.est_lue ? 'bg-white' : 'bg-indigo-50/50'}`}>
                        <span className={`mt-1 w-2 h-2 rounded-full shrink-0 ${notification.est_lue ? 'bg-slate-200' : 'bg-indigo-600'}`} /><span className="min-w-0"><span className="block text-sm font-bold text-slate-800">{notification.titre}</span><span className="block text-xs text-slate-500 mt-1 leading-relaxed">{notification.message}</span><span className="block text-[10px] text-slate-400 mt-2">{new Date(notification.date_creation).toLocaleString('fr-FR')}</span></span>
                      </button>)}</div>
                    </motion.div>}
                  </AnimatePresence>
                </div>

                <div className="relative">
                  <button
                    onClick={() => setShowProfileMenu(!showProfileMenu)}
                    className="flex items-center gap-2 hover:bg-slate-50 p-1.5 rounded-full transition-colors cursor-pointer"
                  >
                    <div className={`w-9 h-9 rounded-full ${user.role === 'Admin' ? 'bg-indigo-600' : 'bg-brand'} text-white flex items-center justify-center font-bold text-sm overflow-hidden border-2 border-transparent hover:border-emerald-200 transition-colors`}>
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
                            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-slate-700 font-extrabold hover:bg-emerald-50 hover:text-brand transition-colors"
                          >
                            <Store className="w-4 h-4" />
                            Ma Boutique
                          </button>
                        )}
                        {user.role === 'Admin' && (
                          <button
                            onClick={() => {
                              setShowProfileMenu(false);
                              navigate('/admin');
                            }}
                            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-slate-700 font-extrabold hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
                          >
                            <ShieldCheck className="w-4 h-4" />
                            CMS Admin
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
                  className="text-xs sm:text-sm font-bold text-slate-600 hover:text-brand transition-colors cursor-pointer hidden sm:block"
                >
                  Connexion
                </button>
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={() => navigate('/register')}
                  className="bg-accent-yellow text-slate-900 hover:bg-accent-yellow-hover px-3 py-2 sm:px-4.5 sm:py-2.5 rounded-2xl text-xs sm:text-sm font-extrabold transition-all shadow-xs cursor-pointer"
                >
                  S'inscrire
                </motion.button>
              </>
            )}

            {/* Mobile Menu Toggle */}
            <button 
              className="md:hidden p-2 -mr-2 text-slate-600 hover:text-brand"
              onClick={() => setShowMobileMenu(!showMobileMenu)}
            >
              {showMobileMenu ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Search Bar Dropdown */}
        <AnimatePresence>
          {showMobileSearch && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="md:hidden overflow-hidden border-t border-slate-100 bg-slate-50"
            >
              <div className="p-4">
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
                    placeholder="Rechercher..."
                    className="w-full text-sm pl-9 pr-14 py-3 bg-white border border-slate-200 focus:bg-white focus:ring-2 focus:ring-brand focus:border-brand rounded-xl placeholder:text-slate-400 transition-all text-slate-800"
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
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* LEVEL 2: Mega Menu & Category Navigation level (Desktop) */}
      <div className="bg-[#fcfdff] border-b border-slate-100/90 relative hidden md:block" id="bottom-header-row">
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
                          ? 'border-brand text-brand'
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
                                        ? 'bg-emerald-50/40 text-brand border-emerald-100 shadow-xs'
                                        : 'text-slate-600 border-transparent hover:bg-slate-50 hover:text-slate-900'
                                    }`}
                                  >
                                    <span>{sub.name}</span>
                                    <ArrowRight className={`w-3.5 h-3.5 transition-transform duration-300 ${hoveredSubcategory === sub.name ? 'translate-x-1 text-brand' : 'text-slate-350'}`} />
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
                                          src={prod.images[0]}
                                          alt={prod.titre}
                                          className="w-full h-full object-cover transition-transform duration-500 group-hover/vignette:scale-108"
                                          referrerPolicy="no-referrer"
                                        />
                                      </div>
                                      {/* Product text metadata */}
                                      <div className="min-w-0 flex-1 space-y-1">
                                        <h5 className="text-xs sm:text-sm font-extrabold text-slate-800 truncate group-hover/vignette:text-brand transition-colors">
                                          {prod.titre}
                                        </h5>
                                        <p className="text-[10px] text-slate-400 truncate">{prod.nom_boutique}</p>
                                        <p className="text-xs font-black text-emerald-800 font-mono">
                                          {prod.prix.toLocaleString('fr-FR')} FCFA
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
                                className="text-xs font-black text-brand hover:underline flex items-center gap-1.5 shrink-0 bg-emerald-50/65 px-4 py-2 rounded-xl transition-all hover:bg-emerald-100"
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
      {/* Mobile Hamburger Menu (Categories & Links) */}
      <AnimatePresence>
        {showMobileMenu && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="md:hidden overflow-y-auto max-h-[80vh] border-b border-slate-100 bg-white"
          >
            <div className="p-4 space-y-4">
              {/* Category list */}
              <div>
                <h3 className="text-xs font-black text-slate-400 tracking-wider uppercase mb-3">Catégories</h3>
                <div className="space-y-1">
                  <button
                    onClick={() => {
                      setSelectedCategory('Tous');
                      setSearchQuery('');
                      setShowMobileMenu(false);
                      navigate('/');
                    }}
                    className={`w-full text-left px-4 py-3 rounded-xl text-sm font-extrabold transition-all flex items-center justify-between ${
                      selectedCategory === 'Tous'
                        ? 'bg-emerald-50 text-brand'
                        : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    Toutes les catégories
                  </button>
                  {megaCategories.map((cat) => (
                    <button
                      key={cat.value}
                      onClick={() => {
                        setSelectedCategory(cat.value);
                        setSearchQuery('');
                        setShowMobileMenu(false);
                        navigate('/');
                      }}
                      className={`w-full text-left px-4 py-3 rounded-xl text-sm font-extrabold transition-all flex items-center justify-between ${
                        selectedCategory === cat.value
                          ? 'bg-emerald-50 text-brand'
                          : 'text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>
              
              <hr className="border-slate-100" />
              
              {/* Mobile Auth/Profile Actions */}
              {!user && (
                <div className="flex flex-col gap-2 pt-2 pb-4">
                  <button
                    onClick={() => {
                      setShowMobileMenu(false);
                      navigate('/login');
                    }}
                    className="w-full bg-slate-50 text-slate-700 py-3 rounded-xl text-sm font-bold border border-slate-200"
                  >
                    Connexion
                  </button>
                  <button
                    onClick={() => {
                      setShowMobileMenu(false);
                      navigate('/register');
                    }}
                    className="w-full bg-accent-yellow text-slate-900 py-3 rounded-xl text-sm font-extrabold"
                  >
                    S'inscrire
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
