/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from 'react';
import { Megaphone } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ExternalAdRecord, fetchActiveExternalAds } from '../lib/services';

export default function Banner728x90() {
  const [adIndex, setAdIndex] = useState(0);
  const [externalAds, setExternalAds] = useState<ExternalAdRecord[]>([]);

  useEffect(() => {
    let mounted = true;
    fetchActiveExternalAds('TopRecherche')
      .then(data => { if (mounted) setExternalAds(data); })
      .catch(error => console.warn('Publicités Supabase indisponibles:', error));
    return () => { mounted = false; };
  }, []);

  const handleNextAd = () => {
    if (externalAds.length > 1) setAdIndex((prev) => (prev + 1) % externalAds.length);
  };

  const externalAd = externalAds[adIndex % Math.max(externalAds.length, 1)];
  if (!externalAd) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full bg-[#e8eefc] border-b border-blue-100 py-2.5 px-4 relative flex flex-col items-center justify-center min-h-[70px]"
        id="top-ad-banner"
      >
        <span className="text-[9px] font-semibold text-blue-500 tracking-widest uppercase mb-0.5">
          PUBLICITÉ
        </span>
        <div className="flex items-center justify-center gap-3 text-center max-w-3xl px-8">
          <Megaphone className="w-4 h-4 text-[#02603c] shrink-0 animate-bounce hidden sm:inline" />
            <a href={externalAd.lien_redirection} target="_blank" rel="noreferrer" className="flex items-center gap-3 min-w-0">
              <img src={externalAd.image_banniere_url} alt={externalAd.nom_entreprise} className="h-10 sm:h-12 max-w-[65vw] object-contain rounded" />
              <span className="text-xs sm:text-sm font-bold text-[#02603c] hidden sm:inline">{externalAd.nom_entreprise}</span>
            </a>
          <button
            onClick={handleNextAd}
            className="text-[10px] bg-white text-blue-800 font-bold px-2 py-0.5 rounded shadow-xs hover:bg-[#02603c] hover:text-white transition-all shrink-0 cursor-pointer"
          >
            Suivante
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
