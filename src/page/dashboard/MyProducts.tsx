import React from 'react';
import { PackageSearch, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function MyProducts() {
  const navigate = useNavigate();
  // Using static placeholder data since we rely on `src/data.ts` and `customProducts` in App for real display normally
  const mockProducts = [
    { id: 1, titre: "Vase Traditionnel Bamiléké", prix: 25000, vues: 142, statut: "Actif" },
    { id: 2, titre: "Statuette en Bronze", prix: 75000, vues: 38, statut: "Actif" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 font-display flex items-center gap-2">
            <PackageSearch className="text-[#02603c]" />
            Mes Articles
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Gérez votre catalogue de créations.
          </p>
        </div>
        <button
          onClick={() => navigate('/dashboard/publish')}
          className="bg-[#02603c] text-white hover:bg-[#01482c] px-4 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Nouvel article
        </button>
      </div>

      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
        {mockProducts.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
              <PackageSearch className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-800">Aucun article publié</h3>
            <p className="text-slate-500 text-sm mt-1 mb-6">Commencez à remplir votre vitrine dès maintenant.</p>
            <button
              onClick={() => navigate('/dashboard/publish')}
              className="bg-slate-900 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-slate-800"
            >
              Publier mon premier article
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-xs uppercase font-bold text-slate-500 border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4">Article</th>
                  <th className="px-6 py-4">Prix</th>
                  <th className="px-6 py-4">Statut</th>
                  <th className="px-6 py-4">Vues</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {mockProducts.map(prod => (
                  <tr key={prod.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-bold text-slate-900">{prod.titre}</td>
                    <td className="px-6 py-4 text-emerald-700 font-bold">{prod.prix.toLocaleString('fr-FR')} FCFA</td>
                    <td className="px-6 py-4">
                      <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-xs font-bold">
                        {prod.statut}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-medium">{prod.vues}</td>
                    <td className="px-6 py-4 text-right">
                      <button className="text-[#02603c] font-bold text-xs hover:underline">Modifier</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
