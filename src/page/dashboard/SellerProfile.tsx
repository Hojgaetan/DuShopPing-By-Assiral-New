import React, { useEffect, useState } from 'react';
import { AlertCircle, FileCheck2, KeyRound, Loader2, Save, Upload, UserRound } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { fetchMySellerVerification, SellerVerificationRecord, submitSellerVerification } from '../../lib/services';

export default function SellerProfile() {
  const { user, updateUser, updatePassword } = useAuth();
  const [nom, setNom] = useState(user?.nom || '');
  const [telephone, setTelephone] = useState(user?.telephone || '+237 ');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [verification, setVerification] = useState<SellerVerificationRecord | null>(null);
  const [documentType, setDocumentType] = useState<SellerVerificationRecord['type_document']>('CNI');
  const isCompany = user?.role === 'Entreprise';
  const [rcc, setRcc] = useState<File | null>(null);
  const [recto, setRecto] = useState<File | null>(null);
  const [verso, setVerso] = useState<File | null>(null);
  const [submittingDocuments, setSubmittingDocuments] = useState(false);

  useEffect(() => { fetchMySellerVerification().then(setVerification).catch(() => undefined); }, []);

  const saveProfile = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(''); setMessage('');
    if (!/^2376\d{8}$/.test(telephone.replace(/\D/g, ''))) {
      setError('Saisissez un numéro camerounais valide au format +237 6XXXXXXXX.');
      return;
    }
    setSavingProfile(true);
    try {
      await updateUser({ nom, telephone });
      setMessage('Profil mis à jour avec succès.');
    } catch (profileError) {
      setError(profileError instanceof Error ? profileError.message : 'Impossible de modifier le profil.');
    } finally {
      setSavingProfile(false);
    }
  };

  const savePassword = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(''); setMessage('');
    if (password.length < 8) { setError('Le mot de passe doit contenir au moins 8 caractères.'); return; }
    if (password !== confirmation) { setError('Les mots de passe ne correspondent pas.'); return; }
    setSavingPassword(true);
    const result = await updatePassword(password);
    if (result.success) {
      setPassword(''); setConfirmation('');
      setMessage('Mot de passe modifié avec succès.');
    } else {
      setError(result.error || 'Impossible de modifier le mot de passe.');
    }
    setSavingPassword(false);
  };

  const submitDocuments = async (event: React.FormEvent) => {
    event.preventDefault(); setError(''); setMessage('');
    if (isCompany && (documentType !== 'CNI' || !rcc)) { setError('La CNI et le RCC sont obligatoires pour une entreprise.'); return; }
    if (!recto) { setError('Le recto ou la page principale du document est obligatoire.'); return; }
    if (documentType === 'CNI' && !verso) { setError('Le verso de la CNI est obligatoire.'); return; }
    setSubmittingDocuments(true);
    try {
      await submitSellerVerification(documentType, recto, verso, rcc);
      setVerification(await fetchMySellerVerification());
      setRecto(null); setVerso(null); setRcc(null);
      setMessage('Dossier transmis. Votre boutique restera en attente pendant son examen.');
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : 'Impossible de transmettre les documents.');
    } finally { setSubmittingDocuments(false); }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div><h2 className="text-3xl font-extrabold text-slate-900 flex items-center gap-3"><UserRound className="text-[#02603c]" />{isCompany ? 'Profil entreprise' : 'Mon profil vendeur'}</h2><p className="text-slate-500 mt-2">Gérez vos informations personnelles et la sécurité de votre compte.</p></div>
      {error && <div className="bg-rose-50 text-rose-700 border border-rose-100 rounded-xl p-4 flex gap-2 font-bold text-sm"><AlertCircle className="w-5 h-5 shrink-0" />{error}</div>}
      {message && <div className="bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-xl p-4 font-bold text-sm">{message}</div>}
      <form onSubmit={saveProfile} className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-7 space-y-5">
        <h3 className="font-extrabold text-lg text-slate-900">Informations personnelles</h3>
        <div><label className="block text-sm font-bold text-slate-700 mb-1.5">Nom</label><input required minLength={2} value={nom} onChange={e => setNom(e.target.value)} className="w-full px-4 py-3 border border-slate-200 rounded-xl" /></div>
        <div><label className="block text-sm font-bold text-slate-700 mb-1.5">E-mail</label><input disabled value={user?.email || ''} className="w-full px-4 py-3 border border-slate-100 rounded-xl bg-slate-50 text-slate-400" /><p className="text-xs text-slate-400 mt-1">L’adresse e-mail ne peut pas être modifiée depuis cet écran.</p></div>
        <div><label className="block text-sm font-bold text-slate-700 mb-1.5">Téléphone</label><input required value={telephone} onChange={e => setTelephone(e.target.value)} placeholder="+237 6XXXXXXXX" className="w-full px-4 py-3 border border-slate-200 rounded-xl" /></div>
        <button disabled={savingProfile} className="px-5 py-3 bg-[#02603c] text-white rounded-xl font-bold inline-flex gap-2 disabled:opacity-50">{savingProfile ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}Enregistrer</button>
      </form>
      <form onSubmit={submitDocuments} className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-7 space-y-5">
        <div className="flex items-start justify-between gap-4">
          <div><h3 className="font-extrabold text-lg text-slate-900 flex items-center gap-2"><FileCheck2 className="w-5 h-5 text-indigo-600" />{isCompany ? 'Documents de l’entreprise : CNI et RCC' : 'Vérification d’identité'}</h3><p className="text-sm text-slate-500 mt-1">Les pièces sont privées et accessibles uniquement à l’administration.</p></div>
          {verification && <span className={`px-3 py-1 rounded-full text-xs font-bold ${verification.statut === 'Approuve' ? 'bg-emerald-100 text-emerald-700' : verification.statut === 'Rejete' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'}`}>{verification.statut}</span>}
        </div>
        {verification?.motif_decision && <div className="bg-rose-50 text-rose-700 border border-rose-100 p-4 rounded-xl text-sm"><strong>Motif du rejet :</strong> {verification.motif_decision}</div>}
        {verification?.statut === 'Approuve' ? <div className="bg-emerald-50 text-emerald-700 p-4 rounded-xl font-bold text-sm">Votre identité a été vérifiée et votre boutique est approuvée.</div> : <>
          <label className="block"><span className="block text-sm font-bold text-slate-700 mb-1.5">Type de pièce</span><select value={documentType} onChange={e => setDocumentType(e.target.value as SellerVerificationRecord['type_document'])} className="w-full px-4 py-3 border border-slate-200 rounded-xl"><option>CNI</option>{!isCompany && <><option>Passeport</option><option>Permis</option></>}</select></label>
          <div className="grid sm:grid-cols-2 gap-4">
            <label className="block"><span className="block text-sm font-bold text-slate-700 mb-1.5">Recto / page principale *</span><input required type="file" accept=".jpg,.jpeg,.png,.webp,.pdf" onChange={e => setRecto(e.target.files?.[0] || null)} className="block w-full text-sm border border-slate-200 rounded-xl p-2" /></label>
            <label className="block"><span className="block text-sm font-bold text-slate-700 mb-1.5">Verso {documentType === 'CNI' ? '*' : '(facultatif)'}</span><input required={documentType === 'CNI'} type="file" accept=".jpg,.jpeg,.png,.webp,.pdf" onChange={e => setVerso(e.target.files?.[0] || null)} className="block w-full text-sm border border-slate-200 rounded-xl p-2" /></label>
          </div>
          {isCompany && <label className="block"><span className="block text-sm font-bold text-slate-700 mb-1.5">RCC de l’entreprise *</span><input required type="file" accept=".jpg,.jpeg,.png,.webp,.pdf" onChange={e => setRcc(e.target.files?.[0] || null)} className="block w-full text-sm border border-slate-200 rounded-xl p-2" /></label>}
          <p className="text-xs text-slate-400">JPG, PNG, WEBP ou PDF, 5 Mo maximum par fichier. Une nouvelle soumission replace le dossier en attente.</p>
          <button disabled={submittingDocuments} className="px-5 py-3 bg-indigo-600 text-white rounded-xl font-bold inline-flex gap-2 disabled:opacity-50">{submittingDocuments ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}Transmettre pour vérification</button>
        </>}
      </form>
      <form onSubmit={savePassword} className="bg-white rounded-[2rem] border border-slate-100 shadow-sm p-7 space-y-5">
        <h3 className="font-extrabold text-lg text-slate-900 flex items-center gap-2"><KeyRound className="w-5 h-5" />Changer le mot de passe</h3>
        <div className="grid sm:grid-cols-2 gap-4"><input type="password" required minLength={8} value={password} onChange={e => setPassword(e.target.value)} placeholder="Nouveau mot de passe" className="px-4 py-3 border border-slate-200 rounded-xl" /><input type="password" required minLength={8} value={confirmation} onChange={e => setConfirmation(e.target.value)} placeholder="Confirmer le mot de passe" className="px-4 py-3 border border-slate-200 rounded-xl" /></div>
        <button disabled={savingPassword} className="px-5 py-3 bg-slate-900 text-white rounded-xl font-bold inline-flex gap-2 disabled:opacity-50">{savingPassword && <Loader2 className="w-5 h-5 animate-spin" />}Modifier le mot de passe</button>
      </form>
    </div>
  );
}
