import React from 'react';
import { LandingContent, StoreSettings } from '../types';
import { generateWhatsAppInquiryUrl } from '../utils';

interface TentangTokoProps {
  content: LandingContent['tentang'];
  settings: StoreSettings;
}

export const TentangToko: React.FC<TentangTokoProps> = ({ content, settings }) => {
  if (!content.is_active) return null;

  const waUrl = generateWhatsAppInquiryUrl(settings.whatsapp);

  return (
    <section className="py-20 bg-white" id="tentang">
      <div className="max-w-7xl mx-auto px-4 md:px-6 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        {/* Left Column: Image */}
        <div className="relative rounded-2xl overflow-hidden shadow-lg border border-[#e0e3e5]">
          <img
            src={content.image || 'https://images.unsplash.com/photo-1541872703-74c5e44368f9?auto=format&fit=crop&w=800&q=80'}
            alt={content.title}
            className="w-full h-auto aspect-[4/3] object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-tr from-[#00288e]/20 via-transparent to-transparent pointer-events-none" />
        </div>

        {/* Right Column: Text */}
        <div className="space-y-6">
          <div className="inline-block bg-[#dde1ff] text-[#173bab] px-3.5 py-1 rounded-full text-xs font-bold">
            Tentang Kami
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#191c1e] tracking-tight">
            {content.title || 'Tentang Fotokopi Salin Serupa'}
          </h2>
          <p className="text-sm sm:text-base text-[#444653] leading-relaxed font-normal">
            {content.description || 'Fotokopi Salin Serupa - Jakarta Utara hadir untuk membantu memenuhi berbagai kebutuhan fotokopi, printing, dokumen, dan alat tulis kantor bagi pelanggan pribadi, pelajar, mahasiswa, maupun kebutuhan bisnis.'}
          </p>
          <div className="pt-2">
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-[#00288e] text-white px-6 py-3 rounded-xl text-sm font-semibold hover:bg-opacity-90 transition-all shadow-md"
            >
              <span>{content.cta_text || 'Hubungi Kami'}</span>
              <span className="material-symbols-outlined text-[18px]">chat</span>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};
