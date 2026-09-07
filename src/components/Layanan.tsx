import React from 'react';
import { Service, StoreSettings } from '../types';
import { generateWhatsAppInquiryUrl } from '../utils';

interface LayananProps {
  services: Service[];
  settings: StoreSettings;
  onSelectService?: (service: Service) => void;
}

export const Layanan: React.FC<LayananProps> = ({ services, settings, onSelectService }) => {
  const activeServices = services.filter(s => s.is_active).sort((a, b) => a.sort_order - b.sort_order);

  const featuredBw = activeServices.find(s => s.id === 'srv-1') || activeServices[0];
  const printColor = activeServices.find(s => s.id === 'srv-2') || activeServices[1];
  const scanDoc = activeServices.find(s => s.id === 'srv-3') || activeServices[2];
  const jilidDoc = activeServices.find(s => s.id === 'srv-4') || activeServices[3];
  const photoDoc = activeServices.find(s => s.id === 'srv-5') || activeServices[4];
  const percetakanDoc = activeServices.find(s => s.id === 'srv-6') || activeServices[5];

  const handlePesan = (srv: Service) => {
    if (onSelectService) {
      onSelectService(srv);
    } else {
      const msg = `Halo Fotokopi Salin Serupa, saya ingin memesan layanan: ${srv.name}`;
      window.open(generateWhatsAppInquiryUrl(settings.whatsapp, msg), '_blank');
    }
  };

  return (
    <section className="py-20 bg-[#f7f9fb]" id="layanan">
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-[#191c1e] mb-3">Layanan Unggulan Kami</h2>
          <p className="text-sm sm:text-base text-[#444653]">
            Kami menyediakan berbagai layanan document solution untuk memenuhi segala kebutuhan cetak dan finishing Anda.
          </p>
        </div>

        {/* Bento Grid Layout (Matches Image 1 layout) */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 auto-rows-[170px]">
          {/* Bento Box 1: Large Featured Card */}
          {featuredBw && (
            <div
              onClick={() => handlePesan(featuredBw)}
              className="md:col-span-2 md:row-span-2 rounded-2xl overflow-hidden relative group cursor-pointer shadow-sm hover:shadow-lg transition-all"
            >
              <img
                src={featuredBw.image || 'https://images.unsplash.com/photo-1562654501-a0ccc0fc3fb1?auto=format&fit=crop&w=800&q=80'}
                alt={featuredBw.name}
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent"></div>
              <div className="absolute bottom-0 left-0 p-6 z-10">
                <div className="bg-[#dde1ff] text-[#173bab] px-3 py-1 rounded-full text-xs font-semibold inline-block mb-3">
                  {featuredBw.badge || 'Paling Dicari'}
                </div>
                <h3 className="text-xl font-bold text-white mb-1.5 flex items-center gap-2">
                  <span className="material-symbols-outlined">{featuredBw.icon || 'file_copy'}</span>
                  {featuredBw.name}
                </h3>
                <p className="text-xs sm:text-sm text-white/80 max-w-md line-clamp-2">
                  {featuredBw.description}
                </p>
                <div className="mt-4">
                  <span className="inline-flex items-center gap-1.5 bg-[#00288e] text-white px-4 py-2 rounded-lg text-xs font-semibold group-hover:bg-opacity-90">
                    Pesan LayananIni
                    <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Small Box 1: Print Warna */}
          {printColor && (
            <div
              onClick={() => handlePesan(printColor)}
              className="rounded-2xl bg-[#e0e3e5] p-5 flex flex-col justify-between hover:shadow-md transition-all cursor-pointer group"
            >
              <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-[#00288e] shadow-xs group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined">{printColor.icon || 'auto_awesome'}</span>
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#191c1e] mb-1">{printColor.name}</h3>
                <p className="text-xs text-[#444653] line-clamp-2">{printColor.description}</p>
              </div>
            </div>
          )}

          {/* Small Box 2: Scan Dokumen */}
          {scanDoc && (
            <div
              onClick={() => handlePesan(scanDoc)}
              className="rounded-2xl bg-[#e0e3e5] p-5 flex flex-col justify-between hover:shadow-md transition-all cursor-pointer group"
            >
              <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-[#00288e] shadow-xs group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined">{scanDoc.icon || 'scanner'}</span>
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#191c1e] mb-1">{scanDoc.name}</h3>
                <p className="text-xs text-[#444653] line-clamp-2">{scanDoc.description}</p>
              </div>
            </div>
          )}

          {/* Medium Box: Jilid & Finishing */}
          {jilidDoc && (
            <div
              onClick={() => handlePesan(jilidDoc)}
              className="md:col-span-2 rounded-2xl bg-[#00288e] text-white p-6 flex flex-col justify-between relative overflow-hidden cursor-pointer group hover:bg-opacity-95 transition-colors shadow-md"
            >
              <div className="absolute -right-8 -bottom-8 opacity-15 pointer-events-none">
                <span className="material-symbols-outlined text-[140px]">menu_book</span>
              </div>
              <div className="relative z-10">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center mb-3 backdrop-blur-xs group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined">{jilidDoc.icon || 'menu_book'}</span>
                </div>
                <h3 className="text-lg font-bold mb-1">{jilidDoc.name}</h3>
                <p className="text-xs sm:text-sm text-white/80 max-w-lg">{jilidDoc.description}</p>
              </div>
            </div>
          )}

          {/* Small Box 3: Cetak Foto */}
          {photoDoc && (
            <div
              onClick={() => handlePesan(photoDoc)}
              className="rounded-2xl bg-[#e0e3e5] p-5 flex flex-col justify-between hover:shadow-md transition-all cursor-pointer group"
            >
              <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-[#00288e] shadow-xs group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined">{photoDoc.icon || 'imagesmode'}</span>
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#191c1e] mb-1">{photoDoc.name}</h3>
                <p className="text-xs text-[#444653] line-clamp-2">{photoDoc.description}</p>
              </div>
            </div>
          )}

          {/* Small Box 4: Percetakan */}
          {percetakanDoc && (
            <div
              onClick={() => handlePesan(percetakanDoc)}
              className="rounded-2xl bg-[#e0e3e5] p-5 flex flex-col justify-between hover:shadow-md transition-all cursor-pointer group"
            >
              <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-[#00288e] shadow-xs group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined">{percetakanDoc.icon || 'storefront'}</span>
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#191c1e] mb-1">{percetakanDoc.name}</h3>
                <p className="text-xs text-[#444653] line-clamp-2">{percetakanDoc.description}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
