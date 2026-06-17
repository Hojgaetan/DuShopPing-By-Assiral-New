import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { ShoppingBag, Mail, Lock, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Small delay for UX
    setTimeout(() => {
      const result = login(email, password);
      setIsLoading(false);

      if (result.success) {
        navigate('/');
      } else {
        setError(result.error || 'Erreur de connexion');
      }
    }, 500);
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-slate-50 relative overflow-hidden">
      
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-emerald-100/40 blur-3xl" />
        <div className="absolute bottom-[10%] -right-[10%] w-[40%] h-[60%] rounded-full bg-emerald-50/60 blur-3xl" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full space-y-8 bg-white p-8 sm:p-10 rounded-[2rem] shadow-xl shadow-slate-200/50 relative z-10 border border-slate-100"
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
            Bon retour !
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            Connectez-vous pour accéder à votre espace
          </p>
        </div>

        {error && (
          <div className="bg-rose-50 text-rose-700 p-4 rounded-xl text-sm font-bold border border-rose-100">
            {error}
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            
            <div>
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
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none block w-full pl-10 pr-3 py-3 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-[#02603c] focus:border-transparent transition-all sm:text-sm bg-slate-50/50 focus:bg-white"
                  placeholder="vous@exemple.com"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="password" className="block text-sm font-bold text-slate-700">
                  Mot de passe
                </label>
                <a href="#" className="text-xs font-bold text-[#02603c] hover:text-emerald-700 transition-colors">
                  Mot de passe oublié ?
                </a>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none block w-full pl-10 pr-3 py-3 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-[#02603c] focus:border-transparent transition-all sm:text-sm bg-slate-50/50 focus:bg-white"
                  placeholder="••••••••"
                />
              </div>
            </div>

          </div>

          <div>
            <motion.button
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-3.5 px-4 border border-transparent text-sm font-extrabold rounded-xl text-white bg-[#02603c] hover:bg-[#01482c] focus:outline-hidden focus:ring-2 focus:ring-offset-2 focus:ring-[#02603c] transition-all shadow-md overflow-hidden"
            >
              <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                <Lock className="h-5 w-5 text-emerald-400 group-hover:text-emerald-300 transition-colors" />
              </span>
              {isLoading ? 'Connexion en cours...' : 'Se connecter'}
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
                Nouveau sur DuShopPing ?
              </span>
            </div>
          </div>

          <div className="mt-6 text-center">
            <Link to="/register" className="text-sm font-extrabold text-[#02603c] hover:text-emerald-700 transition-colors">
              Créer un compte maintenant
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
