import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Zap, Crown, Gem, Check, Phone, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { subscribeToBoost } from '../../lib/services';

const PLANS = [
  { id: 'p1111111-1111-1111-1111-111111111111', nom: 'PLAN DE BASE', jours: 7, prix: 5000, multi: 1.2, icon: Zap, color: 'emerald' },
  { id: 'p2222222-2222-2222-2222-222222222222', nom: 'PLAN BOOST ÉLITE', jours: 14, prix: 15000, multi: 1.8, icon: Crown, color: 'amber', isPopular: true },
  { id: 'p3333333-3333-3333-3333-333333333333', nom: 'PLAN IMPÉRIAL', jours: 30, prix: 35000, multi: 2.5, icon: Gem, color: 'purple' },
];

export default function BoostPlans() {
  const { user } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState<typeof PLANS[0] | null>(null);
  
  // Payment states
  const [operateur, setOperateur] = useState<'MoMo' | 'OM'>('MoMo');
  const [numero, setNumero] = useState('');
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.boutiqueId || !selectedPlan || !numero) return;
    
    setProcessing(true);
    try {
      await subscribeToBoost(user.boutiqueId, selectedPlan.id, operateur, numero, selectedPlan.prix);
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setSelectedPlan(null);
        setNumero('');
      }, 5000);
    } catch (error) {
      console.error(error);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-8 max-w-5xl">
      <div>
        <h2 className="text-3xl font-extrabold text-slate-900 font-display flex items-center gap-3">
          <Zap className="text-amber-500 w-8 h-8" />
          Sponsorisez votre Boutique
        </h2>
        <p className="text-slate-500 mt-2 text-lg">
          Augmentez votre visibilité, débloquez les quotas et multipliez vos ventes en mettant vos créations en avant.
        </p>
      </div>

      <AnimatePresence mode="wait">
        {success ? (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="bg-emerald-50 rounded-[2rem] p-12 text-center border border-emerald-100 shadow-sm"
          >
            <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h3 className="text-2xl font-extrabold text-emerald-900 mb-2">Paiement Réussi !</h3>
            <p className="text-emerald-700 max-w-md mx-auto">
              Votre formule a été activée. Vos articles seront maintenant mis en avant sur la page d'accueil et votre quota de publication est débloqué.
            </p>
            <button
              onClick={() => { setSuccess(false); setSelectedPlan(null); }}
              className="mt-8 bg-emerald-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-emerald-700 transition-colors"
            >
              Retour aux formules
            </button>
          </motion.div>
        ) : (
          <motion.div key="plans" className="space-y-8" exit={{ opacity: 0 }}>
            {/* Grille des Plans */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {PLANS.map((plan) => (
                <div
                  key={plan.id}
                  onClick={() => setSelectedPlan(plan)}
                  className={`relative bg-white rounded-3xl p-6 border-2 transition-all cursor-pointer ${
                    selectedPlan?.id === plan.id
                      ? `border-${plan.color}-500 shadow-lg shadow-${plan.color}-100/50 scale-105 z-10`
                      : 'border-slate-100 hover:border-slate-300 hover:shadow-md'
                  }`}
                >
                  {plan.isPopular && (
                    <div className="absolute -top-4 inset-x-0 flex justify-center">
                      <span className="bg-amber-500 text-white text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full shadow-xs">
                        Le Plus Populaire
                      </span>
                    </div>
                  )}
                  
                  <div className={`w-14 h-14 rounded-2xl bg-${plan.color}-50 text-${plan.color}-600 flex items-center justify-center mb-6`}>
                    <plan.icon className="w-7 h-7" />
                  </div>
                  
                  <h3 className="text-xl font-extrabold text-slate-900 mb-2">{plan.nom}</h3>
                  <div className="flex items-baseline gap-1 mb-6">
                    <span className="text-3xl font-black text-slate-900">{plan.prix.toLocaleString('fr-FR')}</span>
                    <span className="text-sm font-bold text-slate-500">FCFA</span>
                  </div>

                  <ul className="space-y-3 mb-8">
                    <li className="flex items-start gap-2 text-sm text-slate-600 font-medium">
                      <Check className={`w-5 h-5 text-${plan.color}-500 shrink-0`} />
                      Mise en avant {plan.jours} jours
                    </li>
                    <li className="flex items-start gap-2 text-sm text-slate-600 font-medium">
                      <Check className={`w-5 h-5 text-${plan.color}-500 shrink-0`} />
                      Visibilité x{plan.multi}
                    </li>
                    <li className="flex items-start gap-2 text-sm text-slate-600 font-medium">
                      <Check className={`w-5 h-5 text-${plan.color}-500 shrink-0`} />
                      Publications illimitées
                    </li>
                  </ul>

                  <button className={`w-full py-3 rounded-xl font-bold transition-colors ${
                    selectedPlan?.id === plan.id
                      ? `bg-${plan.color}-50 text-${plan.color}-700`
                      : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                  }`}>
                    {selectedPlan?.id === plan.id ? 'Sélectionné' : 'Choisir ce plan'}
                  </button>
                </div>
              ))}
            </div>

            {/* Zone de Paiement (n'apparaît que si un plan est sélectionné) */}
            <AnimatePresence>
              {selectedPlan && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden"
                >
                  <div className="p-8">
                    <h3 className="text-xl font-extrabold text-slate-900 mb-6">Procéder au paiement</h3>
                    
                    <form onSubmit={handlePayment} className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      {/* Choix de l'opérateur */}
                      <div className="space-y-4">
                        <label className="block text-sm font-bold text-slate-700">Moyen de paiement</label>
                        <div className="grid grid-cols-2 gap-4">
                          <div
                            onClick={() => setOperateur('MoMo')}
                            className={`p-4 rounded-2xl border-2 cursor-pointer flex flex-col items-center justify-center gap-2 transition-all ${
                              operateur === 'MoMo' ? 'border-[#ffcc00] bg-[#ffcc00]/10' : 'border-slate-100 hover:border-slate-200'
                            }`}
                          >
                            <div className="w-12 h-12 rounded-full bg-[#ffcc00] flex items-center justify-center font-black text-[#004f71]">MTN</div>
                            <span className="text-xs font-bold text-slate-700">Mobile Money</span>
                          </div>
                          
                          <div
                            onClick={() => setOperateur('OM')}
                            className={`p-4 rounded-2xl border-2 cursor-pointer flex flex-col items-center justify-center gap-2 transition-all ${
                              operateur === 'OM' ? 'border-[#ff6600] bg-[#ff6600]/10' : 'border-slate-100 hover:border-slate-200'
                            }`}
                          >
                            <div className="w-12 h-12 rounded-full bg-[#ff6600] flex items-center justify-center font-black text-white">OM</div>
                            <span className="text-xs font-bold text-slate-700">Orange Money</span>
                          </div>
                        </div>
                      </div>

                      {/* Saisie Numéro et Validation */}
                      <div className="space-y-4 flex flex-col justify-between">
                        <div>
                          <label className="block text-sm font-bold text-slate-700 mb-1.5">Numéro de téléphone</label>
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <Phone className="h-5 w-5 text-slate-400" />
                            </div>
                            <input
                              type="tel"
                              required
                              value={numero}
                              onChange={(e) => setNumero(e.target.value)}
                              className="appearance-none block w-full pl-10 pr-3 py-3 border border-slate-200 rounded-xl text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-slate-800 transition-all bg-slate-50/50"
                              placeholder="Ex: 6XXXXXXXX"
                            />
                          </div>
                          <p className="text-xs text-slate-500 mt-2">
                            Vous recevrez une notification sur votre téléphone pour valider le retrait de <strong>{selectedPlan.prix.toLocaleString()} FCFA</strong>.
                          </p>
                        </div>

                        <button
                          type="submit"
                          disabled={processing || !numero}
                          className={`w-full py-3.5 rounded-xl text-white font-extrabold flex items-center justify-center gap-2 transition-all shadow-md ${
                            operateur === 'MoMo' 
                              ? 'bg-[#004f71] hover:bg-[#003852] shadow-[#004f71]/20' 
                              : 'bg-[#ff6600] hover:bg-[#cc5200] shadow-[#ff6600]/20'
                          } disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                          {processing ? 'Attente de validation...' : `Payer ${selectedPlan.prix.toLocaleString()} FCFA`}
                          {!processing && <ArrowRight className="w-5 h-5" />}
                        </button>
                      </div>
                    </form>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
