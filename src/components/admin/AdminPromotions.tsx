import React, { useState } from 'react';
import { Promotion } from '../../types';
import { formatRupiah } from '../../utils';
import { Plus, Edit2, Trash2, X } from 'lucide-react';
import { getSupabaseClient, getSupabaseHeaders } from '../../lib/supabase';
import { savePromotionToSupabase, deletePromotionFromSupabase } from '../../lib/supabaseData';

interface AdminPromotionsProps {
  promotions: Promotion[];
  token: string;
  onRefreshData: () => void;
  onShowToast: (msg: string, type?: 'success' | 'error') => void;
}

export const AdminPromotions: React.FC<AdminPromotionsProps> = ({
  promotions,
  token,
  onRefreshData,
  onShowToast
}) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Promotion | null>(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [normalPrice, setNormalPrice] = useState<number>(0);
  const [promoPrice, setPromoPrice] = useState<number>(0);
  const [image, setImage] = useState('');
  const [isActive, setIsActive] = useState(true);

  const openModal = (p?: Promotion) => {
    if (p) {
      setEditing(p);
      setTitle(p.title);
      setDescription(p.description);
      setNormalPrice(p.normal_price);
      setPromoPrice(p.promo_price);
      setImage(p.image);
      setIsActive(p.is_active);
    } else {
      setEditing(null);
      setTitle('');
      setDescription('');
      setNormalPrice(15000);
      setPromoPrice(10000);
      setImage('');
      setIsActive(true);
    }
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      id: editing?.id,
      title,
      description,
      normal_price: Number(normalPrice),
      promo_price: Number(promoPrice),
      image,
      is_active: isActive
    };

    try {
      let supaSuccess = false;
      const client = getSupabaseClient();
      if (client) {
        try {
          await savePromotionToSupabase(client, payload);
          supaSuccess = true;
        } catch (supaErr: any) {
          console.warn('Direct Supabase promo save failed, falling back to API:', supaErr);
        }
      }

      const url = editing ? `/api/admin/promotions/${editing.id}` : '/api/admin/promotions';
      const method = editing ? 'PUT' : 'POST';
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
      } catch (e) {}

      if (supaSuccess || apiSuccess) {
        onShowToast('Promo berhasil disimpan!');
        setModalOpen(false);
        onRefreshData();
      } else {
        onShowToast('Gagal menyimpan promo', 'error');
      }
    } catch (err) {
      onShowToast('Gagal menyimpan promo', 'error');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Hapus promo ini?')) return;
    try {
      let supaDeleted = false;
      const client = getSupabaseClient();
      if (client) {
        try {
          await deletePromotionFromSupabase(client, id);
          supaDeleted = true;
        } catch (supaErr: any) {
          console.warn('Direct Supabase promo delete failed, falling back to API:', supaErr);
        }
      }

      let apiDeleted = false;
      try {
        const res = await fetch(`/api/admin/promotions/${id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            ...getSupabaseHeaders()
          }
        });
        apiDeleted = res.ok;
      } catch (e) {}

      if (supaDeleted || apiDeleted) {
        onShowToast('Promo dihapus');
        onRefreshData();
      } else {
        onShowToast('Gagal menghapus promo', 'error');
      }
    } catch (err) {
      onShowToast('Gagal menghapus promo', 'error');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-[#191c1e]">Kelola Promo & Penawaran Spesial</h2>
          <p className="text-xs text-slate-500">Atur paket diskon dan countdown penawaran terbatas</p>
        </div>
        <button
          onClick={() => openModal()}
          className="bg-[#ba1a1a] text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" /> Tambah Promo
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {promotions.map((p) => (
          <div key={p.id} className="bg-white p-4 rounded-2xl border border-[#e0e3e5] flex gap-4 items-center justify-between">
            <div className="flex items-center gap-3">
              <img src={p.image} alt={p.title} className="w-16 h-16 object-cover rounded-xl border" />
              <div>
                <h3 className="font-bold text-sm text-slate-900">{p.title}</h3>
                <p className="text-xs text-slate-500 line-clamp-1">{p.description}</p>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-xs font-bold text-[#ba1a1a]">{formatRupiah(p.promo_price)}</span>
                  <span className="text-[10px] text-slate-400 line-through">{formatRupiah(p.normal_price)}</span>
                </div>
              </div>
            </div>
            <div className="flex gap-1">
              <button onClick={() => openModal(p)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded">
                <Edit2 className="w-4 h-4" />
              </button>
              <button onClick={() => handleDelete(p.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl relative border border-[#e0e3e5]">
            <button onClick={() => setModalOpen(false)} className="absolute top-4 right-4 text-slate-400">
              <X className="w-5 h-5" />
            </button>
            <h3 className="font-bold text-base mb-4">{editing ? 'Edit Promo' : 'Tambah Promo Baru'}</h3>
            <form onSubmit={handleSave} className="space-y-3 text-xs font-medium">
              <div>
                <label className="block font-bold mb-1">Judul Promo *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold mb-1">Harga Normal</label>
                  <input
                    type="number"
                    value={normalPrice}
                    onChange={(e) => setNormalPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 border rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1">Harga Promo Spesial</label>
                  <input
                    type="number"
                    value={promoPrice}
                    onChange={(e) => setPromoPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 border rounded-xl"
                  />
                </div>
              </div>
              <div>
                <label className="block font-bold mb-1">URL Gambar Promo</label>
                <input
                  type="url"
                  value={image}
                  onChange={(e) => setImage(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl"
                />
              </div>
              <div>
                <label className="block font-bold mb-1">Deskripsi Singkat</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl"
                />
              </div>
              <button type="submit" className="w-full bg-[#ba1a1a] text-white py-2.5 rounded-xl font-bold">
                Simpan Promo
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
