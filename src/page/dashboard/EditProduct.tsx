import React, { useEffect, useState } from 'react';
import { AlertCircle, ArrowLeft, ImagePlus, Loader2, Save, Trash2 } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { deleteSellerProduct, fetchCategories, fetchSellerProduct, updateSellerProduct } from '../../lib/services';
import { Categorie } from '../../types';
import { uploadToCloudinary } from '../../lib/cloudinary';

export default function EditProduct() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Categorie[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ titre: '', description: '', prix: '', categorie_id: '', sous_categorie: '', images: [] as string[], statut: 'Brouillon' as 'Actif' | 'Vendu' | 'Brouillon', telephone_contact: '', whatsapp_contact: '' });

  useEffect(() => {
    Promise.all([fetchSellerProduct(id), fetchCategories()])
      .then(([product, categoryData]) => {
        setCategories(categoryData);
        setBlocked(product.statut === 'Bloque');
        setForm({ titre: product.titre, description: product.description, prix: String(product.prix), categorie_id: product.categorie_id, sous_categorie: product.sous_categorie || '', images: product.images, statut: product.statut === 'Bloque' ? 'Brouillon' : product.statut, telephone_contact: product.telephone_contact || '', whatsapp_contact: product.whatsapp_contact || '' });
      })
      .catch(() => setError("Produit introuvable ou accès refusé."))
      .finally(() => setLoading(false));
  }, [id]);

  const uploadImage = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]; if (!file) return;
    setUploading(true); setError('');
    try { const result = await uploadToCloudinary(file, 'dushoppping/produits'); setForm(previous => ({ ...previous, images: [...previous.images, result.secure_url].slice(0, 3) })); }
    catch (uploadError) { setError(uploadError instanceof Error ? uploadError.message : "Échec de l'upload."); }
    finally { setUploading(false); }
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault(); if (blocked) return;
    const normalizedPhone = form.telephone_contact.replace(/\D/g, '');
    if (form.images.filter(Boolean).length < 1) { setError('Ajoutez au moins une image.'); return; }
    if (Number(form.prix) <= 0) { setError('Le prix doit être supérieur à zéro.'); return; }
    if (!/^2376\d{8}$/.test(normalizedPhone)) { setError('Saisissez un numéro camerounais valide au format +237 6XXXXXXXX.'); return; }
    setSaving(true); setError('');
    try {
      await updateSellerProduct(id, { ...form, prix: Number(form.prix), sous_categorie: form.sous_categorie || null, images: form.images.filter(Boolean), telephone_contact: form.telephone_contact || null, whatsapp_contact: form.whatsapp_contact || form.telephone_contact || null });
      window.dispatchEvent(new Event('product_published'));
      navigate('/dashboard/products');
    } catch (updateError) { setError(updateError instanceof Error ? updateError.message : "La modification a échoué ou n'est pas autorisée."); }
    finally { setSaving(false); }
  };

  const remove = async () => {
    if (blocked || !window.confirm('Supprimer définitivement ce produit ?')) return;
    try { await deleteSellerProduct(id); window.dispatchEvent(new Event('product_published')); navigate('/dashboard/products'); }
    catch { setError("La suppression a échoué. Une campagne ou un paiement peut encore référencer ce produit."); }
  };

  if (loading) return <div className="p-12 text-center text-slate-500"><Loader2 className="w-8 h-8 mx-auto mb-3 animate-spin" />Chargement...</div>;
  return <div className="max-w-3xl space-y-6"><button onClick={() => navigate('/dashboard/products')} className="inline-flex items-center gap-2 text-sm font-bold text-slate-500"><ArrowLeft className="w-4 h-4" />Mes articles</button><div className="bg-white rounded-[2rem] border border-slate-100 p-8 shadow-sm"><h2 className="text-2xl font-extrabold text-slate-900">Modifier le produit</h2>{blocked && <div className="mt-5 bg-rose-50 text-rose-700 border border-rose-100 rounded-xl p-4 font-bold text-sm flex gap-2"><AlertCircle className="w-5 h-5" />Ce produit est bloqué par la modération. Vous ne pouvez ni le modifier ni le supprimer.</div>}{error && <div className="mt-5 bg-rose-50 text-rose-700 rounded-xl p-4 font-bold text-sm">{error}</div>}<form onSubmit={submit} className={`mt-6 space-y-5 ${blocked ? 'opacity-60 pointer-events-none' : ''}`}><input required value={form.titre} onChange={e => setForm(p => ({...p, titre: e.target.value}))} placeholder="Titre" className="w-full px-4 py-3 border rounded-xl" /><textarea required rows={5} value={form.description} onChange={e => setForm(p => ({...p, description: e.target.value}))} placeholder="Description" className="w-full px-4 py-3 border rounded-xl" /><div className="grid sm:grid-cols-2 gap-4"><input required min="0" type="number" value={form.prix} onChange={e => setForm(p => ({...p, prix: e.target.value}))} placeholder="Prix FCFA" className="px-4 py-3 border rounded-xl" /><select required value={form.categorie_id} onChange={e => setForm(p => ({...p, categorie_id: e.target.value, sous_categorie: ''}))} className="px-4 py-3 border rounded-xl"><option value="">Catégorie</option>{categories.map(category => <option key={category.id} value={category.id}>{category.nom}</option>)}</select><select value={form.sous_categorie} onChange={e => setForm(p => ({...p, sous_categorie: e.target.value}))} className="px-4 py-3 border rounded-xl"><option value="">Sous-catégorie</option>{categories.find(category => category.id === form.categorie_id)?.sous_categories?.map(sub => <option key={sub}>{sub}</option>)}</select><select value={form.statut} onChange={e => setForm(p => ({...p, statut: e.target.value as typeof form.statut}))} className="px-4 py-3 border rounded-xl"><option value="Actif">Actif</option><option value="Brouillon">Brouillon</option><option value="Vendu">Vendu</option></select><input value={form.telephone_contact} onChange={e => setForm(p => ({...p, telephone_contact: e.target.value}))} placeholder="Téléphone" className="px-4 py-3 border rounded-xl" /><input value={form.whatsapp_contact} onChange={e => setForm(p => ({...p, whatsapp_contact: e.target.value}))} placeholder="WhatsApp" className="px-4 py-3 border rounded-xl" /></div><div><p className="text-sm font-bold text-slate-700 mb-3">Images ({form.images.length}/3)</p><div className="flex flex-wrap gap-3">{form.images.map((image, index) => <div key={image} className="relative w-24 h-24"><img src={image} alt="" className="w-full h-full object-cover rounded-xl" /><button type="button" onClick={() => setForm(p => ({...p, images: p.images.filter((_, i) => i !== index)}))} className="absolute -top-2 -right-2 bg-rose-500 text-white w-6 h-6 rounded-full">×</button></div>)}{form.images.length < 3 && <label className="w-24 h-24 border-2 border-dashed rounded-xl flex items-center justify-center cursor-pointer"><ImagePlus className="w-6 h-6 text-slate-400" /><input type="file" accept="image/*" onChange={uploadImage} disabled={uploading} className="hidden" /></label>}</div></div><div className="flex justify-between pt-5 border-t"><button type="button" onClick={() => void remove()} className="px-4 py-3 bg-rose-50 text-rose-700 rounded-xl font-bold flex gap-2"><Trash2 className="w-5 h-5" />Supprimer</button><button disabled={saving || uploading} className="px-5 py-3 bg-brand text-white rounded-xl font-bold flex gap-2 disabled:opacity-50"><Save className="w-5 h-5" />{saving ? 'Enregistrement...' : 'Enregistrer'}</button></div></form></div></div>;
}
