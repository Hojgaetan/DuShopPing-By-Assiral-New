import React, { useCallback, useEffect, useState } from 'react';
import { AlertCircle, Clock, Loader2, Pencil, Plus, Trash2, TrendingUp, X, Zap } from 'lucide-react';
import {
  createSponsoringPlan,
  deleteSponsoringPlan,
  fetchSponsoringPlans,
  SponsoringPlanInput,
  SponsoringPlanRecord,
  updateSponsoringPlan,
} from '../../lib/services';

const emptyForm = {
  nom_plan: '',
  duree_en_jours: '7',
  prix_unitaire: '',
  multiplicateur_visibilite: '1',
};

export default function AdminSponsoringPlans() {
  const [plans, setPlans] = useState<SponsoringPlanRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  const loadPlans = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setPlans(await fetchSponsoringPlans());
    } catch {
      setError('Impossible de charger les plans de sponsoring.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadPlans();
  }, [loadPlans]);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setError('');
    setShowForm(true);
  };

  const openEdit = (plan: SponsoringPlanRecord) => {
    setEditingId(plan.id);
    setForm({
      nom_plan: plan.nom_plan,
      duree_en_jours: String(plan.duree_en_jours),
      prix_unitaire: String(plan.prix_unitaire),
      multiplicateur_visibilite: String(plan.multiplicateur_visibilite),
    });
    setError('');
    setShowForm(true);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const input: SponsoringPlanInput = {
      nom_plan: form.nom_plan.trim(),
      duree_en_jours: Number(form.duree_en_jours),
      prix_unitaire: Number(form.prix_unitaire),
      multiplicateur_visibilite: Number(form.multiplicateur_visibilite),
    };

    setSaving(true);
    setError('');
    try {
      if (editingId) await updateSponsoringPlan(editingId, input);
      else await createSponsoringPlan(input);
      setShowForm(false);
      await loadPlans();
    } catch {
      setError("L'enregistrement du plan a échoué.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (plan: SponsoringPlanRecord) => {
    if (!window.confirm(`Supprimer le plan « ${plan.nom_plan} » ?`)) return;
    setError('');
    try {
      await deleteSponsoringPlan(plan.id);
      await loadPlans();
    } catch {
      setError('Ce plan ne peut pas être supprimé, probablement parce qu’une campagne l’utilise.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center gap-4">
        <h2 className="text-2xl font-extrabold text-slate-900">Plans de Sponsoring</h2>
        <button onClick={openCreate} className="bg-indigo-600 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-indigo-700 transition-colors">
          <Plus className="w-5 h-5" />
          Nouveau Plan
        </button>
      </div>

      {error && (
        <div className="bg-rose-50 text-rose-700 border border-rose-100 rounded-xl p-4 flex items-center gap-2 text-sm font-bold">
          <AlertCircle className="w-5 h-5" /> {error}
        </div>
      )}

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-[2rem] border border-indigo-100 shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-extrabold text-slate-900">{editingId ? 'Modifier le plan' : 'Nouveau plan'}</h3>
            <button type="button" onClick={() => setShowForm(false)} className="p-2 text-slate-400 hover:text-slate-700"><X className="w-5 h-5" /></button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <input required value={form.nom_plan} onChange={e => setForm(p => ({ ...p, nom_plan: e.target.value }))} placeholder="Nom du plan" className="md:col-span-2 px-4 py-3 border border-slate-200 rounded-xl" />
            <input required min="1" type="number" value={form.duree_en_jours} onChange={e => setForm(p => ({ ...p, duree_en_jours: e.target.value }))} placeholder="Durée en jours" className="px-4 py-3 border border-slate-200 rounded-xl" />
            <input required min="0" type="number" value={form.prix_unitaire} onChange={e => setForm(p => ({ ...p, prix_unitaire: e.target.value }))} placeholder="Prix FCFA" className="px-4 py-3 border border-slate-200 rounded-xl" />
            <input required min="1" step="0.1" type="number" value={form.multiplicateur_visibilite} onChange={e => setForm(p => ({ ...p, multiplicateur_visibilite: e.target.value }))} placeholder="Multiplicateur" className="px-4 py-3 border border-slate-200 rounded-xl" />
          </div>
          <button disabled={saving} className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-bold disabled:opacity-50">
            {saving ? 'Enregistrement...' : 'Enregistrer'}
          </button>
        </form>
      )}

      {loading ? (
        <div className="py-16 text-center text-slate-500"><Loader2 className="w-8 h-8 mx-auto mb-3 animate-spin text-indigo-600" />Chargement...</div>
      ) : plans.length === 0 ? (
        <div className="bg-white p-12 rounded-[2rem] border border-slate-100 text-center text-slate-500">Aucun plan configuré.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map(plan => (
            <div key={plan.id} className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 flex flex-col">
              <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mb-4"><Zap className="w-6 h-6" /></div>
              <h3 className="text-lg font-bold text-slate-900 mb-1">{plan.nom_plan}</h3>
              <div className="text-2xl font-black text-indigo-600 mb-4">{plan.prix_unitaire.toLocaleString('fr-FR')} FCFA</div>
              <div className="space-y-3 mb-8 flex-1 text-sm text-slate-500 font-bold">
                <div className="flex items-center gap-2"><Clock className="w-4 h-4" />{plan.duree_en_jours} jours</div>
                <div className="flex items-center gap-2"><TrendingUp className="w-4 h-4 text-emerald-500" />Visibilité ×{plan.multiplicateur_visibilite}</div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => openEdit(plan)} className="flex-1 py-2 rounded-lg bg-slate-50 text-slate-600 text-xs font-bold hover:bg-slate-100 flex items-center justify-center gap-1.5"><Pencil className="w-4 h-4" />Modifier</button>
                <button onClick={() => void handleDelete(plan)} className="px-3 py-2 rounded-lg bg-red-50 text-red-500 hover:bg-red-100"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
