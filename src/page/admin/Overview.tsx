import React, { useCallback, useEffect, useState } from 'react';
import { AlertCircle, CheckCircle2, Clock3, CreditCard, Loader2, Package, RefreshCw, Store, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { AdminDashboardOverview, fetchAdminDashboardOverview } from '../../lib/services';

const formatNumber = new Intl.NumberFormat('fr-FR');

export default function AdminOverview() {
  const [overview, setOverview] = useState<AdminDashboardOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const load = useCallback(async () => {
    setLoading(true); setError('');
    try { setOverview(await fetchAdminDashboardOverview()); }
    catch { setError('Impossible de charger les indicateurs administratifs.'); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void load(); }, [load]);

  if (loading) return <div className="bg-white rounded-[2rem] border border-slate-100 p-16 text-center text-slate-500"><Loader2 className="w-9 h-9 mx-auto mb-3 animate-spin text-indigo-600" />Chargement des données réelles…</div>;
  if (error || !overview) return <div className="bg-rose-50 text-rose-700 border border-rose-100 rounded-2xl p-5"><div className="flex items-center gap-2 font-bold"><AlertCircle className="w-5 h-5" />{error}</div><button onClick={() => void load()} className="mt-4 px-4 py-2 bg-white rounded-xl font-bold">Réessayer</button></div>;

  const cards = [
    { label: 'Vendeurs', value: overview.vendeurs_total, detail: `${overview.boutiques_approuvees} boutiques approuvées`, icon: Users, color: 'bg-blue-50 text-blue-700', to: '/admin/vendors' },
    { label: 'Boutiques en attente', value: overview.boutiques_en_attente, detail: `${overview.boutiques_total} boutiques au total`, icon: Store, color: 'bg-amber-50 text-amber-700', to: '/admin/vendors' },
    { label: 'Articles actifs', value: overview.produits_actifs, detail: `${overview.produits_bloques} bloqués sur ${overview.produits_total}`, icon: Package, color: 'bg-emerald-50 text-emerald-700', to: '/admin/products' },
    { label: 'Paiements à vérifier', value: overview.paiements_en_attente, detail: `${overview.paiements_valides} paiements validés`, icon: CreditCard, color: 'bg-violet-50 text-violet-700', to: '/admin/payments' },
  ];

  return <div className="space-y-7">
    <div className="flex items-start justify-between gap-4">
      <div><h1 className="text-2xl font-extrabold text-slate-900">Vue d’ensemble</h1><p className="text-sm text-slate-500 mt-1">État réel de la marketplace et tâches à traiter.</p></div>
      <button onClick={() => void load()} className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl" title="Actualiser"><RefreshCw className="w-5 h-5" /></button>
    </div>
    <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {cards.map(card => <Link key={card.label} to={card.to} className="bg-white border border-slate-100 shadow-sm rounded-2xl p-5 hover:-translate-y-0.5 hover:shadow-md transition-all">
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${card.color}`}><card.icon className="w-5 h-5" /></div>
        <p className="text-3xl font-extrabold text-slate-900 mt-4">{formatNumber.format(card.value)}</p><p className="font-bold text-slate-700 mt-1">{card.label}</p><p className="text-xs text-slate-400 mt-1">{card.detail}</p>
      </Link>)}
    </div>
    <div className="grid lg:grid-cols-3 gap-5">
      <section className="lg:col-span-2 bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between"><div><h2 className="font-extrabold text-slate-900">Derniers paiements Boost</h2><p className="text-xs text-slate-500 mt-1">Les cinq demandes les plus récentes</p></div><Link to="/admin/payments" className="text-sm font-bold text-indigo-600">Tout afficher</Link></div>
        {overview.derniers_paiements.length === 0 ? <div className="p-10 text-center text-slate-500">Aucun paiement enregistré.</div> : <div className="divide-y divide-slate-100">{overview.derniers_paiements.map(payment => <div key={payment.id} className="p-5 flex items-center justify-between gap-4">
          <div><p className="font-bold text-slate-800">{payment.reference_transaction}</p><p className="text-xs text-slate-400 mt-1">{new Date(payment.date_paiement).toLocaleString('fr-FR')}</p></div>
          <div className="text-right"><p className="font-extrabold text-slate-900">{formatNumber.format(Number(payment.montant))} FCFA</p><span className={`inline-flex items-center gap-1 mt-1 text-xs font-bold ${payment.statut === 'Reussi' ? 'text-emerald-600' : payment.statut === 'Echoue' ? 'text-rose-600' : 'text-amber-600'}`}>{payment.statut === 'Reussi' ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Clock3 className="w-3.5 h-3.5" />}{payment.statut}</span></div>
        </div>)}</div>}
      </section>
      <section className="bg-indigo-700 text-white rounded-[2rem] p-6 shadow-sm"><CreditCard className="w-9 h-9 text-indigo-200" /><p className="text-sm text-indigo-200 mt-7">Revenus Boost validés</p><p className="text-3xl font-extrabold mt-2">{formatNumber.format(Number(overview.revenus_boost))}</p><p className="font-bold text-indigo-100">FCFA</p><p className="text-xs text-indigo-200 mt-5 leading-relaxed">Ce montant additionne uniquement les paiements dont le statut est « Reussi ».</p></section>
    </div>
  </div>;
}
