import React, { useState } from 'react';
import { CartItem, StoreSettings } from '../types';
import { formatRupiah, generateWhatsAppOrderUrl } from '../utils';
import { X, Send, ShoppingBag, User, Phone, FileText, Store, MessageSquare } from 'lucide-react';

interface CheckoutFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  settings: StoreSettings;
  onSubmitOrder: (orderData: {
    customer_name: string;
    whatsapp: string;
    notes: string;
    pickup_method: 'Ambil di toko' | 'Pesanan sesuai kesepakatan';
    subtotal: number;
    total: number;
    items: any[];
  }) => Promise<any>;
}

export const CheckoutFormModal: React.FC<CheckoutFormModalProps> = ({
  isOpen,
  onClose,
  items,
  settings,
  onSubmitOrder
}) => {
  const [customerName, setCustomerName] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [notes, setNotes] = useState('');
  const [pickupMethod, setPickupMethod] = useState<'Ambil di toko' | 'Pesanan sesuai kesepakatan'>('Ambil di toko');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const totalAmount = items.reduce((sum, item) => {
    const price = item.product.promo_price || item.product.price;
    return sum + price * item.quantity;
  }, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim()) {
      setErrorMsg('Mohon isi nama lengkap Anda.');
      return;
    }
    if (!whatsapp.trim()) {
      setErrorMsg('Mohon isi nomor WhatsApp Anda.');
      return;
    }

    setErrorMsg('');
    setLoading(true);

    // Generate WhatsApp order URL
    const waUrl = generateWhatsAppOrderUrl(
      settings.whatsapp,
      customerName,
      whatsapp,
      items,
      totalAmount,
      notes,
      pickupMethod
    );

    // Open a blank tab synchronously during user click event to prevent popup blocker issues
    let waWin: Window | null = null;
    try {
      waWin = window.open('about:blank', '_blank');
    } catch (e) {
      console.warn('Could not pre-open window tab:', e);
    }

    try {
      // Save order to database quietly
      const orderPayload = {
        customer_name: customerName,
        whatsapp: whatsapp,
        notes: notes,
        pickup_method: pickupMethod,
        subtotal: totalAmount,
        total: totalAmount,
        items: items.map(i => ({
          product_id: i.product.id,
          product_name: i.product.name,
          price: i.product.promo_price || i.product.price,
          quantity: i.quantity,
          subtotal: (i.product.promo_price || i.product.price) * i.quantity
        }))
      };

      await onSubmitOrder(orderPayload);

      // Direct window to WhatsApp chat URL
      if (waWin && !waWin.closed) {
        waWin.location.href = waUrl;
      } else {
        window.location.href = waUrl;
      }
    } catch (err: any) {
      console.error('Failed to submit order:', err);
      if (waWin && !waWin.closed) {
        waWin.location.href = waUrl;
      } else {
        window.location.href = waUrl;
      }
    } finally {
      setLoading(false);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-lg w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-[#e0e3e5] relative flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-[#e0e3e5] flex items-center justify-between bg-[#f7f9fb] sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#006e2f] text-white flex items-center justify-center">
              <span className="material-symbols-outlined text-[18px]">chat</span>
            </div>
            <div>
              <h3 className="font-bold text-base text-[#191c1e]">Checkout via WhatsApp</h3>
              <p className="text-[11px] text-slate-500">Kirim rincian pesanan langsung ke toko</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-500 hover:text-slate-800 hover:bg-[#e0e3e5]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 flex-1">
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl font-medium">
              {errorMsg}
            </div>
          )}

          {/* Form Fields */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-slate-500" /> Nama Pelanggan *
              </label>
              <input
                type="text"
                required
                placeholder="Contoh: Budi Santoso"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#f7f9fb] border border-[#c4c5d5] rounded-xl text-xs sm:text-sm font-medium focus:outline-none focus:border-[#00288e] focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                <Phone className="w-3.5 h-3.5 text-slate-500" /> Nomor WhatsApp *
              </label>
              <input
                type="tel"
                required
                placeholder="Contoh: 081292290876"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#f7f9fb] border border-[#c4c5d5] rounded-xl text-xs sm:text-sm font-medium focus:outline-none focus:border-[#00288e] focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                <Store className="w-3.5 h-3.5 text-slate-500" /> Metode Pengambilan *
              </label>
              <select
                value={pickupMethod}
                onChange={(e: any) => setPickupMethod(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#f7f9fb] border border-[#c4c5d5] rounded-xl text-xs sm:text-sm font-medium focus:outline-none focus:border-[#00288e]"
              >
                <option value="Ambil di toko">Ambil di Toko (Kapuk Muara, Penjaringan)</option>
                <option value="Pesanan sesuai kesepakatan">Pesanan Sesuai Kesepakatan (GoSend/Grab)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                <FileText className="w-3.5 h-3.5 text-slate-500" /> Catatan Tambahan (Opsional)
              </label>
              <textarea
                rows={2}
                placeholder="Contoh: Tolong print warna & jilid lakban bening, ambil jam 4 sore..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3.5 py-2 bg-[#f7f9fb] border border-[#c4c5d5] rounded-xl text-xs font-medium focus:outline-none focus:border-[#00288e] focus:bg-white"
              />
            </div>

            {/* Note Kirim Dokumen ke WhatsApp */}
            <div className="bg-[#25D366]/10 border border-[#25D366]/30 p-3.5 rounded-2xl flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-[#25D366] text-white flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                <MessageSquare className="w-4 h-4" />
              </div>
              <div className="space-y-0.5">
                <p className="text-xs font-bold text-[#006e2f]">
                  📌 Catatan Pengiriman Dokumen:
                </p>
                <p className="text-xs font-bold text-slate-800 leading-relaxed">
                  Silahkan kirimkan dokumen yang mau di print ke WhatsApp
                </p>
                <p className="text-[11px] text-slate-500">
                  File (PDF, Word, Excel, Foto) dikirim langsung ke chat admin setelah menekan tombol di bawah.
                </p>
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="bg-[#f2f4f6] p-4 rounded-2xl border border-[#e0e3e5] space-y-2">
            <h4 className="text-xs font-bold text-slate-700 flex items-center gap-1">
              <ShoppingBag className="w-3.5 h-3.5 text-[#00288e]" /> Ringkasan Item ({items.length})
            </h4>

            <div className="max-h-36 overflow-y-auto space-y-1 pr-1">
              {items.map((i) => {
                const price = i.product.promo_price || i.product.price;
                return (
                  <div key={i.product.id} className="flex justify-between text-xs text-slate-600">
                    <span className="truncate pr-2">{i.product.name} x {i.quantity}</span>
                    <span className="font-semibold shrink-0">{formatRupiah(price * i.quantity)}</span>
                  </div>
                );
              })}
            </div>

            <div className="pt-2 border-t border-[#c4c5d5] flex justify-between items-center text-sm font-extrabold text-[#00288e]">
              <span>Total Tagihan:</span>
              <span>{formatRupiah(totalAmount)}</span>
            </div>
          </div>

          {/* Submit CTA */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#006e2f] text-white py-3.5 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 hover:bg-opacity-95 active:scale-98 transition-all shadow-md"
          >
            <Send className="w-4 h-4" />
            <span>{loading ? 'Memproses...' : 'Kirim Pesanan via WhatsApp'}</span>
          </button>
        </form>
      </div>
    </div>
  );
};
