import React, { useCallback, useEffect, useState } from 'react';
import { AlertCircle, Eye, Loader2, PackageSearch, Pencil, Plus, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { fetchBoutiqueProducts, SellerProductSummary } from '../../lib/services';

export default function MyProducts() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [products, setProducts] = useState<SellerProductSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadProducts = useCallback(async () => {
    if (!user?.boutiqueId) {
      setProducts([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');
    try {
      setProducts(await fetchBoutiqueProducts(user.boutiqueId));
    } catch {
      setError('Impossible de charger vos articles pour le moment.');
    } finally {
      setLoading(false);
    }
  }, [user?.boutiqueId]);

  useEffect(() => {
    void loadProducts();
  }, [loadProducts]);

  const statusClasses: Record<SellerProductSummary['statut'], string> = {
    Actif: 'bg-emerald-100 text-emerald-700',
    Brouillon: 'bg-slate-100 text-slate-600',
    Vendu: 'bg-blue-100 text-blue-700',
    Bloque: 'bg-rose-100 text-rose-700',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 font-display flex items-center gap-2">
            <PackageSearch className="text-[#02603c]" />
            Mes Articles
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Gérez votre catalogue de créations.
          </p>
        </div>
        <button
          onClick={() => navigate('/dashboard/publish')}
          className="bg-[#02603c] text-white hover:bg-[#01482c] px-4 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Nouvel article
        </button>
      </div>

      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500">
            <Loader2 className="w-8 h-8 mx-auto mb-3 animate-spin text-[#02603c]" />
            Chargement de votre catalogue...
          </div>
        ) : error ? (
          <div className="p-12 text-center">
            <AlertCircle className="w-10 h-10 mx-auto mb-3 text-rose-500" />
            <h3 className="font-bold text-slate-800">Chargement impossible</h3>
            <p className="text-sm text-slate-500 mt-1 mb-5">{error}</p>
            <button
              onClick={() => void loadProducts()}
              className="inline-flex items-center gap-2 bg-slate-900 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-slate-800"
            >
              <RefreshCw className="w-4 h-4" />
              Réessayer
            </button>
          </div>
        ) : products.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
              <PackageSearch className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-800">Aucun article publié</h3>
            <p className="text-slate-500 text-sm mt-1 mb-6">Commencez à remplir votre vitrine dès maintenant.</p>
            <button
              onClick={() => navigate('/dashboard/publish')}
              className="bg-slate-900 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-slate-800"
            >
              Publier mon premier article
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-xs uppercase font-bold text-slate-500 border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4">Article</th>
                  <th className="px-6 py-4">Prix</th>
                  <th className="px-6 py-4">Statut</th>
                  <th className="px-6 py-4">Vues</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {products.map(prod => (
                  <tr key={prod.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3 min-w-52">
                        <div className="w-12 h-12 rounded-xl bg-slate-100 overflow-hidden shrink-0">
                          {prod.images[0] ? (
                            <img src={prod.images[0]} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <PackageSearch className="w-5 h-5 m-3.5 text-slate-300" />
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">{prod.titre}</p>
                          <p className="text-xs text-slate-400 mt-0.5">
                            {new Intl.DateTimeFormat('fr-FR').format(new Date(prod.datePublication))}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-emerald-700 font-bold">{prod.prix.toLocaleString('fr-FR')} FCFA</td>
                    <td className="px-6 py-4">
                      <span className={`${statusClasses[prod.statut]} px-3 py-1 rounded-full text-xs font-bold`}>
                        {prod.statut}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-medium">{prod.vues}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="inline-flex items-center gap-3">
                      {prod.statut === 'Actif' && (
                        <button
                          onClick={() => navigate(`/product/${prod.id}`)}
                          className="inline-flex items-center gap-1.5 text-[#02603c] font-bold text-xs hover:underline"
                        >
                          <Eye className="w-4 h-4" />
                          Voir
                        </button>
                      )}
                      <button onClick={() => navigate(`/dashboard/products/${prod.id}/edit`)} className="inline-flex items-center gap-1.5 text-indigo-600 font-bold text-xs hover:underline"><Pencil className="w-4 h-4" />Modifier</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
