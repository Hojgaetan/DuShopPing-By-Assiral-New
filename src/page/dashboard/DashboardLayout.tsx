import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { Store, PackagePlus, BarChart3, Zap, Settings, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function DashboardLayout() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Redirection de sécurité (simplifiée pour démo)
  if (!user || user.role !== 'Vendeur') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <h2 className="text-xl font-bold text-slate-800">Accès refusé</h2>
          <p className="text-slate-500 mt-2">Vous devez être connecté en tant que Vendeur.</p>
          <button onClick={() => navigate('/')} className="mt-4 text-[#02603c] font-bold underline">
            Retour à l'accueil
          </button>
        </div>
      </div>
    );
  }

  const navItems = [
    { name: 'Ma Boutique', icon: Store, path: '/dashboard/store' },
    { name: 'Publier un article', icon: PackagePlus, path: '/dashboard/publish' },
    { name: 'Formules Boost', icon: Zap, path: '/dashboard/boost' },
    { name: 'Statistiques', icon: BarChart3, path: '/dashboard/stats' },
  ];

  return (
    <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 flex flex-col md:flex-row gap-8">
      {/* Sidebar Navigation */}
      <aside className="w-full md:w-64 shrink-0">
        <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100 sticky top-28">
          <div className="flex items-center gap-3 mb-8 px-2">
            <div className="w-12 h-12 bg-emerald-100 text-[#02603c] rounded-2xl flex items-center justify-center font-bold text-xl">
              {user.nom.charAt(0)}
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 truncate">{user.nom}</h3>
              <p className="text-xs text-slate-500">Espace Vendeur</p>
            </div>
          </div>

          <nav className="space-y-1.5">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                    isActive
                      ? 'bg-[#02603c] text-white shadow-md'
                      : 'text-slate-600 hover:bg-emerald-50 hover:text-[#02603c]'
                  }`
                }
              >
                <item.icon className="w-5 h-5" />
                {item.name}
              </NavLink>
            ))}
          </nav>

          <div className="mt-8 pt-6 border-t border-slate-100">
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-slate-500 hover:text-slate-800 transition-all w-full"
            >
              <ArrowLeft className="w-5 h-5" />
              Retour au site
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 min-w-0">
        <Outlet />
      </main>
    </div>
  );
}
