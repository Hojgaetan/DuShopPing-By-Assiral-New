/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { Megaphone } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function Banner728x90() {
  const [adIndex, setAdIndex] = useState(0);

  const ads = [
    {
      title: "Bannière Publicitaire 728x90",
      desc: "Promouvez vos créations artisanales ici ! Touchez des milliers d'acheteurs passionnés d'art africain chic.",
      action: "En savoir plus"
    },
    {
      title: "🌍 Semaine de l'Éco-Responsabilité",
      desc: "-15% sur tous les paniers et vanneries en fibres naturelles avec le code DUSHOPGREEN.",
      action: "Acheter"
    },
    {
      title: "✨ Les Créateurs du Bénin à l'Honneur",
      desc: "Découvrez l'exposition virtuelle exclusive de bronzes sacrés et masques en bois royal.",
      action: "Découvrir"
    }
  ];

  const handleNextAd = () => {
    setAdIndex((prev) => (prev + 1) % ads.length);
  };

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
          <p className="text-xs sm:text-sm font-medium text-blue-900 leading-tight">
            <span className="font-bold text-[#02603c] mr-1.5">{ads[adIndex].titre}:</span>
            {ads[adIndex].desc}
          </p>
          <button 
            onClick={handleNextAd} 
            className="text-[10px] bg-white text-blue-800 font-bold px-2 py-0.5 rounded shadow-xs hover:bg-[#02603c] hover:text-white transition-all shrink-0 cursor-pointer"
          >
            {ads[adIndex].action}
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
