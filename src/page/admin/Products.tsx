import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertCircle, CheckCircle, Eye, Loader2, PackageSearch, RefreshCw, Search, ShieldAlert, X } from 'lucide-react';
import { AdminProductRecord, fetchAdminProducts, updateProductStatus } from '../../lib/services';

export default function AdminProducts() {
  const [products, setProducts] = useState<AdminProductRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('Tous');
  const [selected, setSelected] = useState<AdminProductRecord | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try { setProducts(await fetchAdminProducts()); }
    catch { setError('Impossible de charger les articles.'); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void load(); }, [load]);

  const filtered = useMemo(() => products.filter(product => {
    const matchesSearch = (product.titre + ' ' + product.boutique_nom + ' ' + product.categorie_nom).toLowerCase().includes(search.toLowerCase());
    return matchesSearch && (status === 'Tous' || product.statut === status);
  }), [products, search, status]);

  const moderate = async (product: AdminProductRecord, nextStatus: 'Actif' | 'Bloque') => {
    if (!window.confirm(nextStatus === 'Bloque' ? 'Bloquer cet article et le retirer du catalogue ?' : 'Réactiver cet article ?')) return;
    setProcessingId(product.id); setError('');
    try {
      await updateProductStatus(product.id, nextStatus);
      setProducts(current => current.map(item => item.id === product.id ? { ...item, statut: nextStatus } : item));
      setSelected(current => current?.id === product.id ? { ...current, statut: nextStatus } : current);
    } catch { setError("Impossible de modifier le statut de l'article."); }
    finally { setProcessingId(null); }
  };

  const statusClass: Record<string, string> = { Actif: 'bg-emerald-100 text-emerald-700', Bloque: 'bg-rose-100 text-rose-700', Brouillon: 'bg-slate-100 text-slate-600', Vendu: 'bg-blue-100 text-blue-700' };

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div><h2 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2"><PackageSearch className="text-indigo-600" />Modération des articles</h2><p className="text-sm text-slate-500 mt-1">Consultez, recherchez, bloquez ou réactivez les annonces.</p></div>
        <button onClick={() => void load()} className="p-2.5 rounded-xl bg-slate-100 text-slate-600 self-start"><RefreshCw className="w-5 h-5" /></button>
      </div>
      <div className="bg-white rounded-2xl border border-slate-100 p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" /><input value={search} onChange={event => setSearch(event.target.value)} placeholder="Produit, boutique ou catégorie..." className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl" /></div>
        <select value={status} onChange={event => setStatus(event.target.value)} className="px-4 py-2.5 border border-slate-200 rounded-xl bg-white"><option>Tous</option><option>Actif</option><option>Bloque</option><option>Brouillon</option><option>Vendu</option></select>
      </div>
      {error && <div className="bg-rose-50 text-rose-700 rounded-xl p-4 flex gap-2 font-bold text-sm"><AlertCircle className="w-5 h-5" />{error}</div>}
      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
        {loading ? <div className="p-12 text-center text-slate-500"><Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 text-indigo-600" />Chargement...</div> : filtered.length === 0 ? <div className="p-12 text-center text-slate-500">Aucun article trouvé.</div> : <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="px-5 py-4">Article</th><th className="px-5 py-4">Boutique</th><th className="px-5 py-4">Statut</th><th className="px-5 py-4">Date</th><th className="px-5 py-4 text-right">Actions</th></tr></thead><tbody className="divide-y divide-slate-100">{filtered.map(product => <tr key={product.id}><td className="px-5 py-4"><div className="flex items-center gap-3"><div className="w-12 h-12 rounded-xl bg-slate-100 overflow-hidden">{product.images[0] && <img src={product.images[0]} alt="" className="w-full h-full object-cover" />}</div><div><p className="font-bold text-slate-900">{product.titre}</p><p className="text-xs text-slate-500">{product.categorie_nom} · {product.prix.toLocaleString('fr-FR')} FCFA</p></div></div></td><td className="px-5 py-4"><p className="font-semibold">{product.boutique_nom}</p><p className="text-xs text-slate-400">{product.boutique_statut}</p></td><td className="px-5 py-4"><span className={(statusClass[product.statut] || statusClass.Brouillon) + ' px-3 py-1 rounded-full text-xs font-bold'}>{product.statut}</span></td><td className="px-5 py-4 text-slate-500">{new Date(product.date_publication).toLocaleDateString('fr-FR')}</td><td className="px-5 py-4 text-right"><div className="inline-flex gap-2"><button onClick={() => setSelected(product)} className="p-2 rounded-lg bg-slate-100 text-slate-600" title="Voir"><Eye className="w-4 h-4" /></button>{product.statut === 'Bloque' ? <button disabled={processingId === product.id} onClick={() => void moderate(product, 'Actif')} className="p-2 rounded-lg bg-emerald-50 text-emerald-700" title="Réactiver"><CheckCircle className="w-4 h-4" /></button> : <button disabled={processingId === product.id} onClick={() => void moderate(product, 'Bloque')} className="p-2 rounded-lg bg-rose-50 text-rose-700" title="Bloquer"><ShieldAlert className="w-4 h-4" /></button>}</div></td></tr>)}</tbody></table></div>}
      </div>
      {selected && <div className="fixed inset-0 z-50 bg-slate-900/60 p-4 flex items-center justify-center" onClick={() => setSelected(null)}><div className="bg-white rounded-[2rem] max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6" onClick={event => event.stopPropagation()}><div className="flex justify-between gap-4"><div><h3 className="text-xl font-extrabold">{selected.titre}</h3><p className="text-sm text-slate-500">{selected.boutique_nom}</p></div><button onClick={() => setSelected(null)}><X /></button></div><div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-5">{selected.images.map((image, index) => <img key={image + index} src={image} alt={selected.titre} className="w-full aspect-square object-cover rounded-xl" />)}</div><p className="mt-5 text-sm text-slate-600 whitespace-pre-line">{selected.description}</p></div></div>}
    </div>
  );
}
