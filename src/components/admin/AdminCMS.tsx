import React, { useState } from 'react';
import { LandingContent } from '../../types';
import { Save, Image as ImageIcon, Layout, Info } from 'lucide-react';
import { getSupabaseClient, getSupabaseHeaders } from '../../lib/supabase';
import { saveLandingToSupabase } from '../../lib/supabaseData';

interface AdminCMSProps {
  landing: LandingContent;
  token: string;
  onRefreshData: () => void;
  onShowToast: (msg: string, type?: 'success' | 'error') => void;
}

export const AdminCMS: React.FC<AdminCMSProps> = ({
  landing,
  token,
  onRefreshData,
  onShowToast
}) => {
  const [headline, setHeadline] = useState(landing.hero.headline);
  const [headlineAccent, setHeadlineAccent] = useState(landing.hero.headline_accent);
  const [subheadline, setSubheadline] = useState(landing.hero.subheadline);
  const [ctaPrimary, setCtaPrimary] = useState(landing.hero.cta_primary);
  const [ctaSecondary, setCtaSecondary] = useState(landing.hero.cta_secondary);
  const [heroImage, setHeroImage] = useState(landing.hero.hero_image);
  const [trustText, setTrustText] = useState(landing.hero.trust_text);

  const [aboutTitle, setAboutTitle] = useState(landing.tentang.title);
  const [aboutDesc, setAboutDesc] = useState(landing.tentang.description);
  const [aboutImage, setAboutImage] = useState(landing.tentang.image);
  const [aboutCta, setAboutCta] = useState(landing.tentang.cta_text);

  const [loading, setLoading] = useState(false);

  const handleSaveCMS = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const updatedLanding: LandingContent = {
      hero: {
        ...landing.hero,
        headline,
        headline_accent: headlineAccent,
        subheadline,
        cta_primary: ctaPrimary,
        cta_secondary: ctaSecondary,
        hero_image: heroImage,
        trust_text: trustText,
        is_active: true
      },
      keunggulan: landing.keunggulan,
      tentang: {
        is_active: true,
        title: aboutTitle,
        description: aboutDesc,
        image: aboutImage,
        cta_text: aboutCta
      }
    };

    try {
      const client = getSupabaseClient();
      if (client) {
        try {
          await saveLandingToSupabase(client, updatedLanding);
        } catch (supaErr: any) {
          console.warn('Direct Supabase CMS save failed, falling back to API:', supaErr);
        }
      }

      const res = await fetch('/api/admin/landing', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          ...getSupabaseHeaders()
        },
        body: JSON.stringify(updatedLanding)
      });

      if (res.ok) {
        onShowToast('Konten Landing Page (CMS) berhasil diperbarui!');
        onRefreshData();
      } else {
        onShowToast('Gagal memperbarui CMS', 'error');
      }
    } catch (err) {
      onShowToast('Terjadi kesalahan jaringan', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div>
        <h2 className="text-xl font-bold text-[#191c1e]">CMS Landing Page & Konten Teks</h2>
        <p className="text-xs text-slate-500">Ubah judul hero, foto toko, dan kalimat promosi secara langsung</p>
      </div>

      <form onSubmit={handleSaveCMS} className="space-y-6 text-xs font-medium">
        {/* Hero Section Form */}
        <div className="bg-white p-6 rounded-2xl border border-[#e0e3e5] shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-[#00288e] flex items-center gap-1.5 border-b pb-2">
            <Layout className="w-4 h-4" /> Section Hero Utama
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-700 font-bold mb-1">Headline Utama (Baris 1)</label>
              <input
                type="text"
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
                className="w-full px-3 py-2 border rounded-xl"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-bold mb-1">Headline Aksen Teks Biru</label>
              <input
                type="text"
                value={headlineAccent}
                onChange={(e) => setHeadlineAccent(e.target.value)}
                className="w-full px-3 py-2 border rounded-xl"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-700 font-bold mb-1">Subheadline Penjelasan</label>
            <textarea
              rows={3}
              value={subheadline}
              onChange={(e) => setSubheadline(e.target.value)}
              className="w-full px-3 py-2 border rounded-xl"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-700 font-bold mb-1">Teks Tombol Utama</label>
              <input
                type="text"
                value={ctaPrimary}
                onChange={(e) => setCtaPrimary(e.target.value)}
                className="w-full px-3 py-2 border rounded-xl"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-bold mb-1">Teks Tombol Sekunder</label>
              <input
                type="text"
                value={ctaSecondary}
                onChange={(e) => setCtaSecondary(e.target.value)}
                className="w-full px-3 py-2 border rounded-xl"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-bold mb-1">Teks Kepercayaan Pelanggan</label>
              <input
                type="text"
                value={trustText}
                onChange={(e) => setTrustText(e.target.value)}
                className="w-full px-3 py-2 border rounded-xl"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-700 font-bold mb-1 flex items-center gap-1">
              <ImageIcon className="w-4 h-4 text-slate-400" /> URL Foto Interior/Gedung Hero Toko
            </label>
            <input
              type="url"
              value={heroImage}
              onChange={(e) => setHeroImage(e.target.value)}
              className="w-full px-3 py-2 border rounded-xl"
            />
          </div>
        </div>

        {/* Tentang Kami Form */}
        <div className="bg-white p-6 rounded-2xl border border-[#e0e3e5] shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-[#00288e] flex items-center gap-1.5 border-b pb-2">
            <Info className="w-4 h-4" /> Section tentang Toko
          </h3>

          <div>
            <label className="block text-slate-700 font-bold mb-1">Judul Profil Toko</label>
            <input
              type="text"
              value={aboutTitle}
              onChange={(e) => setAboutTitle(e.target.value)}
              className="w-full px-3 py-2 border rounded-xl"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-bold mb-1">Narasi Deskripsi Profil</label>
            <textarea
              rows={3}
              value={aboutDesc}
              onChange={(e) => setAboutDesc(e.target.value)}
              className="w-full px-3 py-2 border rounded-xl"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-bold mb-1">URL Foto Profil Toko</label>
              <input
                type="url"
                value={aboutImage}
                onChange={(e) => setAboutImage(e.target.value)}
                className="w-full px-3 py-2 border rounded-xl"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-bold mb-1">Teks Tombol Kontak Profil</label>
              <input
                type="text"
                value={aboutCta}
                onChange={(e) => setAboutCta(e.target.value)}
                className="w-full px-3 py-2 border rounded-xl"
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="bg-[#00288e] text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-opacity-90 shadow-md"
        >
          <Save className="w-4 h-4" />
          <span>{loading ? 'Menyimpan CMS...' : 'Simpan Seluruh Perubahan CMS'}</span>
        </button>
      </form>
    </div>
  );
};
