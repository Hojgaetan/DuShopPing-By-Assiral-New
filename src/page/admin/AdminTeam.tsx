import React, { useCallback, useEffect, useState } from 'react';
import { AlertCircle, Loader2, Save, ShieldCheck, Trash2, UserCog } from 'lucide-react';
import { AdministratorRecord, fetchAdministrators, manageAdministrator } from '../../lib/services';

export default function AdminTeam() {
  const [admins, setAdmins] = useState<AdministratorRecord[]>([]);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<AdministratorRecord['role']>('Moderateur');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const load = useCallback(async () => { setLoading(true); try { setAdmins(await fetchAdministrators()); } catch { setError('Impossible de charger l’équipe.'); } finally { setLoading(false); } }, []);
  useEffect(() => { void load(); }, [load]);
  const submit = async (event: React.FormEvent) => {
    event.preventDefault(); setSaving(true); setError(''); setMessage('');
    try { await manageAdministrator(email, role); setEmail(''); setMessage('Rôle administrateur enregistré.'); await load(); }
    catch (e: any) { setError(e?.message || 'Impossible d’enregistrer ce rôle.'); }
    finally { setSaving(false); }
  };
  const remove = async (admin: AdministratorRecord) => {
    if (!window.confirm(`Retirer tous les accès administrateur à ${admin.nom} ?`)) return;
    setError('');
    try { await manageAdministrator(admin.email, admin.role, true); await load(); }
    catch (e: any) { setError(e?.message || 'Impossible de retirer cet accès.'); }
  };
  const roleStyle = (value: AdministratorRecord['role']) => value === 'SuperAdmin' ? 'bg-violet-100 text-violet-700' : value === 'Moderateur' ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700';
  return <div className="space-y-6">
    <div><h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2"><UserCog className="text-indigo-600" />Équipe administrateur</h1><p className="text-sm text-slate-500 mt-1">Attribuez des permissions à un utilisateur déjà inscrit.</p></div>
    {error && <div className="p-4 bg-rose-50 text-rose-700 rounded-xl flex gap-2 text-sm font-bold"><AlertCircle className="w-5 h-5" />{error}</div>}
    {message && <div className="p-4 bg-emerald-50 text-emerald-700 rounded-xl text-sm font-bold">{message}</div>}
    <form onSubmit={submit} className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-6 grid md:grid-cols-[1fr_220px_auto] gap-4 items-end">
      <label><span className="block text-sm font-bold text-slate-700 mb-1.5">E-mail de l’utilisateur</span><input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="utilisateur@exemple.com" className="w-full px-4 py-3 border border-slate-200 rounded-xl" /></label>
      <label><span className="block text-sm font-bold text-slate-700 mb-1.5">Rôle</span><select value={role} onChange={e => setRole(e.target.value as AdministratorRecord['role'])} className="w-full px-4 py-3 border border-slate-200 rounded-xl"><option>Moderateur</option><option>Commercial</option><option>SuperAdmin</option></select></label>
      <button disabled={saving} className="px-5 py-3 bg-indigo-600 text-white rounded-xl font-bold inline-flex gap-2 justify-center disabled:opacity-50">{saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}Enregistrer</button>
    </form>
    <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">{loading ? <div className="p-12 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-indigo-600" /></div> : <div className="divide-y divide-slate-100">{admins.map(admin => <div key={admin.utilisateur_id} className="p-5 flex items-center justify-between gap-4"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center"><ShieldCheck className="w-5 h-5" /></div><div><p className="font-bold text-slate-900">{admin.nom}</p><p className="text-xs text-slate-500">{admin.email}</p></div></div><div className="flex items-center gap-3"><span className={`px-3 py-1 rounded-full text-xs font-bold ${roleStyle(admin.role)}`}>{admin.role}</span><button onClick={() => void remove(admin)} className="p-2 rounded-lg bg-rose-50 text-rose-600" title="Retirer l’accès"><Trash2 className="w-4 h-4" /></button></div></div>)}</div>}</div>
    <div className="bg-slate-100 text-slate-600 rounded-xl p-4 text-xs leading-relaxed"><strong>Moderateur :</strong> catalogue et vendeurs. <strong>Commercial :</strong> Boost, paiements et publicités. <strong>SuperAdmin :</strong> accès total et gestion de l’équipe.</div>
  </div>;
}
