import React, { useState } from 'react';
import {
  Printer,
  Copy,
  Check,
  Share2,
  ExternalLink,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  Sparkles,
  Bluetooth,
  Receipt,
  X
} from 'lucide-react';
import { POSTransaction, POSCartItem, bluetoothPrinter, PrinterDeviceState } from '../../lib/bluetoothPrinter';
import { StoreSettings } from '../../types';
import { PaperSize } from '../../lib/escpos';

interface LiveReceiptPreviewProps {
  // Can take either an active cart & current state OR a completed transaction
  transaction?: POSTransaction;
  cart?: POSCartItem[];
  customerName?: string;
  customerPhone?: string;
  cashierName?: string;
  paymentMethod?: string;
  cashReceived?: number;
  subtotal?: number;
  discountAmount?: number;
  discountType?: 'nominal' | 'percent';
  taxAmount?: number;
  grandTotal?: number;
  changeAmount?: number;
  settings: StoreSettings;
  printerState: PrinterDeviceState;
  onShowToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
  onClose?: () => void;
  isModal?: boolean;
}

export const LiveReceiptPreview: React.FC<LiveReceiptPreviewProps> = ({
  transaction,
  cart = [],
  customerName = 'Pelanggan Langsung',
  customerPhone = '',
  cashierName = 'Kasir',
  paymentMethod = 'Tunai',
  cashReceived = 0,
  subtotal = 0,
  discountAmount = 0,
  taxAmount = 0,
  grandTotal = 0,
  changeAmount = 0,
  settings,
  printerState,
  onShowToast,
  onClose,
  isModal = false
}) => {
  const [copied, setCopied] = useState(false);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [selectedPaperSize, setSelectedPaperSize] = useState<PaperSize>(
    settings.printer_paper_size || printerState.paperSize || (localStorage.getItem('pos_paper_size') as PaperSize) || '58mm'
  );
  const [isPrinting, setIsPrinting] = useState(false);

  // Derive consolidated receipt data
  const isCompletedTx = !!transaction;
  const orderNo = transaction?.orderNumber || '#POS-DRAFT';
  const dateStr = transaction?.createdAt
    ? transaction.createdAt.replace('T', ' ').slice(0, 16)
    : new Date().toLocaleString('id-ID', {
        dateStyle: 'short',
        timeStyle: 'short'
      });
  const cName = transaction?.customerName || (customerName.trim() || 'Pelanggan Langsung');
  const cPhone = transaction?.customerPhone || customerPhone;
  const cCashier = transaction?.cashierName || cashierName;
  const pMethod = transaction?.paymentMethod || paymentMethod;
  const items: POSCartItem[] = transaction?.items || cart;
  const numSubtotal = transaction?.subtotal ?? subtotal;
  const numDiscount = transaction?.discount ?? discountAmount;
  const numTax = transaction?.tax ?? taxAmount;
  const numTotal = transaction?.total ?? grandTotal;
  const numCashReceived = transaction?.cashReceived ?? cashReceived;
  const numChange = transaction?.change ?? changeAmount;

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID').format(val || 0);
  };

  const handlePaperSizeChange = (size: PaperSize) => {
    setSelectedPaperSize(size);
    bluetoothPrinter.setPaperSize(size);
    bluetoothPrinter.savePrinterPreferences({ paperSize: size });
    onShowToast(`Format kertas diubah & disimpan ke ${size}`);
  };

  // Convert current preview to POSTransaction object for printing
  const getActiveTxObject = (): POSTransaction => {
    if (transaction) return transaction;
    return {
      id: 'draft-pos',
      orderNumber: orderNo === '#POS-DRAFT' ? `#DRAFT-${Date.now().toString().slice(-4)}` : orderNo,
      createdAt: new Date().toISOString(),
      customerName: cName,
      customerPhone: cPhone || undefined,
      cashierName: cCashier,
      items: items,
      subtotal: numSubtotal,
      discount: numDiscount,
      tax: numTax,
      total: numTotal,
      paymentMethod: pMethod,
      cashReceived: pMethod === 'Tunai' ? numCashReceived : numTotal,
      change: numChange
    };
  };

  // Copy plain text receipt to clipboard
  const handleCopyText = () => {
    const divider = selectedPaperSize === '80mm' ? '------------------------------------------------' : '--------------------------------';
    const store = settings.store_name || 'SALIN SERUPA';
    const addr = settings.address ? `${settings.address}\n` : '';
    const wa = settings.whatsapp ? `WA: ${settings.whatsapp}\n` : '';

    let text = `${store}\n${addr}${wa}${divider}\n`;
    text += `No. Nota  : ${orderNo}\n`;
    text += `Tanggal   : ${dateStr}\n`;
    text += `Kasir     : ${cCashier}\n`;
    text += `Pelanggan : ${cName}\n`;
    text += `Metode    : ${pMethod}\n`;
    text += `${divider}\n`;
    text += `ITEM PRODUK\n`;

    items.forEach(it => {
      text += `${it.name}\n`;
      text += `  ${it.quantity} x Rp ${formatRupiah(it.price)} = Rp ${formatRupiah(it.subtotal)}\n`;
      if (it.notes) {
        text += `  * ${it.notes}\n`;
      }
    });

    text += `${divider}\n`;
    text += `Subtotal  : Rp ${formatRupiah(numSubtotal)}\n`;
    if (numDiscount > 0) text += `Diskon    : -Rp ${formatRupiah(numDiscount)}\n`;
    if (numTax > 0) text += `PPN 11%   : Rp ${formatRupiah(numTax)}\n`;
    text += `TOTAL     : Rp ${formatRupiah(numTotal)}\n`;

    if (pMethod === 'Tunai') {
      text += `Tunai     : Rp ${formatRupiah(numCashReceived)}\n`;
      text += `Kembalian : Rp ${formatRupiah(numChange)}\n`;
    } else {
      text += `Status    : LUNAS\n`;
    }

    text += `${divider}\n`;
    text += `Terima Kasih Atas Kunjungan Anda!\nBarang yang dibeli tidak dapat ditukar.\n`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    onShowToast('Teks struk berhasil disalin ke papan klip!', 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  // Print via Bluetooth directly
  const handlePrintBluetooth = async () => {
    if (!printerState.connected) {
      onShowToast('Printer Bluetooth belum terhubung. Silakan buka pengaturan printer.', 'error');
      return;
    }

    setIsPrinting(true);
    try {
      const txObj = getActiveTxObject();
      const res = await bluetoothPrinter.printTransaction(txObj, settings);
      if (res.success) {
        onShowToast('Struk berhasil dicetak ke Printer Bluetooth!', 'success');
      } else {
        onShowToast(`Gagal mencetak: ${res.error}`, 'error');
      }
    } catch (e: any) {
      onShowToast(e.message || 'Gagal mengirim ke printer', 'error');
    } finally {
      setIsPrinting(false);
    }
  };

  // Print via Browser Dialog
  const handlePrintBrowser = () => {
    const txObj = getActiveTxObject();
    bluetoothPrinter.printThermalViaBrowser(txObj, settings);
    onShowToast('Membuka dialog cetak thermal browser...');
  };

  // Share via WhatsApp
  const handleShareWhatsApp = () => {
    const targetPhone = cPhone ? cPhone.replace(/\D/g, '') : '';
    const phoneWithCode = targetPhone.startsWith('0') ? '62' + targetPhone.slice(1) : targetPhone;
    const itemsText = items.map(it => `- ${it.name} (${it.quantity}x) = Rp ${formatRupiah(it.subtotal)}`).join('%0A');
    const waText = `*STRUK PEMBELIAN ${encodeURIComponent(settings.store_name || 'SALIN SERUPA')}*%0A` +
      `No. Nota: ${orderNo}%0A` +
      `Tanggal: ${dateStr}%0A` +
      `Kasir: ${cCashier}%0A` +
      `--------------------------------%0A` +
      `${itemsText}%0A` +
      `--------------------------------%0A` +
      `Subtotal: Rp ${formatRupiah(numSubtotal)}%0A` +
      (numDiscount > 0 ? `Diskon: -Rp ${formatRupiah(numDiscount)}%0A` : '') +
      (numTax > 0 ? `PPN 11%: Rp ${formatRupiah(numTax)}%0A` : '') +
      `*TOTAL: Rp ${formatRupiah(numTotal)}*%0A` +
      `Metode: ${pMethod}%0A` +
      (pMethod === 'Tunai' ? `Kembalian: Rp ${formatRupiah(numChange)}%0A` : '') +
      `%0ATerima kasih atas kepercayaan Anda di ${encodeURIComponent(settings.store_name || 'Salin Serupa')}!`;

    const url = phoneWithCode ? `https://wa.me/${phoneWithCode}?text=${waText}` : `https://wa.me/?text=${waText}`;
    window.open(url, '_blank');
  };

  // Width in pixels for 58mm vs 80mm simulator
  const paperWidthClass = selectedPaperSize === '80mm' ? 'w-[360px] max-w-full' : 'w-[280px] max-w-full';

  return (
    <div className={`flex flex-col h-full ${isModal ? '' : 'bg-slate-900/90 text-slate-100 rounded-2xl border border-slate-700/80 p-3.5 shadow-xl'}`}>
      
      {/* Top Header / Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-700/80 shrink-0">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            <Receipt className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h4 className="font-extrabold text-xs text-white uppercase tracking-wider">
                Live Print Preview
              </h4>
              <span className="px-1.5 py-0.5 rounded-full text-[9px] font-black bg-emerald-500 text-slate-950">
                LIVE
              </span>
            </div>
            <p className="text-[10px] text-slate-400">
              Visual simulasi kertas thermal ESC/POS
            </p>
          </div>
        </div>

        {/* Paper Size Switcher & Zoom Controls */}
        <div className="flex items-center gap-1.5">
          {/* Paper Size */}
          <div className="flex bg-slate-800 p-0.5 rounded-lg border border-slate-700 text-[10px] font-bold">
            <button
              type="button"
              onClick={() => handlePaperSizeChange('58mm')}
              className={`px-2 py-1 rounded transition-colors ${
                selectedPaperSize === '58mm'
                  ? 'bg-white text-slate-900 shadow-2xs font-extrabold'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Kertas Thermal Mini 58mm (32 kolom)"
            >
              58mm
            </button>
            <button
              type="button"
              onClick={() => handlePaperSizeChange('80mm')}
              className={`px-2 py-1 rounded transition-colors ${
                selectedPaperSize === '80mm'
                  ? 'bg-white text-slate-900 shadow-2xs font-extrabold'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Kertas Thermal Standar 80mm (48 kolom)"
            >
              80mm
            </button>
          </div>

          {/* Zoom In / Out */}
          <div className="hidden sm:flex items-center bg-slate-800 rounded-lg border border-slate-700 text-slate-300 p-0.5">
            <button
              type="button"
              onClick={() => setZoomLevel(prev => Math.max(0.75, prev - 0.1))}
              className="p-1 hover:text-white hover:bg-slate-700 rounded transition-colors"
              title="Perkecil Tampilan"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="px-1.5 text-[10px] font-mono">{Math.round(zoomLevel * 100)}%</span>
            <button
              type="button"
              onClick={() => setZoomLevel(prev => Math.min(1.4, prev + 0.1))}
              className="p-1 hover:text-white hover:bg-slate-700 rounded transition-colors"
              title="Perbesar Tampilan"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
              title="Tutup Preview"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Main Preview Container (Scrollable with realistic paper) */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden p-3 sm:p-4 my-2 flex items-start justify-center bg-slate-950/70 rounded-xl border border-slate-800/80 shadow-inner min-h-[360px]">
        <div
          style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'top center' }}
          className={`transition-transform duration-150 relative ${paperWidthClass}`}
        >
          {/* Jagged Sawtooth Paper Edge Top */}
          <div className="w-full h-3 overflow-hidden leading-none text-white fill-current">
            <svg
              className="w-full h-3 drop-shadow-xs"
              viewBox="0 0 280 12"
              preserveAspectRatio="none"
            >
              <path
                d="M 0,12 
                   L 5,0 L 10,12 L 15,0 L 20,12 L 25,0 L 30,12 L 35,0 L 40,12 L 45,0 L 50,12
                   L 55,0 L 60,12 L 65,0 L 70,12 L 75,0 L 80,12 L 85,0 L 90,12 L 95,0 L 100,12
                   L 105,0 L 110,12 L 115,0 L 120,12 L 125,0 L 130,12 L 135,0 L 140,12 L 145,0 L 150,12
                   L 155,0 L 160,12 L 165,0 L 170,12 L 175,0 L 180,12 L 185,0 L 190,12 L 195,0 L 200,12
                   L 205,0 L 210,12 L 215,0 L 220,12 L 225,0 L 230,12 L 235,0 L 240,12 L 245,0 L 250,12
                   L 255,0 L 260,12 L 265,0 L 270,12 L 275,0 L 280,12 Z"
                fill="#ffffff"
              />
            </svg>
          </div>

          {/* Paper Body (Simulating Monospaced Thermal Print) */}
          <div className="bg-white text-slate-900 font-mono text-[11px] leading-[1.38] px-3.5 py-4 shadow-2xl select-text border-x border-slate-200">
            
            {/* Store Header with Website Logo */}
            <div className="text-center space-y-1 mb-2.5">
              <div className="flex justify-center items-center py-1">
                <img
                  src={settings.logo || '/logo.png'}
                  alt={settings.store_name || 'Salin Serupa'}
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    const target = e.currentTarget;
                    if (!target.src.endsWith('/logo.png') && !target.src.endsWith('/logo.jpg')) {
                      target.src = '/logo.png';
                    }
                  }}
                  className="max-h-12 max-w-[170px] w-auto object-contain mx-auto filter contrast-125"
                />
              </div>
              {settings.address && (
                <div className="text-[10px] text-slate-700 max-w-[90%] mx-auto leading-tight">
                  {settings.address}
                </div>
              )}
              {settings.whatsapp && (
                <div className="text-[10px] text-slate-700 font-medium">
                  WA: {settings.whatsapp}
                </div>
              )}
            </div>

            {/* Separator */}
            <div className="border-b border-dashed border-slate-900 my-2" />

            {/* Transaction Info */}
            <div className="space-y-0.5 text-[10px]">
              <div className="flex justify-between">
                <span>No. Nota</span>
                <span className="font-bold">{orderNo}</span>
              </div>
              <div className="flex justify-between">
                <span>Tanggal</span>
                <span>{dateStr}</span>
              </div>
              <div className="flex justify-between">
                <span>Kasir</span>
                <span>{cCashier}</span>
              </div>
              <div className="flex justify-between">
                <span>Pelanggan</span>
                <span className="truncate max-w-[130px] font-semibold">{cName}</span>
              </div>
              <div className="flex justify-between">
                <span>Metode</span>
                <span className="font-semibold">{pMethod}</span>
              </div>
            </div>

            {/* Separator */}
            <div className="border-b border-dashed border-slate-900 my-2" />

            {/* Table Header */}
            <div className="flex justify-between font-extrabold text-[10px] pb-1 uppercase">
              <span>ITEM PRODUK</span>
              <span>TOTAL</span>
            </div>

            {/* Item List */}
            <div className="space-y-1.5">
              {items.length === 0 ? (
                <div className="py-3 text-center text-slate-400 italic text-[10px]">
                  [ Belum ada item di keranjang ]
                </div>
              ) : (
                items.map((item, idx) => (
                  <div key={item.id || idx} className="text-[10px]">
                    <div className="font-bold text-slate-950 leading-tight">
                      {item.name}
                    </div>
                    <div className="flex justify-between text-slate-700">
                      <span>&nbsp;&nbsp;{item.quantity} x {formatRupiah(item.price)}</span>
                      <span className="font-semibold text-slate-950">{formatRupiah(item.subtotal)}</span>
                    </div>
                    {item.notes && (
                      <div className="text-[9px] text-slate-500 pl-3 italic">
                        * {item.notes}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Separator */}
            <div className="border-b border-dashed border-slate-900 my-2" />

            {/* Subtotal, Diskon, Pajak */}
            <div className="space-y-0.5 text-[10px]">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>Rp {formatRupiah(numSubtotal)}</span>
              </div>
              {numDiscount > 0 && (
                <div className="flex justify-between text-slate-800">
                  <span>Diskon</span>
                  <span>-Rp {formatRupiah(numDiscount)}</span>
                </div>
              )}
              {numTax > 0 && (
                <div className="flex justify-between text-slate-800">
                  <span>PPN 11%</span>
                  <span>Rp {formatRupiah(numTax)}</span>
                </div>
              )}
            </div>

            {/* Double Border for Grand Total */}
            <div className="border-b-2 border-slate-950 my-1.5" />

            <div className="flex justify-between items-baseline font-black text-xs text-black">
              <span>TOTAL</span>
              <span className="text-sm">Rp {formatRupiah(numTotal)}</span>
            </div>

            {/* Payment Details */}
            {pMethod === 'Tunai' ? (
              <div className="space-y-0.5 text-[10px] mt-1 pt-1 border-t border-dotted border-slate-400">
                <div className="flex justify-between">
                  <span>Tunai</span>
                  <span>Rp {formatRupiah(numCashReceived)}</span>
                </div>
                <div className="flex justify-between font-bold text-slate-950">
                  <span>KEMBALIAN</span>
                  <span>Rp {formatRupiah(numChange)}</span>
                </div>
              </div>
            ) : (
              <div className="flex justify-between text-[10px] mt-1 pt-1 border-t border-dotted border-slate-400">
                <span>Status Bayar</span>
                <span className="font-bold text-emerald-800">LUNAS ({pMethod})</span>
              </div>
            )}

            {/* Separator */}
            <div className="border-b border-dashed border-slate-900 my-2" />

            {/* Simulated Barcode / QR Section for authenticity */}
            <div className="text-center my-2 space-y-1">
              <div className="inline-flex flex-col items-center justify-center p-1 bg-slate-100 rounded border border-slate-300">
                {/* Barcode lines representation */}
                <div className="flex items-center gap-[2px] h-6 px-1">
                  <span className="w-[1px] h-full bg-black" />
                  <span className="w-[2px] h-full bg-black" />
                  <span className="w-[1px] h-full bg-black" />
                  <span className="w-[3px] h-full bg-black" />
                  <span className="w-[1px] h-full bg-black" />
                  <span className="w-[2px] h-full bg-black" />
                  <span className="w-[1px] h-full bg-black" />
                  <span className="w-[1px] h-full bg-black" />
                  <span className="w-[3px] h-full bg-black" />
                  <span className="w-[2px] h-full bg-black" />
                  <span className="w-[1px] h-full bg-black" />
                  <span className="w-[2px] h-full bg-black" />
                  <span className="w-[1px] h-full bg-black" />
                  <span className="w-[3px] h-full bg-black" />
                  <span className="w-[1px] h-full bg-black" />
                  <span className="w-[2px] h-full bg-black" />
                  <span className="w-[1px] h-full bg-black" />
                  <span className="w-[3px] h-full bg-black" />
                </div>
                <span className="text-[8px] tracking-widest text-slate-600 font-mono">
                  {orderNo.replace('#', '')}
                </span>
              </div>
            </div>

            {/* Footer Polite Greeting */}
            <div className="text-center text-[9px] text-slate-700 leading-tight space-y-0.5 pt-1">
              <div className="font-bold">Terima Kasih Atas Kunjungan Anda!</div>
              {settings.printer_footer_note ? (
                <div className="whitespace-pre-line text-[8px] text-slate-600 max-w-[240px] mx-auto">
                  {settings.printer_footer_note}
                </div>
              ) : (
                <>
                  <div>Barang yang sudah dibeli</div>
                  <div>tidak dapat ditukar / dikembalikan</div>
                </>
              )}
              <div className="text-[8px] text-slate-500 pt-0.5 font-medium">{settings.store_name || 'Salin Serupa Fotokopi'}</div>
            </div>

          </div>

          {/* Jagged Sawtooth Paper Edge Bottom */}
          <div className="w-full h-3 overflow-hidden leading-none text-white fill-current rotate-180">
            <svg
              className="w-full h-3 drop-shadow-xs"
              viewBox="0 0 280 12"
              preserveAspectRatio="none"
            >
              <path
                d="M 0,12 
                   L 5,0 L 10,12 L 15,0 L 20,12 L 25,0 L 30,12 L 35,0 L 40,12 L 45,0 L 50,12
                   L 55,0 L 60,12 L 65,0 L 70,12 L 75,0 L 80,12 L 85,0 L 90,12 L 95,0 L 100,12
                   L 105,0 L 110,12 L 115,0 L 120,12 L 125,0 L 130,12 L 135,0 L 140,12 L 145,0 L 150,12
                   L 155,0 L 160,12 L 165,0 L 170,12 L 175,0 L 180,12 L 185,0 L 190,12 L 195,0 L 200,12
                   L 205,0 L 210,12 L 215,0 L 220,12 L 225,0 L 230,12 L 235,0 L 240,12 L 245,0 L 250,12
                   L 255,0 L 260,12 L 265,0 L 270,12 L 275,0 L 280,12 Z"
                fill="#ffffff"
              />
            </svg>
          </div>
        </div>
      </div>

      {/* Action Footer (Print, Copy, Share) */}
      <div className="pt-2 border-t border-slate-700/80 shrink-0 space-y-2">
        <div className="grid grid-cols-2 gap-2">
          
          {/* Print to Bluetooth Printer */}
          <button
            type="button"
            onClick={handlePrintBluetooth}
            disabled={items.length === 0 || isPrinting}
            className={`py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-xs ${
              printerState.connected
                ? 'bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
            } disabled:opacity-50 disabled:pointer-events-none`}
            title={printerState.connected ? 'Kirim perintah cetak langsung ke printer Bluetooth' : 'Printer belum terhubung'}
          >
            <Printer className="w-3.5 h-3.5" />
            <span>{isPrinting ? 'Mencetak...' : 'Cetak Thermal BT'}</span>
          </button>

          {/* Print via Browser / PDF */}
          <button
            type="button"
            onClick={handlePrintBrowser}
            disabled={items.length === 0}
            className="py-2 px-3 rounded-xl bg-[#00288e] hover:bg-[#002070] active:scale-95 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-xs disabled:opacity-50 disabled:pointer-events-none"
            title="Cetak lewat dialog browser (USB / PDF)"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Cetak Browser / PDF</span>
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {/* Copy Receipt Text */}
          <button
            type="button"
            onClick={handleCopyText}
            disabled={items.length === 0}
            className="py-1.5 px-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-[11px] flex items-center justify-center gap-1.5 transition-colors border border-slate-700"
          >
            {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
            <span>{copied ? 'Tersalin!' : 'Salin Teks Struk'}</span>
          </button>

          {/* Share to WhatsApp */}
          <button
            type="button"
            onClick={handleShareWhatsApp}
            disabled={items.length === 0}
            className="py-1.5 px-2.5 rounded-lg bg-emerald-950/70 hover:bg-emerald-900/90 text-emerald-300 font-medium text-[11px] flex items-center justify-center gap-1.5 transition-colors border border-emerald-800/80"
          >
            <Share2 className="w-3 h-3" />
            <span>Kirim via WA</span>
          </button>
        </div>

        {/* Live Bluetooth Status Bar */}
        <div className="pt-0.5 text-center">
          <span className="text-[10px] text-slate-400 flex items-center justify-center gap-1.5">
            <span className={`w-1.5 h-1.5 rounded-full ${printerState.connected ? 'bg-emerald-400' : 'bg-slate-500'}`} />
            <span>
              {printerState.connected
                ? `Printer terhubung: ${printerState.deviceName || 'Thermal BT'} (${selectedPaperSize})`
                : `Printer BT belum terhubung • Ukuran: ${selectedPaperSize}`}
            </span>
          </span>
        </div>
      </div>

    </div>
  );
};
