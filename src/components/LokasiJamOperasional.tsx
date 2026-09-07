import React from 'react';
import { StoreSettings } from '../types';
import { checkStoreOpenStatus, generateWhatsAppInquiryUrl } from '../utils';
import { MapPin, Clock, ExternalLink, Navigation } from 'lucide-react';

interface LokasiJamOperasionalProps {
  settings: StoreSettings;
}

export const LokasiJamOperasional: React.FC<LokasiJamOperasionalProps> = ({ settings }) => {
  const openStatus = checkStoreOpenStatus(
    settings.business_hours_weekdays,
    settings.business_hours_sunday
  );

  const waUrl = generateWhatsAppInquiryUrl(settings.whatsapp);

  return (
    <section className="py-20 bg-[#f7f9fb] border-t border-[#e0e3e5]" id="kontak">
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-[#191c1e] mb-2">Lokasi & Jam Operasional</h2>
          <p className="text-sm text-[#444653]">Kunjungi toko fisik kami atau pesan secara online dari mana saja.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          {/* Left: Info Card */}
          <div className="bg-white rounded-2xl p-6 sm:p-8 border border-[#e0e3e5] shadow-sm space-y-6">
            {/* Status Indicator */}
            <div className="flex items-center justify-between pb-4 border-b border-[#f2f4f6]">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Status Toko Saat Ini:</span>
              <div className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold ${
                openStatus.isOpen ? 'bg-[#6bff8f]/30 text-[#007432] border border-[#6bff8f]' : 'bg-red-50 text-red-700 border border-red-200'
              }`}>
                <span className={`w-2.5 h-2.5 rounded-full ${openStatus.isOpen ? 'bg-[#006e2f] animate-pulse' : 'bg-red-600'}`} />
                <span>{openStatus.isOpen ? '🟢 Sedang Buka' : '🔴 Sedang Tutup'}</span>
              </div>
            </div>

            {/* Address */}
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-full bg-[#dde1ff] text-[#00288e] flex items-center justify-center shrink-0 mt-0.5">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#191c1e] mb-1">{settings.store_name}</h3>
                <p className="text-xs text-[#444653] leading-relaxed font-normal">{settings.address}</p>
              </div>
            </div>

            {/* Hours Table */}
            <div className="flex items-start gap-3.5 pt-2">
              <div className="w-10 h-10 rounded-full bg-[#f2f4f6] text-[#00288e] flex items-center justify-center shrink-0">
                <Clock className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-bold text-[#191c1e] mb-2">Jam Operasional</h3>
                <div className="bg-[#f7f9fb] p-3 rounded-xl border border-[#e0e3e5] space-y-1.5 text-xs text-slate-700 font-medium">
                  <div className="flex justify-between">
                    <span className="font-semibold text-slate-900">Senin - Sabtu:</span>
                    <span className="text-[#00288e] font-bold">{settings.business_hours_weekdays || '09:00 - 21:00 WIB'}</span>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-[#e0e3e5]">
                    <span className="font-semibold text-slate-900">Minggu:</span>
                    <span className="text-[#00288e] font-bold">{settings.business_hours_sunday || '09:00 - 20:30 WIB'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <a
                href={settings.maps_url}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-[#00288e] text-white py-2.5 px-4 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 hover:bg-opacity-90 transition-all shadow-xs"
              >
                <Navigation className="w-4 h-4" />
                <span>Buka Google Maps</span>
              </a>

              <a
                href={waUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-[#006e2f] text-white py-2.5 px-4 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 hover:bg-opacity-90 transition-all shadow-xs"
              >
                <span className="material-symbols-outlined text-[18px]">chat</span>
                <span>Hubungi WA</span>
              </a>
            </div>
          </div>

          {/* Right: Embedded Google Maps */}
          <div className="rounded-2xl overflow-hidden shadow-sm border border-[#e0e3e5] h-full min-h-[340px] bg-slate-100 relative">
            <iframe
              title="Google Maps Location Fotokopi Salin Serupa"
              src={`https://maps.google.com/maps?q=${encodeURIComponent(settings.address || 'Jl. Empang Damai No.62, RT.10/RW.4, Kapuk Muara, Kecamatan Penjaringan, Jakarta Utara, 14460')}&t=&z=17&ie=UTF8&iwloc=&output=embed`}
              width="100%"
              height="100%"
              style={{ border: 0, minHeight: '340px' }}
              allowFullScreen={true}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
            <a
              href={settings.maps_url}
              target="_blank"
              rel="noopener noreferrer"
              className="absolute bottom-3 right-3 bg-white/95 backdrop-blur-xs text-slate-800 text-[11px] font-bold px-3 py-1.5 rounded-lg shadow-md hover:bg-white flex items-center gap-1.5"
            >
              <span>Petunjuk Arah</span>
              <ExternalLink className="w-3.5 h-3.5 text-[#00288e]" />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};
