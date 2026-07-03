import React from 'react';
import { Plus, Image as ImageIcon, ExternalLink, Trash2 } from 'lucide-react';

export default function AdminAds() {
  const ads = [
    { id: 1, type: 'Banner 728x90', slot: 'Top Billboard', active: true, clicks: 1240, image: 'https://via.placeholder.com/728x90?text=Pub+Top' },
    { id: 2, type: 'Sidebar 300x250', slot: 'Home Sidebar', active: true, clicks: 850, image: 'https://via.placeholder.com/300x250?text=Pub+Sidebar' },
    { id: 3, type: 'Mobile 320x100', slot: 'Bottom Sticky', active: false, clicks: 0, image: 'https://via.placeholder.com/320x100?text=Pub+Mobile' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-extrabold text-slate-900">Gestion des Publicités</h2>
        <button className="bg-indigo-600 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-indigo-700 transition-colors">
          <Plus className="w-5 h-5" />
          Nouvelle Campagne
        </button>
      </div>

      <div className="grid gap-6">
        {ads.map((ad) => (
          <div key={ad.id} className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100">
            <div className="flex flex-col lg:flex-row gap-6">
              <div className="w-full lg:w-1/3 bg-slate-50 rounded-xl overflow-hidden border border-slate-100 flex items-center justify-center p-4">
                <img src={ad.image} alt={ad.type} className="max-w-full h-auto shadow-sm rounded shadow-black/10" />
              </div>
              <div className="flex-1 space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">{ad.type}</h3>
                    <p className="text-sm text-slate-500 font-bold uppercase tracking-tight">{ad.slot}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${
                    ad.active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-400'
                  }`}>
                    {ad.active ? 'Active' : 'Inactif'}
                  </span>
                </div>
                
                <div className="grid grid-cols-2 gap-4 bg-slate-50/50 p-4 rounded-2xl">
                  <div>
                    <p className="text-[10px] text-slate-400 font-black uppercase">Clics totaux</p>
                    <p className="text-xl font-black text-slate-700">{ad.clicks.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 font-black uppercase">CTR Estimé</p>
                    <p className="text-xl font-black text-slate-700">{(ad.clicks > 0 ? 2.4 : 0)}%</p>
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button className="flex-1 py-2 bg-indigo-50 text-indigo-600 rounded-xl text-xs font-bold flex items-center justify-center gap-2 hover:bg-indigo-100 transition-colors">
                    <ImageIcon className="w-4 h-4" /> Modifier l'image
                  </button>
                  <button className="px-4 py-2 bg-slate-50 text-slate-600 rounded-xl text-xs font-bold flex items-center justify-center gap-2 hover:bg-slate-100 transition-colors">
                    <ExternalLink className="w-4 h-4" /> Lien
                  </button>
                  <button className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all">
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
