import React from 'react';
import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, LayoutGrid, Users, Zap, Image as ImageIcon, ArrowLeft, ShieldCheck, CreditCard, Gauge, PackageSearch, FileCheck2, UserCog, ScrollText } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function AdminLayout() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  if (loading) {
    return <div className="min-h-[60vh] flex items-center justify-center"><div className="w-10 h-10 rounded-full border-4 border-slate-200 border-t-indigo-600 animate-spin" /></div>;
  }

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

  const adminRole = user.adminRole || 'Moderateur';
  const navItems = [
    { name: 'Vue d’ensemble', icon: LayoutDashboard, path: '/admin', end: true, roles: ['SuperAdmin', 'Moderateur', 'Commercial'] },
    { name: 'Catégories', icon: LayoutGrid, path: '/admin/categories', roles: ['SuperAdmin', 'Moderateur'] },
    { name: 'Vendeurs & Annonces', icon: Users, path: '/admin/vendors', roles: ['SuperAdmin', 'Moderateur'] },
    { name: 'Vérifications', icon: FileCheck2, path: '/admin/verifications', roles: ['SuperAdmin', 'Moderateur'] },
    { name: 'Articles', icon: PackageSearch, path: '/admin/products', roles: ['SuperAdmin', 'Moderateur'] },
    { name: 'Plans Sponsoring', icon: Zap, path: '/admin/sponsoring', roles: ['SuperAdmin', 'Commercial'] },
    { name: 'Publicités Bannières', icon: ImageIcon, path: '/admin/ads', roles: ['SuperAdmin', 'Commercial'] },
    { name: 'Paiements Boost', icon: CreditCard, path: '/admin/payments', roles: ['SuperAdmin', 'Commercial'] },
    { name: 'Quotas', icon: Gauge, path: '/admin/quotas', roles: ['SuperAdmin'] },
    { name: 'Équipe admin', icon: UserCog, path: '/admin/team', roles: ['SuperAdmin'] },
    { name: 'Journal d’activité', icon: ScrollText, path: '/admin/audit', roles: ['SuperAdmin'] },
  ];
  const visibleNavItems = navItems.filter(item => item.roles.includes(adminRole));
  const currentItem = navItems.find(item => item.end ? location.pathname === item.path : location.pathname.startsWith(item.path));
  const isAllowed = !currentItem || currentItem.roles.includes(adminRole);

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
              <p className="text-xs text-slate-500">{adminRole}</p>
            </div>
          </div>

          <nav className="space-y-1.5">
            {visibleNavItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.end}
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
        {isAllowed ? <Outlet /> : <div className="bg-rose-50 border border-rose-100 text-rose-700 rounded-2xl p-6"><h2 className="font-extrabold text-lg">Permission insuffisante</h2><p className="text-sm mt-1">Votre rôle {adminRole} ne permet pas d’accéder à cette section.</p></div>}
      </main>
    </div>
  );
}
