import React, { useState } from 'react';
import { Service } from '../../types';
import { Plus, Edit2, Trash2, X } from 'lucide-react';
import { getSupabaseClient, getSupabaseHeaders } from '../../lib/supabase';
import { saveServiceToSupabase, deleteServiceFromSupabase } from '../../lib/supabaseData';

interface AdminServicesProps {
  services: Service[];
  token: string;
  onRefreshData: () => void;
  onShowToast: (msg: string, type?: 'success' | 'error') => void;
}

export const AdminServices: React.FC<AdminServicesProps> = ({
  services,
  token,
  onRefreshData,
  onShowToast
}) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Service | null>(null);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState('file_copy');
  const [badge, setBadge] = useState('');
  const [image, setImage] = useState('');
  const [isActive, setIsActive] = useState(true);

  const openModal = (srv?: Service) => {
    if (srv) {
      setEditing(srv);
      setName(srv.name);
      setDescription(srv.description);
      setIcon(srv.icon || 'file_copy');
      setBadge(srv.badge || '');
      setImage(srv.image || '');
      setIsActive(srv.is_active);
    } else {
      setEditing(null);
      setName('');
      setDescription('');
      setIcon('file_copy');
      setBadge('');
      setImage('');
      setIsActive(true);
    }
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { id: editing?.id, name, description, icon, badge, image, is_active: isActive };
    try {
      let supaSuccess = false;
      const client = getSupabaseClient();
      if (client) {
        try {
          await saveServiceToSupabase(client, payload);
          supaSuccess = true;
        } catch (supaErr: any) {
          console.warn('Direct Supabase service save failed, falling back to API:', supaErr);
        }
      }

      const url = editing ? `/api/admin/services/${editing.id}` : '/api/admin/services';
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
        onShowToast('Layanan berhasil disimpan!');
        setModalOpen(false);
        onRefreshData();
      } else {
        onShowToast('Gagal menyimpan layanan', 'error');
      }
    } catch (err) {
      onShowToast('Gagal menyimpan layanan', 'error');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Hapus layanan ini?')) return;
    try {
      let supaDeleted = false;
      const client = getSupabaseClient();
      if (client) {
        try {
          await deleteServiceFromSupabase(client, id);
          supaDeleted = true;
        } catch (supaErr: any) {
          console.warn('Direct Supabase service delete failed, falling back to API:', supaErr);
        }
      }

      let apiDeleted = false;
      try {
        const res = await fetch(`/api/admin/services/${id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            ...getSupabaseHeaders()
          }
        });
        apiDeleted = res.ok;
      } catch (e) {}

      if (supaDeleted || apiDeleted) {
        onShowToast('Layanan berhasil dihapus');
        onRefreshData();
      } else {
        onShowToast('Gagal menghapus layanan', 'error');
      }
    } catch (err) {
      onShowToast('Gagal menghapus layanan', 'error');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-[#191c1e]">Kelola Layanan Unggulan (Bento Grid)</h2>
          <p className="text-xs text-slate-500">Sesuaikan kartu layanan bento grid di halaman utama</p>
        </div>
        <button
          onClick={() => openModal()}
          className="bg-[#00288e] text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" /> Tambah Layanan
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {services.map((s) => (
          <div key={s.id} className="bg-white p-4 rounded-2xl border border-[#e0e3e5] flex justify-between items-start gap-4">
            <div className="flex gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#00288e]/10 text-[#00288e] flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined">{s.icon || 'file_copy'}</span>
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900">{s.name}</h3>
                <p className="text-xs text-slate-500 line-clamp-2 mt-0.5">{s.description}</p>
                {s.badge && (
                  <span className="bg-[#dde1ff] text-[#173bab] text-[10px] font-bold px-2 py-0.5 rounded mt-2 inline-block">
                    {s.badge}
                  </span>
                )}
              </div>
            </div>
            <div className="flex gap-1">
              <button onClick={() => openModal(s)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded">
                <Edit2 className="w-4 h-4" />
              </button>
              <button onClick={() => handleDelete(s.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded">
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
            <h3 className="font-bold text-base mb-4">{editing ? 'Edit Layanan' : 'Tambah Layanan'}</h3>
            <form onSubmit={handleSave} className="space-y-3 text-xs font-medium">
              <div>
                <label className="block font-bold mb-1">Nama Layanan *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl"
                />
              </div>
              <div>
                <label className="block font-bold mb-1">Material Icon Name</label>
                <input
                  type="text"
                  value={icon}
                  onChange={(e) => setIcon(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl"
                  placeholder="Contoh: file_copy, print, scanner"
                />
              </div>
              <div>
                <label className="block font-bold mb-1">Deskripsi</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl"
                />
              </div>
              <div>
                <label className="block font-bold mb-1">Badge Tag (Opsional)</label>
                <input
                  type="text"
                  value={badge}
                  onChange={(e) => setBadge(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl"
                  placeholder="Contoh: Paling Dicari, Diskon 10%"
                />
              </div>
              <button type="submit" className="w-full bg-[#00288e] text-white py-2.5 rounded-xl font-bold">
                Simpan Layanan
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
