import React, { useCallback, useEffect, useState } from 'react';
import { AlertCircle, Loader2, RefreshCw, ScrollText } from 'lucide-react';
import { AdminAuditRecord, fetchAdminAuditLog } from '../../lib/services';

const tableLabels: Record<string, string> = {
  boutiques: 'Boutique', produits: 'Article', dossiers_verification_vendeurs: 'Vérification vendeur',
  paiements: 'Paiement Boost', administrateurs: 'Administrateur', categories: 'Catégorie',
  plan_sponsorisations: 'Plan sponsoring', publicites_externes: 'Publicité', configuration_publication: 'Quotas',
};

export default function AdminAuditLog() {
  const [records, setRecords] = useState<AdminAuditRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('Tous');
  const load = useCallback(async () => { setLoading(true); setError(''); try { setRecords(await fetchAdminAuditLog()); } catch { setError('Impossible de charger le journal administratif.'); } finally { setLoading(false); } }, []);
  useEffect(() => { void load(); }, [load]);
  const visible = filter === 'Tous' ? records : records.filter(record => record.table_cible === filter);
  const describe = (record: AdminAuditRecord) => {
    if (record.resume) return record.resume;
    const details = record.details || {};
    if (details.ancien_role || details.nouveau_role) return `Rôle : ${details.ancien_role || 'aucun'} → ${details.nouveau_role || 'retiré'}`;
    if (details.ancien_statut !== undefined || details.nouveau_statut !== undefined) return `Statut : ${details.ancien_statut || '—'} → ${details.nouveau_statut || '—'}`;
    if (details.nom) return details.nom;
    if (details.reference) return `Référence ${details.reference}`;
    if (details.quota) return `Quota défini à ${details.quota}`;
    return record.cible_id ? `Identifiant : ${record.cible_id}` : 'Modification enregistrée';
  };
  return <div className="space-y-6">
    <div className="flex items-start justify-between gap-4"><div><h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2"><ScrollText className="text-indigo-600" />Journal d’activité</h1><p className="text-sm text-slate-500 mt-1">Les 100 dernières actions sensibles réalisées par l’équipe.</p></div><button onClick={() => void load()} className="p-2.5 bg-slate-100 rounded-xl text-slate-600"><RefreshCw className="w-5 h-5" /></button></div>
    <div className="flex gap-2 overflow-x-auto pb-1"><button onClick={() => setFilter('Tous')} className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap ${filter === 'Tous' ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600 border border-slate-200'}`}>Tous</button>{Object.entries(tableLabels).map(([key, label]) => <button key={key} onClick={() => setFilter(key)} className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap ${filter === key ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600 border border-slate-200'}`}>{label}</button>)}</div>
    {error && <div className="p-4 bg-rose-50 text-rose-700 rounded-xl flex gap-2 font-bold text-sm"><AlertCircle className="w-5 h-5" />{error}</div>}
    <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">{loading ? <div className="p-14 text-center"><Loader2 className="w-8 h-8 animate-spin text-indigo-600 mx-auto" /></div> : visible.length === 0 ? <div className="p-14 text-center text-slate-500">Aucune action enregistrée pour ce filtre.</div> : <div className="divide-y divide-slate-100">{visible.map(record => {
      const admin = record.utilisateurs;
      const hasComparison = Object.keys(record.valeur_avant || {}).length > 0 || Object.keys(record.valeur_apres || {}).length > 0;
      return <div key={record.id} className="p-5 hover:bg-slate-50"><div className="flex flex-col sm:flex-row gap-3 sm:justify-between"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><span className={`px-2 py-0.5 rounded text-[10px] font-black ${record.action === 'DELETE' ? 'bg-rose-100 text-rose-700' : record.action === 'INSERT' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>{record.action_metier || record.action}</span><span className="text-xs text-slate-400">{tableLabels[record.table_cible] || record.table_cible}</span></div><p className="text-sm font-semibold text-slate-700 mt-2 leading-relaxed">{describe(record)}</p>{hasComparison && <details className="mt-3"><summary className="cursor-pointer text-xs font-bold text-indigo-600">Afficher les valeurs avant/après</summary><div className="grid sm:grid-cols-2 gap-3 mt-2"><div className="bg-rose-50/60 rounded-xl p-3"><p className="text-[10px] font-black uppercase text-rose-600 mb-2">Avant</p><pre className="text-[11px] text-slate-600 whitespace-pre-wrap break-words">{JSON.stringify(record.valeur_avant || {}, null, 2)}</pre></div><div className="bg-emerald-50/60 rounded-xl p-3"><p className="text-[10px] font-black uppercase text-emerald-600 mb-2">Après</p><pre className="text-[11px] text-slate-600 whitespace-pre-wrap break-words">{JSON.stringify(record.valeur_apres || {}, null, 2)}</pre></div></div></details>}</div><div className="sm:text-right shrink-0"><p className="text-xs font-bold text-slate-700">{record.auteur_nom || admin?.nom || 'Administrateur'}</p><p className="text-[10px] text-indigo-500 font-bold mt-0.5">{record.auteur_role || 'Rôle non archivé'}</p><p className="text-[10px] text-slate-400 mt-1">{new Date(record.date_action).toLocaleString('fr-FR')}</p></div></div></div>;
    })}</div>}</div>
  </div>;
}
