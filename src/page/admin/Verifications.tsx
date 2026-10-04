import React, { useCallback, useEffect, useState } from 'react';
import { AlertCircle, CheckCircle2, ExternalLink, FileCheck2, Loader2, RefreshCw, XCircle } from 'lucide-react';
import { AdminVerificationRecord, createVerificationDocumentUrl, fetchAdminSellerVerifications, reviewSellerVerification } from '../../lib/services';

export default function AdminVerifications() {
  const [records, setRecords] = useState<AdminVerificationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState('');
  const [error, setError] = useState('');
  const load = useCallback(async () => { setLoading(true); setError(''); try { setRecords(await fetchAdminSellerVerifications()); } catch { setError('Impossible de charger les dossiers de vérification.'); } finally { setLoading(false); } }, []);
  useEffect(() => { void load(); }, [load]);

  const openDocument = async (path: string) => {
    try { window.open(await createVerificationDocumentUrl(path), '_blank', 'noopener,noreferrer'); }
    catch { setError('Impossible de générer le lien privé du document.'); }
  };
  const decide = async (record: AdminVerificationRecord, approve: boolean) => {
    let reason = '';
    if (!approve) {
      reason = window.prompt('Indiquez précisément le motif du rejet :')?.trim() || '';
      if (!reason) return;
    } else if (!window.confirm(`Approuver l’identité de ${record.vendeur_nom} et rendre sa boutique visible ?`)) return;
    setProcessing(record.vendeur_id); setError('');
    try { await reviewSellerVerification(record.vendeur_id, approve, reason); await load(); }
    catch { setError('La décision n’a pas pu être enregistrée.'); }
    finally { setProcessing(''); }
  };
  const badge = (status: AdminVerificationRecord['statut']) => status === 'Approuve' ? 'bg-emerald-100 text-emerald-700' : status === 'Rejete' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700';

  return <div className="space-y-6">
    <div className="flex items-start justify-between gap-4"><div><h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2"><FileCheck2 className="text-indigo-600" />Vérification des vendeurs et entreprises</h1><p className="text-sm text-slate-500 mt-1">Consultez les pièces privées et rendez une décision motivée.</p></div><button onClick={() => void load()} className="p-2.5 rounded-xl bg-slate-100 text-slate-600"><RefreshCw className="w-5 h-5" /></button></div>
    {error && <div className="p-4 rounded-xl bg-rose-50 text-rose-700 border border-rose-100 flex gap-2 font-bold text-sm"><AlertCircle className="w-5 h-5" />{error}</div>}
    <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
      {loading ? <div className="p-14 text-center text-slate-500"><Loader2 className="w-8 h-8 mx-auto mb-3 animate-spin text-indigo-600" />Chargement…</div> : records.length === 0 ? <div className="p-14 text-center text-slate-500">Aucun dossier soumis.</div> :
      <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="px-5 py-4">Vendeur</th><th className="px-5 py-4">Dossier</th><th className="px-5 py-4">Documents privés</th><th className="px-5 py-4">Statut</th><th className="px-5 py-4 text-right">Décision</th></tr></thead><tbody className="divide-y divide-slate-100">
        {records.map(record => <tr key={record.vendeur_id} className="hover:bg-slate-50"><td className="px-5 py-4"><p className="font-bold text-slate-900">{record.vendeur_nom}</p><p className="text-xs text-slate-500">{record.vendeur_email}</p><p className="text-xs text-indigo-600 mt-1">{record.boutique_nom}</p></td>
          <td className="px-5 py-4"><p className="font-bold">{record.type_profil === 'Entreprise' ? 'Entreprise : CNI et RCC' : record.type_document}</p><p className="text-xs text-slate-400 mt-1">{new Date(record.soumis_le).toLocaleString('fr-FR')}</p>{record.motif_decision && <p className="text-xs text-rose-600 mt-2 max-w-xs">Motif : {record.motif_decision}</p>}</td>
          <td className="px-5 py-4"><div className="flex gap-2"><button onClick={() => void openDocument(record.document_recto_path)} className="px-3 py-2 bg-indigo-50 text-indigo-700 rounded-lg font-bold text-xs inline-flex gap-1"><ExternalLink className="w-4 h-4" />Recto</button>{record.document_verso_path && <button onClick={() => void openDocument(record.document_verso_path!)} className="px-3 py-2 bg-indigo-50 text-indigo-700 rounded-lg font-bold text-xs inline-flex gap-1"><ExternalLink className="w-4 h-4" />Verso</button>}{record.document_rcc_path && <button onClick={() => void openDocument(record.document_rcc_path!)} className="px-3 py-2 bg-indigo-50 text-indigo-700 rounded-lg font-bold text-xs inline-flex gap-1"><ExternalLink className="w-4 h-4" />RCC</button>}</div></td>
          <td className="px-5 py-4"><span className={`px-3 py-1 rounded-full text-xs font-bold ${badge(record.statut)}`}>{record.statut}</span></td>
          <td className="px-5 py-4 text-right"><div className="inline-flex gap-2"><button disabled={processing === record.vendeur_id} onClick={() => void decide(record, true)} title="Approuver" className="p-2 rounded-lg bg-emerald-50 text-emerald-700 disabled:opacity-50">{processing === record.vendeur_id ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}</button><button disabled={processing === record.vendeur_id} onClick={() => void decide(record, false)} title="Rejeter avec motif" className="p-2 rounded-lg bg-rose-50 text-rose-700 disabled:opacity-50"><XCircle className="w-5 h-5" /></button></div></td>
        </tr>)}
      </tbody></table></div>}
    </div>
  </div>;
}
