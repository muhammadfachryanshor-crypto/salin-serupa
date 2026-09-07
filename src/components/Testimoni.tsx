import React from 'react';
import { Testimonial } from '../types';
import { Star, Quote } from 'lucide-react';

interface TestimoniProps {
  testimonials: Testimonial[];
}

export const Testimoni: React.FC<TestimoniProps> = ({ testimonials }) => {
  const activeTestimonials = testimonials.filter(t => t.is_active).sort((a, b) => a.sort_order - b.sort_order);

  if (activeTestimonials.length === 0) return null;

  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        <div className="text-center max-w-xl mx-auto mb-10">
          <span className="bg-[#dde1ff] text-[#173bab] text-xs font-bold px-3 py-1 rounded-full inline-block mb-2">
            Ulasan Pelanggan
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold text-[#191c1e]">Apa Kata Pelanggan Kami?</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {activeTestimonials.map((t) => (
            <div
              key={t.id}
              className="bg-[#f7f9fb] rounded-2xl p-6 border border-[#e0e3e5] relative flex flex-col justify-between hover:shadow-md transition-shadow"
            >
              <Quote className="w-8 h-8 text-[#00288e]/15 absolute top-5 right-5" />

              <div>
                <div className="flex items-center gap-1 text-amber-500 mb-3">
                  {Array.from({ length: t.rating || 5 }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-xs sm:text-sm text-[#444653] leading-relaxed mb-4 italic font-normal">
                  "{t.comment}"
                </p>
              </div>

              <div className="flex items-center gap-3 pt-4 border-t border-[#e0e3e5]">
                <img
                  src={t.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80'}
                  alt={t.name}
                  className="w-10 h-10 rounded-full object-cover border border-white shadow-xs"
                />
                <div>
                  <h4 className="text-xs font-bold text-[#191c1e]">{t.name}</h4>
                  <p className="text-[11px] text-slate-500 font-medium">{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
