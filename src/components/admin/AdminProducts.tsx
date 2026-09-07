import React, { useState } from 'react';
import { Product, Category } from '../../types';
import { formatRupiah } from '../../utils';
import { Plus, Edit2, Trash2, Search, X, Check, Image as ImageIcon } from 'lucide-react';
import { getSupabaseClient, getSupabaseHeaders } from '../../lib/supabase';
import { saveProductToSupabase, deleteProductFromSupabase } from '../../lib/supabaseData';

interface AdminProductsProps {
  products: Product[];
  categories: Category[];
  token: string;
  onRefreshData: () => void;
  onShowToast: (msg: string, type?: 'success' | 'error') => void;
}

export const AdminProducts: React.FC<AdminProductsProps> = ({
  products,
  categories,
  token,
  onRefreshData,
  onShowToast
}) => {
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [price, setPrice] = useState<number>(0);
  const [promoPrice, setPromoPrice] = useState<number>(0);
  const [unit, setUnit] = useState('Pcs');
  const [stock, setStock] = useState<number>(100);
  const [image, setImage] = useState('');
  const [description, setDescription] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [loading, setLoading] = useState(false);

  const openCreateModal = () => {
    setEditingProduct(null);
    setName('');
    setSku('ATK-' + Math.floor(100 + Math.random() * 900));
    setCategoryId(categories[0]?.id || '');
    setPrice(10000);
    setPromoPrice(0);
    setUnit('Pcs');
    setStock(100);
    setImage('');
    setDescription('');
    setIsActive(true);
    setModalOpen(true);
  };

  const openEditModal = (p: Product) => {
    setEditingProduct(p);
    setName(p.name);
    setSku(p.sku);
    setCategoryId(p.category_id);
    setPrice(p.price);
    setPromoPrice(p.promo_price || 0);
    setUnit(p.unit || 'Pcs');
    setStock(p.stock);
    setImage(p.image);
    setDescription(p.description || '');
    setIsActive(p.is_active);
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const payload = {
      id: editingProduct?.id,
      name,
      sku,
      category_id: categoryId || categories[0]?.id || 'cat-1',
      price: Number(price),
      promo_price: promoPrice ? Number(promoPrice) : undefined,
      unit,
      stock: Number(stock),
      image,
      description,
      is_active: isActive
    };

    try {
      let supaSuccess = false;
      const client = getSupabaseClient();
      if (client) {
        try {
          await saveProductToSupabase(client, payload);
          supaSuccess = true;
        } catch (supaErr: any) {
          console.warn('Direct Supabase product save failed, falling back to API:', supaErr);
        }
      }

      const url = editingProduct ? `/api/admin/products/${editingProduct.id}` : '/api/admin/products';
      const method = editingProduct ? 'PUT' : 'POST';

      let apiSuccess = false;
      try {
        const res = await fetch(url, {
          method,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            ...getSupabaseHeaders()
          },
          body: JSON.stringify(payload)
        });
        apiSuccess = res.ok;
      } catch (e) {
        console.warn('API save call failed:', e);
      }

      if (supaSuccess || apiSuccess) {
        onShowToast(editingProduct ? 'Produk berhasil diperbarui!' : 'Produk baru berhasil ditambahkan!');
        setModalOpen(false);
        onRefreshData();
      } else {
        onShowToast('Gagal menyimpan produk', 'error');
      }
    } catch (err) {
      onShowToast('Terjadi kesalahan jaringan', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Yakin ingin menghapus produk ini?')) return;
    try {
      let supaDeleted = false;
      const client = getSupabaseClient();
      if (client) {
        try {
          await deleteProductFromSupabase(client, id);
          supaDeleted = true;
        } catch (supaErr: any) {
          console.warn('Direct Supabase product delete failed, falling back to API:', supaErr);
        }
      }

      let apiDeleted = false;
      try {
        const res = await fetch(`/api/admin/products/${id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            ...getSupabaseHeaders()
          }
        });
        apiDeleted = res.ok;
      } catch (e) {}

      if (supaDeleted || apiDeleted) {
        onShowToast('Produk berhasil dihapus');
        onRefreshData();
      }
    } catch (err) {
      onShowToast('Gagal menghapus produk', 'error');
    }
  };

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.sku.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#191c1e]">Kelola Katalog Produk & ATK</h2>
          <p className="text-xs text-slate-500">Tambah, edit, atau sesuaikan stok dan harga produk toko</p>
        </div>

        <button
          onClick={openCreateModal}
          className="bg-[#00288e] text-white px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 hover:bg-opacity-90 transition-all shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>+ Tambah Produk</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="relative max-w-sm">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Cari berdasarkan nama atau SKU..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2 bg-white border border-[#c4c5d5] rounded-xl text-xs font-medium focus:outline-none focus:border-[#00288e]"
        />
      </div>

      {/* Product Table */}
      <div className="bg-white rounded-2xl border border-[#e0e3e5] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-[#f7f9fb] border-b border-[#e0e3e5] uppercase font-bold text-slate-500 text-[10px]">
              <tr>
                <th className="py-3 px-4">Gambar & Nama</th>
                <th className="py-3 px-4">SKU</th>
                <th className="py-3 px-4">Kategori</th>
                <th className="py-3 px-4">Harga Normal / Promo</th>
                <th className="py-3 px-4">Stok</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f2f4f6]">
              {filtered.map((p) => {
                const catName = categories.find(c => c.id === p.category_id)?.name || 'ATK';
                return (
                  <tr key={p.id} className="hover:bg-[#f7f9fb] transition-colors">
                    <td className="py-3 px-4 flex items-center gap-3">
                      <img
                        src={p.image || 'https://images.unsplash.com/photo-1586075010923-2dd4570fb338?auto=format&fit=crop&w=150&q=80'}
                        alt={p.name}
                        className="w-10 h-10 object-cover rounded-lg border bg-slate-50 shrink-0"
                      />
                      <div>
                        <p className="font-bold text-slate-900">{p.name}</p>
                        <p className="text-[10px] text-slate-400 line-clamp-1">{p.description}</p>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono font-semibold text-slate-600">{p.sku}</td>
                    <td className="py-3 px-4">
                      <span className="bg-[#dde1ff] text-[#173bab] px-2 py-0.5 rounded text-[10px] font-bold">
                        {catName}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-bold">
                      <p className="text-[#00288e]">{formatRupiah(p.promo_price || p.price)}</p>
                      {p.promo_price && (
                        <p className="text-[10px] text-slate-400 line-through">{formatRupiah(p.price)}</p>
                      )}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-800">{p.stock} {p.unit}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        p.is_active ? 'bg-green-100 text-green-800' : 'bg-slate-200 text-slate-600'
                      }`}>
                        {p.is_active ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right space-x-1">
                      <button
                        onClick={() => openEditModal(p)}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Edit Produk"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(p.id)}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Hapus Produk"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Form */}
      {modalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl relative border border-[#e0e3e5]">
            <button
              onClick={() => setModalOpen(false)}
              className="absolute top-4 right-4 p-1 text-slate-400 hover:text-slate-700"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-bold text-[#191c1e] mb-4">
              {editingProduct ? 'Edit Produk ATK' : 'Tambah Produk Baru'}
            </h3>

            <form onSubmit={handleSave} className="space-y-4 text-xs font-medium">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Nama Produk *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl"
                  placeholder="Contoh: Kertas A4 PaperOne 75gr"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">SKU Produk</label>
                  <input
                    type="text"
                    required
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Kategori *</label>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Harga Normal *</label>
                  <input
                    type="number"
                    required
                    value={price}
                    onChange={(e) => setPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 border rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Harga Promo (Opsional)</label>
                  <input
                    type="number"
                    value={promoPrice}
                    onChange={(e) => setPromoPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 border rounded-xl"
                    placeholder="0 jika tidak promo"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Stok *</label>
                  <input
                    type="number"
                    required
                    value={stock}
                    onChange={(e) => setStock(Number(e.target.value))}
                    className="w-full px-3 py-2 border rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">URL Gambar Produk</label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={image}
                    onChange={(e) => setImage(e.target.value)}
                    className="flex-1 px-3 py-2 border rounded-xl"
                    placeholder="https://images.unsplash.com/..."
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Deskripsi Singkat</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="productActive"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="rounded text-[#00288e]"
                />
                <label htmlFor="productActive" className="text-slate-700 font-bold">Tampilkan di katalog website</label>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#00288e] text-white py-3 rounded-xl font-bold hover:bg-opacity-90 transition-all mt-2"
              >
                {loading ? 'Menyimpan...' : 'Simpan Produk'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
