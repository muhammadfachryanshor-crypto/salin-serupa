import React, { useState, useEffect } from 'react';
import { Promotion, StoreSettings } from '../types';
import { formatRupiah, generateWhatsAppInquiryUrl } from '../utils';
import { Tag, ArrowRight, Clock } from 'lucide-react';

interface PromoSectionProps {
  promotions: Promotion[];
  settings: StoreSettings;
}

export const PromoSection: React.FC<PromoSectionProps> = ({ promotions, settings }) => {
  const activePromos = promotions.filter(p => p.is_active);

  // Simple countdown calculation timer
  const [timeLeft, setTimeLeft] = useState<{ hours: number; minutes: number; seconds: number }>({
    hours: 14,
    minutes: 42,
    seconds: 30
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
        if (prev.minutes > 0) return { ...prev, minutes: 59, seconds: 59 };
        if (prev.hours > 0) return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        return prev;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  if (activePromos.length === 0) return null;

  return (
    <section className="py-16 bg-[#f2f4f6]" id="promo">
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10">
          <div>
            <div className="inline-flex items-center gap-1.5 bg-[#ffdad6] text-[#93000a] px-3 py-1 rounded-full text-xs font-bold mb-2">
              <Tag className="w-3.5 h-3.5" />
              <span>Penawaran Spesial</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-[#191c1e]">Promo & Penawaran Terbatas</h2>
          </div>

          {/* Countdown badge */}
          <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-2xl border border-[#e0e3e5] shadow-xs text-xs font-bold text-slate-800">
            <Clock className="w-4 h-4 text-[#ba1a1a]" />
            <span>Berakhir dalam:</span>
            <div className="font-mono bg-[#ba1a1a] text-white px-2 py-0.5 rounded text-xs font-bold">
              {String(timeLeft.hours).padStart(2, '0')}:{String(timeLeft.minutes).padStart(2, '0')}:{String(timeLeft.seconds).padStart(2, '0')}
            </div>
          </div>
        </div>

        {/* Promo Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {activePromos.map((promo) => {
            const handleOrderPromo = () => {
              const msg = `Halo Fotokopi Salin Serupa, saya tertarik dengan promo: "${promo.title}" (${formatRupiah(promo.promo_price)}).`;
              window.open(generateWhatsAppInquiryUrl(settings.whatsapp, msg), '_blank');
            };

            return (
              <div
                key={promo.id}
                className="bg-white rounded-2xl border border-[#e0e3e5] overflow-hidden shadow-sm hover:shadow-lg transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="relative h-44 bg-slate-100 overflow-hidden">
                    <img
                      src={promo.image || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80'}
                      alt={promo.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-3 left-3 bg-[#ba1a1a] text-white text-xs font-bold px-3 py-1 rounded-full shadow-xs">
                      PROMO SPESIAL
                    </div>
                  </div>

                  <div className="p-5">
                    <h3 className="text-base font-bold text-[#191c1e] mb-1.5 group-hover:text-[#00288e] transition-colors">
                      {promo.title}
                    </h3>
                    <p className="text-xs text-[#444653] line-clamp-2 mb-4 font-normal">
                      {promo.description}
                    </p>

                    <div className="flex items-baseline gap-2 pt-2 border-t border-[#f2f4f6]">
                      <span className="text-xl font-extrabold text-[#ba1a1a]">
                        {formatRupiah(promo.promo_price)}
                      </span>
                      {promo.normal_price > promo.promo_price && (
                        <span className="text-xs text-slate-400 line-through">
                          {formatRupiah(promo.normal_price)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="p-5 pt-0">
                  <button
                    onClick={handleOrderPromo}
                    className="w-full bg-[#00288e] text-white py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 hover:bg-opacity-90 transition-all shadow-xs"
                  >
                    <span>Klaim Promo via WA</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
