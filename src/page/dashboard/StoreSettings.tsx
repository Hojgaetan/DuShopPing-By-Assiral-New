import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Store, Save, MapPin, AlignLeft, ImagePlus } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { fetchUserBoutique, createOrUpdateBoutique } from '../../lib/services';

export default function StoreSettings() {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    nom: '',
    description: '',
    localisation: '',
    logo_url: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (user?.id) {
      fetchUserBoutique(user.id).then(data => {
        if (data) {
          setFormData({
            nom: data.nom || '',
            description: data.description || '',
            localisation: data.localisation || '',
            logo_url: data.logo_url || ''
          });
        }
        setLoading(false);
      });
    }
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    setSuccess(false);

    try {
      await createOrUpdateBoutique(user.id, formData);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-slate-500">Chargement de votre boutique...</div>;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100"
    >
      <div className="mb-8">
        <h2 className="text-2xl font-extrabold text-slate-900 font-display flex items-center gap-2">
          <Store className="text-[#02603c]" />
          Configuration de la Boutique
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          Personnalisez la vitrine de votre boutique telle qu'elle apparaîtra aux acheteurs.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-1.5">
            Nom de la boutique
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Store className="h-5 w-5 text-slate-400" />
            </div>
            <input
              type="text"
              name="nom"
              required
              value={formData.nom}
              onChange={handleChange}
              className="appearance-none block w-full pl-10 pr-3 py-3 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-[#02603c] transition-all bg-slate-50/50"
              placeholder="Ex: Les Merveilles d'Amara"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-bold text-slate-700 mb-1.5">
            Localisation
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MapPin className="h-5 w-5 text-slate-400" />
            </div>
            <input
              type="text"
              name="localisation"
              value={formData.localisation}
              onChange={handleChange}
              className="appearance-none block w-full pl-10 pr-3 py-3 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-[#02603c] transition-all bg-slate-50/50"
              placeholder="Ex: Marché Central, Douala"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-bold text-slate-700 mb-1.5">
            Description
          </label>
          <div className="relative">
            <div className="absolute top-3 left-3 pointer-events-none">
              <AlignLeft className="h-5 w-5 text-slate-400" />
            </div>
            <textarea
              name="description"
              rows={4}
              value={formData.description}
              onChange={handleChange}
              className="appearance-none block w-full pl-10 pr-3 py-3 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-[#02603c] transition-all bg-slate-50/50 resize-none"
              placeholder="Décrivez votre savoir-faire et vos créations..."
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-bold text-slate-700 mb-1.5">
            Logo ou Photo de Profil de la Boutique
          </label>
          <div className="flex items-center gap-6">
            <div className="w-24 h-24 rounded-2xl bg-slate-50 border-2 border-dashed border-slate-300 flex items-center justify-center overflow-hidden shrink-0">
              {formData.logo_url ? (
                <img src={formData.logo_url} alt="Logo Boutique" className="w-full h-full object-cover" />
              ) : (
                <ImagePlus className="w-8 h-8 text-slate-300" />
              )}
            </div>
            <div className="flex-1">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onloadend = () => {
                      setFormData(prev => ({ ...prev, logo_url: reader.result as string }));
                    };
                    reader.readAsDataURL(file);
                  }
                }}
                className="block w-full text-sm text-slate-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-bold file:bg-emerald-50 file:text-[#02603c] hover:file:bg-emerald-100 cursor-pointer"
              />
              <p className="text-xs text-slate-400 mt-2">
                Formats acceptés : JPG, PNG, WEBP.
              </p>
            </div>
          </div>
        </div>

        {success && (
          <div className="bg-emerald-50 text-emerald-700 p-4 rounded-xl text-sm font-bold border border-emerald-100">
            Modifications enregistrées avec succès !
          </div>
        )}

        <div className="pt-4 border-t border-slate-100 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 bg-[#02603c] text-white hover:bg-[#01482c] px-6 py-3 rounded-xl font-extrabold transition-all disabled:opacity-70"
          >
            <Save className="w-5 h-5" />
            {saving ? 'Enregistrement...' : 'Enregistrer'}
          </button>
        </div>
      </form>
    </motion.div>
  );
}
