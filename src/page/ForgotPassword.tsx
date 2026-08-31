import React, { useState } from 'react';
import { ArrowLeft, Mail } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ForgotPassword() {
  const { requestPasswordReset } = useAuth();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault(); setLoading(true); setError('');
    const result = await requestPasswordReset(email.trim());
    if (result.success) setSent(true); else setError(result.error || "L'envoi a échoué.");
    setLoading(false);
  };

  return <div className="min-h-[70vh] flex items-center justify-center px-4"><div className="bg-white border border-slate-100 shadow-xl rounded-[2rem] p-8 w-full max-w-md"><Mail className="w-10 h-10 text-brand mb-5" /><h2 className="text-2xl font-extrabold text-slate-900">Mot de passe oublié</h2><p className="text-sm text-slate-500 mt-2 mb-6">Recevez un lien sécurisé pour choisir un nouveau mot de passe.</p>{sent ? <div className="bg-emerald-50 text-emerald-700 p-4 rounded-xl font-bold text-sm">Si cette adresse existe, un e-mail de réinitialisation a été envoyé.</div> : <form onSubmit={submit} className="space-y-4">{error && <div className="bg-rose-50 text-rose-700 p-4 rounded-xl text-sm font-bold">{error}</div>}<input required type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="vous@exemple.com" className="w-full px-4 py-3 border border-slate-200 rounded-xl" /><button disabled={loading} className="w-full bg-brand text-white py-3 rounded-xl font-bold disabled:opacity-50">{loading ? 'Envoi...' : 'Envoyer le lien'}</button></form>}<Link to="/login" className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-brand"><ArrowLeft className="w-4 h-4" />Retour à la connexion</Link></div></div>;
}
