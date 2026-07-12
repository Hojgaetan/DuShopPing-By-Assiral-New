/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect, FormEvent } from 'react';
import { X, Send, MapPin, BadgeCheck, Phone, CheckCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ProduitUI, Message, VendeurUI } from '../types';
import { SELLERS } from '../data';

interface ChatModalProps {
  product: ProduitUI | null;
  onClose: () => void;
}

export default function ChatModal({ product, onClose }: ChatModalProps) {
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  if (!product) return null;

  const seller: VendeurUI = SELLERS[product.nom_boutique] || {
    nom: product.nom_boutique,
    rating: 4.8,
    hasBadge: product.hasBadge,
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&fit=crop&q=80',
    telephone: product.telephone_contact || '+221 77 000 00 00',
    whatsapp: product.whatsapp_contact || '+221770000000',
    localisation: product.localisation || 'Dakar, Sénégal',
    description: 'Vendeur de produits artisanaux sur DuShopPing.'
  };

  const [messages, setMessages] = useState<Message[]>([
    {
      sender: 'seller',
      text: `Bonjour ! Merci pour votre intérêt pour mon produit "${product.titre}". Il est actuellement disponible en stock. Souhaitez-vous le réserver ou planifier une livraison ou un appel ?`,
      timestamp: 'Juste maintenant'
    }
  ]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSend = (e: FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const userMsg: Message = {
      sender: 'user',
      text: inputText,
      timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsTyping(true);

    // Simulate smart seller response
    setTimeout(() => {
      setIsTyping(false);
      let responseText = `Parfait ! C'est bien noté. Pour régler l'achat de "${product.titre}" (${new Intl.NumberFormat('fr-FR').format(product.prix)} FCFA), nous acceptons les paiements via Wave ou Orange Money, ou bien en espèces à la livraison. Qu'est-ce qui vous arrange le mieux ?`;
      
      const lowerText = userMsg.text.toLowerCase();
      if (lowerText.includes('prix') || lowerText.includes('cher') || lowerText.includes('reduction') || lowerText.includes('rabais')) {
        responseText = `Le prix de "${product.titre}" est fixé équitablement à ${new Intl.NumberFormat('fr-FR').format(product.prix)} FCFA pour rémunérer correctement nos artisans locaux. Je peux faire un geste de 5% si vous prenez un deuxième article !`;
      } else if (lowerText.includes('livrer') || lowerText.includes('livraison') || lowerText.includes('envoi') || lowerText.includes('dakar')) {
        responseText = `Absolument ! Nous livrons rapidement dans tout le secteur de ${seller.localisation.split(',')[0]} pour environ 1 500 FCFA de frais de coursier. Quel est votre quartier exact et votre numéro pour le chauffeur ?`;
      } else if (lowerText.includes('dispo') || lowerText.includes('disponible') || lowerText.includes('stock')) {
        responseText = `Oui, c'est bien disponible ! C'est une pièce unique fabriquée avec beaucoup de soin. Je peux vous l'emballer dès aujourd'hui.`;
      }

      setMessages(prev => [...prev, {
        sender: 'seller',
        text: responseText,
        timestamp: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
      }]);
    }, 1500);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 inline-flex" id="chat-modal-overlay">
        {/* Backdrop background */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-900/45 backdrop-blur-xs"
        />

        {/* Modal panel containing the chat */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 15 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 15 }}
          className="relative bg-white w-full max-w-lg h-[600px] flex flex-col rounded-3xl overflow-hidden shadow-2xl border border-slate-100 z-10"
        >
          {/* Header */}
          <div className="bg-brand text-white p-4 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <img
                src={seller.avatar}
                alt={seller.nom}
                className="w-11 h-11 rounded-full object-cover border-2 border-white/20"
              />
              <div>
                <div className="flex items-center gap-1">
                  <h3 className="font-display font-bold text-sm sm:text-base leading-tight">{seller.nom}</h3>
                  {seller.hasBadge && (
                    <BadgeCheck className="w-4.5 h-4.5 text-emerald-200 fill-brand shrink-0" />
                  )}
                </div>
                <p className="text-[10px] text-brand-light flex items-center gap-0.5">
                  <MapPin className="w-3 h-3" />
                  <span>{seller.localisation}</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Phone display tooltip badge */}
              <a 
                href={`tel:${seller.telephone}`}
                className="p-2 text-white/90 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
                title={`Appeler directement: ${seller.telephone}`}
              >
                <Phone className="w-4 h-4" />
              </a>
              <button
                onClick={onClose}
                className="p-2 text-white/90 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
                title="Fermer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Product context strip */}
          <div className="bg-slate-50 border-b border-slate-100 p-3 flex items-center justify-between gap-3 shrink-0 text-xs text-slate-600">
            <div className="flex items-center gap-2">
              <img
                src={product.images[0]}
                alt={product.titre}
                className="w-10 h-10 object-cover rounded-md"
              />
              <div>
                <span className="font-bold text-slate-700">{product.titre}</span>
                <p className="text-slate-400 text-[10px] uppercase font-semibold">{product.categorie_id}</p>
              </div>
            </div>
            <div className="font-mono font-bold text-brand text-right">
              {new Intl.NumberFormat('fr-FR').format(product.prix)} FCFA
            </div>
          </div>

          {/* Chat scrolling viewport */}
          <div className="flex-1 overflow-y-auto p-4 bg-slate-50/50 space-y-4" ref={scrollRef}>
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl p-3.5 text-xs sm:text-sm shadow-xs leading-normal relative ${
                    msg.sender === 'user'
                      ? 'bg-[#02603c] text-white rounded-tr-none'
                      : 'bg-white text-slate-700 rounded-tl-none border border-slate-100'
                  }`}
                >
                  <p>{msg.text}</p>
                  <div className="flex items-center justify-end gap-1 mt-1 text-[9px] opacity-75">
                    <span>{msg.timestamp}</span>
                    {msg.sender === 'user' && <CheckCheck className="w-3 h-3 text-emerald-200" />}
                  </div>
                </div>
              </div>
            ))}

            {/* Typing indicator */}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-white text-slate-500 rounded-2xl rounded-tl-none p-3 shadow-xs border border-slate-100 text-xs flex items-center gap-2">
                  <span className="text-[10px] font-bold text-slate-400">L'artisan écrit</span>
                  <div className="flex gap-1">
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{   }} />
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Form input messaging bar */}
          <form onSubmit={handleSend} className="p-3 bg-white border-t border-slate-100 flex gap-2 shrink-0">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Écrivez votre question ou offre tarifaire..."
              className="flex-1 bg-slate-50 hover:bg-slate-100/50 focus:bg-white text-xs sm:text-sm p-3.5 rounded-xl border border-transparent focus:border-slate-200 outline-hidden text-slate-800"
            />
            <motion.button
              whileTap={{ scale: 0.95 }}
              type="submit"
              disabled={!inputText.trim()}
              className="bg-[#02603c] hover:bg-brand-hover disabled:bg-slate-100 disabled:text-slate-400 text-white p-3.5 rounded-xl transition-all cursor-pointer shadow-xs font-semibold text-sm shrink-0 flex items-center justify-center"
            >
              <Send className="w-4.5 h-4.5" />
            </motion.button>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
