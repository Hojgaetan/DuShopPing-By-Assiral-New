import React, { useEffect, useState } from 'react';
import { AlertCircle, Gauge, Loader2, Save } from 'lucide-react';
import { fetchPublicationQuotaConfig, updatePublicationQuotaConfig } from '../../lib/services';

export default function AdminQuotas() {
  const [max, setMax] = useState('5');
  const [enabled, setEnabled] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetchPublicationQuotaConfig().then(config => { setMax(String(config.max)); setEnabled(config.enabled); }).catch(() => setError('Impossible de charger la configuration.')).finally(() => setLoading(false));
  }, []);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault(); setSaving(true); setError(''); setSuccess(false);
    try { await updatePublicationQuotaConfig(Number(max), enabled); setSuccess(true); }
    catch { setError("L'enregistrement de la configuration a échoué."); }
    finally { setSaving(false); }
  };

  if (loading) return <div className="p-12 text-center text-slate-500"><Loader2 className="w-8 h-8 mx-auto mb-3 animate-spin text-indigo-600" />Chargement...</div>;
  return <div className="max-w-2xl space-y-6"><div><h2 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2"><Gauge className="text-indigo-600" />Configuration des quotas</h2><p className="text-sm text-slate-500 mt-2">Définissez le nombre de produits gratuits autorisés pour chaque boutique sans Boost actif.</p></div><form onSubmit={submit} className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-8 space-y-6">{error && <div className="bg-rose-50 text-rose-700 p-4 rounded-xl flex gap-2 font-bold text-sm"><AlertCircle className="w-5 h-5" />{error}</div>}{success && <div className="bg-emerald-50 text-emerald-700 p-4 rounded-xl font-bold text-sm">Configuration enregistrée.</div>}<label className="block"><span className="text-sm font-bold text-slate-700">Nombre maximal de produits gratuits</span><input required min="1" max="1000" type="number" value={max} onChange={e => setMax(e.target.value)} disabled={!enabled} className="mt-2 w-full px-4 py-3 border border-slate-200 rounded-xl disabled:bg-slate-100" /></label><label className="flex items-center justify-between gap-4 p-4 bg-slate-50 rounded-xl"><div><p className="font-bold text-slate-800">Activer la limite</p><p className="text-xs text-slate-500 mt-1">Si désactivée, toutes les boutiques publient sans limite.</p></div><input type="checkbox" checked={enabled} onChange={e => setEnabled(e.target.checked)} className="w-5 h-5" /></label><div className="bg-indigo-50 text-indigo-700 rounded-xl p-4 text-sm">Une campagne Boost active rend automatiquement le quota illimité pour la boutique concernée.</div><button disabled={saving} className="bg-indigo-600 text-white px-5 py-3 rounded-xl font-bold flex items-center gap-2 disabled:opacity-50"><Save className="w-5 h-5" />{saving ? 'Enregistrement...' : 'Enregistrer'}</button></form></div>;
}
