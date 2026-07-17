import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, X, AlertTriangle, Loader2 } from 'lucide-react';
import { Categorie } from '../../types';
import { fetchCategories, createCategory, updateCategory, deleteCategory } from '../../lib/services';
import { motion, AnimatePresence } from 'motion/react';

export default function AdminCategories() {
  const [categories, setCategories] = useState<Categorie[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<{ nom: string; icone_url: string; sous_categories: string[] }>({
    nom: '',
    icone_url: '',
    sous_categories: []
  });
  const [newSub, setNewSub] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    setLoading(true);
    const data = await fetchCategories();
    setCategories(data);
    setLoading(false);
  };

  const handleOpenModal = (cat?: Categorie) => {
    if (cat) {
      setEditingId(cat.id);
      setFormData({
        nom: cat.nom,
        icone_url: cat.icone_url || '',
        sous_categories: cat.sous_categories || []
      });
    } else {
      setEditingId(null);
      setFormData({ nom: '', icone_url: '', sous_categories: [] });
    }
    setNewSub('');
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
  };

  const handleAddSub = (e: React.KeyboardEvent | React.MouseEvent) => {
    if ((e.type === 'keydown' && (e as React.KeyboardEvent).key !== 'Enter') || !newSub.trim()) return;
    e.preventDefault();
    if (!formData.sous_categories.includes(newSub.trim())) {
      setFormData(prev => ({ ...prev, sous_categories: [...prev.sous_categories, newSub.trim()] }));
    }
    setNewSub('');
  };

  const handleRemoveSub = (sub: string) => {
    setFormData(prev => ({
      ...prev,
      sous_categories: prev.sous_categories.filter(s => s !== sub)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nom.trim()) return;
    
    setSaving(true);
    try {
      if (editingId) {
        await updateCategory(editingId, formData);
      } else {
        await createCategory(formData);
      }
      await loadCategories();
      handleCloseModal();
    } catch (err) {
      console.error(err);
      alert("Une erreur est survenue.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer cette catégorie ?")) return;
    try {
      await deleteCategory(id);
      await loadCategories();
    } catch (err) {
      console.error(err);
      alert("Impossible de supprimer la catégorie (elle est peut-être utilisée par des produits).");
    }
  };

  if (loading) {
    return <div className="p-12 flex justify-center"><Loader2 className="w-8 h-8 text-indigo-600 animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-extrabold text-slate-900">Gestion des Catégories</h2>
        <button 
          onClick={() => handleOpenModal()}
          className="bg-indigo-600 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-indigo-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Nouvelle Catégorie
        </button>
      </div>

      <div className="grid gap-4">
        {categories.map((cat) => (
          <div key={cat.id} className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 flex flex-col md:flex-row md:items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="text-2xl">{cat.icone_url || '📁'}</span>
                <h3 className="text-xl font-bold text-slate-900">{cat.nom}</h3>
              </div>
              <div className="flex flex-wrap gap-2 mt-3">
                {cat.sous_categories && cat.sous_categories.map((s, idx) => (
                  <span key={idx} className="bg-slate-50 text-slate-600 px-3 py-1 rounded-lg text-sm font-bold border border-slate-200">
                    {s}
                  </span>
                ))}
                {(!cat.sous_categories || cat.sous_categories.length === 0) && (
                  <span className="text-sm text-slate-400 italic">Aucune sous-catégorie</span>
                )}
              </div>
            </div>
            <div className="flex gap-2 shrink-0">
              <button onClick={() => handleOpenModal(cat)} className="p-2 text-slate-400 hover:text-indigo-600 bg-slate-50 rounded-xl transition-colors">
                <Edit2 className="w-5 h-5" />
              </button>
              <button onClick={() => handleDelete(cat.id)} className="p-2 text-slate-400 hover:text-rose-600 bg-slate-50 rounded-xl transition-colors">
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        ))}
        {categories.length === 0 && (
          <div className="text-center p-12 bg-white rounded-[2rem] border border-slate-100">
            <p className="text-slate-500">Aucune catégorie trouvée. Créez-en une !</p>
          </div>
        )}
      </div>

      {/* Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-[2rem] shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="flex justify-between items-center p-6 border-b border-slate-100">
                <h3 className="text-xl font-bold text-slate-900">
                  {editingId ? 'Modifier la catégorie' : 'Nouvelle catégorie'}
                </h3>
                <button onClick={handleCloseModal} className="text-slate-400 hover:text-slate-600">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto">
                <form id="cat-form" onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1.5">Nom de la catégorie</label>
                    <input
                      type="text"
                      required
                      value={formData.nom}
                      onChange={e => setFormData({ ...formData, nom: e.target.value })}
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-600 outline-none"
                      placeholder="Ex: Mode & Textiles"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1.5">Icône (Emoji ou URL)</label>
                    <input
                      type="text"
                      value={formData.icone_url}
                      onChange={e => setFormData({ ...formData, icone_url: e.target.value })}
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-600 outline-none"
                      placeholder="Ex: 👗"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1.5">Sous-catégories</label>
                    <div className="flex gap-2 mb-3">
                      <input
                        type="text"
                        value={newSub}
                        onChange={e => setNewSub(e.target.value)}
                        onKeyDown={handleAddSub}
                        className="flex-1 px-4 py-2 border border-slate-200 rounded-xl outline-none"
                        placeholder="Ajouter..."
                      />
                      <button
                        type="button"
                        onClick={handleAddSub}
                        className="bg-slate-100 px-4 py-2 rounded-xl font-bold text-slate-700 hover:bg-slate-200"
                      >
                        Ajouter
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {formData.sous_categories.map(sub => (
                        <span key={sub} className="flex items-center gap-1 bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-lg text-sm font-bold">
                          {sub}
                          <button type="button" onClick={() => handleRemoveSub(sub)} className="hover:text-rose-600 ml-1">
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                </form>
              </div>

              <div className="p-6 border-t border-slate-100 flex justify-end gap-3 bg-slate-50">
                <button type="button" onClick={handleCloseModal} className="px-5 py-2.5 rounded-xl font-bold text-slate-600 hover:bg-slate-200">
                  Annuler
                </button>
                <button
                  type="submit"
                  form="cat-form"
                  disabled={saving || !formData.nom}
                  className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-indigo-700 flex items-center gap-2 disabled:opacity-50"
                >
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                  {editingId ? 'Enregistrer' : 'Créer'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
