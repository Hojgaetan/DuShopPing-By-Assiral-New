import React from 'react';
import { Plus, Zap, Clock, TrendingUp } from 'lucide-react';

export default function AdminSponsoringPlans() {
  const plans = [
    { id: 1, name: 'Pack Visibilité 7j', price: '5,000 FCFA', duration: '7 jours', features: ['Top liste', 'Badge sponsorisé'] },
    { id: 2, name: 'Pack Premium 30j', price: '15,000 FCFA', duration: '30 jours', features: ['Top liste', 'Badge sponsorisé', 'Sidebar Ad'] },
    { id: 3, name: 'Pack Elite 90j', price: '40,000 FCFA', duration: '90 jours', features: ['Top liste', 'Badge sponsorisé', 'Banner Ad included', 'Stats avancées'] },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-extrabold text-slate-900">Plans de Sponsoring</h2>
        <button className="bg-indigo-600 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-indigo-700 transition-colors">
          <Plus className="w-5 h-5" />
          Nouveau Plan
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <div key={plan.id} className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 flex flex-col">
            <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mb-4">
              <Zap className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-1">{plan.name}</h3>
            <div className="text-2xl font-black text-indigo-600 mb-4">{plan.price}</div>
            
            <div className="space-y-3 mb-8 flex-1">
              <div className="flex items-center gap-2 text-sm text-slate-500 font-bold">
                <Clock className="w-4 h-4" />
                {plan.duration}
              </div>
              <div className="pt-4 border-t border-slate-50">
                <ul className="space-y-2">
                  {plan.features.map((f, i) => (
                    <li key={i} className="text-xs text-slate-600 flex items-center gap-2 font-bold">
                      <TrendingUp className="w-3 h-3 text-emerald-500" />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="flex gap-2">
              <button className="flex-1 py-2 rounded-lg bg-slate-50 text-slate-600 text-xs font-bold hover:bg-slate-100 transition-colors">
                Modifier
              </button>
              <button className="px-3 py-2 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition-colors">
                <Plus className="w-4 h-4 rotate-45" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
