import React, { useState, useEffect } from 'react';
import { StoreSettings, PaymentMethodConfig } from '../../types';
import {
  Save,
  Store,
  MapPin,
  Phone,
  Clock,
  Globe,
  Database,
  Download,
  Upload,
  AlertCircle,
  Image as ImageIcon,
  RefreshCw,
  Copy,
  Check,
  Code,
  CreditCard,
  QrCode,
  Banknote,
  Printer,
  Sliders,
  Settings2,
  Plus,
  Edit3,
  Trash2,
  CheckCircle2,
  FileText,
  Link2,
  Key
} from 'lucide-react';
import { getSupabaseClient, getSupabaseCredentials, saveSupabaseCredentials, clearSupabaseCredentials, testSupabaseConnection as testSupabaseLib, getSupabaseHeaders } from '../../lib/supabase';
import { saveSettingsToSupabase } from '../../lib/supabaseData';
import { bluetoothPrinter, PaperSize } from '../../lib/bluetoothPrinter';
import { initialAppData } from '../../data/initialData';

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
  // Navigation Tab State
  const [activeTab, setActiveTab] = useState<'general' | 'payments' | 'printer' | 'database'>('general');

  // General Store Info State
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

  // Payment Methods Configuration State
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodConfig[]>(
    settings.payment_methods && settings.payment_methods.length > 0
      ? settings.payment_methods
      : (initialAppData.settings.payment_methods || [])
  );
  const [editingMethod, setEditingMethod] = useState<PaymentMethodConfig | null>(null);
  const [isAddingMethod, setIsAddingMethod] = useState(false);
  const [methodFormData, setMethodFormData] = useState<Partial<PaymentMethodConfig>>({
    name: '',
    type: 'qris',
    enabled: true,
    account_name: '',
    account_number: '',
    qr_image_url: '',
    notes: ''
  });

  // Printer Configuration State
  const [printerPaperSize, setPrinterPaperSize] = useState<PaperSize>(
    settings.printer_paper_size || (localStorage.getItem('pos_paper_size') as PaperSize) || '58mm'
  );
  const [printerAutoPrint, setPrinterAutoPrint] = useState<boolean>(
    settings.printer_auto_print !== undefined
      ? settings.printer_auto_print
      : localStorage.getItem('pos_auto_print') !== 'false'
  );
  const [printerOpenDrawer, setPrinterOpenDrawer] = useState<boolean>(
    settings.printer_open_drawer !== undefined
      ? settings.printer_open_drawer
      : localStorage.getItem('pos_open_drawer') === 'true'
  );
  const [printerFooterNote, setPrinterFooterNote] = useState<string>(
    settings.printer_footer_note || 'Barang yang sudah dibeli tidak dapat ditukar/dikembalikan. Terima kasih atas kunjungan Anda!'
  );
  const [printerTestRunning, setPrinterTestRunning] = useState(false);

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
        onShowToast('Gagal memuat file skema SQL', 'error');
      }
    } catch (err) {
      onShowToast('Gagal menghubungi server untuk memuat file SQL', 'error');
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

  // --- SAVE ALL SETTINGS HELPER ---
  const saveAllSettings = async (customOverrides?: Partial<StoreSettings>) => {
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
      meta_description: metaDesc,
      payment_methods: paymentMethods,
      printer_paper_size: printerPaperSize,
      printer_auto_print: printerAutoPrint,
      printer_open_drawer: printerOpenDrawer,
      printer_footer_note: printerFooterNote,
      ...customOverrides
    };

    // Also persist printer settings to local storage and bluetoothPrinter singleton
    bluetoothPrinter.savePrinterPreferences({
      paperSize: updatedSettings.printer_paper_size,
      autoPrint: updatedSettings.printer_auto_print,
      openDrawer: updatedSettings.printer_open_drawer
    });

    try {
      let supaSuccess = false;
      const client = getSupabaseClient();
      if (client) {
        try {
          await saveSettingsToSupabase(client, updatedSettings);
          supaSuccess = true;
        } catch (supaErr: any) {
          console.warn('Direct Supabase save failed, falling back to API:', supaErr);
        }
      }

      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...getSupabaseHeaders()
      };

      let apiSuccess = false;
      try {
        const res = await fetch('/api/admin/settings', {
          method: 'PUT',
          headers,
          body: JSON.stringify(updatedSettings)
        });
        apiSuccess = res.ok;
      } catch (e) {}

      if (supaSuccess || apiSuccess) {
        onShowToast('Pengaturan toko & printer berhasil tersimpan secara permanen!');
        onRefreshData();
      } else {
        onShowToast('Gagal menyimpan pengaturan ke server', 'error');
      }
    } catch (err) {
      onShowToast('Terjadi kesalahan koneksi saat menyimpan', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    await saveAllSettings();
  };

  // --- PAYMENT METHOD MANAGEMENT HANDLERS ---
  const handleTogglePaymentMethod = (id: string) => {
    const updated = paymentMethods.map(m => (m.id === id ? { ...m, enabled: !m.enabled } : m));
    setPaymentMethods(updated);
    onShowToast(`Metode pembayaran telah di-${updated.find(m => m.id === id)?.enabled ? 'aktifkan' : 'nonaktifkan'}. Klik Simpan untuk mempermanenkan.`);
  };

  const handleDeletePaymentMethod = (id: string) => {
    if (!window.confirm('Hapus metode pembayaran ini dari pilihan kasir?')) return;
    const updated = paymentMethods.filter(m => m.id !== id);
    setPaymentMethods(updated);
    onShowToast('Metode pembayaran berhasil dihapus dari daftar');
  };

  const handleOpenAddMethod = () => {
    setMethodFormData({
      id: 'pay-' + Date.now(),
      name: '',
      type: 'qris',
      enabled: true,
      account_name: '',
      account_number: '',
      qr_image_url: '',
      notes: ''
    });
    setEditingMethod(null);
    setIsAddingMethod(true);
  };

  const handleOpenEditMethod = (method: PaymentMethodConfig) => {
    setEditingMethod(method);
    setMethodFormData({ ...method });
    setIsAddingMethod(true);
  };

  const handleSaveMethodForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!methodFormData.name?.trim()) {
      onShowToast('Nama metode pembayaran wajib diisi', 'error');
      return;
    }

    if (editingMethod) {
      // Update existing
      const updated = paymentMethods.map(m =>
        m.id === editingMethod.id ? ({ ...m, ...methodFormData } as PaymentMethodConfig) : m
      );
      setPaymentMethods(updated);
      onShowToast(`Metode "${methodFormData.name}" berhasil diperbarui`);
    } else {
      // Add new
      const newMethod: PaymentMethodConfig = {
        id: methodFormData.id || 'pay-' + Date.now(),
        name: methodFormData.name.trim(),
        type: methodFormData.type || 'other',
        enabled: methodFormData.enabled ?? true,
        account_name: methodFormData.account_name?.trim() || undefined,
        account_number: methodFormData.account_number?.trim() || undefined,
        qr_image_url: methodFormData.qr_image_url?.trim() || undefined,
        notes: methodFormData.notes?.trim() || undefined
      };
      setPaymentMethods([...paymentMethods, newMethod]);
      onShowToast(`Metode "${newMethod.name}" berhasil ditambahkan`);
    }
    setIsAddingMethod(false);
    setEditingMethod(null);
  };

  const handleResetDefaultPaymentMethods = () => {
    if (!window.confirm('Kembalikan konfigurasi tipe pembayaran ke 4 metode standar (Tunai, QRIS, Transfer Bank, Debit)?')) return;
    const defaults = initialAppData.settings.payment_methods || [];
    setPaymentMethods(defaults);
    onShowToast('Tipe pembayaran berhasil dikembalikan ke standar');
  };

  // --- PRINTER TEST HANDLER ---
  const handleTestPrintPrinter = () => {
    setPrinterTestRunning(true);
    try {
      const dummyTx = {
        id: 'tx-test-settings',
        orderNumber: '#TEST-PRINTER',
        customerName: 'Pelanggan Tes Kasir',
        cashierName: 'Admin Kasir',
        items: [
          { id: 'item-1', name: 'Fotokopi A4 HVS 70gr', price: 350, quantity: 10, subtotal: 3500 },
          { id: 'item-2', name: 'Jilid Spiral Kawat A4', price: 12000, quantity: 1, subtotal: 12000 },
          { id: 'item-3', name: 'Kertas HVS A4 Rim 80gr', price: 55000, quantity: 1, subtotal: 55000 }
        ],
        subtotal: 70500,
        discount: 5000,
        tax: 0,
        total: 65500,
        paymentMethod: 'Tunai',
        cashReceived: 70000,
        change: 4500,
        notes: 'Format uji coba cetak printer ukuran ' + printerPaperSize,
        createdAt: new Date().toISOString()
      };

      bluetoothPrinter.setPaperSize(printerPaperSize);
      bluetoothPrinter.printThermalViaBrowser(dummyTx, {
        ...settings,
        store_name: storeName,
        printer_paper_size: printerPaperSize,
        printer_footer_note: printerFooterNote
      });
      onShowToast(`Dialog cetak thermal ${printerPaperSize} berhasil dibuka!`);
    } catch (e: any) {
      onShowToast(e.message || 'Gagal melakukan tes cetak', 'error');
    } finally {
      setPrinterTestRunning(false);
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-black text-[#191c1e] tracking-tight">Pengaturan Toko, Pembayaran & Printer</h2>
          <p className="text-xs text-slate-500">Kelola identitas toko, tipe/metode pembayaran, ukuran kertas printer thermal 58mm/80mm, serta database</p>
        </div>

        {/* Global Save Button */}
        <button
          type="button"
          onClick={() => saveAllSettings()}
          disabled={loading}
          className="bg-[#00288e] hover:bg-[#001f70] text-white px-5 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-all active:scale-95 disabled:opacity-50 cursor-pointer self-start sm:self-auto"
        >
          <Save className="w-4 h-4" />
          <span>{loading ? 'Menyimpan...' : 'Simpan Semua Pengaturan'}</span>
        </button>
      </div>

      {/* TABS NAVIGATION */}
      <div className="flex items-center gap-1.5 p-1.5 bg-slate-100/90 rounded-2xl border border-slate-200 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('general')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'general'
              ? 'bg-white text-[#00288e] shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
          }`}
        >
          <Store className="w-4 h-4" />
          <span>Profil Toko & Jam Buka</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('payments')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'payments'
              ? 'bg-white text-[#00288e] shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
          }`}
        >
          <CreditCard className="w-4 h-4 text-emerald-600" />
          <span>Tipe & Metode Pembayaran</span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-emerald-100 text-emerald-800 font-extrabold">
            {paymentMethods.filter(m => m.enabled).length} Aktif
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('printer')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'printer'
              ? 'bg-white text-[#00288e] shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
          }`}
        >
          <Printer className="w-4 h-4 text-indigo-600" />
          <span>Printer Thermal (58mm / 80mm)</span>
          <span className="px-1.5 py-0.5 rounded text-[10px] bg-indigo-100 text-indigo-800 font-bold uppercase">
            {printerPaperSize}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('database')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeTab === 'database'
              ? 'bg-white text-[#00288e] shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
          }`}
        >
          <Database className="w-4 h-4 text-amber-600" />
          <span>Supabase & Backup Data</span>
        </button>
      </div>

      {/* TAB 1: PROFIL TOKO & INFORMASI UMUM */}
      {activeTab === 'general' && (
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
            <span>{loading ? 'Menyimpan...' : 'Simpan Profil Toko'}</span>
          </button>
        </form>
      )}

      {/* TAB 2: PENGATURAN TIPE / METODE PEMBAYARAN */}
      {activeTab === 'payments' && (
        <div className="bg-white p-6 rounded-2xl border border-[#e0e3e5] shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
            <div>
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-[#00288e]" />
                Kelola Tipe & Metode Pembayaran Kasir POS
              </h3>
              <p className="text-xs text-slate-500">
                Atur metode pembayaran yang muncul pada kasir POS (Tunai, QRIS, Transfer Bank, Mesin EDC, dsb.)
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleResetDefaultPaymentMethods}
                className="px-3 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all cursor-pointer"
              >
                Reset ke Standar
              </button>
              <button
                type="button"
                onClick={handleOpenAddMethod}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>+ Tambah Metode Pembayaran</span>
              </button>
            </div>
          </div>

          {/* Payment Methods Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {paymentMethods.map((method) => {
              const getIcon = () => {
                switch (method.type) {
                  case 'cash': return <Banknote className="w-5 h-5 text-emerald-600" />;
                  case 'qris': return <QrCode className="w-5 h-5 text-purple-600" />;
                  case 'transfer': return <CreditCard className="w-5 h-5 text-blue-600" />;
                  case 'debit': return <CreditCard className="w-5 h-5 text-amber-600" />;
                  default: return <CreditCard className="w-5 h-5 text-slate-600" />;
                }
              };

              return (
                <div
                  key={method.id}
                  className={`p-4 rounded-2xl border transition-all ${
                    method.enabled
                      ? 'bg-white border-slate-200 shadow-xs hover:border-[#00288e]/40'
                      : 'bg-slate-50 border-slate-200 opacity-60'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                        {getIcon()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-extrabold text-sm text-slate-900">{method.name}</h4>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                            method.enabled
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-slate-200 text-slate-600'
                          }`}>
                            {method.enabled ? 'Aktif di POS' : 'Nonaktif'}
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-500 font-medium capitalize">
                          Tipe: {method.type === 'cash' ? 'Tunai / Cash' : method.type === 'qris' ? 'QRIS Digital' : method.type === 'transfer' ? 'Transfer Bank' : method.type === 'debit' ? 'Kartu Debit / EDC' : 'Lainnya'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleTogglePaymentMethod(method.id)}
                        className={`p-1.5 rounded-lg text-xs font-bold transition-colors ${
                          method.enabled
                            ? 'text-emerald-700 hover:bg-emerald-50'
                            : 'text-slate-500 hover:bg-slate-200'
                        }`}
                        title={method.enabled ? 'Nonaktifkan' : 'Aktifkan'}
                      >
                        <CheckCircle2 className={`w-4 h-4 ${method.enabled ? 'text-emerald-600' : 'text-slate-400'}`} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenEditMethod(method)}
                        className="p-1.5 rounded-lg text-slate-600 hover:text-[#00288e] hover:bg-blue-50 transition-colors"
                        title="Edit Metode"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      {paymentMethods.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleDeletePaymentMethod(method.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                          title="Hapus Metode"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Method Details (Account / NMID / Notes) */}
                  <div className="mt-3 pt-3 border-t border-slate-100 text-xs space-y-1 text-slate-600">
                    {method.account_number && (
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500 text-[11px]">No. Rekening / NMID:</span>
                        <span className="font-mono font-bold text-slate-800">{method.account_number}</span>
                      </div>
                    )}
                    {method.account_name && (
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500 text-[11px]">Atas Nama / Merchant:</span>
                        <span className="font-semibold text-slate-800">{method.account_name}</span>
                      </div>
                    )}
                    {method.notes && (
                      <p className="text-[11px] text-slate-500 italic mt-1 bg-slate-50 p-1.5 rounded-lg">
                        Catatan: {method.notes}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Action Save Button */}
          <div className="pt-4 border-t border-slate-200 flex justify-end">
            <button
              type="button"
              onClick={() => saveAllSettings()}
              disabled={loading}
              className="bg-[#00288e] hover:bg-[#001f70] text-white px-6 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 shadow-xs cursor-pointer transition-all active:scale-95"
            >
              <Save className="w-4 h-4" />
              <span>{loading ? 'Menyimpan...' : 'Simpan Perubahan Metode Pembayaran'}</span>
            </button>
          </div>
        </div>
      )}

      {/* TAB 3: PENGATURAN PRINTER THERMAL & NOTA STRUK */}
      {activeTab === 'printer' && (
        <div className="bg-white p-6 rounded-2xl border border-[#e0e3e5] shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
            <div>
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <Printer className="w-5 h-5 text-[#00288e]" />
                Pengaturan Printer Thermal & Ukuran Kertas Struk
              </h3>
              <p className="text-xs text-slate-500">
                Tentukan format kertas thermal default (58mm vs 80mm), otomatisasi cetak kasir, dan footer struk toko
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleTestPrintPrinter}
                disabled={printerTestRunning}
                className="px-3.5 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <FileText className="w-4 h-4 text-emerald-600" />
                <span>Uji Cetak Struk ({printerPaperSize})</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Section: Paper Size Selector */}
            <div className="p-5 rounded-2xl bg-slate-50/90 border border-slate-200 space-y-4">
              <div className="flex items-center justify-between">
                <label className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-[#00288e]" />
                  Pilihan Ukuran Kertas Thermal Default
                </label>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#00288e] text-white uppercase">
                  Terpilih: {printerPaperSize}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* 58mm Option */}
                <button
                  type="button"
                  onClick={() => setPrinterPaperSize('58mm')}
                  className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                    printerPaperSize === '58mm'
                      ? 'bg-white border-[#00288e] ring-2 ring-[#00288e]/20 shadow-xs'
                      : 'bg-white/60 border-slate-200 hover:bg-white text-slate-600'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-black text-sm text-slate-900">58 mm</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-slate-100 text-slate-700">
                      32 Kolom
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Standar printer Bluetooth portable / mini POS (Goojprt, Panda, RPP02N, Zjiang, dsb.)
                  </p>
                </button>

                {/* 80mm Option */}
                <button
                  type="button"
                  onClick={() => setPrinterPaperSize('80mm')}
                  className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                    printerPaperSize === '80mm'
                      ? 'bg-white border-[#00288e] ring-2 ring-[#00288e]/20 shadow-xs'
                      : 'bg-white/60 border-slate-200 hover:bg-white text-slate-600'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-black text-sm text-slate-900">80 mm</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-slate-100 text-slate-700">
                      48 Kolom
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Printer thermal meja lebar / kasir supermarket (Epson TM-T82, Xprinter, Iware, dsb.)
                  </p>
                </button>
              </div>

              <p className="text-[11px] text-slate-500 bg-white p-3 rounded-xl border border-slate-200">
                💡 <strong>Tips:</strong> Pilihan ukuran kertas ini akan otomatis tersimpan ke preferensi sistem kasir POS dan pratinjau live struk.
              </p>
            </div>

            {/* Section: Automation Controls */}
            <div className="p-5 rounded-2xl bg-slate-50/90 border border-slate-200 space-y-4">
              <label className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                <Settings2 className="w-4 h-4 text-[#00288e]" />
                Otomatisasi Kasir & Perangkat Keras
              </label>

              <div className="space-y-3">
                <label className="flex items-start gap-3 p-3 bg-white rounded-xl border border-slate-200 cursor-pointer hover:border-slate-300 transition-colors">
                  <input
                    type="checkbox"
                    checked={printerAutoPrint}
                    onChange={e => setPrinterAutoPrint(e.target.checked)}
                    className="w-4 h-4 text-[#00288e] rounded border-slate-300 focus:ring-[#00288e] mt-0.5 cursor-pointer"
                  />
                  <div>
                    <span className="font-bold text-xs text-slate-900 block">
                      Auto-Print Struk Saat Transaksi Berhasil
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Jika printer Bluetooth terhubung, perintah cetak langsung dikirim otomatis tanpa perlu klik tombol cetak ulang.
                    </span>
                  </div>
                </label>

                <label className="flex items-start gap-3 p-3 bg-white rounded-xl border border-slate-200 cursor-pointer hover:border-slate-300 transition-colors">
                  <input
                    type="checkbox"
                    checked={printerOpenDrawer}
                    onChange={e => setPrinterOpenDrawer(e.target.checked)}
                    className="w-4 h-4 text-[#00288e] rounded border-slate-300 focus:ring-[#00288e] mt-0.5 cursor-pointer"
                  />
                  <div>
                    <span className="font-bold text-xs text-slate-900 block">
                      Kirim Pulsa Buka Laci Kasir (Cash Drawer)
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Mengirimkan kode ESC/POS pin 2/5 untuk membuka laci kasir otomatis saat struk dicetak.
                    </span>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* Receipt Footer Note Customization */}
          <div className="space-y-2">
            <label className="block text-slate-700 font-bold text-xs flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-[#00288e]" />
              Catatan Kaki Struk Kasir (Receipt Footer Note):
            </label>
            <textarea
              rows={2}
              value={printerFooterNote}
              onChange={e => setPrinterFooterNote(e.target.value)}
              className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs bg-white text-slate-900"
              placeholder="Barang yang sudah dibeli tidak dapat ditukar/dikembalikan. Terima kasih atas kunjungan Anda!"
            />
            <p className="text-[11px] text-slate-400">
              Teks ini dicetak di bagian paling bawah struk belanja pelanggan setelah total dan ucapan terima kasih.
            </p>
          </div>

          {/* Action Save Button */}
          <div className="pt-4 border-t border-slate-200 flex justify-end">
            <button
              type="button"
              onClick={() => saveAllSettings()}
              disabled={loading}
              className="bg-[#00288e] hover:bg-[#001f70] text-white px-6 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 shadow-xs cursor-pointer transition-all active:scale-95"
            >
              <Save className="w-4 h-4" />
              <span>{loading ? 'Menyimpan...' : 'Simpan Pengaturan Printer (58mm / 80mm)'}</span>
            </button>
          </div>
        </div>
      )}

      {/* TAB 4: SUPABASE DATABASE & BACKUP */}
      {activeTab === 'database' && (
        <div className="space-y-6">
          {/* Database Backup & Restore Box */}
          <div className="bg-[#f2f4f6] p-5 rounded-2xl border border-[#e0e3e5] space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#00288e]/10 text-[#00288e] flex items-center justify-center font-bold shrink-0">
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-[#191c1e]">Pencadangan & Pemulihan Database Toko (JSON Backup)</h3>
                  <p className="text-xs text-slate-500">Unduh seluruh data produk, pesanan, dan landing page ke file JSON atau pulihkan data kapan saja</p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleDownloadBackup}
                  className="bg-white hover:bg-slate-50 text-[#00288e] border border-[#00288e]/30 px-4 py-2 rounded-xl font-bold flex items-center gap-2 text-xs shadow-2xs transition-all cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Unduh Backup (.json)</span>
                </button>

                <label className="bg-[#00288e] hover:bg-[#001d68] text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 text-xs shadow-2xs cursor-pointer transition-all">
                  <Upload className="w-4 h-4" />
                  <span>{restoreLoading ? 'Memulihkan...' : 'Restore Database'}</span>
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

          {/* Interactive Supabase Connection Box */}
          <div className="bg-white p-5 rounded-2xl border border-[#e0e3e5] shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#3ecf8e]/20 text-[#3ecf8e] flex items-center justify-center font-black shrink-0">
                  <Database className="w-5 h-5 text-[#3ecf8e]" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                    Koneksi & Sinkronisasi Supabase
                    {supabaseStatus.connected && (
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 font-extrabold px-2 py-0.5 rounded-full flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Terhubung
                      </span>
                    )}
                  </h3>
                  <p className="text-xs text-slate-500">Hubungkan database cloud PostgreSQL Supabase untuk penyimpanan data realtime & permanen</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => testSupabaseConnection()}
                  disabled={checkingSupabase}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${checkingSupabase ? 'animate-spin' : ''}`} />
                  <span>{checkingSupabase ? 'Memeriksa...' : 'Cek Status Koneksi'}</span>
                </button>
              </div>
            </div>

            {/* Connection Status Message */}
            {supabaseStatus.checked && (
              <div className={`p-4 rounded-xl border flex items-start gap-3 ${
                supabaseStatus.connected
                  ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900'
                  : 'bg-amber-50/80 border-amber-200 text-amber-900'
              }`}>
                {supabaseStatus.connected ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                )}
                <div className="space-y-1 text-xs">
                  <p className="font-bold">{supabaseStatus.message}</p>
                  {supabaseStatus.details && (
                    <p className="text-[11px] opacity-90">{supabaseStatus.details}</p>
                  )}
                </div>
              </div>
            )}

            {/* Supabase URL & Key Configuration */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-700 font-bold mb-1.5 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <Link2 className="w-3.5 h-3.5 text-slate-500" />
                    Supabase Project URL
                  </span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                    credSource === 'env'
                      ? 'bg-blue-100 text-blue-800'
                      : credSource === 'localStorage'
                      ? 'bg-purple-100 text-purple-800'
                      : 'bg-slate-100 text-slate-600'
                  }`}>
                    {credSource === 'env' ? 'Dari .env' : credSource === 'localStorage' ? 'Disimpan di Browser' : 'Belum Terkonfigurasi'}
                  </span>
                </label>
                <input
                  type="url"
                  value={inputUrl}
                  onChange={(e) => setInputUrl(e.target.value)}
                  placeholder="https://xyzabcdefghijklmnop.supabase.co"
                  className="w-full px-3.5 py-2.5 border border-[#c4c5d5] rounded-xl font-mono text-xs text-slate-900 bg-white"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1.5 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <Key className="w-3.5 h-3.5 text-slate-500" />
                    Supabase Public Anon Key
                  </span>
                  <span className="text-[10px] text-slate-400 font-normal">anon / public key</span>
                </label>
                <input
                  type="password"
                  value={inputAnonKey}
                  onChange={(e) => setInputAnonKey(e.target.value)}
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  className="w-full px-3.5 py-2.5 border border-[#c4c5d5] rounded-xl font-mono text-xs text-slate-900 bg-white"
                />
              </div>
            </div>

            {/* Action Buttons for Supabase Credentials */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSaveSupabaseCreds}
                  className="bg-[#00288e] hover:bg-[#001d68] text-white px-4 py-2 rounded-xl font-bold flex items-center gap-1.5 text-xs shadow-2xs transition-all cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Simpan Kredensial Supabase</span>
                </button>

                {credSource === 'localStorage' && (
                  <button
                    type="button"
                    onClick={handleClearSupabaseCreds}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 px-3 py-2 rounded-xl font-bold text-xs transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Hapus dari Browser</span>
                  </button>
                )}
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
        </div>
      )}

      {/* MODAL: ADD / EDIT PAYMENT METHOD */}
      {isAddingMethod && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
              <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-[#00288e]" />
                {editingMethod ? 'Edit Metode Pembayaran' : 'Tambah Metode Pembayaran Baru'}
              </h3>
              <button
                type="button"
                onClick={() => setIsAddingMethod(false)}
                className="text-slate-400 hover:text-slate-700 p-1 text-lg font-bold"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSaveMethodForm} className="space-y-4 text-xs font-medium">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Nama Tipe / Metode Pembayaran *</label>
                <input
                  type="text"
                  required
                  value={methodFormData.name || ''}
                  onChange={e => setMethodFormData({ ...methodFormData, name: e.target.value })}
                  placeholder="Contoh: QRIS BCA, Transfer Mandiri, EDC Debit BRI"
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl font-bold text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1">Kategori Tipe *</label>
                  <select
                    value={methodFormData.type || 'qris'}
                    onChange={e => setMethodFormData({ ...methodFormData, type: e.target.value as any })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-semibold bg-white"
                  >
                    <option value="cash">Tunai / Cash</option>
                    <option value="qris">QRIS Digital</option>
                    <option value="transfer">Transfer Bank</option>
                    <option value="debit">Debit / EDC</option>
                    <option value="other">Lainnya / E-Wallet</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1">Status di Kasir</label>
                  <select
                    value={methodFormData.enabled ? 'true' : 'false'}
                    onChange={e => setMethodFormData({ ...methodFormData, enabled: e.target.value === 'true' })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-semibold bg-white text-emerald-700"
                  >
                    <option value="true">Aktif (Tampil di POS)</option>
                    <option value="false">Nonaktif (Sembunyikan)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">No. Rekening / NMID / No. HP Merchant:</label>
                <input
                  type="text"
                  value={methodFormData.account_number || ''}
                  onChange={e => setMethodFormData({ ...methodFormData, account_number: e.target.value })}
                  placeholder="Contoh: 123-456-7890 atau ID102003004005"
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-xl font-mono text-slate-900"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Atas Nama Pemilik Rekening / Merchant:</label>
                <input
                  type="text"
                  value={methodFormData.account_name || ''}
                  onChange={e => setMethodFormData({ ...methodFormData, account_name: e.target.value })}
                  placeholder="Contoh: Fotokopi Salin Serupa"
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-xl font-semibold text-slate-900"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Catatan Panduan Kasir & Pelanggan:</label>
                <input
                  type="text"
                  value={methodFormData.notes || ''}
                  onChange={e => setMethodFormData({ ...methodFormData, notes: e.target.value })}
                  placeholder="Contoh: Konfirmasi bukti transfer ke WhatsApp kasir"
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-slate-700"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddingMethod(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#00288e] hover:bg-[#001f70] text-white rounded-xl font-bold shadow-xs cursor-pointer"
                >
                  Simpan Metode
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
