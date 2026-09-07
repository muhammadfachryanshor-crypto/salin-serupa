import React from 'react';
import { CartItem } from '../types';
import { formatRupiah } from '../utils';
import { X, Trash2, Plus, Minus, ShoppingBag, ArrowRight } from 'lucide-react';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemoveItem: (productId: string) => void;
  onClearCart: () => void;
  onProceedCheckout: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  items,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onProceedCheckout
}) => {
  if (!isOpen) return null;

  const totalAmount = items.reduce((sum, item) => {
    const price = item.product.promo_price || item.product.price;
    return sum + price * item.quantity;
  }, 0);

  return (
    <div className="fixed inset-0 z-[999] flex justify-end bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-md h-full flex flex-col shadow-2xl border-l border-[#e0e3e5] animate-in slide-in-from-right duration-300">
        {/* Drawer Header */}
        <div className="p-4 border-b border-[#e0e3e5] flex items-center justify-between bg-[#f7f9fb]">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-[#00288e]" />
            <h3 className="font-bold text-base text-[#191c1e]">Keranjang Belanja</h3>
            <span className="bg-[#dde1ff] text-[#173bab] text-xs font-bold px-2 py-0.5 rounded-full">
              {items.length} item
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-500 hover:text-slate-800 hover:bg-[#e0e3e5] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cart Item List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
              <ShoppingBag className="w-16 h-16 mb-3 stroke-[1.2]" />
              <p className="font-bold text-slate-700 text-sm mb-1">Keranjang Masih Kosong</p>
              <p className="text-xs text-slate-500">
                Pilih produk dari katalog toko kami untuk menambahkan ke keranjang belanja Anda.
              </p>
            </div>
          ) : (
            items.map((item) => {
              const itemPrice = item.product.promo_price || item.product.price;
              const subtotal = itemPrice * item.quantity;

              return (
                <div
                  key={item.product.id}
                  className="p-3 bg-[#f7f9fb] rounded-xl border border-[#e0e3e5] flex gap-3 items-center"
                >
                  <img
                    src={item.product.image || 'https://images.unsplash.com/photo-1586075010923-2dd4570fb338?auto=format&fit=crop&w=300&q=80'}
                    alt={item.product.name}
                    className="w-16 h-16 object-cover rounded-lg bg-white border shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-bold text-slate-900 truncate">{item.product.name}</h4>
                    <p className="text-xs text-[#00288e] font-extrabold mt-0.5">
                      {formatRupiah(itemPrice)}
                    </p>
                    <p className="text-[10px] text-slate-400">Subtotal: {formatRupiah(subtotal)}</p>
                  </div>

                  {/* Quantity controls */}
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <button
                      onClick={() => onRemoveItem(item.product.id)}
                      className="text-red-500 hover:text-red-700 p-1"
                      title="Hapus item"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <div className="flex items-center border border-[#c4c5d5] rounded-lg bg-white">
                      <button
                        onClick={() => onUpdateQuantity(item.product.id, Math.max(1, item.quantity - 1))}
                        className="px-1.5 py-0.5 text-slate-600 hover:text-slate-900"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-6 text-center text-xs font-bold">{item.quantity}</span>
                      <button
                        onClick={() => onUpdateQuantity(item.product.id, item.quantity + 1)}
                        className="px-1.5 py-0.5 text-slate-600 hover:text-slate-900"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Drawer Footer */}
        {items.length > 0 && (
          <div className="p-4 border-t border-[#e0e3e5] bg-[#f7f9fb] space-y-3">
            <div className="flex justify-between items-center text-xs text-slate-500">
              <span>Total Pesanan ({items.reduce((acc, i) => acc + i.quantity, 0)} item):</span>
              <button
                onClick={onClearCart}
                className="text-red-600 hover:underline font-medium text-[11px]"
              >
                Kosongkan Keranjang
              </button>
            </div>

            <div className="flex justify-between items-center text-lg font-extrabold text-[#00288e]">
              <span>Total:</span>
              <span>{formatRupiah(totalAmount)}</span>
            </div>

            <button
              onClick={onProceedCheckout}
              className="w-full bg-[#00288e] text-white py-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 hover:bg-opacity-90 active:scale-98 transition-all shadow-md"
            >
              <span>Lanjut ke Form Checkout</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
