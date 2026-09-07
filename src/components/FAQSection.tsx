import React, { useState } from 'react';
import { FAQ } from '../types';
import { ChevronDown, HelpCircle } from 'lucide-react';

interface FAQSectionProps {
  faqs: FAQ[];
}

export const FAQSection: React.FC<FAQSectionProps> = ({ faqs }) => {
  const activeFaqs = faqs.filter(f => f.is_active).sort((a, b) => a.sort_order - b.sort_order);
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  if (activeFaqs.length === 0) return null;

  return (
    <section className="py-16 bg-[#f7f9fb] border-t border-[#e0e3e5]">
      <div className="max-w-4xl mx-auto px-4 md:px-6">
        <div className="text-center max-w-xl mx-auto mb-10">
          <div className="inline-flex items-center gap-1.5 bg-[#dde1ff] text-[#173bab] px-3 py-1 rounded-full text-xs font-bold mb-2">
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Pertanyaan Umum</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-[#191c1e]">Pertanyaan Sering Diajukan (FAQ)</h2>
        </div>

        <div className="space-y-3">
          {activeFaqs.map((faq, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div
                key={faq.id}
                className="bg-white rounded-2xl border border-[#e0e3e5] overflow-hidden transition-all shadow-xs"
              >
                <button
                  onClick={() => setOpenIndex(isOpen ? null : idx)}
                  className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-4 font-bold text-xs sm:text-sm text-[#191c1e] hover:text-[#00288e] transition-colors"
                >
                  <span>{faq.question}</span>
                  <ChevronDown className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180 text-[#00288e]' : ''}`} />
                </button>
                {isOpen && (
                  <div className="px-4 pb-5 sm:px-5 sm:pb-5 text-xs sm:text-sm text-[#444653] leading-relaxed border-t border-[#f2f4f6] pt-3 font-normal">
                    {faq.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
