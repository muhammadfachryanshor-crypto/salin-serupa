import React from 'react';
import { StoreSettings } from '../types';
import { generateWhatsAppInquiryUrl } from '../utils';
import { MapPin, Phone, Clock, ShieldCheck } from 'lucide-react';

interface FooterProps {
  settings: StoreSettings;
  onNavigateAdmin: () => void;
}

export const Footer: React.FC<FooterProps> = ({ settings, onNavigateAdmin }) => {
  const [logoError, setLogoError] = React.useState(false);
  const waUrl = generateWhatsAppInquiryUrl(settings.whatsapp);

  return (
    <footer className="bg-[#191c1e] text-white pt-14 pb-8 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 md:px-6 grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
        {/* Col 1: Brand */}
        <div className="md:col-span-2 space-y-4">
          <div className="flex items-center gap-3">
            {settings.logo && !logoError ? (
              <img
                src={settings.logo}
                alt={settings.store_name}
                onError={() => setLogoError(true)}
                referrerPolicy="no-referrer"
                className="h-12 w-auto object-contain max-w-[220px] bg-white p-1.5 rounded-xl shadow-xs"
              />
            ) : (
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#00288e] text-white flex items-center justify-center font-bold">
                  <span className="material-symbols-outlined text-xl">print</span>
                </div>
                <span className="font-extrabold text-lg text-white">{settings.store_name}</span>
              </div>
            )}
          </div>
          <p className="text-xs text-slate-400 leading-relaxed max-w-sm">
            Toko fotokopi, percetakan, dan penyedia alat tulis kantor (ATK) terpercaya di Jakarta Utara. Solusi cepat, hemat, dan hasil berkualitas tinggi untuk kebutuhan dokumen Anda.
          </p>
          <div className="flex items-center gap-3 pt-1">
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-[#006e2f] text-white px-3.5 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 hover:bg-opacity-90"
            >
              <span className="material-symbols-outlined text-[16px]">chat</span>
              <span>Hubungi WA</span>
            </a>
          </div>
        </div>

        {/* Col 2: Navigation */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Navigasi Halaman</h4>
          <ul className="space-y-2 text-xs text-slate-400">
            <li><a href="#" className="hover:text-white transition-colors">Beranda</a></li>
            <li><a href="#layanan" className="hover:text-white transition-colors">Layanan Unggulan</a></li>
            <li><a href="#katalog" className="hover:text-white transition-colors">Katalog Produk & ATK</a></li>
            <li><a href="#promo" className="hover:text-white transition-colors">Promo Spesial</a></li>
            <li><a href="#tentang" className="hover:text-white transition-colors">Tentang Kami</a></li>
            <li><a href="#kontak" className="hover:text-white transition-colors">Lokasi & Kontak</a></li>
          </ul>
        </div>

        {/* Col 3: Contact Info */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Informasi Kontak</h4>
          <ul className="space-y-2.5 text-xs text-slate-400">
            <li className="flex items-start gap-2">
              <MapPin className="w-4 h-4 text-[#00288e] shrink-0 mt-0.5" />
              <span>{settings.address}</span>
            </li>
            <li className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-[#006e2f] shrink-0" />
              <span>{settings.whatsapp}</span>
            </li>
            <li className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-500 shrink-0" />
              <span>Senin-Sabtu ({settings.business_hours_weekdays})</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-500">
        <p className="flex items-center gap-1">
          <span>© {new Date().getFullYear()} {settings.store_name}. All Rights Reserved.</span>
          <button
            onClick={onNavigateAdmin}
            className="opacity-20 hover:opacity-100 text-slate-500 transition-opacity ml-1 p-0.5 cursor-pointer"
            title="Akses Sistem Admin Rahasia (/admin/login)"
          >
            •
          </button>
        </p>
        <p>Progressive Web App (PWA) • Kapuk Muara, Jakarta Utara</p>
      </div>
    </footer>
  );
};
