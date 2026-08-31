import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { PackagePlus, AlertTriangle, ArrowRight, Zap, CheckCircle2, ImagePlus, Loader2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { checkPublishingQuota, createProduct, fetchCategories } from '../../lib/services';
import { Categorie } from '../../types';
import { uploadToCloudinary } from '../../lib/cloudinary';
import { isPublishingQuotaExceeded } from '../../lib/mappers';

export default function PublishProduct() {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [quota, setQuota] = useState({ used: 0, max: 0, unlimited: false, enabled: true });
  const [loadingQuota, setLoadingQuota] = useState(true);
  
  const [formData, setFormData] = useState<{
    titre: string;
    description: string;
    prix: string;
    categorie_id: string;
    sous_categorie: string;
    images: string[];
    telephone_contact: string;
  }>({
    titre: '',
    description: '',
    prix: '',
    categorie_id: '',
    sous_categorie: '',
    images: ['', '', ''],
    telephone_contact: '+237 ',
  });
  
  const [publishing, setPublishing] = useState(false);
  const [success, setSuccess] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [publishError, setPublishError] = useState('');

  const isQuotaExceeded = isPublishingQuotaExceeded(quota);

  const [dbCategories, setDbCategories] = useState<Categorie[]>([]);

  useEffect(() => {
    if (user?.boutiqueId) {
      checkPublishingQuota(user.boutiqueId).then(res => {
        setQuota(res);
        setLoadingQuota(false);
      });
    } else {
      setLoadingQuota(false);
    }
    fetchCategories().then(data => setDbCategories(data));
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value;
    if (!val.startsWith('+237 ')) {
      if (val.startsWith('+237')) {
        val = '+237 ' + val.substring(4).trim();
      } else {
        val = '+237 ';
      }
    }
    const prefix = '+237 ';
    const rest = val.substring(prefix.length).replace(/[^0-9\s]/g, '');
    setFormData(prev => ({ ...prev, telephone_contact: prefix + rest }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadError('');

    try {
      const result = await uploadToCloudinary(file, 'dushoppping/produits');
      setFormData(prev => {
        const newImages = [...prev.images];
        newImages[index] = result.secure_url;
        return { ...prev, images: newImages };
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur lors de l\'upload de l\'image.';
      setUploadError(message);
      console.error('Cloudinary upload error:', err);
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (index: number) => {
    setFormData(prev => {
      const newImages = [...prev.images];
      newImages[index] = '';
      return { ...prev, images: newImages };
    });
  };



  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isQuotaExceeded || !user?.boutiqueId) return;

    const images = formData.images.filter(Boolean);
    const normalizedPhone = formData.telephone_contact.replace(/\D/g, '');
    if (images.length < 1) {
      setPublishError("Ajoutez au moins une photo de l'article.");
      return;
    }
    if (!formData.categorie_id) {
      setPublishError('Sélectionnez une catégorie.');
      return;
    }
    if (Number(formData.prix) <= 0) {
      setPublishError('Le prix doit être supérieur à zéro.');
      return;
    }
    if (!/^2376\d{8}$/.test(normalizedPhone)) {
      setPublishError('Saisissez un numéro camerounais valide au format +237 6XXXXXXXX.');
      return;
    }
    
    setPublishing(true);
    setPublishError('');
    try {
      await createProduct(user.boutiqueId, {
        ...formData,
        prix: parseFloat(formData.prix)
      });
      window.dispatchEvent(new Event('product_published'));
      setSuccess(true);
      navigate('/dashboard/products', { replace: true });
    } catch (err) {
      console.error(err);
      setPublishError(err instanceof Error ? err.message : "La publication a échoué. Vérifiez les informations saisies.");
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
            Quota : {quota.unlimited || !quota.enabled ? 'Illimité' : `${quota.used} / ${quota.max} gratuits`}
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

          {publishError && (
            <div className="bg-rose-50 text-rose-700 p-4 rounded-xl flex items-start gap-3 font-bold border border-rose-100">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              {publishError}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-slate-700 mb-1.5">Photos de l'article (1 à 3)</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full">
                {[0, 1, 2].map((index) => (
                  <div key={index} className="flex flex-col items-center justify-center w-full relative">
                    <label className={`flex flex-col items-center justify-center w-full aspect-[4/3] border-2 border-slate-200 border-dashed rounded-2xl cursor-pointer bg-slate-50 hover:bg-emerald-50 hover:border-emerald-200 transition-colors relative overflow-hidden group ${index === 0 && !formData.images[0] ? 'ring-2 ring-emerald-100 ring-offset-2' : ''}`}>
                      {uploading && formData.images[index] === 'uploading' ? (
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                          <Loader2 className="w-8 h-8 text-[#02603c] animate-spin mb-2" />
                          <p className="text-xs text-slate-500 font-bold">Upload...</p>
                        </div>
                      ) : formData.images[index] ? (
                        <>
                          <img src={formData.images[index]} alt={`Aperçu ${index + 1}`} className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <span className="text-white font-bold text-sm bg-black/50 px-3 py-1.5 rounded-xl backdrop-blur-md">Changer</span>
                          </div>
                        </>
                      ) : (
                        <div className="flex flex-col items-center justify-center p-4 text-center">
                          <div className="w-12 h-12 bg-white rounded-2xl shadow-sm flex items-center justify-center mb-3">
                            <ImagePlus className="w-6 h-6 text-[#02603c]" />
                          </div>
                          <p className="text-xs text-slate-700 font-bold">{index === 0 ? 'Photo principale' : `Photo ${index + 1} (Optionnel)`}</p>
                        </div>
                      )}
                      <input 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        disabled={uploading}
                        onChange={(e) => handleImageUpload(e, index)} 
                      />
                    </label>
                    {formData.images[index] && (
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute -top-2 -right-2 bg-rose-500 text-white rounded-full p-1 shadow-xs hover:bg-rose-600 transition-colors"
                      >
                        <AlertTriangle className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              {uploadError && (
                <p className="text-xs text-rose-600 mt-2 font-semibold w-full">{uploadError}</p>
              )}
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
                min="1"
                value={formData.prix}
                onChange={handleChange}
                className="appearance-none block w-full px-4 py-3 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-[#02603c] bg-slate-50/50"
                placeholder="Ex: 15000"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-slate-700 mb-3">Catégorie & Sous-catégorie</label>
              
              <div className="space-y-4">
                {/* Catégorie Principale */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {dbCategories.map((cat) => (
                    <button
                      type="button"
                      key={cat.id}
                      onClick={() => setFormData(prev => ({ ...prev, categorie_id: cat.id, sous_categorie: '' }))}
                      className={`flex flex-col items-center p-3 rounded-2xl border-2 transition-all ${
                        formData.categorie_id === cat.id 
                          ? 'border-[#02603c] bg-emerald-50 text-[#02603c]' 
                          : 'border-slate-100 bg-white text-slate-500 hover:border-slate-200'
                      }`}
                    >
                      <span className="text-2xl mb-1">{cat.icone_url || '📁'}</span>
                      <span className="text-xs font-bold text-center leading-tight">{cat.nom}</span>
                    </button>
                  ))}
                  {dbCategories.length === 0 && <span className="text-sm text-slate-500 italic col-span-4">Chargement des catégories...</span>}
                </div>

                {/* Sous-catégorie (conditionnelle) */}
                <AnimatePresence mode="wait">
                  {formData.categorie_id && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="p-4 bg-slate-50 rounded-2xl border border-slate-100"
                    >
                      <p className="text-xs font-bold text-slate-500 mb-3 uppercase tracking-wider">Sélectionnez une sous-catégorie</p>
                      <div className="flex flex-wrap gap-2">
                        {dbCategories.find(c => c.id === formData.categorie_id)?.sous_categories?.map(sub => (
                          <button
                            type="button"
                            key={sub}
                            onClick={() => setFormData(prev => ({ ...prev, sous_categorie: sub }))}
                            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                              formData.sous_categorie === sub
                                ? 'bg-[#02603c] text-white shadow-md'
                                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                            }`}
                          >
                            {sub}
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
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
              <label className="block text-sm font-bold text-slate-700 mb-1.5">Numéro de téléphone WhatsApp/Appel</label>
              <input
                type="tel"
                name="telephone_contact"
                required
                value={formData.telephone_contact}
                onChange={handlePhoneChange}
                className="appearance-none block w-full px-4 py-3 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-[#02603c] bg-slate-50/50 font-bold"
                placeholder="+237 6XX XX XX XX"
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
