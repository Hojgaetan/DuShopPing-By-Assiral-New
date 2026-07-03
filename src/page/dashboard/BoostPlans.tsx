import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Zap, Crown, Gem, Check, Phone, ArrowRight, CheckCircle2, X, Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { subscribeToBoost } from '../../lib/services';

const PLANS = [
  { id: 'p1111111-1111-1111-1111-111111111111', nom: 'PLAN DE BASE', jours: 7, prix: 5000, multi: 1.2, icon: Zap, color: 'emerald' },
  { id: 'p2222222-2222-2222-2222-222222222222', nom: 'PLAN BOOST ÉLITE', jours: 14, prix: 15000, multi: 1.8, icon: Crown, color: 'amber', isPopular: true },
  { id: 'p3333333-3333-3333-3333-333333333333', nom: 'PLAN IMPÉRIAL', jours: 30, prix: 35000, multi: 2.5, icon: Gem, color: 'purple' },
];

// ======================== CONFETTI ENGINE ========================
interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  rotation: number;
  rotationSpeed: number;
  opacity: number;
  shape: 'rect' | 'circle' | 'star';
}

function createConfettiParticles(count: number): Particle[] {
  const colors = [
    '#ff6b6b', '#ffd93d', '#6bcb77', '#4d96ff',
    '#ff6f91', '#ff9671', '#ffc75f', '#845ec2',
    '#00c9a7', '#c34a36', '#ff8066', '#b39cd0',
    '#e8a0bf', '#fbeaff', '#00d2fc', '#0089ba'
  ];
  const shapes: Particle['shape'][] = ['rect', 'circle', 'star'];

  return Array.from({ length: count }, () => ({
    x: Math.random() * window.innerWidth,
    y: -20 - Math.random() * 100,
    vx: (Math.random() - 0.5) * 12,
    vy: Math.random() * 4 + 3,
    color: colors[Math.floor(Math.random() * colors.length)],
    size: Math.random() * 10 + 5,
    rotation: Math.random() * 360,
    rotationSpeed: (Math.random() - 0.5) * 15,
    opacity: 1,
    shape: shapes[Math.floor(Math.random() * shapes.length)],
  }));
}

function ConfettiCanvas({ active, onComplete }: { active: boolean; onComplete: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animFrameRef = useRef<number>(0);

  useEffect(() => {
    if (!active) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Create 200 particles for a dramatic effect
    particlesRef.current = createConfettiParticles(200);

    const drawStar = (ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number) => {
      const spikes = 5;
      const outerRadius = size;
      const innerRadius = size / 2;
      let rot = Math.PI / 2 * 3;
      const step = Math.PI / spikes;

      ctx.beginPath();
      ctx.moveTo(cx, cy - outerRadius);
      for (let i = 0; i < spikes; i++) {
        ctx.lineTo(cx + Math.cos(rot) * outerRadius, cy + Math.sin(rot) * outerRadius);
        rot += step;
        ctx.lineTo(cx + Math.cos(rot) * innerRadius, cy + Math.sin(rot) * innerRadius);
        rot += step;
      }
      ctx.lineTo(cx, cy - outerRadius);
      ctx.closePath();
      ctx.fill();
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      let stillAlive = false;

      particlesRef.current.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.12; // gravity
        p.vx *= 0.99; // friction
        p.rotation += p.rotationSpeed;
        p.opacity -= 0.003;

        if (p.opacity > 0 && p.y < canvas.height + 50) {
          stillAlive = true;

          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate((p.rotation * Math.PI) / 180);
          ctx.globalAlpha = Math.max(0, p.opacity);
          ctx.fillStyle = p.color;

          if (p.shape === 'rect') {
            ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
          } else if (p.shape === 'circle') {
            ctx.beginPath();
            ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
            ctx.fill();
          } else {
            drawStar(ctx, 0, 0, p.size / 2);
          }

          ctx.restore();
        }
      });

      if (stillAlive) {
        animFrameRef.current = requestAnimationFrame(animate);
      } else {
        onComplete();
      }
    };

    // Start with a burst wave - fire 3 waves
    const fireWave = (delay: number) => {
      setTimeout(() => {
        particlesRef.current.push(...createConfettiParticles(80));
      }, delay);
    };
    fireWave(300);
    fireWave(600);

    animFrameRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animFrameRef.current);
    };
  }, [active, onComplete]);

  if (!active) return null;

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-[10001] pointer-events-none"
      style={{ width: '100vw', height: '100vh' }}
    />
  );
}

// ======================== MAIN COMPONENT ========================
export default function BoostPlans() {
  const { user } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState<typeof PLANS[0] | null>(null);

  // Confirmation popup state
  const [showConfirmPopup, setShowConfirmPopup] = useState(false);
  const [pendingPlan, setPendingPlan] = useState<typeof PLANS[0] | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  
  // Payment states
  const [operateur, setOperateur] = useState<'MoMo' | 'OM'>('MoMo');
  const [numero, setNumero] = useState('');
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);

  // Handle clicking on a plan - show confirmation popup
  const handlePlanClick = (plan: typeof PLANS[0]) => {
    setPendingPlan(plan);
    setShowConfirmPopup(true);
  };

  // Handle confirming the plan selection
  const handleConfirmPlan = useCallback(() => {
    if (!pendingPlan) return;

    setShowConfirmPopup(false);
    setShowConfetti(true);
    setShowSuccessMessage(true);

    // After confetti, set the selected plan and show payment
    setTimeout(() => {
      setSelectedPlan(pendingPlan);
      setShowSuccessMessage(false);
    }, 3500);
  }, [pendingPlan]);

  const handleConfettiComplete = useCallback(() => {
    setShowConfetti(false);
  }, []);

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

  // Get color classes for plan
  const getColorClasses = (color: string) => {
    const colorMap: Record<string, { bg: string; text: string; border: string; shadow: string; bgLight: string }> = {
      emerald: { bg: 'bg-emerald-600', text: 'text-emerald-600', border: 'border-emerald-500', shadow: 'shadow-emerald-100/50', bgLight: 'bg-emerald-50' },
      amber: { bg: 'bg-amber-500', text: 'text-amber-600', border: 'border-amber-500', shadow: 'shadow-amber-100/50', bgLight: 'bg-amber-50' },
      purple: { bg: 'bg-purple-600', text: 'text-purple-600', border: 'border-purple-500', shadow: 'shadow-purple-100/50', bgLight: 'bg-purple-50' },
    };
    return colorMap[color] || colorMap.emerald;
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

      {/* Confetti Canvas */}
      <ConfettiCanvas active={showConfetti} onComplete={handleConfettiComplete} />

      {/* Success Floating Message */}
      <AnimatePresence>
        {showSuccessMessage && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5, y: -50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.5, y: -30 }}
            transition={{ type: 'spring', damping: 15, stiffness: 200 }}
            className="fixed inset-0 z-[10000] flex items-center justify-center pointer-events-none"
          >
            <div className="bg-white/95 backdrop-blur-xl rounded-[2rem] shadow-2xl px-10 py-8 text-center border border-emerald-200">
              <motion.div
                initial={{ rotate: -180, scale: 0 }}
                animate={{ rotate: 0, scale: 1 }}
                transition={{ type: 'spring', delay: 0.2, damping: 10 }}
                className="text-6xl mb-4"
              >
                🎉
              </motion.div>
              <motion.h3
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-2xl font-extrabold text-slate-900 mb-2"
              >
                Formule Sélectionnée !
              </motion.h3>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="text-slate-600"
              >
                {pendingPlan?.nom} — {pendingPlan?.prix.toLocaleString('fr-FR')} FCFA
              </motion.p>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7 }}
                className="flex items-center justify-center gap-2 mt-4"
              >
                <Sparkles className="w-5 h-5 text-amber-500" />
                <span className="text-sm text-amber-600 font-bold">Passez au paiement ci-dessous</span>
                <Sparkles className="w-5 h-5 text-amber-500" />
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Confirmation Popup Modal */}
      {typeof document !== 'undefined' ? createPortal(
        <AnimatePresence>
          {showConfirmPopup && pendingPlan && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[99999] flex items-center justify-center p-4"
              onClick={() => setShowConfirmPopup(false)}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.85, y: 30 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.85, y: 30 }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden border border-slate-100"
                onClick={e => e.stopPropagation()}
              >
              {/* Header with gradient */}
              <div className={`p-6 text-white relative ${
                pendingPlan.color === 'emerald' ? 'bg-gradient-to-r from-emerald-500 to-teal-500' :
                pendingPlan.color === 'amber' ? 'bg-gradient-to-r from-amber-500 to-orange-500' :
                'bg-gradient-to-r from-purple-500 to-indigo-500'
              }`}>
                <button
                  onClick={() => setShowConfirmPopup(false)}
                  className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center">
                    <pendingPlan.icon className="w-7 h-7" />
                  </div>
                  <div>
                    <h3 className="text-xl font-extrabold">{pendingPlan.nom}</h3>
                    <p className="text-white/80 text-sm">Confirmation de sélection</p>
                  </div>
                </div>
              </div>

              {/* Plan Details */}
              <div className="p-6 space-y-4">
                <div className="bg-slate-50 rounded-2xl p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-500">Prix</span>
                    <span className="text-lg font-extrabold text-slate-900">{pendingPlan.prix.toLocaleString('fr-FR')} FCFA</span>
                  </div>
                  <div className="h-px bg-slate-200" />
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-500">Durée</span>
                    <span className="text-sm font-bold text-slate-700">{pendingPlan.jours} jours</span>
                  </div>
                  <div className="h-px bg-slate-200" />
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-500">Multiplicateur de visibilité</span>
                    <span className="text-sm font-bold text-slate-700">x{pendingPlan.multi}</span>
                  </div>
                  <div className="h-px bg-slate-200" />
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-500">Publications</span>
                    <span className="text-sm font-bold text-emerald-600">Illimitées ✓</span>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowConfirmPopup(false)}
                    className="flex-1 py-3.5 rounded-xl border-2 border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    Annuler
                  </button>
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={handleConfirmPlan}
                    className={`flex-1 py-3.5 rounded-xl text-white font-extrabold transition-all shadow-lg cursor-pointer flex items-center justify-center gap-2 ${
                      pendingPlan.color === 'emerald' ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-200' :
                      pendingPlan.color === 'amber' ? 'bg-amber-500 hover:bg-amber-600 shadow-amber-200' :
                      'bg-purple-600 hover:bg-purple-700 shadow-purple-200'
                    }`}
                  >
                    <Check className="w-5 h-5" />
                    OK
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
        </AnimatePresence>,
      document.body) : null}

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
              {PLANS.map((plan) => {
                const colors = getColorClasses(plan.color);
                return (
                  <motion.div
                    key={plan.id}
                    whileHover={{ y: -4 }}
                    onClick={() => handlePlanClick(plan)}
                    className={`relative bg-white rounded-3xl p-6 border-2 transition-all cursor-pointer ${
                      selectedPlan?.id === plan.id
                        ? `${colors.border} shadow-lg ${colors.shadow} scale-105 z-10`
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
                    
                    <div className={`w-14 h-14 rounded-2xl ${colors.bgLight} ${colors.text} flex items-center justify-center mb-6`}>
                      <plan.icon className="w-7 h-7" />
                    </div>
                    
                    <h3 className="text-xl font-extrabold text-slate-900 mb-2">{plan.nom}</h3>
                    <div className="flex items-baseline gap-1 mb-6">
                      <span className="text-3xl font-black text-slate-900">{plan.prix.toLocaleString('fr-FR')}</span>
                      <span className="text-sm font-bold text-slate-500">FCFA</span>
                    </div>

                    <ul className="space-y-3 mb-8">
                      <li className="flex items-start gap-2 text-sm text-slate-600 font-medium">
                        <Check className={`w-5 h-5 ${colors.text} shrink-0`} />
                        Mise en avant {plan.jours} jours
                      </li>
                      <li className="flex items-start gap-2 text-sm text-slate-600 font-medium">
                        <Check className={`w-5 h-5 ${colors.text} shrink-0`} />
                        Visibilité x{plan.multi}
                      </li>
                      <li className="flex items-start gap-2 text-sm text-slate-600 font-medium">
                        <Check className={`w-5 h-5 ${colors.text} shrink-0`} />
                        Publications illimitées
                      </li>
                    </ul>

                    <button className={`w-full py-3 rounded-xl font-bold transition-colors ${
                      selectedPlan?.id === plan.id
                        ? `${colors.bgLight} ${colors.text}`
                        : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                    }`}>
                      {selectedPlan?.id === plan.id ? '✓ Sélectionné' : 'Choisir ce plan'}
                    </button>
                  </motion.div>
                );
              })}
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
