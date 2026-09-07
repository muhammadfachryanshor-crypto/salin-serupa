import React, { useState, useEffect } from 'react';
import {
  Printer,
  Bluetooth,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  X,
  RefreshCw,
  Power,
  Settings2,
  FileText
} from 'lucide-react';
import { bluetoothPrinter, PrinterDeviceState } from '../../lib/bluetoothPrinter';
import { StoreSettings } from '../../types';

interface BluetoothPrinterModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: StoreSettings;
  onShowToast: (msg: string, type?: 'success' | 'error') => void;
}

export const BluetoothPrinterModal: React.FC<BluetoothPrinterModalProps> = ({
  isOpen,
  onClose,
  settings,
  onShowToast
}) => {
  const [printerState, setPrinterState] = useState<PrinterDeviceState>(bluetoothPrinter.getState());
  const [testing, setTesting] = useState(false);
  const [inIframe, setInIframe] = useState(false);

  useEffect(() => {
    const unsub = bluetoothPrinter.subscribe(state => setPrinterState(state));
    setInIframe(bluetoothPrinter.isInIframe());
    return unsub;
  }, []);

  if (!isOpen) return null;

  const handleConnect = async () => {
    if (inIframe) {
      onShowToast('Membuka di Tab Baru agar dialog pairing Bluetooth browser dapat muncul...', 'info');
      openInNewTab();
      return;
    }
    const res = await bluetoothPrinter.connect();
    if (res.success) {
      onShowToast(`Printer Bluetooth "${res.deviceName}" berhasil terhubung!`, 'success');
    } else {
      onShowToast(res.error || 'Gagal menghubungkan printer', 'error');
    }
  };

  const handleDisconnect = () => {
    bluetoothPrinter.disconnect();
    onShowToast('Printer Bluetooth berhasil diputuskan');
  };

  const handleBrowserThermalTest = () => {
    const dummyTx = {
      id: 'tx-test-001',
      orderNumber: '#TEST-001',
      customerName: 'Pelanggan Uji Coba',
      cashierName: 'Kasir Salin Serupa',
      items: [
        { id: 'item-1', name: 'Fotokopi A4 HVS 70gr (Uji Cetak)', price: 350, quantity: 10, subtotal: 3500 },
        { id: 'item-2', name: 'Jilid Mika Spiral Kawat', price: 12000, quantity: 1, subtotal: 12000 }
      ],
      subtotal: 15500,
      discount: 0,
      tax: 0,
      total: 15500,
      paymentMethod: 'Tunai' as const,
      cashReceived: 20000,
      change: 4500,
      createdAt: new Date().toISOString()
    };
    bluetoothPrinter.printThermalViaBrowser(dummyTx, settings);
    onShowToast('Membuka dialog cetak thermal browser...', 'info');
  };

  const handleTestPrint = async () => {
    if (!printerState.connected) {
      onShowToast('Hubungkan printer Bluetooth terlebih dahulu atau gunakan Cetak via Browser', 'info');
      return;
    }
    setTesting(true);
    try {
      const res = await bluetoothPrinter.printTest(settings);
      if (res.success) {
        onShowToast('Struk uji coba (Self-Test) berhasil dikirim ke printer!', 'success');
      } else {
        onShowToast(res.error || 'Gagal mencetak struk uji coba', 'error');
      }
    } catch (e: any) {
      onShowToast(e.message || 'Terjadi kesalahan saat mencetak', 'error');
    } finally {
      setTesting(false);
    }
  };

  const openInNewTab = () => {
    window.open(window.location.href, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              printerState.connected ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'
            }`}>
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                Driver Printer Bluetooth
                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800">
                  ESC/POS Native
                </span>
              </h2>
              <p className="text-xs text-slate-500">
                Hubungkan thermal printer 58mm / 80mm via Web Bluetooth
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-slate-700 text-xs">
          
          {/* Status Card */}
          <div className={`p-4 rounded-xl border flex items-center justify-between transition-all ${
            printerState.connected
              ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
              : 'bg-slate-50 border-slate-200 text-slate-700'
          }`}>
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${
                printerState.connected
                  ? 'bg-emerald-500 animate-pulse'
                  : printerState.connecting
                  ? 'bg-amber-500 animate-ping'
                  : 'bg-slate-400'
              }`} />
              <div>
                <div className="font-bold text-sm">
                  {printerState.connected
                    ? (printerState.deviceName || 'Thermal Bluetooth Printer Terhubung')
                    : printerState.connecting
                    ? 'Menghubungkan ke Printer...'
                    : 'Printer Belum Terhubung'}
                </div>
                <div className="text-[11px] text-slate-500">
                  {printerState.connected
                    ? 'Status: Online & Siap Cetak (Kanal ESC/POS GATT Aktif)'
                    : 'Silakan aktifkan Bluetooth dan nyalakan printer Anda.'}
                </div>
              </div>
            </div>

            <div>
              {printerState.connected ? (
                <button
                  onClick={handleDisconnect}
                  className="px-3 py-1.5 rounded-lg border border-red-200 bg-white hover:bg-red-50 text-red-600 font-semibold text-xs transition-colors flex items-center gap-1.5 shadow-xs"
                >
                  <Power className="w-3.5 h-3.5" />
                  Putuskan
                </button>
              ) : (
                <button
                  onClick={handleConnect}
                  disabled={printerState.connecting}
                  className="px-4 py-2 rounded-lg bg-[#00288e] hover:bg-[#001f70] text-white font-bold text-xs transition-colors flex items-center gap-2 shadow-xs disabled:opacity-50"
                >
                  {printerState.connecting ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      Memindai...
                    </>
                  ) : (
                    <>
                      <Bluetooth className="w-3.5 h-3.5" />
                      Hubungkan Printer
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Iframe Notice & Permission Tip */}
          {inIframe && (
            <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 flex items-start gap-3">
              <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
              <div className="space-y-1">
                <p className="font-bold text-xs">Penting untuk Izin Bluetooth:</p>
                <p className="text-[11px] leading-relaxed text-amber-800">
                  Beberapa browser membatasi dialog pop-up Bluetooth di dalam frame preview. Jika dialog pairing printer tidak muncul saat Anda klik &quot;Hubungkan Printer&quot;, buka aplikasi di <strong>Tab Baru</strong>.
                </p>
                <button
                  onClick={openInNewTab}
                  className="inline-flex items-center gap-1 mt-1 text-[11px] font-bold text-[#00288e] hover:underline"
                >
                  <ExternalLink className="w-3 h-3" />
                  Buka Aplikasi di Tab Baru
                </button>
              </div>
            </div>
          )}

          {/* Driver Configurations */}
          <div className="space-y-3">
            <h3 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
              <Settings2 className="w-4 h-4 text-slate-500" />
              Pengaturan Driver & Struk
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Paper Size */}
              <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-1.5">
                <label className="text-[11px] font-bold text-slate-600 block">
                  Ukuran Kertas Thermal:
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => bluetoothPrinter.setPaperSize('58mm')}
                    className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold border transition-colors ${
                      printerState.paperSize === '58mm'
                        ? 'bg-[#00288e] text-white border-[#00288e]'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    58mm (32 Kolom)
                  </button>
                  <button
                    type="button"
                    onClick={() => bluetoothPrinter.setPaperSize('80mm')}
                    className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold border transition-colors ${
                      printerState.paperSize === '80mm'
                        ? 'bg-[#00288e] text-white border-[#00288e]'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    80mm (48 Kolom)
                  </button>
                </div>
              </div>

              {/* Auto Print Toggle */}
              <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-1.5">
                <label className="text-[11px] font-bold text-slate-600 block">
                  Otomatisasi Kasir:
                </label>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={printerState.autoPrint}
                      onChange={e => bluetoothPrinter.setAutoPrint(e.target.checked)}
                      className="w-4 h-4 text-[#00288e] rounded border-slate-300 focus:ring-blue-500"
                    />
                    <span className="text-[11px] text-slate-700 font-medium">
                      Cetak struk otomatis saat pembayaran selesai
                    </span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={printerState.openDrawer}
                      onChange={e => bluetoothPrinter.setOpenDrawer(e.target.checked)}
                      className="w-4 h-4 text-[#00288e] rounded border-slate-300 focus:ring-blue-500"
                    />
                    <span className="text-[11px] text-slate-700 font-medium">
                      Kirim sinyal buka laci kasir (Cash Drawer)
                    </span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Test Print Actions */}
          <div className="space-y-2">
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div>
                <div className="font-bold text-slate-900 text-xs">Uji Komunikasi Printer Bluetooth (Self-Test)</div>
                <div className="text-[11px] text-slate-500">
                  Kirim format biner ESC/POS asli untuk memverifikasi print head thermal Bluetooth.
                </div>
              </div>
              <button
                type="button"
                onClick={handleTestPrint}
                disabled={!printerState.connected || testing}
                className="w-full sm:w-auto px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors disabled:opacity-40 shadow-xs"
              >
                {testing ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    Mencetak...
                  </>
                ) : (
                  <>
                    <FileText className="w-3.5 h-3.5" />
                    Cetak Test Struk BT
                  </>
                )}
              </button>
            </div>

            {/* Browser / USB Print Fallback Test */}
            <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-200 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div>
                <div className="font-bold text-blue-950 text-xs flex items-center gap-1.5">
                  <Printer className="w-3.5 h-3.5 text-blue-700" />
                  Cetak via Dialog Print Browser / Printer USB
                </div>
                <div className="text-[11px] text-blue-800">
                  Dapat digunakan di dalam preview frame atau jika menggunakan printer thermal kabel USB / WiFi.
                </div>
              </div>
              <button
                type="button"
                onClick={handleBrowserThermalTest}
                className="w-full sm:w-auto px-4 py-2 rounded-lg bg-[#00288e] hover:bg-[#001f70] text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors shadow-xs"
              >
                <Printer className="w-3.5 h-3.5" />
                Uji Cetak Struk Browser
              </button>
            </div>
          </div>

          {/* Compatibility list */}
          <div className="text-[10px] text-slate-400 space-y-1 border-t border-slate-100 pt-3">
            <div className="font-bold text-slate-500">Printer yang didukung:</div>
            <div>
              Kompatibel dengan semua printer thermal Bluetooth ESC/POS: Panda, Goojprt (PT-210/MTP-II), Xprinter, Zjiang (ZJ-5802/5805), RPP02N, Eppos, Iware, Paperang, POS-58, POS-80, dan printer mobile mini lainnya.
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-100 bg-slate-50/50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs rounded-lg transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
