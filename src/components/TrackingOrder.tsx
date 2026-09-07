import React, { useState } from 'react';
import { Order, StoreSettings } from '../types';
import { formatRupiah, generateWhatsAppInquiryUrl } from '../utils';
import { Search, PackageCheck, Clock, CheckCircle2, AlertCircle, ShoppingBag, Truck, ArrowRight, MessageSquare, FileText, Check, History, Paperclip, ShieldAlert } from 'lucide-react';

interface TrackingOrderProps {
  orders?: Order[];
  settings: StoreSettings;
}

export const TrackingOrder: React.FC<TrackingOrderProps> = ({ orders = [], settings }) => {
  const [searchId, setSearchId] = useState('');
  const [trackedOrder, setTrackedOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);

  const handleSearch = async (queryToSearch?: string) => {
    const query = (queryToSearch !== undefined ? queryToSearch : searchId).trim();
    if (!query) {
      setError('Masukkan nomor transaksi atau ID pesanan Anda terlebih dahulu.');
      return;
    }

    setLoading(true);
    setError(null);
    setSearched(true);

    // 1. Try finding locally first from props
    const cleanQuery = query.toLowerCase().replace(/^[#]/, '').replace(/^ord-/, '');
    const localMatch = orders.find(o => {
      const oId = o.id.toLowerCase();
      const oIdClean = oId.replace(/^[#]/, '').replace(/^ord-/, '');
      const waClean = (o.whatsapp || '').replace(/[^0-9]/g, '');
      return oId === query.toLowerCase() || oIdClean === cleanQuery || (cleanQuery.length >= 4 && waClean.includes(cleanQuery));
    });

    if (localMatch) {
      setTrackedOrder(localMatch);
      setLoading(false);
      return;
    }

    // 2. Fallback to API endpoint
    try {
      const res = await fetch(`/api/orders/track/${encodeURIComponent(query)}`);
      const data = await res.json();

      if (res.ok && data.success && data.order) {
        setTrackedOrder(data.order);
      } else {
        setTrackedOrder(null);
        setError(data.error || 'Pesanan dengan nomor transaksi tersebut tidak ditemukan. Periksa kembali ID pesanan Anda.');
      }
    } catch (err) {
      setTrackedOrder(null);
      setError('Gagal menghubungkan ke server untuk melacak pesanan. Silakan periksa koneksi internet Anda.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusStepIndex = (status: Order['status']) => {
    switch (status) {
      case 'Baru': return 1;
      case 'Diproses': return 2;
      case 'Siap Diambil': return 3;
      case 'Selesai': return 4;
      case 'Dibatalkan': return -1;
      default: return 1;
    }
  };

  const sampleOrderIds = orders.length > 0
    ? orders.slice(0, 3).map(o => o.id)
    : ['ORD-092', 'ORD-091', 'ORD-090'];

  // Helper to generate transparent timeline status history logs
  const getStatusHistoryLogs = (order: Order) => {
    const createdDateStr = new Date(order.created_at).toLocaleString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }) + ' WIB';

    const stepIndex = getStatusStepIndex(order.status);

    if (order.status === 'Dibatalkan') {
      return [
        {
          step: 1,
          statusName: 'Baru Diterima',
          badgeColor: 'bg-amber-100 text-amber-800 border-amber-200',
          time: createdDateStr,
          title: 'Pesanan Didaftarkan',
          description: 'Pesanan baru telah berhasil tercatat di sistem.',
          isDone: true
        },
        {
          step: -1,
          statusName: 'Dibatalkan',
          badgeColor: 'bg-red-100 text-red-800 border-red-200',
          time: 'Status Terkini',
          title: 'Pesanan Dibatalkan',
          description: 'Pesanan ini telah dibatalkan oleh admin atau atas permintaan pelanggan.',
          isDone: true,
          isCancelled: true
        }
      ];
    }

    const allSteps = [
      {
        step: 1,
        statusName: 'Baru',
        badgeColor: 'bg-amber-100 text-amber-800 border-amber-200',
        time: createdDateStr,
        title: 'Tahap 1: Pesanan Baru Diterima',
        description: 'Pesanan & berkas dokumen berhasil dikirim ke sistem toko Salin Serupa dan masuk antrean pemeriksaan.'
      },
      {
        step: 2,
        statusName: 'Diproses',
        badgeColor: 'bg-blue-100 text-blue-800 border-blue-200',
        time: stepIndex >= 2 ? 'Proses Pengerjaan' : 'Menunggu Pengerjaan',
        title: 'Tahap 2: Sedang Diproses Operator',
        description: 'Dokumen sedang dalam tahap pencetakan, fotokopi, penjilidan, pemotongan, atau penyiapan barang ATK oleh tim staf.'
      },
      {
        step: 3,
        statusName: 'Siap Diambil',
        badgeColor: 'bg-purple-100 text-purple-800 border-purple-200',
        time: stepIndex >= 3 ? 'Siap di Toko' : 'Menunggu Selesai Cetak',
        title: 'Tahap 3: Hasil Cetak Siap Diambil / Dikirim',
        description: 'Seluruh pesanan telah tuntas dikerjakan, lolos pemeriksaan kualitas (QC), dan siap diambil di toko atau diserahkan ke kurir.'
      },
      {
        step: 4,
        statusName: 'Selesai',
        badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
        time: stepIndex >= 4 ? 'Transaksi Selesai' : 'Belum Diserahkan',
        title: 'Tahap 4: Pesanan Diserahkan & Lunas',
        description: 'Pesanan telah diterima oleh pembeli dengan baik dan transaksi dinyatakan selesai sepenuhnya.'
      }
    ];

    return allSteps.map(s => ({
      ...s,
      isDone: stepIndex >= s.step,
      isCurrent: stepIndex === s.step
    }));
  };

  return (
    <section id="tracking" className="py-16 bg-gradient-to-b from-[#f7f9fb] via-white to-[#f7f9fb] relative overflow-hidden">
      {/* Decorative Blur Backgrounds */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-full pointer-events-none">
        <div className="absolute top-1/4 left-10 w-72 h-72 bg-[#00288e]/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-10 right-10 w-80 h-80 bg-blue-400/5 rounded-full blur-3xl"></div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 relative z-10">
        {/* Section Header */}
        <div className="text-center space-y-3 mb-10">
          <span className="inline-flex items-center gap-1.5 bg-[#00288e]/10 text-[#00288e] px-3.5 py-1 rounded-full text-xs font-bold tracking-wide">
            <PackageCheck className="w-4 h-4" />
            Lacak Pesanan Real-Time
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#191c1e]">
            Cek Status & Riwayat Cetakan Anda
          </h2>
          <p className="text-slate-600 text-xs sm:text-sm max-w-xl mx-auto">
            Masukkan Nomor Transaksi (ID Pesanan) yang Anda dapatkan saat checkout untuk melihat perkembangan pengerjaan secara transparan.
          </p>
        </div>

        {/* Search Input Box */}
        <div className="bg-white p-4 sm:p-6 rounded-3xl border border-[#e0e3e5] shadow-lg mb-8">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSearch();
            }}
            className="flex flex-col sm:flex-row gap-3"
          >
            <div className="relative flex-1">
              <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchId}
                onChange={(e) => setSearchId(e.target.value)}
                placeholder="Masukkan No. Transaksi (Contoh: ORD-092)..."
                className="w-full pl-11 pr-4 py-3.5 bg-[#f7f9fb] border border-[#c4c5d5] focus:border-[#00288e] focus:bg-white rounded-2xl text-xs sm:text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none transition-all shadow-inner"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="bg-[#00288e] text-white px-6 py-3.5 rounded-2xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 hover:bg-[#001d68] active:scale-95 transition-all shadow-md disabled:opacity-50 shrink-0 cursor-pointer"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Mencari...</span>
                </>
              ) : (
                <>
                  <span>Lacak Pesanan</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick sample chips */}
          <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
            <span className="text-slate-400 font-medium">Contoh ID Transaksi:</span>
            {sampleOrderIds.map(id => (
              <button
                key={id}
                type="button"
                onClick={() => {
                  setSearchId(id);
                  handleSearch(id);
                }}
                className="bg-[#f2f4f6] hover:bg-[#00288e]/10 text-slate-700 hover:text-[#00288e] px-2.5 py-1 rounded-xl text-[11px] font-mono font-bold transition-all border border-[#e0e3e5] cursor-pointer"
              >
                {id}
              </button>
            ))}
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-2xl flex items-start gap-3 mb-8 animate-in fade-in duration-200">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold mb-0.5">Pesanan Tidak Ditemukan</p>
              <p className="text-xs text-red-700">{error}</p>
            </div>
          </div>
        )}

        {/* Tracked Order Result Card */}
        {trackedOrder && (
          <div className="bg-white rounded-3xl border border-[#e0e3e5] shadow-xl overflow-hidden animate-in fade-in duration-300">
            {/* Header Banner */}
            <div className="bg-gradient-to-r from-[#00288e] to-[#0040c1] p-6 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-medium text-blue-200 uppercase tracking-wider">Nomor Transaksi Resi</span>
                <h3 className="text-2xl font-mono font-extrabold tracking-tight mt-0.5">{trackedOrder.id}</h3>
                <p className="text-[11px] text-blue-100 mt-1 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  Waktu Pemesanan: {new Date(trackedOrder.created_at).toLocaleString('id-ID', { dateStyle: 'full', timeStyle: 'short' })} WIB
                </p>
              </div>

              {/* Status Pill */}
              <div className="shrink-0">
                <span className={`px-4 py-2 rounded-full text-xs font-extrabold shadow-sm tracking-wide inline-flex items-center gap-1.5 ${
                  trackedOrder.status === 'Baru'
                    ? 'bg-amber-400 text-slate-950'
                    : trackedOrder.status === 'Diproses'
                    ? 'bg-blue-400 text-slate-950'
                    : trackedOrder.status === 'Siap Diambil'
                    ? 'bg-purple-300 text-slate-950'
                    : trackedOrder.status === 'Selesai'
                    ? 'bg-emerald-400 text-slate-950'
                    : 'bg-red-500 text-white'
                }`}>
                  {trackedOrder.status === 'Selesai' && <CheckCircle2 className="w-4 h-4" />}
                  {trackedOrder.status === 'Diproses' && <Clock className="w-4 h-4 animate-spin" />}
                  {trackedOrder.status === 'Baru' && <Clock className="w-4 h-4" />}
                  {trackedOrder.status === 'Dibatalkan' && <ShieldAlert className="w-4 h-4" />}
                  <span>Status: {trackedOrder.status.toUpperCase()}</span>
                </span>
              </div>
            </div>

            {/* Visual Progress Steps Bar */}
            <div className="p-6 border-b border-[#e0e3e5] bg-[#f7f9fb]">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-6 text-center sm:text-left flex items-center gap-1.5">
                <PackageCheck className="w-4 h-4 text-[#00288e]" />
                Kemajuan Status Pesanan
              </h4>

              {trackedOrder.status === 'Dibatalkan' ? (
                <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-2xl flex items-center gap-3">
                  <AlertCircle className="w-6 h-6 text-red-600 shrink-0" />
                  <div>
                    <p className="font-bold text-xs">Pesanan Ini Dibatalkan</p>
                    <p className="text-xs text-red-700">Hubungi admin toko melalui WhatsApp jika Anda butuh informasi pembatalan.</p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 relative">
                  {[
                    { step: 1, title: 'Baru', desc: 'Diterima sistem', icon: FileText },
                    { step: 2, title: 'Diproses', desc: 'Cetak & diproduksi', icon: Clock },
                    { step: 3, title: 'Siap Diambil', desc: 'Lolos QC di toko', icon: Truck },
                    { step: 4, title: 'Selesai', desc: 'Pesanan diterima', icon: CheckCircle2 }
                  ].map((s) => {
                    const currentStep = getStatusStepIndex(trackedOrder.status);
                    const isPassed = currentStep >= s.step;
                    const isCurrent = currentStep === s.step;
                    const Icon = s.icon;

                    return (
                      <div
                        key={s.step}
                        className={`flex flex-col items-center text-center p-3 rounded-2xl transition-all border ${
                          isCurrent
                            ? 'bg-white border-[#00288e] shadow-md ring-2 ring-[#00288e]/20 scale-102'
                            : isPassed
                            ? 'bg-blue-50/70 border-blue-200'
                            : 'bg-white/60 border-slate-200 opacity-50'
                        }`}
                      >
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center mb-1.5 font-bold text-xs shadow-xs ${
                          isCurrent
                            ? 'bg-[#00288e] text-white animate-pulse'
                            : isPassed
                            ? 'bg-emerald-500 text-white'
                            : 'bg-slate-200 text-slate-500'
                        }`}>
                          {isPassed && !isCurrent ? <Check className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                        </div>
                        <h5 className={`text-xs font-bold ${isCurrent ? 'text-[#00288e]' : isPassed ? 'text-slate-900' : 'text-slate-400'}`}>
                          {s.title}
                        </h5>
                        <p className="text-[10px] text-slate-500 mt-0.5 leading-tight">{s.desc}</p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Transparent Status History Logs Section */}
            <div className="p-6 border-b border-[#e0e3e5] bg-white space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <History className="w-4 h-4 text-[#00288e]" />
                  Riwayat Status Transparan
                </h4>
                <span className="text-[10px] font-bold bg-blue-50 text-[#00288e] px-2.5 py-0.5 rounded-full border border-blue-200">
                  Transparan & Terverifikasi
                </span>
              </div>

              <div className="space-y-3 relative before:absolute before:inset-0 before:left-3.5 before:w-0.5 before:bg-slate-200">
                {getStatusHistoryLogs(trackedOrder).map((log, idx) => (
                  <div key={idx} className="relative pl-8 flex flex-col sm:flex-row sm:items-start justify-between gap-2 text-xs">
                    {/* Status Dot */}
                    <div className={`absolute left-1.5 top-1 w-4 h-4 rounded-full border-2 border-white shadow-xs ${
                      log.isCancelled
                        ? 'bg-red-500'
                        : log.isCurrent
                        ? 'bg-[#00288e] ring-2 ring-[#00288e]/30'
                        : log.isDone
                        ? 'bg-emerald-500'
                        : 'bg-slate-300'
                    }`}></div>

                    <div className="space-y-1 max-w-lg">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold border ${log.badgeColor}`}>
                          {log.statusName}
                        </span>
                        <h6 className={`font-bold text-xs ${log.isCurrent ? 'text-[#00288e]' : log.isDone ? 'text-slate-900' : 'text-slate-400'}`}>
                          {log.title}
                        </h6>
                      </div>
                      <p className="text-[11px] text-slate-600 leading-relaxed">
                        {log.description}
                      </p>
                    </div>

                    <span className="text-[10px] font-semibold text-slate-400 shrink-0 bg-[#f2f4f6] px-2 py-1 rounded-md self-start">
                      {log.time}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Order Customer & Item Details */}
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                {/* Pemesan Info */}
                <div className="bg-[#f7f9fb] p-4 rounded-2xl border border-[#e0e3e5] space-y-2">
                  <h5 className="font-bold text-slate-900 border-b border-[#e0e3e5] pb-1.5 flex items-center gap-1.5">
                    <ShoppingBag className="w-4 h-4 text-[#00288e]" />
                    Informasi Pemesan
                  </h5>
                  <p><span className="text-slate-500">Nama Pelanggan:</span> <strong>{trackedOrder.customer_name}</strong></p>
                  <p><span className="text-slate-500">WhatsApp:</span> <strong>{trackedOrder.whatsapp}</strong></p>
                  <p><span className="text-slate-500">Metode Pengambilan:</span> <strong className="text-[#00288e]">{trackedOrder.pickup_method}</strong></p>
                  {trackedOrder.notes && (
                    <p className="pt-1 text-slate-600 italic border-t border-slate-200 mt-2">
                      Catatan: "<span className="font-medium">{trackedOrder.notes}</span>"
                    </p>
                  )}
                </div>

                {/* Tagihan Info */}
                <div className="bg-[#f7f9fb] p-4 rounded-2xl border border-[#e0e3e5] space-y-2">
                  <h5 className="font-bold text-slate-900 border-b border-[#e0e3e5] pb-1.5 flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-[#00288e]" />
                    Ringkasan Tagihan Pembayaran
                  </h5>
                  <div className="flex justify-between text-slate-600">
                    <span>Subtotal Produk:</span>
                    <span>{formatRupiah(trackedOrder.subtotal || trackedOrder.total)}</span>
                  </div>
                  <div className="flex justify-between font-extrabold text-sm text-[#00288e] pt-2 border-t border-[#e0e3e5]">
                    <span>Total Pembayaran:</span>
                    <span>{formatRupiah(trackedOrder.total)}</span>
                  </div>
                </div>
              </div>

              {/* Items List */}
              <div>
                <h5 className="text-xs font-bold text-slate-800 mb-3 uppercase tracking-wider flex items-center justify-between">
                  <span>Daftar Item / Dokumen ({trackedOrder.items.length})</span>
                  <span className="text-slate-400 normal-case font-normal">Harga Per Item</span>
                </h5>
                <div className="space-y-2">
                  {trackedOrder.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center bg-[#f7f9fb] p-3 rounded-2xl border border-[#e0e3e5] text-xs">
                      <div>
                        <p className="font-bold text-slate-900">{item.product_name}</p>
                        <p className="text-[11px] text-slate-500">{formatRupiah(item.price)} x {item.quantity}</p>
                      </div>
                      <span className="font-extrabold text-[#00288e]">{formatRupiah(item.subtotal)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Attached Documents if available */}
              {trackedOrder.documents && trackedOrder.documents.length > 0 && (
                <div>
                  <h5 className="text-xs font-bold text-slate-800 mb-2.5 uppercase tracking-wider flex items-center gap-1.5">
                    <Paperclip className="w-4 h-4 text-[#00288e]" />
                    Berkas Dokumen Terlampir ({trackedOrder.documents.length})
                  </h5>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {trackedOrder.documents.map((doc, idx) => (
                      <div key={idx} className="bg-[#f2f4f6] p-2.5 rounded-xl border border-[#e0e3e5] flex items-center gap-2 text-xs">
                        <FileText className="w-4 h-4 text-[#00288e] shrink-0" />
                        <span className="font-bold text-slate-800 truncate flex-1">{doc.name}</span>
                        <span className="text-[10px] text-slate-500 bg-white px-1.5 py-0.5 rounded border">
                          {(doc.size / (1024 * 1024)).toFixed(1)} MB
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Contact Admin via WA */}
              <div className="pt-4 border-t border-[#e0e3e5] flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#f7f9fb] p-4 rounded-2xl">
                <div>
                  <h6 className="font-bold text-xs text-slate-900">Butuh Informasi Lebih Lanjut?</h6>
                  <p className="text-[11px] text-slate-500">
                    Hubungi tim staf layanan Fotokopi Salin Serupa melalui WhatsApp.
                  </p>
                </div>
                <a
                  href={generateWhatsAppInquiryUrl(settings.whatsapp, trackedOrder.id)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-[#25D366] text-white px-5 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-2 hover:bg-[#1eb956] transition-all shadow-md shrink-0 w-full sm:w-auto justify-center cursor-pointer"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Tanyakan Status via WhatsApp</span>
                </a>
              </div>
            </div>
          </div>
        )}

        {!searched && (
          <div className="bg-[#00288e]/5 border border-[#00288e]/15 p-6 rounded-3xl text-center space-y-2">
            <PackageCheck className="w-8 h-8 text-[#00288e] mx-auto" />
            <h4 className="text-sm font-bold text-slate-900">Masukkan No. Transaksi di Atas</h4>
            <p className="text-xs text-slate-600 max-w-md mx-auto">
              Nomor transaksi tercantum pada struk digital setelah Anda melakukan checkout atau yang dikirimkan ke pesan WhatsApp Anda.
            </p>
          </div>
        )}
      </div>
    </section>
  );
};
