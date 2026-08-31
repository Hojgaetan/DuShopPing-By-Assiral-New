import React, { useCallback, useEffect, useState } from 'react';
import { AlertCircle, ExternalLink, Loader2, Pencil, Plus, Power, Trash2, Upload, X } from 'lucide-react';
import {
  createExternalAd,
  deleteExternalAd,
  ExternalAdInput,
  ExternalAdRecord,
  fetchExternalAds,
  updateExternalAd,
} from '../../lib/services';
import { uploadToCloudinary } from '../../lib/cloudinary';

const emptyForm = {
  nom_entreprise: '', image_banniere_url: '', lien_redirection: '',
  date_debut: '', date_fin: '', emplacement: 'Accueil' as ExternalAdInput['emplacement'], statut: true,
};

export default function AdminAds() {
  const [ads, setAds] = useState<ExternalAdRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState('');

  const loadAds = useCallback(async () => {
    setLoading(true); setError('');
    try { setAds(await fetchExternalAds()); }
    catch { setError('Impossible de charger les publicités.'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { void loadAds(); }, [loadAds]);

  const openCreate = () => { setEditingId(null); setForm(emptyForm); setImageFile(null); setImagePreview(''); setShowForm(true); setError(''); };
  const openEdit = (ad: ExternalAdRecord) => {
    setEditingId(ad.id);
    setForm({
      nom_entreprise: ad.nom_entreprise,
      image_banniere_url: ad.image_banniere_url,
      lien_redirection: ad.lien_redirection,
      date_debut: ad.date_debut.slice(0, 10),
      date_fin: ad.date_fin.slice(0, 10),
      emplacement: ad.emplacement,
      statut: ad.statut,
    });
    setImageFile(null);
    setImagePreview(ad.image_banniere_url);
    setShowForm(true); setError('');
  };

  const selectImage = (file?: File) => {
    if (!file) return;
    if (imagePreview.startsWith('blob:')) URL.revokeObjectURL(imagePreview);
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault(); setSaving(true); setError('');
    try {
      let imageUrl = form.image_banniere_url;
      if (imageFile) imageUrl = (await uploadToCloudinary(imageFile, 'dushoppping/publicites')).secure_url;
      if (!imageUrl) throw new Error('Image obligatoire');
      const input: ExternalAdInput = {
        ...form,
        image_banniere_url: imageUrl,
        date_debut: new Date(`${form.date_debut}T00:00:00`).toISOString(),
        date_fin: new Date(`${form.date_fin}T23:59:59`).toISOString(),
      };
      if (editingId) await updateExternalAd(editingId, input); else await createExternalAd(input);
      setShowForm(false); await loadAds();
    } catch (uploadError) { setError(uploadError instanceof Error ? uploadError.message : "L'enregistrement de la publicité a échoué."); }
    finally { setSaving(false); }
  };

  const toggleStatus = async (ad: ExternalAdRecord) => {
    try { await updateExternalAd(ad.id, { statut: !ad.statut }); await loadAds(); }
    catch { setError('Impossible de modifier le statut.'); }
  };

  const removeAd = async (ad: ExternalAdRecord) => {
    if (!window.confirm(`Supprimer la publicité de « ${ad.nom_entreprise} » ?`)) return;
    try { await deleteExternalAd(ad.id); await loadAds(); }
    catch { setError('Impossible de supprimer cette publicité.'); }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center gap-4">
        <h2 className="text-2xl font-extrabold text-slate-900">Gestion des Publicités</h2>
        <button onClick={openCreate} className="bg-indigo-600 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-indigo-700"><Plus className="w-5 h-5" />Nouvelle Campagne</button>
      </div>

      {error && <div className="bg-rose-50 text-rose-700 border border-rose-100 rounded-xl p-4 flex gap-2 text-sm font-bold"><AlertCircle className="w-5 h-5" />{error}</div>}

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-[2rem] border border-indigo-100 shadow-sm space-y-4">
          <div className="flex justify-between"><h3 className="font-extrabold">{editingId ? 'Modifier la campagne' : 'Nouvelle campagne'}</h3><button type="button" onClick={() => setShowForm(false)}><X className="w-5 h-5" /></button></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input required value={form.nom_entreprise} onChange={e => setForm(p => ({...p, nom_entreprise: e.target.value}))} placeholder="Entreprise" className="px-4 py-3 border rounded-xl" />
            <select value={form.emplacement} onChange={e => setForm(p => ({...p, emplacement: e.target.value as ExternalAdInput['emplacement']}))} className="px-4 py-3 border rounded-xl"><option value="Accueil">Accueil</option><option value="Categorie">Catégorie</option><option value="TopRecherche">Top recherche</option></select>
            <label className="md:col-span-2 block border-2 border-dashed border-slate-200 rounded-2xl p-4 cursor-pointer hover:border-indigo-300 hover:bg-indigo-50/30">
              <span className="text-sm font-bold text-slate-700 flex items-center gap-2"><Upload className="w-4 h-4 text-indigo-600" />Image de la campagne {editingId ? '(laissez inchangée pour conserver l’image actuelle)' : '*'}</span>
              <input required={!editingId} type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={e => selectImage(e.target.files?.[0])} className="mt-3 block w-full text-sm text-slate-500" />
              {imagePreview && <div className="mt-4 bg-slate-50 rounded-xl p-3 flex justify-center"><img src={imagePreview} alt="Aperçu de la campagne" className="max-h-44 max-w-full object-contain rounded-lg" /></div>}
              <span className="block text-xs text-slate-400 mt-2">JPG, PNG, WEBP ou GIF — 5 Mo maximum.</span>
            </label>
            <input required type="url" value={form.lien_redirection} onChange={e => setForm(p => ({...p, lien_redirection: e.target.value}))} placeholder="Lien de redirection" className="px-4 py-3 border rounded-xl" />
            <label className="text-sm font-bold text-slate-600">Début<input required type="date" value={form.date_debut} onChange={e => setForm(p => ({...p, date_debut: e.target.value}))} className="block w-full mt-1 px-4 py-3 border rounded-xl font-normal" /></label>
            <label className="text-sm font-bold text-slate-600">Fin<input required type="date" min={form.date_debut} value={form.date_fin} onChange={e => setForm(p => ({...p, date_fin: e.target.value}))} className="block w-full mt-1 px-4 py-3 border rounded-xl font-normal" /></label>
          </div>
          <label className="flex items-center gap-2 text-sm font-bold"><input type="checkbox" checked={form.statut} onChange={e => setForm(p => ({...p, statut: e.target.checked}))} />Campagne active</label>
          <button disabled={saving} className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-bold disabled:opacity-50 inline-flex items-center gap-2">{saving && <Loader2 className="w-4 h-4 animate-spin" />}{saving ? 'Téléversement et enregistrement...' : 'Enregistrer'}</button>
        </form>
      )}

      {loading ? <div className="py-16 text-center text-slate-500"><Loader2 className="w-8 h-8 mx-auto mb-3 animate-spin text-indigo-600" />Chargement...</div> : ads.length === 0 ? <div className="bg-white p-12 rounded-[2rem] text-center text-slate-500">Aucune publicité configurée.</div> : (
        <div className="grid gap-6">
          {ads.map(ad => (
            <div key={ad.id} className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100">
              <div className="flex flex-col lg:flex-row gap-6">
                <div className="w-full lg:w-1/3 bg-slate-50 rounded-xl overflow-hidden border flex items-center justify-center p-4"><img src={ad.image_banniere_url} alt={ad.nom_entreprise} className="max-w-full max-h-40 rounded" /></div>
                <div className="flex-1 space-y-4">
                  <div className="flex justify-between gap-4"><div><h3 className="text-lg font-bold">{ad.nom_entreprise}</h3><p className="text-sm text-slate-500 font-bold uppercase">{ad.emplacement}</p></div><span className={`px-3 py-1 h-fit rounded-full text-[10px] font-black uppercase ${ad.statut ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-400'}`}>{ad.statut ? 'Active' : 'Inactive'}</span></div>
                  <p className="text-xs text-slate-500">Du {new Date(ad.date_debut).toLocaleDateString('fr-FR')} au {new Date(ad.date_fin).toLocaleDateString('fr-FR')}</p>
                  <div className="flex flex-wrap gap-3 pt-2">
                    <button onClick={() => openEdit(ad)} className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl text-xs font-bold flex gap-2"><Pencil className="w-4 h-4" />Modifier</button>
                    <button onClick={() => void toggleStatus(ad)} className="px-4 py-2 bg-slate-50 text-slate-600 rounded-xl text-xs font-bold flex gap-2"><Power className="w-4 h-4" />{ad.statut ? 'Désactiver' : 'Activer'}</button>
                    <a href={ad.lien_redirection} target="_blank" rel="noreferrer" className="px-4 py-2 bg-slate-50 text-slate-600 rounded-xl text-xs font-bold flex gap-2"><ExternalLink className="w-4 h-4" />Lien</a>
                    <button onClick={() => void removeAd(ad)} className="p-2 text-red-500 hover:bg-red-50 rounded-xl"><Trash2 className="w-5 h-5" /></button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
