import React, { useState, useEffect } from 'react';
import { StoreSettings } from '../../types';
import { Save, Store, MapPin, Phone, Clock, Globe, Database, Download, Upload, AlertCircle, Image as ImageIcon, RefreshCw, Copy, Check, Code, ExternalLink, FileCode, Layers, CheckCircle2, XCircle, ShieldCheck, Key, Link2, Trash2 } from 'lucide-react';
import { isSupabaseConfigured, getSupabaseClient, getSupabaseCredentials, saveSupabaseCredentials, clearSupabaseCredentials, testSupabaseConnection as testSupabaseLib, getSupabaseHeaders } from '../../lib/supabase';
import { saveSettingsToSupabase } from '../../lib/supabaseData';

interface AdminSettingsProps {
  settings: StoreSettings;
  token: string;
  onRefreshData: () => void;
  onShowToast: (msg: string, type?: 'success' | 'error') => void;
}

export const AdminSettings: React.FC<AdminSettingsProps> = ({
  settings,
  token,
  onRefreshData,
  onShowToast
}) => {
  const [storeName, setStoreName] = useState(settings.store_name);
  const [logo, setLogo] = useState(settings.logo || '/logo.jpg');
  const [favicon, setFavicon] = useState(settings.favicon || '/logo.jpg');
  const [whatsapp, setWhatsapp] = useState(settings.whatsapp);
  const [address, setAddress] = useState(settings.address);
  const [weekdaysHours, setWeekdaysHours] = useState(settings.business_hours_weekdays);
  const [sundayHours, setSundayHours] = useState(settings.business_hours_sunday);
  const [mapsUrl, setMapsUrl] = useState(settings.maps_url);
  const [metaTitle, setMetaTitle] = useState(settings.meta_title);
  const [metaDesc, setMetaDesc] = useState(settings.meta_description);

  const [loading, setLoading] = useState(false);
  const [restoreLoading, setRestoreLoading] = useState(false);
  const [logoUploading, setLogoUploading] = useState(false);

  const [showSqlModal, setShowSqlModal] = useState(false);
  const [sqlContent, setSqlContent] = useState('');
  const [loadingSql, setLoadingSql] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);

  // Supabase Interactive Configuration state
  const initialCreds = getSupabaseCredentials();
  const [inputUrl, setInputUrl] = useState(initialCreds.url);
  const [inputAnonKey, setInputAnonKey] = useState(initialCreds.key);
  const [credSource, setCredSource] = useState<'env' | 'localStorage' | 'none'>(initialCreds.source);

  const [supabaseStatus, setSupabaseStatus] = useState<{
    checked: boolean;
    connected: boolean;
    message: string;
    details?: string;
  }>({ checked: false, connected: false, message: '' });
  const [checkingSupabase, setCheckingSupabase] = useState(false);

  const testSupabaseConnection = async (overrideUrl?: string, overrideKey?: string) => {
    setCheckingSupabase(true);
    try {
      const urlToTest = overrideUrl !== undefined ? overrideUrl : inputUrl;
      const keyToTest = overrideKey !== undefined ? overrideKey : inputAnonKey;

      const res = await testSupabaseLib(urlToTest, keyToTest);
      const currentCreds = getSupabaseCredentials();
      setCredSource(currentCreds.source);

      if (res.success) {
        setSupabaseStatus({
          checked: true,
          connected: true,
          message: 'Selamat! Website Anda SUDAH TERHUBUNG & TERINTEGRASI dengan Supabase!',
          details: res.message
        });
      } else {
        setSupabaseStatus({
          checked: true,
          connected: false,
          message: res.message,
          details: res.details || 'Pastikan URL & API Key valid dan script SQL supabase_schema.sql sudah dijalankan di Supabase.'
        });
      }
    } catch (err: any) {
      setSupabaseStatus({
        checked: true,
        connected: false,
        message: 'Gagal Memeriksa Koneksi Supabase.',
        details: err?.message || 'Terjadi kesalahan jaringan.'
      });
    } finally {
      setCheckingSupabase(false);
    }
  };

  const handleSaveSupabaseCreds = () => {
    if (!inputUrl.trim() || !inputAnonKey.trim()) {
      onShowToast('Silakan isi URL dan API Key Supabase terlebih dahulu', 'error');
      return;
    }
    saveSupabaseCredentials(inputUrl.trim(), inputAnonKey.trim());
    onShowToast('Kredensial Supabase berhasil disimpan di browser!');
    testSupabaseConnection(inputUrl.trim(), inputAnonKey.trim());
  };

  const handleClearSupabaseCreds = () => {
    clearSupabaseCredentials();
    const creds = getSupabaseCredentials();
    setInputUrl(creds.url);
    setInputAnonKey(creds.key);
    setCredSource(creds.source);
    onShowToast('Kredensial lokal Supabase berhasil direset');
    testSupabaseConnection(creds.url, creds.key);
  };

  useEffect(() => {
    testSupabaseConnection();
  }, []);

  const handleFetchSql = async () => {
    setShowSqlModal(true);
    if (sqlContent) return;
    setLoadingSql(true);
    try {
      const res = await fetch('/api/supabase/schema');
      if (res.ok) {
        const text = await res.text();
        setSqlContent(text);
      } else {
        onShowToast('Gagal memuat skema SQL', 'error');
      }
    } catch (err) {
      onShowToast('Gagal terhubung ke server', 'error');
    } finally {
      setLoadingSql(false);
    }
  };

  const handleCopySql = () => {
    if (!sqlContent) return;
    navigator.clipboard.writeText(sqlContent);
    setCopiedSql(true);
    onShowToast('Skema SQL Supabase berhasil disalin ke clipboard!');
    setTimeout(() => setCopiedSql(false), 3000);
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      onShowToast('Mohon pilih file gambar yang valid (.png, .jpg, .svg, .webp)', 'error');
      return;
    }

    setLogoUploading(true);
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setLogo(dataUrl);
      setFavicon(dataUrl);
      setLogoUploading(false);
      onShowToast('Pratinjau logo baru berhasil dimuat! Klik "Simpan Perubahan" untuk menerapkan.');
    };
    reader.onerror = () => {
      setLogoUploading(false);
      onShowToast('Gagal membaca file gambar', 'error');
    };
    reader.readAsDataURL(file);
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const updatedSettings: StoreSettings = {
      ...settings,
      store_name: storeName,
      logo,
      favicon,
      whatsapp,
      address,
      business_hours_weekdays: weekdaysHours,
      business_hours_sunday: sundayHours,
      maps_url: mapsUrl,
      meta_title: metaTitle,
      meta_description: metaDesc
    };

    try {
      const client = getSupabaseClient();
      if (client) {
        try {
          await saveSettingsToSupabase(client, updatedSettings);
        } catch (supaErr: any) {
          console.warn('Direct Supabase save failed, falling back to API:', supaErr);
        }
      }

      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...getSupabaseHeaders()
      };

      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers,
        body: JSON.stringify(updatedSettings)
      });

      if (res.ok) {
        onShowToast('Pengaturan toko berhasil tersimpan!');
        onRefreshData();
      } else {
        onShowToast('Gagal menyimpan pengaturan', 'error');
      }
    } catch (err) {
      onShowToast('Terjadi kesalahan koneksi', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadBackup = async () => {
    try {
      const res = await fetch('/api/admin/backup', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const dateStr = new Date().toISOString().split('T')[0];
        a.download = `salin-serupa-database-backup-${dateStr}.json`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        onShowToast('Database JSON berhasil diunduh!');
      } else {
        onShowToast('Gagal mengunduh backup database', 'error');
      }
    } catch (err) {
      onShowToast('Terjadi kesalahan saat membuat backup', 'error');
    }
  };

  const handleRestoreBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!window.confirm(`Apakah Anda yakin ingin melakukan Restore Database dari file "${file.name}"? Data yang ada akan diperbarui.`)) {
      e.target.value = '';
      return;
    }

    setRestoreLoading(true);
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const jsonContent = JSON.parse(reader.result as string);
        const res = await fetch('/api/admin/restore', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(jsonContent)
        });

        const data = await res.json();
        if (res.ok && data.success) {
          onShowToast('Database berhasil dipulihkan!');
          onRefreshData();
        } else {
          onShowToast(data.error || 'Format file JSON tidak sesuai', 'error');
        }
      } catch (err) {
        onShowToast('Gagal memproses file JSON restore', 'error');
      } finally {
        setRestoreLoading(false);
        e.target.value = '';
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div>
        <h2 className="text-xl font-bold text-[#191c1e]">Pengaturan Informasi Toko & Database</h2>
        <p className="text-xs text-slate-500">Kelola identitas toko, nomor WhatsApp, jam operasional, serta backup/restore database</p>
      </div>

      {/* Database Backup & Restore Box */}
      <div className="bg-white p-6 rounded-2xl border border-[#e0e3e5] shadow-xs space-y-4">
        <div className="flex items-center gap-2 border-b border-[#e0e3e5] pb-3">
          <Database className="w-5 h-5 text-[#00288e]" />
          <div>
            <h3 className="font-bold text-sm text-slate-900">Backup & Restore Database Server (JSON Storage)</h3>
            <p className="text-[11px] text-slate-500">Ekspor seluruh data toko ke file JSON atau pulihkan dari cadangan sebelumnya</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          {/* Backup Action */}
          <div className="bg-[#f7f9fb] p-4 rounded-xl border border-[#e0e3e5] space-y-2.5">
            <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
              <Download className="w-4 h-4 text-[#006e2f]" /> Backup Database
            </h4>
            <p className="text-slate-600 text-[11px]">
              Unduh cadangan data produk, layanan, pesanan, dan konfigurasi toko dalam bentuk file JSON.
            </p>
            <button
              type="button"
              onClick={handleDownloadBackup}
              className="bg-[#006e2f] text-white px-4 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-opacity-90 transition-all text-xs"
            >
              <Download className="w-4 h-4" />
              <span>Unduh Backup Database (.json)</span>
            </button>
          </div>

          {/* Restore Action */}
          <div className="bg-[#f7f9fb] p-4 rounded-xl border border-[#e0e3e5] space-y-2.5">
            <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
              <Upload className="w-4 h-4 text-[#ba1a1a]" /> Restore Database
            </h4>
            <p className="text-slate-600 text-[11px]">
              Unggah file cadangan JSON untuk memulihkan seluruh data toko ke kondisi sebelumnya.
            </p>
            <label className="inline-flex bg-[#ba1a1a] text-white px-4 py-2.5 rounded-xl font-bold items-center gap-2 hover:bg-opacity-90 cursor-pointer text-xs">
              <Upload className="w-4 h-4" />
              <span>{restoreLoading ? 'Memproses Restore...' : 'Pilih File JSON & Restore'}</span>
              <input
                type="file"
                accept=".json"
                disabled={restoreLoading}
                onChange={handleRestoreBackup}
                className="hidden"
              />
            </label>
          </div>
        </div>
      </div>

      {/* Supabase Integration & SQL Schema Box */}
      <div className="bg-white p-6 rounded-2xl border border-[#e0e3e5] shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-[#e0e3e5] pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#3ecf8e]/10 text-[#3ecf8e] flex items-center justify-center font-bold">
              <Layers className="w-5 h-5 text-[#3ecf8e]" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <span>Database Supabase PostgreSQL</span>
                <span className="bg-[#3ecf8e]/10 text-[#279d63] text-[10px] px-2 py-0.5 rounded-full font-bold">PostgreSQL Ready</span>
              </h3>
              <p className="text-[11px] text-slate-500">Skema SQL tabel, indeks, RLS policy & status koneksi Supabase</p>
            </div>
          </div>
          <a
            href="https://supabase.com/dashboard"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[11px] text-[#00288e] hover:underline font-bold flex items-center gap-1 cursor-pointer"
          >
            <span>Dashboard Supabase</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>

        {/* Live Status Connection Box */}
        <div className={`p-4 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
          supabaseStatus.connected 
            ? 'bg-emerald-50 border-emerald-200 text-emerald-900' 
            : 'bg-amber-50 border-amber-200 text-amber-900'
        }`}>
          <div className="flex items-start gap-3">
            {supabaseStatus.connected ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <XCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            )}
            <div className="space-y-0.5">
              <h4 className="font-bold text-xs flex items-center gap-2">
                <span>Status Koneksi Supabase:</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide ${
                  supabaseStatus.connected ? 'bg-emerald-200 text-emerald-900' : 'bg-amber-200 text-amber-900'
                }`}>
                  {supabaseStatus.connected ? 'Terhubung' : 'Belum Dikonfigurasi'}
                </span>
                {credSource !== 'none' && (
                  <span className="text-[10px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded-md font-mono">
                    {credSource === 'env' ? 'via Vercel Environment' : 'via Form Lokal Browser'}
                  </span>
                )}
              </h4>
              <p className="text-[11px] leading-relaxed">
                {supabaseStatus.message}
              </p>
              {supabaseStatus.details && (
                <p className="text-[10.5px] opacity-80 mt-1 font-mono">
                  {supabaseStatus.details}
                </p>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={() => testSupabaseConnection()}
            disabled={checkingSupabase}
            className="shrink-0 bg-white border border-slate-300 text-slate-700 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-slate-50 flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${checkingSupabase ? 'animate-spin text-[#00288e]' : ''}`} />
            <span>{checkingSupabase ? 'Memeriksa...' : 'Cek Ulang Koneksi'}</span>
          </button>
        </div>

        {/* Interactive Supabase Credentials Input Form */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3.5">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
              <Key className="w-4 h-4 text-[#00288e]" />
              <span>Input Kredensial Supabase Langsung</span>
            </h4>
            {credSource === 'localStorage' && (
              <button
                type="button"
                onClick={handleClearSupabaseCreds}
                className="text-[11px] text-red-600 hover:underline flex items-center gap-1 font-bold cursor-pointer"
              >
                <Trash2 className="w-3 h-3" /> Hapus Kredensial Lokal
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block text-slate-700 font-bold mb-1 flex items-center gap-1">
                <Link2 className="w-3.5 h-3.5 text-slate-500" />
                VITE_SUPABASE_URL
              </label>
              <input
                type="text"
                placeholder="https://xyzabcdefg.supabase.co"
                value={inputUrl}
                onChange={(e) => setInputUrl(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono text-xs bg-white text-slate-900 focus:ring-2 focus:ring-[#00288e] focus:border-transparent outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1 flex items-center gap-1">
                <Key className="w-3.5 h-3.5 text-slate-500" />
                VITE_SUPABASE_ANON_KEY
              </label>
              <input
                type="password"
                placeholder="eyJhbGciOiJIUzI1Ni..."
                value={inputAnonKey}
                onChange={(e) => setInputAnonKey(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono text-xs bg-white text-slate-900 focus:ring-2 focus:ring-[#00288e] focus:border-transparent outline-none"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
            <p className="text-[11px] text-slate-500">
              💡 Kredensial yang diisi di sini disimpan di browser untuk pengujian cepat. Untuk produksi permanen di Vercel, tetap disarankan memasukkannya di <strong>Vercel Environment Variables</strong>.
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSaveSupabaseCreds}
                className="bg-[#00288e] text-white px-3.5 py-1.5 rounded-lg text-xs font-bold hover:bg-[#001d68] transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Simpan & Uji Koneksi</span>
              </button>
            </div>
          </div>
        </div>

        <div className="bg-[#f0fdf4] p-4 rounded-xl border border-[#bbf7d0] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h4 className="font-bold text-[#166534] text-xs flex items-center gap-1.5">
              <FileCode className="w-4 h-4 text-[#166534]" /> File Skema Database: <code className="bg-white px-1.5 py-0.5 rounded border border-[#bbf7d0] text-[11px]">supabase_schema.sql</code>
            </h4>
            <p className="text-[#15803d] text-[11px]">
              Telah dibuat 12 tabel (produk, pesanan, kategori, dll) beserta data awal toko. Salin atau unduh skema ini untuk dijalankan di <strong>SQL Editor Supabase</strong>.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleFetchSql}
              className="bg-[#00288e] text-white px-3.5 py-2 rounded-xl font-bold flex items-center gap-1.5 hover:bg-[#001d68] transition-all text-xs cursor-pointer"
            >
              <Code className="w-4 h-4" />
              <span>Lihat & Salin SQL</span>
            </button>
            <a
              href="/api/supabase/schema"
              download="supabase_schema.sql"
              className="bg-white text-slate-700 border border-slate-300 px-3.5 py-2 rounded-xl font-bold flex items-center gap-1.5 hover:bg-slate-50 transition-all text-xs cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Unduh .sql</span>
            </a>
          </div>
        </div>
      </div>

      <form onSubmit={handleSaveSettings} className="bg-white p-6 rounded-2xl border border-[#e0e3e5] shadow-xs space-y-5 text-xs font-medium">
        <div>
          <label className="block text-slate-700 font-bold mb-1 flex items-center gap-1">
            <Store className="w-4 h-4 text-[#00288e]" /> Nama Resmi Toko *
          </label>
          <input
            type="text"
            required
            value={storeName}
            onChange={(e) => setStoreName(e.target.value)}
            className="w-full px-3.5 py-2.5 border border-[#c4c5d5] rounded-xl font-bold text-slate-900"
          />
        </div>

        {/* LOGO WEBSITE MANAGEMENT SECTION */}
        <div className="bg-[#f7f9fb] p-4 sm:p-5 rounded-2xl border border-[#e0e3e5] space-y-4">
          <div className="flex items-center justify-between border-b border-[#e0e3e5] pb-3">
            <div className="flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-[#00288e]" />
              <div>
                <h3 className="font-bold text-sm text-slate-900">Logo Website & Brand Identity</h3>
                <p className="text-[11px] text-slate-500">Atur dan unggah foto/logo resmi yang tampil di header navigasi, footer, dan struk pesanan</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setLogo('/logo.jpg');
                setFavicon('/logo.jpg');
                onShowToast('Logo dikembalikan ke /logo.jpg standar');
              }}
              className="text-[11px] text-[#00288e] hover:underline font-bold flex items-center gap-1 cursor-pointer"
            >
              <RefreshCw className="w-3 h-3" /> Reset
            </button>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-5">
            {/* Logo Preview Box */}
            <div className="shrink-0 text-center">
              <div className="w-28 h-28 rounded-2xl bg-white border-2 border-dashed border-[#00288e]/30 flex items-center justify-center p-2 shadow-inner overflow-hidden relative group">
                {logo ? (
                  <img
                    src={logo}
                    alt="Pratinjau Logo"
                    referrerPolicy="no-referrer"
                    className="max-h-full max-w-full object-contain rounded-lg"
                  />
                ) : (
                  <span className="text-slate-400 text-[10px]">Belum Ada Logo</span>
                )}
              </div>
              <span className="text-[10px] text-slate-500 font-semibold mt-1 block">Pratinjau Logo</span>
            </div>

            {/* Upload & URL Controls */}
            <div className="flex-1 space-y-3 w-full">
              <div>
                <label className="block text-slate-700 font-bold mb-1.5 flex items-center justify-between">
                  <span>Unggah File Gambar Logo Baru</span>
                  <span className="text-[10px] text-slate-400 font-normal">.PNG, .JPG, .SVG, .WEBP (Maks 5MB)</span>
                </label>
                <label className="inline-flex items-center gap-2 bg-[#00288e] text-white px-4 py-2.5 rounded-xl font-bold hover:bg-[#001d68] cursor-pointer transition-all shadow-xs text-xs active:scale-95">
                  <Upload className="w-4 h-4" />
                  <span>{logoUploading ? 'Mengunggah...' : 'Pilih File Foto / Logo Baru'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    disabled={logoUploading}
                    onChange={handleLogoUpload}
                    className="hidden"
                  />
                </label>
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1 text-[11px]">Atau Masukkan URL Gambar Logo Direct:</label>
                <input
                  type="text"
                  value={logo}
                  onChange={(e) => {
                    setLogo(e.target.value);
                    setFavicon(e.target.value);
                  }}
                  className="w-full px-3 py-2 border border-[#c4c5d5] rounded-xl font-mono text-xs bg-white"
                  placeholder="/logo.jpg atau https://..."
                />
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-slate-700 font-bold mb-1 flex items-center gap-1">
              <Phone className="w-4 h-4 text-[#006e2f]" /> Nomor WhatsApp Notifikasi Pesanan *
            </label>
            <input
              type="text"
              required
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
              className="w-full px-3.5 py-2.5 border border-[#c4c5d5] rounded-xl font-mono text-slate-900"
              placeholder="+62 812-9229-0876"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-bold mb-1 flex items-center gap-1">
              <MapPin className="w-4 h-4 text-[#ba1a1a]" /> URL Google Maps Toko
            </label>
            <input
              type="url"
              required
              value={mapsUrl}
              onChange={(e) => setMapsUrl(e.target.value)}
              className="w-full px-3.5 py-2.5 border border-[#c4c5d5] rounded-xl"
            />
          </div>
        </div>

        <div>
          <label className="block text-slate-700 font-bold mb-1 flex items-center gap-1">
            <MapPin className="w-4 h-4 text-slate-500" /> Alamat Lengkap Toko *
          </label>
          <textarea
            rows={2}
            required
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="w-full px-3.5 py-2.5 border border-[#c4c5d5] rounded-xl"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t">
          <div>
            <label className="block text-slate-700 font-bold mb-1 flex items-center gap-1">
              <Clock className="w-4 h-4 text-slate-500" /> Jam Buka Senin - Sabtu *
            </label>
            <input
              type="text"
              required
              value={weekdaysHours}
              onChange={(e) => setWeekdaysHours(e.target.value)}
              className="w-full px-3.5 py-2.5 border border-[#c4c5d5] rounded-xl font-semibold text-[#00288e]"
              placeholder="09:00 - 21:00"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-bold mb-1 flex items-center gap-1">
              <Clock className="w-4 h-4 text-slate-500" /> Jam Buka Minggu *
            </label>
            <input
              type="text"
              required
              value={sundayHours}
              onChange={(e) => setSundayHours(e.target.value)}
              className="w-full px-3.5 py-2.5 border border-[#c4c5d5] rounded-xl font-semibold text-[#00288e]"
              placeholder="09:00 - 20:30"
            />
          </div>
        </div>

        <div className="pt-2 border-t space-y-3">
          <h4 className="font-bold text-slate-900 flex items-center gap-1">
            <Globe className="w-4 h-4 text-[#00288e]" /> Pengaturan SEO & Meta Title PWA
          </h4>

          <div>
            <label className="block text-slate-700 font-bold mb-1">Meta Title Halaman</label>
            <input
              type="text"
              value={metaTitle}
              onChange={(e) => setMetaTitle(e.target.value)}
              className="w-full px-3.5 py-2 border border-[#c4c5d5] rounded-xl"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-bold mb-1">Meta Description Search Engine</label>
            <textarea
              rows={2}
              value={metaDesc}
              onChange={(e) => setMetaDesc(e.target.value)}
              className="w-full px-3.5 py-2 border border-[#c4c5d5] rounded-xl"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="bg-[#00288e] text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-opacity-90 shadow-md cursor-pointer"
        >
          <Save className="w-4 h-4" />
          <span>{loading ? 'Menyimpan...' : 'Simpan Perubahan Pengaturan'}</span>
        </button>
      </form>

      {/* SQL SCHEMA MODAL */}
      {showSqlModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in duration-150">
            {/* Modal Header */}
            <div className="bg-slate-900 text-white p-4 sm:p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#3ecf8e]/20 text-[#3ecf8e] flex items-center justify-center font-bold shrink-0">
                  <Code className="w-5 h-5 text-[#3ecf8e]" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-white flex items-center gap-2">
                    Skema Database SQL Supabase
                    <span className="text-[10px] bg-[#3ecf8e] text-slate-950 font-extrabold px-2 py-0.5 rounded-md uppercase tracking-wider">
                      supabase_schema.sql
                    </span>
                  </h3>
                  <p className="text-slate-400 text-xs">Jalankan di menu SQL Editor pada Dashboard Supabase Anda</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopySql}
                  disabled={loadingSql || !sqlContent}
                  className="bg-[#3ecf8e] text-slate-950 font-bold text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 hover:bg-[#32b279] transition-all cursor-pointer active:scale-95"
                >
                  {copiedSql ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedSql ? 'Tersalin!' : 'Salin SQL'}</span>
                </button>
                <button
                  onClick={() => setShowSqlModal(false)}
                  className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition-colors text-lg font-bold"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Modal Body / SQL Viewer */}
            <div className="p-4 sm:p-5 overflow-y-auto flex-1 bg-slate-950 text-slate-200 font-mono text-xs space-y-4">
              <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl text-slate-300 text-[11px] font-sans flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-[#3ecf8e] shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <span className="font-bold text-white block">Cara Penggunaan di Supabase:</span>
                  <ol className="list-decimal list-inside text-slate-300 space-y-1">
                    <li>Klik tombol <strong>"Salin SQL"</strong> di pojok kanan atas.</li>
                    <li>Buka <a href="https://supabase.com/dashboard" target="_blank" rel="noopener noreferrer" className="text-[#3ecf8e] underline">Dashboard Supabase</a> &gt; Masuk ke proyek Anda.</li>
                    <li>Pilih menu <strong>SQL Editor</strong> pada sidebar kiri.</li>
                    <li>Klik <strong>New Query</strong>, tempel (paste) skema di atas, lalu klik <strong>Run</strong>.</li>
                  </ol>
                </div>
              </div>

              {loadingSql ? (
                <div className="p-12 text-center text-slate-400 space-y-2">
                  <div className="animate-spin w-6 h-6 border-2 border-[#3ecf8e] border-t-transparent rounded-full mx-auto" />
                  <p>Memuat skema SQL...</p>
                </div>
              ) : (
                <pre className="p-4 bg-slate-900 rounded-xl border border-slate-800 overflow-x-auto text-[11px] leading-relaxed text-slate-300 select-all font-mono">
                  {sqlContent}
                </pre>
              )}
            </div>

            {/* Modal Footer */}
            <div className="bg-slate-900 border-t border-slate-800 p-3.5 px-5 flex items-center justify-between text-xs">
              <span className="text-slate-400">12 Tabel + Initial Seed Data Toko Fotokopi Salin Serupa</span>
              <button
                onClick={() => setShowSqlModal(false)}
                className="bg-slate-800 hover:bg-slate-700 text-white font-bold px-4 py-2 rounded-xl transition-all"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
