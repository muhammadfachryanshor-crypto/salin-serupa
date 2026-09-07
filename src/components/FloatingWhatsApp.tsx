import React from 'react';
import { StoreSettings } from '../types';
import { generateWhatsAppInquiryUrl } from '../utils';

interface FloatingWhatsAppProps {
  settings: StoreSettings;
}

export const FloatingWhatsApp: React.FC<FloatingWhatsAppProps> = ({ settings }) => {
  const waUrl = generateWhatsAppInquiryUrl(settings.whatsapp);

  return (
    <a
      href={waUrl}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat WhatsApp Salin Serupa"
      className="fixed bottom-6 right-6 z-40 bg-[#006e2f] text-white p-3.5 rounded-full shadow-2xl hover:bg-opacity-95 hover:scale-110 active:scale-95 transition-all flex items-center justify-center group"
    >
      <span className="material-symbols-outlined text-[28px]">chat</span>
      <span className="max-w-0 overflow-hidden whitespace-nowrap group-hover:max-w-xs group-hover:ml-2 text-xs font-bold transition-all duration-300">
        Chat WA Salin Serupa
      </span>
    </a>
  );
};
