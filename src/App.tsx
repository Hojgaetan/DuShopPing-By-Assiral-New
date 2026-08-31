/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { Suspense, useState, FormEvent } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Banner728x90 from './components/Banner728x90';
import FavoritesDrawer from './components/FavoritesDrawer';

// Pages placed in the requested /page directory
import Home from './page/Home';

const ProductDetails = React.lazy(() => import('./page/ProductDetails'));
const CategoryPage = React.lazy(() => import('./page/CategoryPage'));
const SellerPage = React.lazy(() => import('./page/SellerPage'));
const Login = React.lazy(() => import('./page/Login'));
const Register = React.lazy(() => import('./page/Register'));
const ForgotPassword = React.lazy(() => import('./page/ForgotPassword'));
const ResetPassword = React.lazy(() => import('./page/ResetPassword'));
const DashboardLayout = React.lazy(() => import('./page/dashboard/DashboardLayout'));
const StoreSettings = React.lazy(() => import('./page/dashboard/StoreSettings'));
const PublishProduct = React.lazy(() => import('./page/dashboard/PublishProduct'));
const BoostPlans = React.lazy(() => import('./page/dashboard/BoostPlans'));
const SellerStats = React.lazy(() => import('./page/dashboard/SellerStats'));
const MyProducts = React.lazy(() => import('./page/dashboard/MyProducts'));
const EditProduct = React.lazy(() => import('./page/dashboard/EditProduct'));
const SellerProfile = React.lazy(() => import('./page/dashboard/SellerProfile'));
const AdminLayout = React.lazy(() => import('./page/admin/AdminLayout'));
const AdminOverview = React.lazy(() => import('./page/admin/Overview'));
const AdminCategories = React.lazy(() => import('./page/admin/Categories'));
const AdminVendors = React.lazy(() => import('./page/admin/Vendors'));
const AdminVerifications = React.lazy(() => import('./page/admin/Verifications'));
const AdminTeam = React.lazy(() => import('./page/admin/AdminTeam'));
const AdminAudit = React.lazy(() => import('./page/admin/AuditLog'));
const AdminProducts = React.lazy(() => import('./page/admin/Products'));
const AdminSponsoringPlans = React.lazy(() => import('./page/admin/SponsoringPlans'));
const AdminAds = React.lazy(() => import('./page/admin/AdsManagement'));
const AdminPayments = React.lazy(() => import('./page/admin/Payments'));
const AdminQuotas = React.lazy(() => import('./page/admin/Quotas'));

// Context
import { AuthProvider } from './context/AuthContext';

// Types and Data
import { ProduitUI } from './types';
import { Check } from 'lucide-react';
import { fetchMyFavoriteProductIds, fetchPublicProducts, incrementProductClics, subscribeNewsletter, toggleMyFavorite } from './lib/services';
import { supabase } from './lib/supabase';
import { isDatabaseUuid } from './lib/mappers';

export default function App() {
  // Common states shared between routes or accessed through navigation
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Tous');
  
  const [customProducts, setCustomProducts] = useState<ProduitUI[]>([]);
  const [favorites, setFavorites] = useState<ProduitUI[]>([]);
  const [catalogError, setCatalogError] = useState('');
  
  const [showFavorites, setShowFavorites] = useState(false);

  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterSuccess, setNewsletterSuccess] = useState(false);
  const [newsletterLoading, setNewsletterLoading] = useState(false);
  const [newsletterError, setNewsletterError] = useState('');


  React.useEffect(() => {
    let isMounted = true;

    const loadProducts = async () => {
      try {
        const products = await fetchPublicProducts();
        if (!isMounted) return;
        setCustomProducts(products);
        setCatalogError('');
        const favoriteIds = await fetchMyFavoriteProductIds().catch(() => []);
        if (isMounted) setFavorites(products.filter(product => favoriteIds.includes(product.id)));
      } catch {
        if (isMounted) setCatalogError('Le catalogue est momentanément indisponible. Vérifiez votre connexion puis réessayez.');
      }
    };

    void loadProducts();
    window.addEventListener('product_published', loadProducts);
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      void loadProducts();
    });
    return () => {
      isMounted = false;
      window.removeEventListener('product_published', loadProducts);
      subscription.unsubscribe();
    };
  }, []);

  // Toggle favorite actions
  const handleToggleFavorite = (prodId: string) => {
    const found = customProducts.find(p => p.id === prodId);
    if (!found) return;

    setFavorites(prev => {
      const isAlreadyFav = prev.some(item => item.id === prodId);
      if (isAlreadyFav) {
        return prev.filter(item => item.id !== prodId);
      } else {
        return [...prev, found];
      }
    });

    if (isDatabaseUuid(prodId)) {
      void toggleMyFavorite(prodId).catch(error => {
        console.warn('Favori non persisté:', error.message);
      });
    }
  };

  // Handle newsletter sign-up safely
  const handleNewsletterSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail.trim()) return;
    setNewsletterLoading(true); setNewsletterError('');
    try {
      await subscribeNewsletter(newsletterEmail);
      setNewsletterSuccess(true);
      setNewsletterEmail('');
    } catch {
      setNewsletterError("L’inscription n’a pas pu être enregistrée. Réessayez.");
    } finally {
      setNewsletterLoading(false);
    }
  };

  const contactSellerForCall = (product: ProduitUI) => {
    const number = (product.whatsapp_contact || product.telephone_contact || '').replace(/\D/g, '');
    if (!number) return;
    void incrementProductClics(product.id, 'AppelDirect');
    window.open(`https://wa.me/${number}?text=${encodeURIComponent(`Bonjour, je souhaite échanger par appel au sujet de votre article « ${product.titre} » sur DuShopPing.`)}`, '_blank', 'noopener,noreferrer');
  };

  const contactSellerOnWhatsApp = (product: ProduitUI) => {
    const number = (product.whatsapp_contact || product.telephone_contact || '').replace(/\D/g, '');
    if (!number) return;
    void incrementProductClics(product.id, 'ClicWhatsApp');
    window.open(`https://wa.me/${number}?text=${encodeURIComponent(`Bonjour, je suis intéressé(e) par votre article « ${product.titre} » sur DuShopPing. Est-il toujours disponible ?`)}`, '_blank', 'noopener,noreferrer');
  };

  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-slate-50 flex flex-col font-sans relative antialiased group" id="dushop-app-root">
        
        {/* Sticky Header Group: contains Top Billboard publicity banner and Primary Main Navigation Header */}
        <div className="sticky top-0 z-40 w-full flex flex-col">
          {/* 1. Header Horizontal Billboard publicity */}
          <Banner728x90 />

          {/* 2. Primary Navigation with Search and controls */}
          <Header
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
            favoritesCount={favorites.length}
            openFavorites={() => setShowFavorites(true)}
          />
        </div>

        {/* 3. Central Router Outlets */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full">
          {catalogError && <div role="alert" className="mb-6 bg-rose-50 text-rose-700 border border-rose-100 rounded-2xl p-4 flex items-center justify-between gap-4"><span className="text-sm font-bold">{catalogError}</span><button onClick={() => window.location.reload()} className="shrink-0 bg-white px-3 py-2 rounded-xl text-xs font-bold">Réessayer</button></div>}
          <Suspense fallback={
            <div className="min-h-[50vh] flex items-center justify-center">
              <div className="w-10 h-10 rounded-full border-4 border-slate-200 border-t-brand animate-spin" aria-label="Chargement de la page" />
            </div>
          }>
          <Routes>
            <Route
              path="/"
              element={
                <Home
                  searchQuery={searchQuery}
                  setSearchQuery={setSearchQuery}
                  selectedCategory={selectedCategory}
                  setSelectedCategory={setSelectedCategory}
                  customProducts={customProducts}
                  favorites={favorites}
                  handleToggleFavorite={handleToggleFavorite}
                  onCallSeller={contactSellerForCall}
                  onChatSeller={contactSellerOnWhatsApp}
                />
              }
            />

            <Route
              path="/product/:id"
              element={
                <ProductDetails
                  customProducts={customProducts}
                  favorites={favorites}
                  handleToggleFavorite={handleToggleFavorite}
                  onCallSeller={contactSellerForCall}
                  onChatSeller={contactSellerOnWhatsApp}
                />
              }
            />

            <Route
              path="/category/:categoryName"
              element={
                <CategoryPage
                  customProducts={customProducts}
                  favorites={favorites}
                  handleToggleFavorite={handleToggleFavorite}
                  onCallSeller={contactSellerForCall}
                  onChatSeller={contactSellerOnWhatsApp}
                />
              }
            />

            <Route
              path="/seller/:sellerName"
              element={
                <SellerPage
                  customProducts={customProducts}
                  favorites={favorites}
                  handleToggleFavorite={handleToggleFavorite}
                  onCallSeller={contactSellerForCall}
                  onChatSeller={contactSellerOnWhatsApp}
                />
              }
            />

            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />

            <Route path="/dashboard" element={<DashboardLayout />}>
              <Route index element={<StoreSettings />} />
              <Route path="store" element={<StoreSettings />} />
              <Route path="products" element={<MyProducts />} />
              <Route path="products/:id/edit" element={<EditProduct />} />
              <Route path="publish" element={<PublishProduct />} />
              <Route path="boost" element={<BoostPlans />} />
              <Route path="stats" element={<SellerStats />} />
              <Route path="profile" element={<SellerProfile />} />
            </Route>

            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<AdminOverview />} />
              <Route path="categories" element={<AdminCategories />} />
              <Route path="vendors" element={<AdminVendors />} />
              <Route path="verifications" element={<AdminVerifications />} />
              <Route path="team" element={<AdminTeam />} />
              <Route path="audit" element={<AdminAudit />} />
              <Route path="products" element={<AdminProducts />} />
              <Route path="sponsoring" element={<AdminSponsoringPlans />} />
              <Route path="ads" element={<AdminAds />} />
              <Route path="payments" element={<AdminPayments />} />
              <Route path="quotas" element={<AdminQuotas />} />
            </Route>
          </Routes>
          </Suspense>
        </main>

        {/* 4. Footer Section */}
        <footer className="bg-brand-dark text-slate-350 border-t border-slate-905 mt-20" id="main-footer">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12 border-b border-slate-800 pb-12">
              
              {/* Mission Statement */}
              <div className="space-y-4">
                <span className="text-2xl font-bold font-display text-white block">
                  DuShopPing
                </span>
                <p className="text-xs sm:text-sm text-slate-400 leading-relaxed font-sans">
                  Célébrer l'excellence de l'artisanat africain en connectant les créateurs du continent au marché mondial. Le panafricanisme moderne à travers le commerce équitable.
                </p>
              </div>

              {/* Marketplace Directory */}
              <div>
                <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-4 font-display">
                  Marketplace
                </h4>
                <ul className="space-y-2.5 text-xs sm:text-sm text-slate-400">
                  <li>
                    <a href="/" className="hover:text-emerald-450 transition-colors">La place du marché</a>
                  </li>
                  <li><a href="/dashboard/publish" className="hover:text-emerald-450 transition-colors">Vendre des créations</a></li>
                </ul>
              </div>

              {/* Legal / Protection */}
              <div>
                <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-4 font-display">
                  Légal
                </h4>
                <ul className="space-y-2.5 text-xs sm:text-sm text-slate-400">
                  <li>
                    <a href="/#terms" onClick={(e) => { e.preventDefault(); alert("Conditions d'utilisation en cours de rédaction"); }} className="hover:text-emerald-450 transition-colors font-sans">Conditions d'utilisation</a>
                  </li>
                  <li>
                    <a href="/#privacy" onClick={(e) => { e.preventDefault(); alert("Politique de confidentialité en cours de rédaction"); }} className="hover:text-emerald-450 transition-colors font-sans">Politique de confidentialité</a>
                  </li>
                  <li>
                    <a href="mailto:support@dushop.com" className="hover:text-emerald-450 transition-colors font-sans">Support Client</a>
                  </li>
                </ul>
              </div>

              {/* Newsletter Subscribe */}
              <div className="space-y-4">
                <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-1 font-display">
                  Newsletter
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Rejoignez notre communauté engagée pour découvrir en premier les nouveautés et offres exclusives.
                </p>

                {newsletterSuccess ? (
                  <div className="bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 p-3 rounded-xl text-xs flex items-center gap-1.5 font-semibold">
                    <Check className="w-4 h-4 text-emerald-450 shrink-0" />
                    <span>Merci ! Votre inscription est prise en compte.</span>
                  </div>
                ) : (
                  <form onSubmit={handleNewsletterSubmit} className="space-y-2">
                    <div className="flex gap-2">
                    <input
                      type="email"
                      required
                      value={newsletterEmail}
                      onChange={(e) => setNewsletterEmail(e.target.value)}
                      placeholder="Votre email"
                      className="flex-1 bg-slate-900 border border-slate-750 p-2.5 rounded-xl text-xs sm:text-sm focus:outline-hidden focus:ring-1 focus:ring-brand text-slate-200 placeholder:text-slate-500"
                    />
                    <button
                      type="submit"
                      disabled={newsletterLoading}
                      className="bg-accent-yellow hover:bg-accent-yellow-hover text-slate-900 font-bold px-3.5 py-2.5 rounded-xl text-xs sm:text-sm transition-colors cursor-pointer disabled:opacity-50"
                    >
                      {newsletterLoading ? 'Envoi…' : 'Rejoindre'}
                    </button>
                    </div>
                    {newsletterError && <p className="text-xs text-rose-400">{newsletterError}</p>}
                  </form>
                )}
              </div>

            </div>

            {/* Social icons & copyright */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
              <p className="text-center sm:text-left">
                © 2026 DuShopPing. Tous droits reservés.
              </p>
              <div className="flex items-center gap-5 text-slate-400">
                <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="hover:text-[#1877F2] transition-colors" title="Suivez-nous sur Facebook" aria-label="Facebook">
                  <ion-icon name="logo-facebook" style={{ fontSize: '22px' }}></ion-icon>
                </a>
                <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="hover:text-[#E4405F] transition-colors" title="Suivez-nous sur Instagram" aria-label="Instagram">
                  <ion-icon name="logo-instagram" style={{ fontSize: '22px' }}></ion-icon>
                </a>
              </div>
            </div>

          </div>
        </footer>

        {/* 5. Drawers & Popup Modals */}
        
        {/* Favorites slide-over page */}
        <FavoritesDrawer
          isOpen={showFavorites}
          onClose={() => setShowFavorites(false)}
          favorites={favorites}
          onRemove={(id) => setFavorites(prev => prev.filter(f => f.id !== id))}
          onCallSeller={contactSellerForCall}
          onChatSeller={contactSellerOnWhatsApp}
        />

      </div>
    </Router>
    </AuthProvider>
  );
}
