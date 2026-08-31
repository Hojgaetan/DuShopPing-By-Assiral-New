import React, { useState, useEffect } from 'react';
import { Search, CheckCircle, XCircle, ExternalLink, ShieldAlert, Loader2, X, Store, PackageX } from 'lucide-react';
import { fetchAdminBoutiques, updateBoutiqueStatus, fetchAdminBoutiqueProducts, updateProductStatus, updateSellerAccountStatus } from '../../lib/services';
import { Produit } from '../../types';
import { motion, AnimatePresence } from 'motion/react';

export default function AdminVendors() {
  const [boutiques, setBoutiques] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const [selectedBoutique, setSelectedBoutique] = useState<any | null>(null);
  const [boutiqueProducts, setBoutiqueProducts] = useState<Produit[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    loadBoutiques();
  }, []);

  const loadBoutiques = async () => {
    setLoading(true);
    const data = await fetchAdminBoutiques();
    setBoutiques(data);
    setLoading(false);
  };

  const handleUpdateBoutiqueStatus = async (id: string, status: 'EnAttente' | 'Approuvee' | 'Rejetee') => {
    if (!window.confirm(`Voulez-vous vraiment changer le statut de cette boutique à "${status}" ?`)) return;
    try {
      await updateBoutiqueStatus(id, status);
      await loadBoutiques();
    } catch (err) {
      console.error(err);
      alert("Erreur lors de la mise à jour de la boutique.");
    }
  };

  const handleUpdateAccountStatus = async (sellerId: string, status: 'Actif' | 'Suspendu') => {
    const label = status === 'Suspendu' ? 'suspendre ce compte vendeur' : 'réactiver ce compte vendeur';
    if (!window.confirm(`Voulez-vous vraiment ${label} ?`)) return;
    try {
      await updateSellerAccountStatus(sellerId, status);
      await loadBoutiques();
    } catch (err) {
      console.error(err);
      alert("Erreur lors de la mise à jour du compte vendeur.");
    }
  };

  const handleOpenProducts = async (boutique: any) => {
    setSelectedBoutique(boutique);
    setIsModalOpen(true);
    setLoadingProducts(true);
    try {
      const prods = await fetchAdminBoutiqueProducts(boutique.id);
      setBoutiqueProducts(prods);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingProducts(false);
    }
  };

  const handleUpdateProductStatus = async (id: string, status: 'Actif' | 'Bloque') => {
    try {
      await updateProductStatus(id, status);
      // Actualiser la liste locale
      setBoutiqueProducts(prev => prev.map(p => p.id === id ? { ...p, statut: status } : p));
    } catch (err) {
      console.error(err);
      alert("Erreur lors de la mise à jour du produit.");
    }
  };

  const filteredBoutiques = boutiques.filter(b => 
    b.nom.toLowerCase().includes(searchQuery.toLowerCase()) || 
    b.nom_vendeur.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-extrabold text-slate-900">Vendeurs & Annonces</h2>
        <div className="relative">
          <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Rechercher..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
        {loading ? (
          <div className="p-12 flex justify-center"><Loader2 className="w-8 h-8 text-indigo-600 animate-spin" /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-max">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Boutique & Vendeur</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Statut Modération</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-center">Produits</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredBoutiques.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-900 text-base">{b.nom}</div>
                      <div className="text-xs text-slate-500">{b.nom_vendeur} ({b.email})</div>
                      <span className={`inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-bold ${b.statut_compte === 'Suspendu' ? 'bg-rose-100 text-rose-700' : 'bg-emerald-50 text-emerald-700'}`}>Compte {b.statut_compte}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${
                        b.statut_moderation === 'Approuvee' ? 'bg-emerald-100 text-emerald-700' : 
                        b.statut_moderation === 'Rejetee' ? 'bg-rose-100 text-rose-700' :
                        'bg-amber-100 text-amber-700'
                      }`}>
                        {b.statut_moderation}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-bold text-slate-700 text-center">
                      <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-lg text-sm">{b.nb_produits}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex gap-2 justify-end">
                        <button onClick={() => handleOpenProducts(b)} className="p-2 text-slate-400 hover:text-indigo-600 bg-white border border-slate-200 rounded-xl transition-colors shadow-sm" title="Voir les annonces">
                          <ExternalLink className="w-5 h-5" />
                        </button>
                        
                        {b.statut_moderation !== 'Approuvee' && (
                          <button onClick={() => handleUpdateBoutiqueStatus(b.id, 'Approuvee')} className="p-2 text-slate-400 hover:text-emerald-600 bg-white border border-slate-200 rounded-xl transition-colors shadow-sm" title="Approuver">
                            <CheckCircle className="w-5 h-5" />
                          </button>
                        )}
                        
                        {b.statut_moderation !== 'Rejetee' && (
                          <button onClick={() => handleUpdateBoutiqueStatus(b.id, 'Rejetee')} className="p-2 text-slate-400 hover:text-rose-600 bg-white border border-slate-200 rounded-xl transition-colors shadow-sm" title="Rejeter la boutique">
                            <XCircle className="w-5 h-5" />
                          </button>
                        )}
                        <button onClick={() => handleUpdateAccountStatus(b.vendeur_id, b.statut_compte === 'Suspendu' ? 'Actif' : 'Suspendu')} className={`p-2 bg-white border border-slate-200 rounded-xl transition-colors shadow-sm ${b.statut_compte === 'Suspendu' ? 'text-emerald-600 hover:bg-emerald-50' : 'text-slate-400 hover:text-rose-600'}`} title={b.statut_compte === 'Suspendu' ? 'Réactiver le compte' : 'Suspendre le compte'}>
                          {b.statut_compte === 'Suspendu' ? <CheckCircle className="w-5 h-5" /> : <ShieldAlert className="w-5 h-5" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredBoutiques.length === 0 && (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-slate-500">Aucune boutique trouvée.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal des produits de la boutique */}
      <AnimatePresence>
        {isModalOpen && selectedBoutique && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-[2rem] shadow-xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="flex justify-between items-center p-6 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                    <Store className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">Annonces de {selectedBoutique.nom}</h3>
                    <p className="text-xs text-slate-500">{selectedBoutique.nom_vendeur}</p>
                  </div>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-2 bg-slate-50 rounded-full">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto bg-slate-50 flex-1">
                {loadingProducts ? (
                  <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 text-indigo-600 animate-spin" /></div>
                ) : boutiqueProducts.length === 0 ? (
                  <div className="text-center p-12">
                    <PackageX className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-500 font-bold">Cette boutique n'a publié aucune annonce.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {boutiqueProducts.map(prod => (
                      <div key={prod.id} className="bg-white p-4 rounded-2xl border border-slate-200 flex gap-4 items-center">
                        <div className="w-20 h-20 bg-slate-100 rounded-xl overflow-hidden shrink-0">
                          {prod.images && prod.images[0] ? (
                            <img src={prod.images[0]} alt={prod.titre} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-300">Sans image</div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-slate-900 truncate">{prod.titre}</h4>
                          <p className="text-sm font-bold text-indigo-600">{prod.prix} FCFA</p>
                          <div className="mt-2 flex items-center justify-between">
                            <span className={`text-[10px] font-bold px-2 py-1 rounded-lg uppercase ${
                              prod.statut === 'Actif' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                            }`}>
                              {prod.statut}
                            </span>
                            
                            {prod.statut === 'Actif' ? (
                              <button 
                                onClick={() => handleUpdateProductStatus(prod.id, 'Bloque')}
                                className="text-xs font-bold text-rose-600 hover:underline"
                              >
                                Bloquer
                              </button>
                            ) : (
                              <button 
                                onClick={() => handleUpdateProductStatus(prod.id, 'Actif')}
                                className="text-xs font-bold text-emerald-600 hover:underline"
                              >
                                Réactiver
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
