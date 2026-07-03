import React from 'react';
import { Plus, Edit2, Trash2 } from 'lucide-react';

export default function AdminCategories() {
  const categories = [
    { id: 1, name: 'Artisanat', sub: ['Poterie', 'Sculpture', 'Vannerie'] },
    { id: 2, name: 'Mode', sub: ['Vêtements', 'Bijoux', 'Chaussures'] },
    { id: 3, name: 'Saveurs', sub: ['Épices', 'Thés', 'Miels'] },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-extrabold text-slate-900">Gestion des Catégories</h2>
        <button className="bg-indigo-600 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-indigo-700 transition-colors">
          <Plus className="w-5 h-5" />
          Nouvelle Catégorie
        </button>
      </div>

      <div className="grid gap-4">
        {categories.map((cat) => (
          <div key={cat.id} className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">{cat.name}</h3>
                <p className="text-sm text-slate-500">{cat.sub.length} sous-catégories</p>
              </div>
              <div className="flex gap-2">
                <button className="p-2 text-slate-400 hover:text-indigo-600 transition-colors">
                  <Edit2 className="w-5 h-5" />
                </button>
                <button className="p-2 text-slate-400 hover:text-red-600 transition-colors">
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {cat.sub.map((s, idx) => (
                <span key={idx} className="bg-slate-50 text-slate-600 px-3 py-1 rounded-lg text-xs font-bold border border-slate-100">
                  {s}
                </span>
              ))}
              <button className="text-indigo-600 text-xs font-bold px-3 py-1 hover:underline">
                + Ajouter une sous-catégorie
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
