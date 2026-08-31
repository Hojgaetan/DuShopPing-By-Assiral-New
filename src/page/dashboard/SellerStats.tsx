import React, { useState, useEffect } from 'react';
import { AlertCircle, BarChart3, Eye, MousePointerClick, RefreshCw, TrendingUp } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getSellerStats } from '../../lib/services';

export default function SellerStats() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    vuesBoutique: 0,
    vuesProduits: 0,
    clics: 0,
    evolution: [] as Array<{ date: string; label: string; vues: number; clics: number }>,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadStats = () => {
    if (user?.boutiqueId) {
      setLoading(true);
      setError('');
      getSellerStats(user.boutiqueId).then(data => {
        setStats(data);
      }).catch(() => {
        setError('Impossible de charger les statistiques pour le moment.');
      }).finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, [user]);

  if (loading) return <div className="p-8 text-center text-slate-500">Chargement des statistiques...</div>;
  if (error) return <div className="bg-white rounded-3xl p-10 text-center border border-slate-100"><AlertCircle className="w-10 h-10 mx-auto text-rose-500 mb-3" /><p className="font-bold text-slate-800">{error}</p><button onClick={loadStats} className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 text-white text-sm font-bold"><RefreshCw className="w-4 h-4" />Réessayer</button></div>;

  const maxDailyValue = Math.max(1, ...stats.evolution.map(day => day.vues + day.clics));

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
            <p className="text-sm font-bold text-slate-500 mb-1">Vues des Produits</p>
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
        <div className="flex items-center gap-5 text-xs font-bold text-slate-500 mb-5">
          <span className="inline-flex items-center gap-2"><span className="w-3 h-3 rounded-sm bg-emerald-500" />Vues</span>
          <span className="inline-flex items-center gap-2"><span className="w-3 h-3 rounded-sm bg-amber-400" />Clics contact</span>
        </div>
        <div className="h-64 bg-slate-50 rounded-xl border border-slate-100 px-4 pt-5 pb-3">
          <div className="h-full flex items-end justify-between gap-2 sm:gap-4">
            {stats.evolution.map(day => (
              <div key={day.date} className="h-full flex-1 flex flex-col items-center justify-end gap-2 group">
                <div className="text-[11px] font-bold text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                  {day.vues} vue{day.vues > 1 ? 's' : ''}, {day.clics} clic{day.clics > 1 ? 's' : ''}
                </div>
                <div className="w-full max-w-12 h-44 flex items-end rounded-t-lg overflow-hidden bg-slate-100">
                  <div className="w-full flex flex-col justify-end" style={{ height: `${((day.vues + day.clics) / maxDailyValue) * 100}%` }}>
                    {day.vues > 0 && <div className="w-full bg-emerald-500" style={{ flex: day.vues }} />}
                    {day.clics > 0 && <div className="w-full bg-amber-400" style={{ flex: day.clics }} />}
                  </div>
                </div>
                <span className="text-xs font-bold text-slate-500 capitalize">{day.label}</span>
              </div>
            ))}
          </div>
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
