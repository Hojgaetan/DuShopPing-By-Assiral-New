import React, { useState, useEffect } from 'react';
import { BarChart3, Eye, MousePointerClick, TrendingUp } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getSellerStats } from '../../lib/services';

export default function SellerStats() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ vuesBoutique: 0, vuesProduits: 0, clics: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.boutiqueId) {
      getSellerStats(user.boutiqueId).then(data => {
        setStats(data);
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }, [user]);

  if (loading) return <div className="p-8 text-center text-slate-500">Chargement des statistiques...</div>;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-extrabold text-slate-900 font-display flex items-center gap-3">
          <BarChart3 className="text-[#02603c] w-8 h-8" />
          Aperçu des performances
        </h2>
        <p className="text-slate-500 mt-2">
          Suivez la visibilité de votre boutique et l'interaction des acheteurs.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center shrink-0">
            <StoreIcon className="w-7 h-7" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-500 mb-1">Vues de la Boutique</p>
            <p className="text-3xl font-black text-slate-900">{stats.vuesBoutique}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shrink-0">
            <Eye className="w-7 h-7" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-500 mb-1">Vues des Articles</p>
            <p className="text-3xl font-black text-slate-900">{stats.vuesProduits}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center shrink-0">
            <MousePointerClick className="w-7 h-7" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-500 mb-1">Clics de Contact</p>
            <p className="text-3xl font-black text-slate-900">{stats.clics}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-sm">
        <div className="flex items-center gap-2 mb-6">
          <TrendingUp className="w-5 h-5 text-emerald-600" />
          <h3 className="text-lg font-bold text-slate-800">Évolution de la visibilité</h3>
        </div>
        <div className="h-64 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 border border-dashed border-slate-200">
          <p className="text-sm">Graphique des visites (Simulation en cours)</p>
        </div>
      </div>
    </div>
  );
}

// Quick fallback for icon Store not imported from lucide-react in this exact snippet to avoid breaking if forgot:
function StoreIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7"/><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4"/><path d="M2 7h20"/><path d="M22 7v3a2 2 0 0 1-2 2v0a2.7 2.7 0 0 1-1.59-.53L18 11a2.7 2.7 0 0 1-1.59.53v0a2.7 2.7 0 0 1-1.59-.53L14 11a2.7 2.7 0 0 1-1.59.53v0a2.7 2.7 0 0 1-1.59-.53L10 11a2.7 2.7 0 0 1-1.59.53v0a2.7 2.7 0 0 1-1.59-.53L6 11a2.7 2.7 0 0 1-1.59.53v0A2 2 0 0 1 2 10V7"/>
    </svg>
  );
}
