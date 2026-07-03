import React from 'react';
import { Search, CheckCircle, XCircle, ExternalLink } from 'lucide-react';

export default function AdminVendors() {
  const vendors = [
    { id: 1, name: 'Artisanat du Sahel', email: 'sahel@example.com', status: 'Vérifié', products: 12 },
    { id: 2, name: 'Mode Africaine', email: 'mode@example.com', status: 'En attente', products: 5 },
    { id: 3, name: 'Saveurs Bio', email: 'bio@example.com', status: 'Vérifié', products: 24 },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-extrabold text-slate-900">Vendeurs & Annonces</h2>
        <div className="relative">
          <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Rechercher un vendeur..."
            className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100">
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Vendeur</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Status</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Annonces</th>
              <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {vendors.map((vendor) => (
              <tr key={vendor.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-6 py-4">
                  <div className="font-bold text-slate-900">{vendor.name}</div>
                  <div className="text-xs text-slate-500">{vendor.email}</div>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${
                    vendor.status === 'Vérifié' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                  }`}>
                    {vendor.status}
                  </span>
                </td>
                <td className="px-6 py-4 font-bold text-slate-700">
                  {vendor.products}
                </td>
                <td className="px-6 py-4">
                  <div className="flex gap-2">
                    <button className="p-2 text-slate-400 hover:text-indigo-600 transition-colors" title="Voir les annonces">
                      <ExternalLink className="w-5 h-5" />
                    </button>
                    {vendor.status === 'En attente' && (
                      <>
                        <button className="p-2 text-slate-400 hover:text-emerald-600 transition-colors" title="Valider">
                          <CheckCircle className="w-5 h-5" />
                        </button>
                        <button className="p-2 text-slate-400 hover:text-red-600 transition-colors" title="Rejeter">
                          <XCircle className="w-5 h-5" />
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
