import React, { useCallback, useEffect, useState } from 'react';
import { AlertCircle, Check, Clock, CreditCard, Loader2, RefreshCw, X } from 'lucide-react';
import { BoostPaymentReviewRecord, fetchBoostPayments, reviewBoostPayment } from '../../lib/services';

export default function AdminPayments() {
  const [payments, setPayments] = useState<BoostPaymentReviewRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [error, setError] = useState('');

  const loadPayments = useCallback(async () => {
    setLoading(true); setError('');
    try { setPayments(await fetchBoostPayments()); }
    catch { setError('Impossible de charger les demandes de paiement.'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { void loadPayments(); }, [loadPayments]);

  const review = async (payment: BoostPaymentReviewRecord, approve: boolean) => {
    const action = approve ? 'valider' : 'rejeter';
    if (!window.confirm(`Voulez-vous ${action} la demande ${payment.reference_transaction} ?`)) return;
    setProcessingId(payment.id); setError('');
    try { await reviewBoostPayment(payment.id, approve); await loadPayments(); }
    catch (reviewError) { setError(`Impossible de ${action} cette demande : ${reviewError && typeof reviewError === 'object' && 'message' in reviewError ? String(reviewError.message) : 'réessayez.'}`); }
    finally { setProcessingId(null); }
  };

  const statusClasses = {
    EnAttente: 'bg-amber-100 text-amber-700', Reussi: 'bg-emerald-100 text-emerald-700', Echoue: 'bg-rose-100 text-rose-700',
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center gap-4">
        <div><h2 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2"><CreditCard className="text-indigo-600" />Paiements Boost</h2><p className="text-sm text-slate-500 mt-1">Contrôlez les demandes avant d'activer une campagne.</p></div>
        <button onClick={() => void loadPayments()} className="p-2.5 rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200"><RefreshCw className="w-5 h-5" /></button>
      </div>
      {error && <div className="bg-rose-50 text-rose-700 border border-rose-100 rounded-xl p-4 flex gap-2 text-sm font-bold"><AlertCircle className="w-5 h-5" />{error}</div>}
      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
        {loading ? <div className="p-12 text-center text-slate-500"><Loader2 className="w-8 h-8 mx-auto mb-3 animate-spin text-indigo-600" />Chargement...</div> : payments.length === 0 ? <div className="p-12 text-center text-slate-500">Aucune demande de paiement.</div> : (
          <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="px-5 py-4">Demande</th><th className="px-5 py-4">Vendeur / Produit</th><th className="px-5 py-4">Plan</th><th className="px-5 py-4">Montant</th><th className="px-5 py-4">Statut</th><th className="px-5 py-4 text-right">Actions</th></tr></thead>
          <tbody className="divide-y divide-slate-100">{payments.map(payment => <tr key={payment.id} className="hover:bg-slate-50"><td className="px-5 py-4"><p className="font-bold text-slate-800">{payment.reference_transaction}</p><p className="text-xs text-slate-400 mt-1">{new Date(payment.date_paiement).toLocaleString('fr-FR')} · {payment.operateur} {payment.telephone_paiement || ''}</p></td><td className="px-5 py-4"><p className="font-bold text-slate-800">{payment.vendeur_nom}</p><p className="text-xs text-slate-500">{payment.produit_titre}</p></td><td className="px-5 py-4 font-semibold text-slate-600">{payment.plan_nom}</td><td className="px-5 py-4 font-bold text-indigo-700">{payment.montant.toLocaleString('fr-FR')} FCFA</td><td className="px-5 py-4"><span className={`${statusClasses[payment.statut]} px-3 py-1 rounded-full text-xs font-bold`}>{payment.statut}</span></td><td className="px-5 py-4 text-right">{payment.statut === 'EnAttente' ? <div className="inline-flex gap-2"><button disabled={processingId !== null} onClick={() => void review(payment, true)} className="p-2 bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100 disabled:opacity-50" title="Valider">{processingId === payment.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}</button><button disabled={processingId !== null} onClick={() => void review(payment, false)} className="p-2 bg-rose-50 text-rose-700 rounded-lg hover:bg-rose-100 disabled:opacity-50" title="Rejeter"><X className="w-4 h-4" /></button></div> : <span className="text-xs text-slate-400 inline-flex items-center gap-1"><Clock className="w-3 h-3" />Traitée</span>}</td></tr>)}</tbody></table></div>
        )}
      </div>
    </div>
  );
}
