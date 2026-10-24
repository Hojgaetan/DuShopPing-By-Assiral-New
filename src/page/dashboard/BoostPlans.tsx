import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Zap, Crown, Gem, Check, Phone, ArrowRight, CheckCircle2, X, Sparkles, Loader2, AlertCircle, Clock3, History } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { customerServiceNumber, orangeMerchantCode, momoMerchantCode, companyName } from '../../lib/contact';
import { fetchBoutiqueProducts, fetchMyBoostRequests, fetchSponsoringPlans, SellerBoostRequest, SellerProductSummary, subscribeToBoost } from '../../lib/services';

interface BoostPlan {
  id: string;
  nom: string;
  jours: number;
  prix: number;
  multi: number;
  icon: React.ComponentType<{ className?: string }>;
  color: 'emerald' | 'amber' | 'purple';
  isPopular?: boolean;
}

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
  const [plans, setPlans] = useState<BoostPlan[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [plansError, setPlansError] = useState('');
  const [selectedPlan, setSelectedPlan] = useState<BoostPlan | null>(null);
  const [products, setProducts] = useState<SellerProductSummary[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [selectionError, setSelectionError] = useState('');

  // Confirmation popup state
  const [showConfirmPopup, setShowConfirmPopup] = useState(false);
  const [pendingPlan, setPendingPlan] = useState<BoostPlan | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  
  // Payment states
  const [operateur, setOperateur] = useState<'MoMo' | 'OM'>('OM');
  const [numero, setNumero] = useState('');
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);
  const [paymentError, setPaymentError] = useState('');
  const [boostRequests, setBoostRequests] = useState<SellerBoostRequest[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(true);

  useEffect(() => {
    let mounted = true;
    const icons = [Zap, Crown, Gem];
    const colors: BoostPlan['color'][] = ['emerald', 'amber', 'purple'];

    fetchSponsoringPlans()
      .then(records => {
        if (!mounted) return;
        const middleIndex = records.length > 1 ? 1 : -1;
        setPlans(records.map((record, index) => ({
          id: record.id,
          nom: record.nom_plan,
          jours: record.duree_en_jours,
          prix: record.prix_unitaire,
          multi: record.multiplicateur_visibilite,
          icon: icons[index % icons.length],
          color: colors[index % colors.length],
          isPopular: index === middleIndex,
        })));
      })
      .catch(() => {
        if (mounted) setPlansError('Impossible de charger les formules de sponsoring.');
      })
      .finally(() => {
        if (mounted) setLoadingPlans(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    if (!user?.boutiqueId) {
      setLoadingProducts(false);
      return;
    }

    fetchBoutiqueProducts(user.boutiqueId)
      .then(data => {
        if (!mounted) return;
        const activeProducts = data.filter(product => product.statut === 'Actif');
        setProducts(activeProducts);
        if (activeProducts.length === 1) setSelectedProductId(activeProducts[0].id);
      })
      .catch(() => {
        if (mounted) setSelectionError('Impossible de charger vos produits actifs.');
      })
      .finally(() => {
        if (mounted) setLoadingProducts(false);
      });

    return () => { mounted = false; };
  }, [user?.boutiqueId]);

  useEffect(() => {
    if (!user) {
      setLoadingRequests(false);
      return;
    }
    fetchMyBoostRequests()
      .then(setBoostRequests)
      .catch(() => setPaymentError("Impossible de charger l'historique des demandes Boost."))
      .finally(() => setLoadingRequests(false));
  }, [user]);

  // Handle clicking on a plan - show confirmation popup
  const handlePlanClick = (plan: BoostPlan) => {
    if (!selectedProductId) {
      setSelectionError('Sélectionnez d’abord le produit à sponsoriser.');
      return;
    }
    setSelectionError('');
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
    if (!user?.boutiqueId || !selectedProductId || !selectedPlan) return;

    const adminWhatsApp = customerServiceNumber;
    if (!adminWhatsApp) {
      setPaymentError("Le numéro WhatsApp de l'administrateur n'est pas encore configuré.");
      return;
    }
    
    setProcessing(true);
    setPaymentError('');
    try {
      const result = await subscribeToBoost(selectedProductId, selectedPlan.id, numero);
      if (!result.success) {
        setPaymentError(result.error || "La demande de paiement n'a pas pu être enregistrée.");
        return;
      }
      setSuccess(true);
      const product = products.find(item => item.id === selectedProductId);
      const proofMessage = [
        'Bonjour, je souhaite transmettre la preuve de paiement de mon Boost DuShopPing.',
        `Référence : ${result.transactionId}`,
        `Plan : ${selectedPlan.nom}`,
        `Produit : ${product?.titre || selectedProductId}`,
        `Montant : ${selectedPlan.prix.toLocaleString('fr-FR')} FCFA`,
        `Moyen de paiement : ${operateur === 'MoMo' ? 'MTN Mobile Money' : 'Orange Money'}`,
        `Numéro payeur : ${numero.trim() || 'Non renseigné'}`,
        '',
        'Je joins la capture ou le reçu de paiement à ce message.',
      ].join('\n');
      window.location.assign(`https://wa.me/${adminWhatsApp}?text=${encodeURIComponent(proofMessage)}`);
    } catch (error) {
      console.error(error);
      setPaymentError("La demande de paiement n'a pas pu être enregistrée.");
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

      <section className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-6">
        <div className="flex items-center gap-3 mb-5">
          <History className="w-5 h-5 text-slate-600" />
          <div>
            <h3 className="font-extrabold text-slate-900">Mes demandes Boost</h3>
            <p className="text-sm text-slate-500">Suivez la vérification de vos paiements et la durée de vos campagnes.</p>
          </div>
        </div>
        {loadingRequests ? (
          <div className="py-5 text-center text-slate-500"><Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" />Chargement...</div>
        ) : boostRequests.length === 0 ? (
          <p className="py-5 text-center text-sm text-slate-500 bg-slate-50 rounded-2xl">Aucune demande Boost pour le moment.</p>
        ) : (
          <div className="space-y-3">
            {boostRequests.map(request => {
              const statusLabel = request.status === 'Reussi' ? 'Validée' : request.status === 'Echoue' ? 'Refusée' : 'En attente';
              const statusClass = request.status === 'Reussi' ? 'bg-emerald-100 text-emerald-700' : request.status === 'Echoue' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700';
              return (
                <div key={request.id} className="border border-slate-100 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap"><p className="font-extrabold text-slate-900">{request.productTitle}</p><span className={`${statusClass} px-2.5 py-1 rounded-full text-[11px] font-bold`}>{statusLabel}</span></div>
                    <p className="text-sm text-slate-500 mt-1">{request.planName} · {request.amount.toLocaleString('fr-FR')} FCFA</p>
                    <p className="text-xs text-slate-400 mt-1">Réf. {request.reference} · {new Date(request.requestedAt).toLocaleString('fr-FR')}</p>
                  </div>
                  <div className="md:text-right text-sm">
                    {request.startsAt && request.endsAt ? (
                      <><p className="font-bold text-emerald-700 inline-flex items-center gap-1"><Clock3 className="w-4 h-4" />Campagne active</p><p className="text-xs text-slate-500 mt-1">Du {new Date(request.startsAt).toLocaleDateString('fr-FR')} au {new Date(request.endsAt).toLocaleDateString('fr-FR')}</p></>
                    ) : request.status === 'EnAttente' ? (
                      <p className="text-xs text-amber-700 font-bold">Preuve en cours de vérification</p>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-6">
        <div className="flex items-center justify-between gap-4 mb-4">
          <div>
            <h3 className="font-extrabold text-slate-900">1. Choisissez le produit à booster</h3>
            <p className="text-sm text-slate-500 mt-1">Seuls vos produits actifs peuvent être sponsorisés.</p>
          </div>
        </div>

        {loadingProducts ? (
          <div className="py-6 text-center text-slate-500"><Loader2 className="w-6 h-6 mx-auto mb-2 animate-spin text-amber-500" />Chargement des produits...</div>
        ) : products.length === 0 ? (
          <div className="bg-amber-50 text-amber-800 border border-amber-100 rounded-xl p-4 text-sm font-bold">
            Publiez et activez au moins un produit avant de choisir une formule Boost.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {products.map(product => (
              <button
                type="button"
                key={product.id}
                onClick={() => { setSelectedProductId(product.id); setSelectionError(''); setSelectedPlan(null); }}
                className={`flex items-center gap-3 p-3 rounded-2xl border-2 text-left transition-all ${selectedProductId === product.id ? 'border-amber-500 bg-amber-50' : 'border-slate-100 hover:border-slate-200'}`}
              >
                <div className="w-14 h-14 rounded-xl bg-slate-100 overflow-hidden shrink-0">
                  {product.images[0] && <img src={product.images[0]} alt="" className="w-full h-full object-cover" />}
                </div>
                <div className="min-w-0"><p className="font-bold text-sm text-slate-900 truncate">{product.titre}</p><p className="text-xs text-emerald-700 font-bold mt-1">{product.prix.toLocaleString('fr-FR')} FCFA</p></div>
              </button>
            ))}
          </div>
        )}
        {selectionError && <p className="mt-3 text-sm font-bold text-rose-600 flex items-center gap-2"><AlertCircle className="w-4 h-4" />{selectionError}</p>}
      </section>

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
            <h3 className="text-2xl font-extrabold text-emerald-900 mb-2">Demande enregistrée</h3>
            <p className="text-emerald-700 max-w-md mx-auto">
              Votre demande de paiement est en attente de confirmation. La formule sera activée uniquement après validation par l'opérateur.
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
            <h3 className="font-extrabold text-slate-900">2. Choisissez votre formule</h3>
            {/* Grille des Plans */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {loadingPlans ? (
                <div className="md:col-span-3 py-12 text-center text-slate-500">
                  <Loader2 className="w-8 h-8 mx-auto mb-3 animate-spin text-amber-500" />
                  Chargement des formules...
                </div>
              ) : plansError ? (
                <div className="md:col-span-3 bg-rose-50 text-rose-700 border border-rose-100 rounded-2xl p-6 flex items-center justify-center gap-2 font-bold">
                  <AlertCircle className="w-5 h-5" /> {plansError}
                </div>
              ) : plans.length === 0 ? (
                <div className="md:col-span-3 bg-white border border-slate-100 rounded-2xl p-10 text-center text-slate-500">
                  Aucune formule n'est disponible pour le moment.
                </div>
              ) : plans.map((plan) => {
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
                    {paymentError && (
                      <div className="mb-6 bg-rose-50 text-rose-700 border border-rose-100 rounded-xl p-4 flex items-center gap-2 text-sm font-bold">
                        <AlertCircle className="w-5 h-5" /> {paymentError}
                      </div>
                    )}
                    
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
                        <p className="text-xs text-slate-500">Le paiement Boost est disponible via Orange Money et MTN Mobile Money.</p>
                      </div>

                      {/* Saisie Numéro et Validation */}
                      <div className="space-y-4 flex flex-col justify-between">
                        <div>
                          {operateur === 'OM' && (
                            <div className="mb-5 rounded-2xl border border-orange-200 bg-orange-50 p-4 text-sm text-slate-700">
                              <p className="font-extrabold text-orange-700 mb-2">Paiement Orange Money</p>
                              <ol className="list-decimal pl-5 space-y-1.5">
                                <li>Composez <strong>#150*47#</strong> sur votre téléphone.</li>
                                <li>Saisissez le code marchand <strong className="text-base">{orangeMerchantCode}</strong> ({companyName}).</li>
                                <li>Payez exactement <strong>{selectedPlan.prix.toLocaleString('fr-FR')} FCFA</strong>.</li>
                                <li>Conservez le reçu ou faites une capture d’écran.</li>
                              </ol>
                            </div>
                          )}
                          {operateur === 'MoMo' && (
                            <div className="mb-5 rounded-2xl border border-yellow-300 bg-yellow-50 p-4 text-sm text-slate-700">
                              <p className="font-extrabold text-yellow-700 mb-2">Paiement MTN Mobile Money</p>
                              <ol className="list-decimal pl-5 space-y-1.5">
                                <li>Composez <strong>*126*4*{momoMerchantCode}*{selectedPlan.prix}#</strong> sur votre téléphone.</li>
                                <li>Vérifiez le nom du marchand : <strong>{companyName}</strong> (code <strong className="text-base">{momoMerchantCode}</strong>).</li>
                                <li>Payez exactement <strong>{selectedPlan.prix.toLocaleString('fr-FR')} FCFA</strong>.</li>
                                <li>Conservez le reçu ou faites une capture d’écran.</li>
                              </ol>
                            </div>
                          )}
                          <label className="block text-sm font-bold text-slate-700 mb-1.5">Numéro {operateur === 'MoMo' ? 'MTN Mobile Money' : 'Orange Money'} <span className="font-medium text-slate-400">(facultatif)</span></label>
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <Phone className="h-5 w-5 text-slate-400" />
                            </div>
                            <input
                              type="tel"
                              value={numero}
                              onChange={(e) => setNumero(e.target.value)}
                              className="appearance-none block w-full pl-10 pr-3 py-3 border border-slate-200 rounded-xl text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-slate-800 transition-all bg-slate-50/50"
                              placeholder="Ex: 6XXXXXXXX"
                            />
                          </div>
                          <p className="text-xs text-slate-500 mt-2">
                            Si vous renseignez ce champ, indiquez le numéro avec lequel vous effectuerez la transaction {operateur === 'MoMo' ? 'MTN Mobile Money' : 'Orange Money'}. Cela aidera l’administrateur à vérifier votre preuve de paiement.
                          </p>
                          <p className="text-xs text-slate-500 mt-2">
                            Une demande de <strong>{selectedPlan.prix.toLocaleString()} FCFA</strong> sera enregistrée. Aucun boost ne sera activé avant vérification de la preuve.
                          </p>
                        </div>

                        <button
                          type="submit"
                          disabled={processing}
                          className={`w-full py-3.5 rounded-xl text-white font-extrabold flex items-center justify-center gap-2 transition-all shadow-md ${
                            operateur === 'MoMo' ? 'bg-[#004f71] hover:bg-[#003a54] shadow-[#004f71]/20' : 'bg-[#ff6600] hover:bg-[#cc5200] shadow-[#ff6600]/20'
                          } disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                          {processing ? 'Enregistrement...' : 'J’ai payé — envoyer la preuve'}
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
