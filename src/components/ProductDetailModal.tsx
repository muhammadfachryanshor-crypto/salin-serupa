import React, { useState } from 'react';
import { Product, Category, StoreSettings } from '../types';
import { formatRupiah, generateWhatsAppOrderUrl } from '../utils';
import { X, Plus, Minus, ShoppingBag, MessageSquare, CheckCircle2 } from 'lucide-react';

interface ProductDetailModalProps {
  product: Product | null;
  categories: Category[];
  settings: StoreSettings;
  onClose: () => void;
  onAddToCart: (product: Product, quantity: number) => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  categories,
  settings,
  onClose,
  onAddToCart
}) => {
  const [quantity, setQuantity] = useState<number>(1);

  if (!product) return null;

  const currentPrice = product.promo_price || product.price;
  const hasDiscount = !!product.promo_price && product.promo_price < product.price;
  const categoryName = categories.find(c => c.id === product.category_id)?.name || 'ATK';

  const handleDirectWhatsApp = () => {
    const waUrl = generateWhatsAppOrderUrl(
      settings.whatsapp,
      'Pelanggan Direct',
      '',
      [{ product, quantity }],
      currentPrice * quantity,
      `Pesan langsung dari detail produk: ${product.name}`,
      'Ambil di toko'
    );
    window.open(waUrl, '_blank');
  };

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-[#e0e3e5] relative flex flex-col md:flex-row">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-white/80 hover:bg-white text-slate-700 flex items-center justify-center shadow-md transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Left Column: Image */}
        <div className="md:w-1/2 bg-[#f2f4f6] p-6 flex items-center justify-center relative min-h-[260px]">
          <img
            src={product.image || 'https://images.unsplash.com/photo-1586075010923-2dd4570fb338?auto=format&fit=crop&w=600&q=80'}
            alt={product.name}
            className="w-full h-auto max-h-72 object-contain drop-shadow-md rounded-xl"
          />
          {hasDiscount && (
            <span className="absolute top-4 left-4 bg-[#ba1a1a] text-white text-xs font-bold px-3 py-1 rounded-full shadow-xs">
              DISKON PROMO
            </span>
          )}
        </div>

        {/* Right Column: Information */}
        <div className="md:w-1/2 p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-[#dde1ff] text-[#173bab] text-[11px] font-bold px-2.5 py-0.5 rounded-full">
                {categoryName}
              </span>
              <span className="text-slate-400 text-xs font-mono">SKU: {product.sku}</span>
            </div>

            <h2 className="text-xl font-bold text-[#191c1e] mb-2">{product.name}</h2>

            {/* Price */}
            <div className="flex items-baseline gap-2 mb-4">
              <span className="text-2xl font-extrabold text-[#00288e]">
                {formatRupiah(currentPrice)}
              </span>
              {hasDiscount && (
                <span className="text-sm text-slate-400 line-through">
                  {formatRupiah(product.price)}
                </span>
              )}
              {product.unit && (
                <span className="text-xs text-slate-500 font-medium">/ {product.unit}</span>
              )}
            </div>

            {/* Stock status */}
            <div className="flex items-center gap-1.5 text-xs font-semibold text-green-700 mb-4 bg-green-50 px-3 py-1.5 rounded-lg border border-green-200">
              <CheckCircle2 className="w-4 h-4 text-green-600" />
              <span>Stok Tersedia ({product.stock} {product.unit || 'Pcs'})</span>
            </div>

            {/* Description */}
            <div className="mb-6">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Deskripsi Produk:</h4>
              <p className="text-xs text-[#444653] leading-relaxed font-normal">
                {product.description || 'Tidak ada deskripsi tambahan.'}
              </p>
            </div>
          </div>

          {/* Action Row */}
          <div className="space-y-4 pt-4 border-t border-[#e0e3e5]">
            {/* Quantity Selector */}
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700">Jumlah Pesanan:</span>
              <div className="flex items-center border border-[#c4c5d5] rounded-xl bg-[#f2f4f6]">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="p-2 text-slate-700 hover:text-[#00288e] transition-colors"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-10 text-center text-sm font-bold text-slate-800">{quantity}</span>
                <button
                  onClick={() => setQuantity(Math.min(product.stock || 99, quantity + 1))}
                  className="p-2 text-slate-700 hover:text-[#00288e] transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Buttons */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => {
                  onAddToCart(product, quantity);
                  onClose();
                }}
                className="bg-[#00288e] text-white py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 hover:bg-opacity-90 active:scale-98 transition-all shadow-md"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>+ Keranjang</span>
              </button>

              <button
                onClick={handleDirectWhatsApp}
                className="bg-[#006e2f] text-white py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 hover:bg-opacity-90 active:scale-98 transition-all shadow-md"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Pesan WhatsApp</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
