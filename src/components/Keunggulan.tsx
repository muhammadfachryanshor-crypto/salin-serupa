import React from 'react';
import { KeunggulanItem } from '../types';

interface KeunggulanProps {
  items: KeunggulanItem[];
}

export const Keunggulan: React.FC<KeunggulanProps> = ({ items }) => {
  const activeItems = items.filter(i => i.is_active).sort((a, b) => a.sort_order - b.sort_order);

  return (
    <section className="py-14 bg-white border-y border-[#e0e3e5]">
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {activeItems.map((item) => (
            <div
              key={item.id}
              className="p-6 rounded-xl bg-[#f2f4f6] border border-[#e0e3e5] flex flex-col gap-4 hover:shadow-md transition-shadow duration-200"
            >
              <div className="w-12 h-12 rounded-lg bg-[#00288e]/10 text-[#00288e] flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[28px]">{item.icon || 'star'}</span>
              </div>
              <div>
                <h3 className="text-base font-bold text-[#191c1e] mb-1.5">{item.title}</h3>
                <p className="text-xs text-[#444653] leading-relaxed font-normal">{item.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
