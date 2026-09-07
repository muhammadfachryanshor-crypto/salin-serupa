import React, { useState } from 'react';
import { Download, X } from 'lucide-react';

interface PWAInstallBannerProps {
  onInstall: () => void;
}

export const PWAInstallBanner: React.FC<PWAInstallBannerProps> = ({ onInstall }) => {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-24 z-40 bg-[#001453] text-white p-4 rounded-2xl shadow-2xl border border-blue-400/30 max-w-sm w-full animate-in slide-in-from-bottom-4 duration-300">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white text-[#00288e] flex items-center justify-center shrink-0 shadow-xs">
            <span className="material-symbols-outlined text-2xl">print</span>
          </div>
          <div>
            <h4 className="text-xs font-bold text-white">Install App Salin Serupa</h4>
            <p className="text-[11px] text-blue-200">Akses lebih cepat & cepat pesan offline.</p>
          </div>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="text-blue-300 hover:text-white p-1"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="mt-3 flex gap-2">
        <button
          onClick={() => {
            onInstall();
            setDismissed(true);
          }}
          className="flex-1 bg-white text-[#00288e] py-1.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-blue-50 transition-colors"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Install Sekarang</span>
        </button>
        <button
          onClick={() => setDismissed(true)}
          className="px-3 py-1.5 rounded-xl text-xs font-semibold text-blue-200 hover:text-white"
        >
          Nanti Saja
        </button>
      </div>
    </div>
  );
};
