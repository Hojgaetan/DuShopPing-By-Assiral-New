import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { LayoutGrid, Users, Zap, Image as ImageIcon, ArrowLeft, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function AdminLayout() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Redirection de sécurité (simplifiée pour démo)
  if (!user || user.role !== 'Admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <h2 className="text-xl font-bold text-slate-800">Accès refusé</h2>
          <p className="text-slate-500 mt-2">Vous devez être connecté en tant qu'Administrateur.</p>
          <button onClick={() => navigate('/')} className="mt-4 text-[#02603c] font-bold underline">
            Retour à l'accueil
          </button>
        </div>
      </div>
    );
  }

  const navItems = [
    { name: 'Catégories', icon: LayoutGrid, path: '/admin/categories' },
    { name: 'Vendeurs & Annonces', icon: Users, path: '/admin/vendors' },
    { name: 'Plans Sponsoring', icon: Zap, path: '/admin/sponsoring' },
    { name: 'Publicités Bannières', icon: ImageIcon, path: '/admin/ads' },
  ];

  return (
    <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 flex flex-col md:flex-row gap-8">
      {/* Sidebar Navigation */}
      <aside className="w-full md:w-64 shrink-0">
        <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100 sticky top-28">
          <div className="flex items-center gap-3 mb-8 px-2">
            <div className="w-12 h-12 bg-indigo-100 text-indigo-700 rounded-2xl flex items-center justify-center font-bold text-xl">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 truncate">{user.nom}</h3>
              <p className="text-xs text-slate-500">CMS Admin</p>
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
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'text-slate-600 hover:bg-indigo-50 hover:text-indigo-600'
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
