/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, FormEvent } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Banner728x90 from './components/Banner728x90';
import ContactModal from './components/ContactModal';
import ChatModal from './components/ChatModal';
import FavoritesDrawer from './components/FavoritesDrawer';
import AddProductModal from './components/AddProductModal';

// Pages placed in the requested /page directory
import Home from './page/Home';
import ProductDetails from './page/ProductDetails';
import CategoryPage from './page/CategoryPage';
import SellerPage from './page/SellerPage';
import Login from './page/Login';
import Register from './page/Register';

// Dashboard Routes
import DashboardLayout from './page/dashboard/DashboardLayout';
import StoreSettings from './page/dashboard/StoreSettings';
import PublishProduct from './page/dashboard/PublishProduct';
import BoostPlans from './page/dashboard/BoostPlans';
import SellerStats from './page/dashboard/SellerStats';
import MyProducts from './page/dashboard/MyProducts';

// Context
import { AuthProvider } from './context/AuthContext';

// Types and Data
import { Product } from './types';
import { ALL_PRODUCTS } from './data';
import { Check } from 'lucide-react';

export default function App() {
  // Common states shared between routes or accessed through navigation
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Tous');
  
  const [customProducts, setCustomProducts] = useState<Product[]>([]);
  const [favorites, setFavorites] = useState<Product[]>([]);
  
  const [showFavorites, setShowFavorites] = useState(false);
  const [showAddProduct, setShowAddProduct] = useState(false);
  
  const [contactProduct, setContactProduct] = useState<Product | null>(null);
  const [chatProduct, setChatProduct] = useState<Product | null>(null);

  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterSuccess, setNewsletterSuccess] = useState(false);


  // Add customized items from Sell wizard
  const handleAddProduct = (newProd: Product) => {
    setCustomProducts(prev => [newProd, ...prev]);
  };

  React.useEffect(() => {
    const loadLocalProducts = () => {
      const dbProduits = JSON.parse(localStorage.getItem('dushop_produits_db') || '[]');
      const boutiques = JSON.parse(localStorage.getItem('dushop_boutiques_db') || '[]');
      
      const mapped: Product[] = dbProduits.map((p: any) => {
        const boutique = boutiques.find((b: any) => b.id === p.boutique_id);
        const sellerName = boutique ? boutique.nom : 'Boutique Indépendante';
        
        return {
          id: p.id,
          title: p.titre,
          category: p.categorie_id === 'c1111111-1111-1111-1111-111111111111' ? 'Artisanat' :
                    p.categorie_id === 'c2222222-2222-2222-2222-222222222222' ? 'Mode' :
                    p.categorie_id === 'c3333333-3333-3333-3333-333333333333' ? 'Saveurs' : 'Cosmétiques',
          price: p.prix,
          image: p.image_url || 'https://via.placeholder.com/300?text=Produit',
          seller: sellerName,
          hasBadge: false,
          isSponsorised: false,
          description: p.description
        };
      });
      setCustomProducts(mapped);
    };

    loadLocalProducts();
    window.addEventListener('product_published', loadLocalProducts);
    return () => window.removeEventListener('product_published', loadLocalProducts);
  }, []);

  // Toggle favorite actions
  const handleToggleFavorite = (prodId: string) => {
    const allItems = [...customProducts, ...ALL_PRODUCTS];
    const found = allItems.find(p => p.id === prodId);
    if (!found) return;

    setFavorites(prev => {
      const isAlreadyFav = prev.some(item => item.id === prodId);
      if (isAlreadyFav) {
        return prev.filter(item => item.id !== prodId);
      } else {
        return [...prev, found];
      }
    });
  };

  // Handle newsletter sign-up safely
  const handleNewsletterSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail.trim()) return;
    setNewsletterSuccess(true);
    setTimeout(() => {
      setNewsletterEmail('');
      setNewsletterSuccess(false);
    }, 4000);
  };

  const triggerCallSimulation = (product: Product) => {
    setContactProduct(product);
    import('./lib/services').then(m => m.incrementProductClics(product.id));
  };

  const triggerChatSimulation = (product: Product) => {
    setChatProduct(product);
    import('./lib/services').then(m => m.incrementProductClics(product.id));
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
            onAddProductClick={() => setShowAddProduct(true)}
          />
        </div>

        {/* 3. Central Router Outlets */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full">
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
                  triggerCallSimulation={triggerCallSimulation}
                  triggerChatSimulation={triggerChatSimulation}
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
                  triggerCallSimulation={triggerCallSimulation}
                  triggerChatSimulation={triggerChatSimulation}
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
                  triggerCallSimulation={triggerCallSimulation}
                  triggerChatSimulation={triggerChatSimulation}
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
                  triggerCallSimulation={triggerCallSimulation}
                  triggerChatSimulation={triggerChatSimulation}
                />
              }
            />

            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            <Route path="/dashboard" element={<DashboardLayout />}>
              <Route index element={<StoreSettings />} />
              <Route path="store" element={<StoreSettings />} />
              <Route path="products" element={<MyProducts />} />
              <Route path="publish" element={<PublishProduct />} />
              <Route path="boost" element={<BoostPlans />} />
              <Route path="stats" element={<SellerStats />} />
            </Route>
          </Routes>
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
                  <li>
                    <button onClick={() => setShowAddProduct(true)} className="hover:text-emerald-450 transition-colors cursor-pointer text-left">
                      Vendre des créations
                    </button>
                  </li>
                  <li>
                    <a href="/#promotions" onClick={(e) => { e.preventDefault(); alert("Page Promotions en cours de construction"); }} className="hover:text-emerald-450 transition-colors">Promotions & Codes</a>
                  </li>
                  <li>
                    <a href="/#faq" onClick={(e) => { e.preventDefault(); alert("Page FAQ en cours de construction"); }} className="hover:text-emerald-450 transition-colors">Foire aux questions (FAQ)</a>
                  </li>
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
                    <a href="/#tips" onClick={(e) => { e.preventDefault(); alert("Conseils aux acheteurs en cours de rédaction"); }} className="hover:text-emerald-450 transition-colors font-sans">Conseils aux acheteurs</a>
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
                  <form onSubmit={handleNewsletterSubmit} className="flex gap-2">
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
                      className="bg-[#02603c] hover:bg-emerald-750 text-white font-bold px-3.5 py-2.5 rounded-xl text-xs sm:text-sm transition-colors cursor-pointer"
                    >
                      Rejoindre
                    </button>
                  </form>
                )}
              </div>

            </div>

            {/* Social icons & copyright */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
              <p className="text-center sm:text-left">
                © 2024 Kazi & Mali. Le panafricanisme moderne dans le commerce.
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
        
        {/* Contact info overlay */}
        <ContactModal
          product={contactProduct}
          onClose={() => setContactProduct(null)}
          onOpenChat={(prod) => {
            setContactProduct(null);
            setChatProduct(prod);
          }}
        />

        {/* Chat messages overlay drawer */}
        <ChatModal
          product={chatProduct}
          onClose={() => setChatProduct(null)}
        />

        {/* Favorites slide-over page */}
        <FavoritesDrawer
          isOpen={showFavorites}
          onClose={() => setShowFavorites(false)}
          favorites={favorites}
          onRemove={(id) => setFavorites(prev => prev.filter(f => f.id !== id))}
          onCallSeller={triggerCallSimulation}
          onChatSeller={triggerChatSimulation}
        />

        {/* Selling form wizard overlay */}
        <AddProductModal
          isOpen={showAddProduct}
          onClose={() => setShowAddProduct(false)}
          onAddProduct={handleAddProduct}
        />

      </div>
    </Router>
    </AuthProvider>
  );
}
