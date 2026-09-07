import React, { useState, useMemo } from 'react';
import { Product, Category } from '../types';
import { formatRupiah } from '../utils';
import { Search, Filter, ShoppingBag, Eye, ArrowUpDown } from 'lucide-react';

interface KatalogProdukProps {
  products: Product[];
  categories: Category[];
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onAddToCart: (product: Product, quantity?: number) => void;
  onOpenDetail: (product: Product) => void;
}

export const KatalogProduk: React.FC<KatalogProdukProps> = ({
  products,
  categories,
  searchQuery,
  onSearchChange,
  onAddToCart,
  onOpenDetail
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'terbaru' | 'harga-rendah' | 'harga-tinggi'>('terbaru');

  const activeCategories = useMemo(() => {
    return categories.filter(c => c.is_active).sort((a, b) => a.sort_order - b.sort_order);
  }, [categories]);

  const filteredProducts = useMemo(() => {
    return products
      .filter(p => p.is_active)
      .filter(p => {
        const matchesCategory = selectedCategory === 'all' || p.category_id === selectedCategory;
        const q = searchQuery.toLowerCase().trim();
        const matchesQuery = !q || p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q) || p.description.toLowerCase().includes(q);
        return matchesCategory && matchesQuery;
      })
      .sort((a, b) => {
        const priceA = a.promo_price || a.price;
        const priceB = b.promo_price || b.price;
        if (sortBy === 'harga-rendah') return priceA - priceB;
        if (sortBy === 'harga-tinggi') return priceB - priceA;
        return 0; // default order
      });
  }, [products, selectedCategory, searchQuery, sortBy]);

  const getCategoryName = (catId: string) => {
    const cat = categories.find(c => c.id === catId);
    return cat ? cat.name : 'ATK';
  };

  return (
    <section className="py-16 bg-white" id="katalog">
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        {/* Section Title */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-[#191c1e] mb-2">Katalog Produk & ATK</h2>
            <p className="text-sm text-[#444653]">Pilih berbagai kertas, alat tulis kantor, dan perlengkapan dokumen berkualitas.</p>
          </div>

          {/* Controls Bar: Search + Sort */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Cari produk..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-[#f2f4f6] border border-[#c4c5d5] rounded-xl text-xs sm:text-sm font-medium focus:outline-none focus:border-[#00288e]"
              />
            </div>

            <div className="relative flex items-center gap-1.5 bg-[#f2f4f6] px-3 py-2 rounded-xl border border-[#c4c5d5] text-xs font-semibold text-slate-700">
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-500" />
              <select
                value={sortBy}
                onChange={(e: any) => setSortBy(e.target.value)}
                className="bg-transparent focus:outline-none text-xs font-semibold cursor-pointer"
              >
                <option value="terbaru">Terbaru</option>
                <option value="harga-rendah">Harga Termurah</option>
                <option value="harga-tinggi">Harga Termahal</option>
              </select>
            </div>
          </div>
        </div>

        {/* Category Pills Filter */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 scrollbar-none mb-6 -mx-4 px-4 sm:mx-0 sm:px-0">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
              selectedCategory === 'all'
                ? 'bg-[#00288e] text-white shadow-xs'
                : 'bg-[#f2f4f6] text-[#444653] hover:bg-[#e0e3e5]'
            }`}
          >
            Semua Produk ({products.filter(p => p.is_active).length})
          </button>
          {activeCategories.map((cat) => {
            const count = products.filter(p => p.is_active && p.category_id === cat.id).length;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                  selectedCategory === cat.id
                    ? 'bg-[#00288e] text-white shadow-xs'
                    : 'bg-[#f2f4f6] text-[#444653] hover:bg-[#e0e3e5]'
                }`}
              >
                {cat.name} ({count})
              </button>
            );
          })}
        </div>

        {/* Product Grid (Mobile 2 columns, Desktop 4 columns) */}
        {filteredProducts.length === 0 ? (
          <div className="text-center py-16 bg-[#f7f9fb] rounded-2xl border border-dashed border-[#c4c5d5] p-8">
            <Filter className="w-12 h-12 mx-auto text-slate-300 mb-3" />
            <h3 className="text-base font-bold text-slate-700 mb-1">Produk Tidak Ditemukan</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
              Coba kata kunci lain atau pilih kategori yang berbeda untuk menemukan produk yang Anda inginkan.
            </p>
            <button
              onClick={() => {
                onSearchChange('');
                setSelectedCategory('all');
              }}
              className="bg-[#00288e] text-white px-4 py-2 rounded-xl text-xs font-semibold"
            >
              Reset Filter
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
            {filteredProducts.map((product) => {
              const currentPrice = product.promo_price || product.price;
              const hasDiscount = !!product.promo_price && product.promo_price < product.price;

              return (
                <div
                  key={product.id}
                  className="bg-white rounded-2xl border border-[#e0e3e5] overflow-hidden flex flex-col justify-between hover:shadow-lg transition-all duration-300 group"
                >
                  {/* Image Area */}
                  <div className="relative aspect-square bg-[#f2f4f6] overflow-hidden">
                    <img
                      src={product.image || 'https://images.unsplash.com/photo-1586075010923-2dd4570fb338?auto=format&fit=crop&w=600&q=80'}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />

                    {/* Promo Tag */}
                    {hasDiscount && (
                      <span className="absolute top-2 left-2 bg-[#ba1a1a] text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-xs">
                        PROMO
                      </span>
                    )}

                    {/* Category Tag */}
                    <span className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-xs text-white text-[9px] font-semibold px-2 py-0.5 rounded-full">
                      {getCategoryName(product.category_id)}
                    </span>

                    {/* Quick View Button */}
                    <button
                      onClick={() => onOpenDetail(product)}
                      title="Detail Produk"
                      className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white/90 text-slate-700 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center hover:bg-white shadow-xs"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Body Content */}
                  <div className="p-3 sm:p-4 flex-1 flex flex-col justify-between">
                    <div>
                      <h3
                        onClick={() => onOpenDetail(product)}
                        className="text-xs sm:text-sm font-bold text-[#191c1e] line-clamp-2 hover:text-[#00288e] cursor-pointer transition-colors mb-1"
                      >
                        {product.name}
                      </h3>
                      <p className="text-[11px] text-[#757684] line-clamp-1 mb-2 font-normal">
                        {product.unit ? `Satuan: ${product.unit}` : ''} • Stok: {product.stock > 0 ? product.stock : 'Habis'}
                      </p>
                    </div>

                    {/* Price & Action */}
                    <div className="mt-2 pt-2 border-t border-[#f2f4f6]">
                      <div className="mb-2">
                        {hasDiscount && (
                          <span className="text-[10px] text-slate-400 line-through block font-normal">
                            {formatRupiah(product.price)}
                          </span>
                        )}
                        <span className="text-xs sm:text-sm font-extrabold text-[#00288e]">
                          {formatRupiah(currentPrice)}
                        </span>
                      </div>

                      <button
                        onClick={() => onAddToCart(product)}
                        disabled={product.stock <= 0}
                        className={`w-full py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                          product.stock > 0
                            ? 'bg-[#00288e] text-white hover:bg-opacity-90 active:scale-98 shadow-xs'
                            : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                        }`}
                      >
                        <ShoppingBag className="w-3.5 h-3.5" />
                        <span className="text-[11px] sm:text-xs">
                          {product.stock > 0 ? '+ Keranjang' : 'Stok Habis'}
                        </span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
};
