import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { PackagePlus, AlertTriangle, ArrowRight, Zap, CheckCircle2, ImagePlus, Loader2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { checkPublishingQuota, createProduct } from '../../lib/services';
import { uploadToCloudinary } from '../../lib/cloudinary';

export default function PublishProduct() {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [quota, setQuota] = useState({ used: 0, max: 0 });
  const [loadingQuota, setLoadingQuota] = useState(true);
  
  const [formData, setFormData] = useState({
    titre: '',
    description: '',
    prix: '',
    categorie_id: 'c1111111-1111-1111-1111-111111111111', // Artisanat par défaut
    image_url: '',
    telephone_contact: '',
  });
  
  const [publishing, setPublishing] = useState(false);
  const [success, setSuccess] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  const isQuotaExceeded = quota.used >= quota.max;

  useEffect(() => {
    if (user?.boutiqueId) {
      checkPublishingQuota(user.boutiqueId).then(res => {
        setQuota(res);
        setLoadingQuota(false);
      });
    } else {
      setLoadingQuota(false);
    }
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadError('');

    try {
      const result = await uploadToCloudinary(file, 'dushoppping/produits');
      setFormData(prev => ({ ...prev, image_url: result.secure_url }));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur lors de l\'upload de l\'image.';
      setUploadError(message);
      console.error('Cloudinary upload error:', err);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isQuotaExceeded || !user?.boutiqueId) return;
    
    setPublishing(true);
    try {
      await createProduct(user.boutiqueId, {
        ...formData,
        prix: parseFloat(formData.prix)
      });
      window.dispatchEvent(new Event('product_published'));
      setSuccess(true);
      // Actualiser le quota après 2 secondes et rediriger
      setTimeout(() => {
        setQuota(prev => ({ ...prev, used: prev.used + 1 }));
        setSuccess(false);
        setFormData(prev => ({ ...prev, titre: '', description: '', prix: '', image_url: '' }));
      }, 2000);
    } catch (err) {
      console.error(err);
    } finally {
      setPublishing(false);
    }
  };

  if (loadingQuota) return <div className="p-8 text-center text-slate-500">Vérification de vos quotas...</div>;

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="text-2xl font-extrabold text-slate-900 font-display flex items-center gap-2">
              <PackagePlus className="text-[#02603c]" />
              Publier un article
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Ajoutez une nouvelle création à votre vitrine.
            </p>
          </div>
          
          <div className={`px-4 py-2 rounded-xl text-sm font-bold border ${
            isQuotaExceeded 
              ? 'bg-rose-50 text-rose-700 border-rose-100' 
              : 'bg-emerald-50 text-emerald-700 border-emerald-100'
          }`}>
            Quota : {quota.used} / {quota.max} gratuits
          </div>
        </div>

        <AnimatePresence>
          {isQuotaExceeded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mb-8 bg-rose-50 rounded-2xl p-6 border border-rose-100"
            >
              <div className="flex items-start gap-4">
                <div className="p-2 bg-rose-100 rounded-xl text-rose-600">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-rose-900">
                    Quota de publications atteint
                  </h3>
                  <p className="text-rose-700 mt-1 mb-4 text-sm">
                    Vous avez atteint votre limite de {quota.max} articles gratuits. Pour continuer à publier et attirer plus d'acheteurs, souscrivez à une formule de sponsorisation.
                  </p>
                  <Link
                    to="/dashboard/boost"
                    className="inline-flex items-center gap-2 bg-rose-600 text-white hover:bg-rose-700 px-5 py-2.5 rounded-xl text-sm font-bold transition-colors"
                  >
                    <Zap className="w-4 h-4" />
                    Découvrir les formules Boost
                  </Link>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handleSubmit} className={`space-y-6 ${isQuotaExceeded ? 'opacity-50 pointer-events-none grayscale-[0.5]' : ''}`}>
          
          {success && (
            <div className="bg-emerald-50 text-emerald-700 p-4 rounded-xl flex items-center gap-3 font-bold border border-emerald-100">
              <CheckCircle2 className="w-5 h-5" />
              Article publié avec succès !
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-slate-700 mb-1.5">Photo principale de l'article</label>
              <div className="flex flex-col items-center justify-center w-full">
                <label className="flex flex-col items-center justify-center w-full h-56 border-2 border-slate-200 border-dashed rounded-2xl cursor-pointer bg-slate-50 hover:bg-emerald-50 hover:border-emerald-200 transition-colors relative overflow-hidden group">
                  {uploading ? (
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mb-4">
                        <Loader2 className="w-8 h-8 text-[#02603c] animate-spin" />
                      </div>
                      <p className="mb-2 text-sm text-slate-700 font-bold">Upload en cours sur Cloudinary...</p>
                      <p className="text-xs text-slate-400">Veuillez patienter</p>
                    </div>
                  ) : formData.image_url ? (
                    <>
                      <img src={formData.image_url} alt="Aperçu" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="text-white font-bold text-sm bg-black/50 px-4 py-2 rounded-xl backdrop-blur-md">Changer la photo</span>
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mb-4">
                        <ImagePlus className="w-8 h-8 text-[#02603c]" />
                      </div>
                      <p className="mb-2 text-sm text-slate-700 font-bold">Cliquez pour sélectionner une image</p>
                      <p className="text-xs text-slate-400">Fichiers supportés : PNG, JPG, WEBP (Max. 5 Mo)</p>
                    </div>
                  )}
                  <input 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    disabled={uploading}
                    onChange={handleImageUpload} 
                  />
                </label>
                {uploadError && (
                  <p className="text-xs text-rose-600 mt-2 font-semibold w-full text-center">{uploadError}</p>
                )}
              </div>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-slate-700 mb-1.5">Titre de l'article</label>
              <input
                type="text"
                name="titre"
                required
                value={formData.titre}
                onChange={handleChange}
                className="appearance-none block w-full px-4 py-3 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-[#02603c] bg-slate-50/50"
                placeholder="Ex: Vase en terre cuite de Bamessing"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">Prix (FCFA)</label>
              <input
                type="number"
                name="prix"
                required
                min="0"
                value={formData.prix}
                onChange={handleChange}
                className="appearance-none block w-full px-4 py-3 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-[#02603c] bg-slate-50/50"
                placeholder="Ex: 15000"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">Catégorie</label>
              <select
                name="categorie_id"
                value={formData.categorie_id}
                onChange={handleChange}
                className="appearance-none block w-full px-4 py-3 border border-slate-200 rounded-xl text-slate-900 bg-slate-50/50 focus:outline-hidden focus:ring-2 focus:ring-[#02603c]"
              >
                <option value="c1111111-1111-1111-1111-111111111111">Artisanat & Décoration</option>
                <option value="c2222222-2222-2222-2222-222222222222">Mode & Textiles</option>
                <option value="c3333333-3333-3333-3333-333333333333">Saveurs & Épicerie</option>
                <option value="c4444444-4444-4444-4444-444444444444">Cosmétiques</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-slate-700 mb-1.5">Description détaillée</label>
              <textarea
                name="description"
                required
                rows={5}
                value={formData.description}
                onChange={handleChange}
                className="appearance-none block w-full px-4 py-3 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-[#02603c] bg-slate-50/50 resize-none"
                placeholder="Décrivez les matériaux, la taille, l'histoire de l'objet..."
              />
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-slate-700 mb-1.5">Numéro de téléphone de contact</label>
              <input
                type="tel"
                name="telephone_contact"
                required
                value={formData.telephone_contact}
                onChange={handleChange}
                className="appearance-none block w-full px-4 py-3 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-[#02603c] bg-slate-50/50"
                placeholder="Ex: +237 6XX XX XX XX"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <button
              type="submit"
              disabled={publishing || isQuotaExceeded || uploading}
              className="flex items-center gap-2 bg-[#02603c] text-white hover:bg-[#01482c] px-6 py-3 rounded-xl font-extrabold transition-all disabled:opacity-50"
            >
              {publishing ? 'Publication...' : 'Publier l\'article'}
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
