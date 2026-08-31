import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { ShoppingBag, Mail, Lock, User, Phone, Store, ArrowRight, ShieldCheck, MapPin } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [activeTab, setActiveTab] = useState<'acheteur' | 'vendeur'>('acheteur');
  
  const [formData, setFormData] = useState({
    nom: '',
    email: '',
    telephone: '',
    password: '',
    nomBoutique: '',
    localisation: ''
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Validation Vendeur
    if (activeTab === 'vendeur') {
      if (!formData.nomBoutique.trim()) {
        setError('Le nom de la boutique est obligatoire pour un vendeur.');
        setIsLoading(false);
        return;
      }
    }

    try {
      const result = await register({
        nom: formData.nom,
        email: formData.email,
        telephone: formData.telephone,
        password: formData.password,
        isVendeur: activeTab === 'vendeur',
        nomBoutique: activeTab === 'vendeur' ? formData.nomBoutique : undefined,
        localisation: activeTab === 'vendeur' ? formData.localisation : undefined,
      });

      if (result.success) {
        if (result.requiresEmailConfirmation) {
          navigate('/login', { state: { message: 'Compte créé. Consultez votre e-mail pour confirmer votre inscription avant de vous connecter.' } });
        } else {
          navigate(activeTab === 'vendeur' ? '/dashboard' : '/');
        }
      } else {
        setError(result.error || "Erreur lors de l'inscription");
        setIsLoading(false);
      }
    } catch (err: any) {
      setError(err.message || "Une erreur est survenue");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[90vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-slate-50 relative overflow-hidden">
      
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <div className="absolute top-[10%] right-[5%] w-[40%] h-[40%] rounded-full bg-emerald-100/40 blur-3xl" />
        <div className="absolute bottom-[0%] -left-[10%] w-[50%] h-[50%] rounded-full bg-emerald-50/70 blur-3xl" />
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="max-w-2xl w-full space-y-6 bg-white p-8 sm:p-10 rounded-[2rem] shadow-xl shadow-slate-200/50 relative z-10 border border-slate-100"
      >
        <div className="text-center">
          <motion.div 
            whileHover={{ scale: 1.05 }}
            className="mx-auto h-16 w-16 bg-emerald-50 rounded-2xl flex items-center justify-center mb-6 cursor-pointer"
            onClick={() => navigate('/')}
          >
            <ShoppingBag className="w-8 h-8 text-brand stroke-[2.5]" />
          </motion.div>
          <h2 className="text-3xl font-extrabold text-slate-900 font-display">
            Rejoignez DuShopPing
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            Choisissez votre type de compte pour commencer
          </p>
        </div>

        {/* Tabs for Acheteur / Vendeur */}
        <div className="flex p-1 bg-slate-100 rounded-2xl mt-6 relative z-20">
          <button
            type="button"
            onClick={() => { setActiveTab('acheteur'); setError(''); }}
            className={`flex-1 py-3 text-sm font-extrabold rounded-xl flex items-center justify-center gap-2 transition-all ${
              activeTab === 'acheteur' 
                ? 'bg-white text-brand shadow-sm border border-slate-200/50' 
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            Je veux acheter
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab('vendeur'); setError(''); }}
            className={`flex-1 py-3 text-sm font-extrabold rounded-xl flex items-center justify-center gap-2 transition-all ${
              activeTab === 'vendeur' 
                ? 'bg-brand text-white shadow-md' 
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <Store className="w-4 h-4" />
            Je veux vendre
          </button>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          
          {error && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }} 
              animate={{ opacity: 1, y: 0 }}
              className="bg-rose-50 text-rose-700 p-4 rounded-xl text-sm font-bold border border-rose-100"
            >
              {error}
            </motion.div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Nom Complet */}
            <div className="md:col-span-2">
              <label htmlFor="nom" className="block text-sm font-bold text-slate-700 mb-1.5">
                {activeTab === 'vendeur' ? 'Nom du gérant' : 'Nom complet ou Pseudo'}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  id="nom"
                  name="nom"
                  type="text"
                  required
                  value={formData.nom}
                  onChange={handleChange}
                  className="appearance-none block w-full pl-10 pr-3 py-3 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-brand focus:border-transparent transition-all sm:text-sm bg-slate-50/50 focus:bg-white"
                  placeholder="Amara Koné"
                />
              </div>
            </div>

            {/* Email */}
            <div className="md:col-span-2">
              <label htmlFor="email" className="block text-sm font-bold text-slate-700 mb-1.5">
                Adresse e-mail
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="appearance-none block w-full pl-10 pr-3 py-3 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-brand focus:border-transparent transition-all sm:text-sm bg-slate-50/50 focus:bg-white"
                  placeholder="vous@exemple.com"
                />
              </div>
            </div>

            {/* Téléphone */}
            <div className="md:col-span-1">
              <label htmlFor="telephone" className="block text-sm font-bold text-slate-700 mb-1.5">
                N° de Téléphone
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Phone className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  id="telephone"
                  name="telephone"
                  type="tel"
                  required={activeTab === 'vendeur'}
                  value={formData.telephone}
                  onChange={handleChange}
                  className="appearance-none block w-full pl-10 pr-3 py-3 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-brand focus:border-transparent transition-all sm:text-sm bg-slate-50/50 focus:bg-white"
                  placeholder="+237 6..."
                />
              </div>
            </div>

            {/* Mot de passe */}
            <div className="md:col-span-1">
              <label htmlFor="password" className="block text-sm font-bold text-slate-700 mb-1.5">
                Mot de passe
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="appearance-none block w-full pl-10 pr-3 py-3 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-brand focus:border-transparent transition-all sm:text-sm bg-slate-50/50 focus:bg-white"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {/* Specific Vendeur Fields */}
            <AnimatePresence>
              {activeTab === 'vendeur' && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4 mt-2 overflow-hidden"
                >
                  <div className="md:col-span-2">
                    <div className="h-px w-full bg-emerald-100 my-2"></div>
                    <h3 className="text-emerald-800 font-extrabold text-sm mb-4 flex items-center gap-2">
                      <Store className="w-4 h-4" /> Informations de la Boutique
                    </h3>
                  </div>

                  <div className="md:col-span-1">
                    <label htmlFor="nomBoutique" className="block text-sm font-bold text-slate-700 mb-1.5">
                      Nom de la boutique
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Store className="h-5 w-5 text-slate-400" />
                      </div>
                      <input
                        id="nomBoutique"
                        name="nomBoutique"
                        type="text"
                        required={activeTab === 'vendeur'}
                        value={formData.nomBoutique}
                        onChange={handleChange}
                        className="appearance-none block w-full pl-10 pr-3 py-3 border border-emerald-200 rounded-xl text-slate-900 placeholder-emerald-300 focus:outline-hidden focus:ring-2 focus:ring-brand focus:border-transparent transition-all sm:text-sm bg-emerald-50/30 focus:bg-white"
                        placeholder="Ex: Les Merveilles d'Amara"
                      />
                    </div>
                  </div>

                  <div className="md:col-span-1">
                    <label htmlFor="localisation" className="block text-sm font-bold text-slate-700 mb-1.5">
                      Localisation (Ville/Quartier)
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <MapPin className="h-5 w-5 text-slate-400" />
                      </div>
                      <input
                        id="localisation"
                        name="localisation"
                        type="text"
                        value={formData.localisation}
                        onChange={handleChange}
                        className="appearance-none block w-full pl-10 pr-3 py-3 border border-emerald-200 rounded-xl text-slate-900 placeholder-emerald-300 focus:outline-hidden focus:ring-2 focus:ring-brand focus:border-transparent transition-all sm:text-sm bg-emerald-50/30 focus:bg-white"
                        placeholder="Ex: Douala, Akwa"
                      />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

          </div>

          {/* Sécurité info */}
          <div className="flex items-center justify-center gap-2 text-xs text-slate-500 pt-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Vos données sont sécurisées et cryptées</span>
          </div>

          <div>
            <motion.button
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-4 px-4 border border-transparent text-sm font-extrabold rounded-xl text-white bg-brand hover:bg-brand-hover focus:outline-hidden focus:ring-2 focus:ring-offset-2 focus:ring-brand transition-all shadow-lg shadow-emerald-500/30 overflow-hidden"
            >
              {isLoading ? 'Création en cours...' : (activeTab === 'vendeur' ? 'Ouvrir ma boutique' : 'Créer mon compte')}
              {!isLoading && <ArrowRight className="ml-2 w-5 h-5 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all absolute right-4" />}
            </motion.button>
          </div>
        </form>

        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-slate-500">
                Vous avez déjà un compte ?
              </span>
            </div>
          </div>

          <div className="mt-6 text-center">
            <Link to="/login" className="text-sm font-extrabold text-brand hover:text-emerald-700 transition-colors">
              Connectez-vous ici
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
