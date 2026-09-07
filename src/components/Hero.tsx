import React from 'react';
import { ArrowRight, Truck } from 'lucide-react';
import { LandingContent, StoreSettings } from '../types';
import { checkStoreOpenStatus } from '../utils';

interface HeroProps {
  content: LandingContent['hero'];
  settings: StoreSettings;
  onPesanSekarang: () => void;
  onLihatKatalog: () => void;
}

export const Hero: React.FC<HeroProps> = ({
  content,
  settings,
  onPesanSekarang,
  onLihatKatalog
}) => {
  const openStatus = checkStoreOpenStatus(
    settings.business_hours_weekdays,
    settings.business_hours_sunday
  );

  return (
    <section className="relative pt-24 pb-16 lg:pt-28 lg:pb-24 overflow-hidden bg-[#f7f9fb] bg-[radial-gradient(#dde1ff_1px,transparent_1px)] [background-size:20px_20px]">
      <div className="max-w-7xl mx-auto px-4 md:px-6 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        {/* Left Column Text Content */}
        <div className="space-y-6 z-10">
          {/* Status Badge */}
          <div className="inline-flex items-center gap-2 bg-[#6bff8f]/30 text-[#007432] border border-[#6bff8f] px-3.5 py-1.5 rounded-full text-xs font-semibold">
            <span className="relative flex h-2.5 w-2.5">
              {openStatus.isOpen && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#006e2f] opacity-75"></span>
              )}
              <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${openStatus.isOpen ? 'bg-[#006e2f]' : 'bg-red-500'}`}></span>
            </span>
            <span>{openStatus.text}</span>
          </div>

          {/* Headline */}
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-[#191c1e] tracking-tight leading-tight">
            {content.headline || 'Solusi Fotokopi, Printing & ATK Terlengkap di'}{' '}
            <span className="text-[#00288e] block sm:inline">{content.headline_accent || 'Jakarta Utara'}</span>
          </h1>

          {/* Subheadline */}
          <p className="text-base sm:text-lg text-[#444653] leading-relaxed max-w-xl font-normal">
            {content.subheadline || 'Kami menyediakan layanan percetakan cepat, penjilidan profesional, dan berbagai kebutuhan alat tulis kantor untuk mahasiswa, profesional, dan bisnis lokal.'}
          </p>

          {/* CTAs */}
          <div className="flex flex-wrap items-center gap-4 pt-2">
            <button
              onClick={onPesanSekarang}
              className="bg-[#00288e] text-white px-6 py-3 rounded-xl text-sm font-semibold hover:bg-opacity-90 transition-all shadow-md hover:shadow-lg flex items-center gap-2"
            >
              <span>{content.cta_primary || 'Pesan Sekarang'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={onLihatKatalog}
              className="bg-[#e6e8ea] text-[#191c1e] px-6 py-3 rounded-xl text-sm font-semibold hover:bg-[#e0e3e5] transition-colors flex items-center gap-2"
            >
              {content.cta_secondary || 'Lihat Katalog'}
            </button>
          </div>

          {/* Trust Avatars */}
          <div className="pt-6 flex flex-wrap items-center gap-4 text-xs font-semibold text-[#444653]">
            <div className="flex -space-x-3">
              <img
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80"
                alt="Pelanggan"
                className="w-10 h-10 rounded-full border-2 border-white object-cover shadow-xs"
              />
              <img
                src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&q=80"
                alt="Pelanggan"
                className="w-10 h-10 rounded-full border-2 border-white object-cover shadow-xs"
              />
              <img
                src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80"
                alt="Pelanggan"
                className="w-10 h-10 rounded-full border-2 border-white object-cover shadow-xs"
              />
            </div>
            <p className="text-slate-600">{content.trust_text || 'Dipercaya oleh 1000+ pelanggan di Jakarta Utara'}</p>
          </div>
        </div>

        {/* Right Image Showcase with Floating Card */}
        <div className="relative z-10 lg:ml-auto">
          <div className="relative rounded-2xl overflow-hidden shadow-xl bg-white border border-[#e0e3e5]">
            <img
              src={content.hero_image || 'https://images.unsplash.com/photo-1562654501-a0ccc0fc3fb1?auto=format&fit=crop&w=1200&q=80'}
              alt="Toko Fotokopi Salin Serupa Jakarta Utara"
              className="w-full h-auto object-cover aspect-[4/3] transform hover:scale-102 transition-transform duration-500"
            />
            {/* Overlay Gradient for contrast */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent pointer-events-none" />

            {/* Floating Glass Card */}
            <div className="absolute bottom-5 left-5 right-5 sm:left-6 sm:right-auto sm:w-72 bg-white/95 backdrop-blur-md border border-white/40 p-3.5 rounded-xl shadow-lg flex items-center gap-3.5 transform transition-transform hover:-translate-y-1">
              <div className="w-11 h-11 bg-[#dde1ff] text-[#00288e] rounded-full flex items-center justify-center shrink-0">
                <Truck className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900">Pengiriman Cepat</p>
                <p className="text-[11px] font-medium text-slate-500">Tersedia via GoSend/Grab</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
