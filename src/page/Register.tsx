import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { ShoppingBag, Mail, Lock, User, Phone, Store, ArrowRight, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [formData, setFormData] = useState({
    nom: '',
    email: '',
    telephone: '',
    password: '',
    isVendeur: false
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    setTimeout(() => {
      const result = register({
        nom: formData.nom,
        email: formData.email,
        telephone: formData.telephone,
        password: formData.password,
        isVendeur: formData.isVendeur,
      });

      setIsLoading(false);

      if (result.success) {
        navigate(formData.isVendeur ? '/dashboard' : '/');
      } else {
        setError(result.error || "Erreur lors de l'inscription");
      }
    }, 500);
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
        className="max-w-xl w-full space-y-6 bg-white p-8 sm:p-10 rounded-[2rem] shadow-xl shadow-slate-200/50 relative z-10 border border-slate-100"
      >
        <div className="text-center">
          <motion.div 
            whileHover={{ scale: 1.05 }}
            className="mx-auto h-16 w-16 bg-emerald-50 rounded-2xl flex items-center justify-center mb-6 cursor-pointer"
            onClick={() => navigate('/')}
          >
            <ShoppingBag className="w-8 h-8 text-[#02603c] stroke-[2.5]" />
          </motion.div>
          <h2 className="text-3xl font-extrabold text-slate-900 font-display">
            Rejoignez DuShopPing
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            Créez votre compte pour explorer ou vendre des créations
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          
          {error && (
            <div className="bg-rose-50 text-rose-700 p-4 rounded-xl text-sm font-bold border border-rose-100">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Nom Complet */}
            <div className="md:col-span-2">
              <label htmlFor="nom" className="block text-sm font-bold text-slate-700 mb-1.5">
                Nom complet ou Pseudo
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
                  className="appearance-none block w-full pl-10 pr-3 py-3 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-[#02603c] focus:border-transparent transition-all sm:text-sm bg-slate-50/50 focus:bg-white"
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
                  className="appearance-none block w-full pl-10 pr-3 py-3 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-[#02603c] focus:border-transparent transition-all sm:text-sm bg-slate-50/50 focus:bg-white"
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
                  value={formData.telephone}
                  onChange={handleChange}
                  className="appearance-none block w-full pl-10 pr-3 py-3 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-[#02603c] focus:border-transparent transition-all sm:text-sm bg-slate-50/50 focus:bg-white"
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
                  className="appearance-none block w-full pl-10 pr-3 py-3 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-[#02603c] focus:border-transparent transition-all sm:text-sm bg-slate-50/50 focus:bg-white"
                  placeholder="••••••••"
                />
              </div>
            </div>
          </div>

          {/* Type de compte (Vendeur ou non) */}
          <div className="mt-4 bg-emerald-50/50 p-4 rounded-xl border border-emerald-100 transition-colors hover:bg-emerald-50">
            <div className="flex items-start">
              <div className="flex items-center h-5">
                <input
                  id="isVendeur"
                  name="isVendeur"
                  type="checkbox"
                  checked={formData.isVendeur}
                  onChange={handleChange}
                  className="focus:ring-[#02603c] h-5 w-5 text-[#02603c] border-slate-300 rounded-md cursor-pointer"
                />
              </div>
              <div className="ml-3 text-sm">
                <label htmlFor="isVendeur" className="font-extrabold text-slate-800 cursor-pointer flex items-center gap-2">
                  Je souhaite vendre sur la plateforme
                  <Store className="w-4 h-4 text-emerald-600" />
                </label>
                <p className="text-slate-500 mt-1">
                  Cochez cette case pour créer une boutique et commencer à vendre vos propres créations artisanales.
                </p>
              </div>
            </div>
          </div>

          {/* Sécurité info */}
          <div className="flex items-center justify-center gap-2 text-xs text-slate-500 mt-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Vos données sont sécurisées et cryptées (Politique de confidentialité)</span>
          </div>

          <div>
            <motion.button
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-3.5 px-4 border border-transparent text-sm font-extrabold rounded-xl text-white bg-[#02603c] hover:bg-[#01482c] focus:outline-hidden focus:ring-2 focus:ring-offset-2 focus:ring-[#02603c] transition-all shadow-md overflow-hidden"
            >
              {isLoading ? 'Création en cours...' : 'Créer mon compte'}
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
            <Link to="/login" className="text-sm font-extrabold text-[#02603c] hover:text-emerald-700 transition-colors">
              Connectez-vous ici
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
