import React, { useState } from 'react';
import { Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ResetPassword() {
  const { updatePassword } = useAuth();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (password.length < 8) return setError('Le mot de passe doit contenir au moins 8 caractères.');
    if (password !== confirmation) return setError('Les mots de passe ne correspondent pas.');
    setLoading(true); setError('');
    const result = await updatePassword(password);
    if (result.success) navigate('/login', { state: { message: 'Mot de passe modifié. Vous pouvez vous connecter.' } });
    else setError(result.error || 'La modification a échoué. Le lien est peut-être expiré.');
    setLoading(false);
  };

  return <div className="min-h-[70vh] flex items-center justify-center px-4"><div className="bg-white border border-slate-100 shadow-xl rounded-[2rem] p-8 w-full max-w-md"><Lock className="w-10 h-10 text-brand mb-5" /><h2 className="text-2xl font-extrabold text-slate-900">Nouveau mot de passe</h2><p className="text-sm text-slate-500 mt-2 mb-6">Choisissez un mot de passe d'au moins huit caractères.</p><form onSubmit={submit} className="space-y-4">{error && <div className="bg-rose-50 text-rose-700 p-4 rounded-xl text-sm font-bold">{error}</div>}<input required minLength={8} type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Nouveau mot de passe" className="w-full px-4 py-3 border border-slate-200 rounded-xl" /><input required minLength={8} type="password" value={confirmation} onChange={e => setConfirmation(e.target.value)} placeholder="Confirmer le mot de passe" className="w-full px-4 py-3 border border-slate-200 rounded-xl" /><button disabled={loading} className="w-full bg-brand text-white py-3 rounded-xl font-bold disabled:opacity-50">{loading ? 'Modification...' : 'Modifier le mot de passe'}</button></form></div></div>;
}
