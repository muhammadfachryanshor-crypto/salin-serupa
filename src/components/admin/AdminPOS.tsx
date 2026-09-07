import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  Plus,
  Minus,
  Trash2,
  Printer,
  Bluetooth,
  CheckCircle2,
  ShoppingBag,
  RotateCcw,
  QrCode,
  Banknote,
  CreditCard,
  User,
  Phone,
  FileText,
  Percent,
  Sparkles,
  ExternalLink,
  MessageSquare,
  DollarSign,
  Receipt,
  Eye,
  PanelRight,
  Split
} from 'lucide-react';
import { AppData, Product, StoreSettings } from '../../types';
import {
  bluetoothPrinter,
  PrinterDeviceState,
  POSTransaction,
  POSCartItem
} from '../../lib/bluetoothPrinter';
import { BluetoothPrinterModal } from './BluetoothPrinterModal';
import { LiveReceiptPreview } from './LiveReceiptPreview';
import { getSupabaseClient, getSupabaseHeaders } from '../../lib/supabase';
import { createOrderInSupabase } from '../../lib/supabaseData';

interface AdminPOSProps {
  data: AppData;
  token: string;
  adminUser: any;
  onRefreshData: () => void;
  onShowToast: (msg: string, type?: 'success' | 'error') => void;
}

export const AdminPOS: React.FC<AdminPOSProps> = ({
  data,
  token,
  adminUser,
  onRefreshData,
  onShowToast
}) => {
  // Bluetooth Printer State
  const [printerState, setPrinterState] = useState<PrinterDeviceState>(bluetoothPrinter.getState());
  const [isPrinterModalOpen, setIsPrinterModalOpen] = useState(false);

  // POS State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [cart, setCart] = useState<POSCartItem[]>([]);
  const [mobileTab, setMobileTab] = useState<'catalog' | 'checkout' | 'preview'>('catalog');
  const [showLivePreviewModal, setShowLivePreviewModal] = useState(false);
  const [isDesktopPreviewDocked, setIsDesktopPreviewDocked] = useState(false);

  // Customer & Payment Info
  const [customerType, setCustomerType] = useState<'walk-in' | 'custom'>('walk-in');
  const [customerName, setCustomerName] = useState('Pelanggan Langsung');
  const [customerPhone, setCustomerPhone] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<string>('Tunai');
  const [cashReceived, setCashReceived] = useState<number>(0);
  const [discountType, setDiscountType] = useState<'nominal' | 'percent'>('nominal');
  const [discountValue, setDiscountValue] = useState<number>(0);
  const [taxEnabled, setTaxEnabled] = useState(false);

  // Sync printer preferences from settings on load
  useEffect(() => {
    if (data.settings?.printer_paper_size) {
      bluetoothPrinter.setPaperSize(data.settings.printer_paper_size);
    }
    if (data.settings?.printer_auto_print !== undefined) {
      bluetoothPrinter.setAutoPrint(data.settings.printer_auto_print);
    }
    if (data.settings?.printer_open_drawer !== undefined) {
      bluetoothPrinter.setOpenDrawer(data.settings.printer_open_drawer);
    }
  }, [data.settings?.printer_paper_size, data.settings?.printer_auto_print, data.settings?.printer_open_drawer]);

  // Dynamic Payment Methods List from Store Settings
  const activePaymentMethods = useMemo(() => {
    if (data.settings?.payment_methods && data.settings.payment_methods.length > 0) {
      const enabled = data.settings.payment_methods.filter(m => m.enabled);
      if (enabled.length > 0) return enabled;
    }
    return [
      { id: 'pay-cash', name: 'Tunai', type: 'cash' as const, enabled: true },
      { id: 'pay-qris', name: 'QRIS', type: 'qris' as const, enabled: true },
      { id: 'pay-transfer', name: 'Transfer Bank', type: 'transfer' as const, enabled: true },
      { id: 'pay-debit', name: 'Debit / EDC', type: 'debit' as const, enabled: true }
    ];
  }, [data.settings?.payment_methods]);

  // Currently selected method configuration
  const currentMethodConfig = useMemo(() => {
    return activePaymentMethods.find(m => m.name === paymentMethod || m.id === paymentMethod);
  }, [activePaymentMethods, paymentMethod]);

  // Custom Item Modal State
  const [customItemModal, setCustomItemModal] = useState(false);
  const [customItemName, setCustomItemName] = useState('');
  const [customItemPrice, setCustomItemPrice] = useState<number>(1000);
  const [customItemQty, setCustomItemQty] = useState<number>(1);
  const [customItemNotes, setCustomItemNotes] = useState('');

  // Transaction Success State
  const [lastTx, setLastTx] = useState<POSTransaction | null>(null);
  const [successModalOpen, setSuccessModalOpen] = useState(false);
  const [processingPayment, setProcessingPayment] = useState(false);

  // Listen to printer status
  useEffect(() => {
    const unsub = bluetoothPrinter.subscribe(state => setPrinterState(state));
    return unsub;
  }, []);

  // Filter products
  const filteredProducts = useMemo(() => {
    return (data.products || []).filter(p => {
      if (!p.is_active) return false;
      const matchCat = selectedCategory === 'all' || p.category_id === selectedCategory;
      const matchSearch =
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.sku && p.sku.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchCat && matchSearch;
    });
  }, [data.products, selectedCategory, searchQuery]);

  // Calculations
  const subtotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.subtotal, 0);
  }, [cart]);

  const discountAmount = useMemo(() => {
    if (discountType === 'percent') {
      return Math.round((subtotal * Math.min(100, Math.max(0, discountValue))) / 100);
    }
    return Math.min(subtotal, Math.max(0, discountValue));
  }, [subtotal, discountType, discountValue]);

  const taxAmount = useMemo(() => {
    if (!taxEnabled) return 0;
    return Math.round((subtotal - discountAmount) * 0.11);
  }, [subtotal, discountAmount, taxEnabled]);

  const grandTotal = useMemo(() => {
    return Math.max(0, subtotal - discountAmount + taxAmount);
  }, [subtotal, discountAmount, taxAmount]);

  const changeAmount = useMemo(() => {
    if (paymentMethod !== 'Tunai') return 0;
    return Math.max(0, cashReceived - grandTotal);
  }, [cashReceived, grandTotal, paymentMethod]);

  const isCashInsufficient = paymentMethod === 'Tunai' && cashReceived < grandTotal && grandTotal > 0;

  // Cart operations
  const addToCart = (product: Product) => {
    setCart(prev => {
      const existingIdx = prev.findIndex(item => item.productId === product.id);
      const price = product.promo_price || product.price;

      if (existingIdx !== -1) {
        const updated = [...prev];
        const newQty = updated[existingIdx].quantity + 1;
        updated[existingIdx] = {
          ...updated[existingIdx],
          quantity: newQty,
          subtotal: newQty * updated[existingIdx].price
        };
        return updated;
      }

      return [
        ...prev,
        {
          id: `pos-item-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          productId: product.id,
          name: product.name,
          price: price,
          quantity: 1,
          subtotal: price
        }
      ];
    });
  };

  const updateQuantity = (itemId: string, newQty: number) => {
    if (newQty <= 0) {
      removeFromCart(itemId);
      return;
    }
    setCart(prev =>
      prev.map(item =>
        item.id === itemId
          ? { ...item, quantity: newQty, subtotal: newQty * item.price }
          : item
      )
    );
  };

  const updateItemNotes = (itemId: string, notes: string) => {
    setCart(prev =>
      prev.map(item => (item.id === itemId ? { ...item, notes } : item))
    );
  };

  const removeFromCart = (itemId: string) => {
    setCart(prev => prev.filter(item => item.id !== itemId));
  };

  const handleAddCustomItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customItemName.trim() || customItemPrice <= 0 || customItemQty <= 0) {
      onShowToast('Mohon lengkapi nama dan harga jasa/item', 'error');
      return;
    }

    setCart(prev => [
      ...prev,
      {
        id: `pos-custom-${Date.now()}`,
        name: customItemName.trim(),
        price: customItemPrice,
        quantity: customItemQty,
        notes: customItemNotes.trim() || undefined,
        subtotal: customItemPrice * customItemQty
      }
    ]);

    setCustomItemModal(false);
    setCustomItemName('');
    setCustomItemPrice(1000);
    setCustomItemQty(1);
    setCustomItemNotes('');
    onShowToast('Jasa/item kustom ditambahkan ke transaksi');
  };

  const resetCart = () => {
    setCart([]);
    setDiscountValue(0);
    setTaxEnabled(false);
    setCashReceived(0);
    setCustomerType('walk-in');
    setCustomerName('Pelanggan Langsung');
    setCustomerPhone('');
  };

  // Process transaction
  const handleProcessTransaction = async (shouldPrintReceipt: boolean) => {
    if (cart.length === 0) {
      onShowToast('Keranjang masih kosong!', 'error');
      return;
    }

    if (isCashInsufficient) {
      onShowToast('Uang tunai yang diterima masih kurang dari total belanja!', 'error');
      return;
    }

    setProcessingPayment(true);

    const orderNumber = `#POS-${Date.now().toString().slice(-6)}`;
    const tx: POSTransaction = {
      id: orderNumber,
      orderNumber: orderNumber,
      createdAt: new Date().toISOString(),
      customerName: customerType === 'walk-in' ? 'Pelanggan Langsung' : (customerName.trim() || 'Pelanggan'),
      customerPhone: customerPhone.trim() || undefined,
      cashierName: adminUser?.name || 'Kasir',
      items: cart,
      subtotal: subtotal,
      discount: discountAmount,
      tax: taxAmount,
      total: grandTotal,
      paymentMethod: paymentMethod,
      cashReceived: paymentMethod === 'Tunai' ? cashReceived : grandTotal,
      change: changeAmount
    };

    try {
      // 1. Save to Supabase (if configured) & local server DB
      const orderPayload = {
        id: orderNumber,
        customer_name: tx.customerName,
        whatsapp: tx.customerPhone || '',
        notes: `Transaksi POS Kasir - Metode: ${tx.paymentMethod}${tx.discount > 0 ? ` - Diskon: Rp ${tx.discount}` : ''}`,
        pickup_method: 'Ambil di toko',
        subtotal: tx.subtotal,
        total: tx.total,
        status: 'Selesai',
        created_at: tx.createdAt,
        payment_method: tx.paymentMethod,
        cash_received: tx.cashReceived,
        cash_change: tx.change,
        discount: tx.discount,
        cashier_name: tx.cashierName,
        source: 'pos',
        items: tx.items.map(it => ({
          id: it.id,
          product_id: it.productId || null,
          product_name: it.name,
          price: it.price,
          quantity: it.quantity,
          subtotal: it.subtotal
        }))
      };

      const client = getSupabaseClient();
      if (client) {
        try {
          await createOrderInSupabase(client, orderPayload);
        } catch (supaErr) {
          console.warn('Direct Supabase order creation failed, relying on server API:', supaErr);
        }
      }

      await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          ...getSupabaseHeaders()
        },
        body: JSON.stringify(orderPayload)
      });

      setLastTx(tx);
      setSuccessModalOpen(true);
      onRefreshData();

      // 2. Print receipt if requested or if autoPrint is turned on
      if (shouldPrintReceipt || printerState.autoPrint) {
        if (printerState.connected) {
          const printRes = await bluetoothPrinter.printTransaction(tx, data.settings);
          if (printRes.success) {
            onShowToast('Struk berhasil dicetak ke Printer Bluetooth!', 'success');
          } else {
            onShowToast(`Gagal mencetak: ${printRes.error}`, 'error');
          }
        } else {
          // If printer is not connected, open system thermal print
          onShowToast('Printer Bluetooth belum terhubung. Menyiapkan cetak alternatif...');
          bluetoothPrinter.printThermalViaBrowser(tx, data.settings);
        }
      } else {
        onShowToast('Transaksi berhasil diselesaikan!', 'success');
      }

      resetCart();
    } catch (err: any) {
      console.error('POS transaction error:', err);
      onShowToast(err.message || 'Gagal memproses transaksi', 'error');
    } finally {
      setProcessingPayment(false);
    }
  };

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID').format(val || 0);
  };

  const quickCashOptions = useMemo(() => {
    if (grandTotal <= 0) return [10000, 20000, 50000, 100000];
    const set = new Set<number>();
    set.add(grandTotal);
    const round5k = Math.ceil(grandTotal / 5000) * 5000;
    const round10k = Math.ceil(grandTotal / 10000) * 10000;
    const round20k = Math.ceil(grandTotal / 20000) * 20000;
    const round50k = Math.ceil(grandTotal / 50000) * 50000;
    const round100k = Math.ceil(grandTotal / 100000) * 100000;
    [round5k, round10k, round20k, round50k, round100k, 50000, 100000, 200000, 500000].forEach(v => {
      if (v > grandTotal) set.add(v);
    });
    return Array.from(set).sort((a, b) => a - b).slice(0, 5);
  }, [grandTotal]);

  return (
    <div className="flex flex-col lg:flex-row gap-5 h-full min-h-[calc(100vh-120px)] text-slate-800 relative">
      
      {/* Mobile Tab Switcher (Visible only on < lg) */}
      <div className="lg:hidden flex bg-slate-100 p-1 rounded-xl gap-1 shrink-0">
        <button
          type="button"
          onClick={() => setMobileTab('catalog')}
          className={`flex-1 py-2 px-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
            mobileTab === 'catalog'
              ? 'bg-white text-[#00288e] shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <ShoppingBag className="w-3.5 h-3.5" />
          <span>Katalog ({filteredProducts.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setMobileTab('checkout')}
          className={`flex-1 py-2 px-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
            mobileTab === 'checkout'
              ? 'bg-[#00288e] text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Banknote className="w-3.5 h-3.5" />
          <span>Kasir & Bayar</span>
          {cart.length > 0 && (
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
              mobileTab === 'checkout' ? 'bg-white text-[#00288e]' : 'bg-[#00288e] text-white'
            }`}>
              {cart.reduce((s, i) => s + i.quantity, 0)}
            </span>
          )}
        </button>
        <button
          type="button"
          onClick={() => setMobileTab('preview')}
          className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
            mobileTab === 'preview'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-700 bg-white/80 hover:bg-white'
          }`}
          title="Lihat Simulasi Struk Thermal Realtime"
        >
          <Receipt className="w-3.5 h-3.5 text-emerald-500" />
          <span className="hidden sm:inline">Live Struk</span>
          <span className="sm:hidden">Struk</span>
          {cart.length > 0 && (
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          )}
        </button>
      </div>

      {/* LEFT COLUMN: Product Catalog & Fast Add */}
      <div className={`flex-1 min-w-0 flex flex-col space-y-3.5 ${mobileTab === 'catalog' ? 'flex' : 'hidden lg:flex'}`}>
        
        {/* Top Action Bar: Search, Category, Custom Item & Bluetooth Bar */}
        <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3 shrink-0">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            
            {/* Search Input */}
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Cari produk / SKU / ATK..."
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:border-[#00288e] focus:ring-1 focus:ring-[#00288e] outline-none"
              />
            </div>

            {/* Top Right Buttons */}
            <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end flex-wrap">
              {/* Add Custom Item Button */}
              <button
                type="button"
                onClick={() => setCustomItemModal(true)}
                className="px-3 py-2 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-colors"
                title="Tambah Jasa Fotokopi / Jilid / Kustom"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Jasa / Kustom</span>
              </button>

              {/* Live Print Preview Button */}
              <button
                type="button"
                onClick={() => setShowLivePreviewModal(true)}
                className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all shadow-xs"
                title="Buka Tampilan Print Preview Struk Live"
              >
                <Receipt className="w-3.5 h-3.5 text-emerald-400" />
                <span>Live Struk</span>
                {cart.length > 0 && (
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                )}
              </button>

              {/* Desktop Dock Toggle (Only on wide screens) */}
              <button
                type="button"
                onClick={() => setIsDesktopPreviewDocked(prev => !prev)}
                className={`hidden 2xl:flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-all ${
                  isDesktopPreviewDocked
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-900 shadow-2xs'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
                title={isDesktopPreviewDocked ? 'Sembunyikan Kolom Preview Samping' : 'Sematkan Preview Struk di Kolom Samping'}
              >
                <PanelRight className="w-3.5 h-3.5 text-[#00288e]" />
                <span>{isDesktopPreviewDocked ? 'Tutup Samping' : 'Preview di Samping'}</span>
              </button>

              {/* Bluetooth Status Button */}
              <button
                type="button"
                onClick={() => setIsPrinterModalOpen(true)}
                className={`px-3 py-2 rounded-xl text-xs font-bold border flex items-center gap-2 transition-all shadow-xs ${
                  printerState.connected
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-800 hover:bg-emerald-100'
                    : 'bg-slate-50 border-slate-300 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <span className={`w-2.5 h-2.5 rounded-full ${
                  printerState.connected ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
                }`} />
                <Bluetooth className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">
                  {printerState.connected ? printerState.deviceName || 'Printer BT' : 'Printer'}
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/70 font-semibold">
                  {printerState.paperSize}
                </span>
              </button>
            </div>
          </div>

          {/* Category Chips */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-3.5 py-1.5 rounded-xl font-bold transition-colors whitespace-nowrap ${
                selectedCategory === 'all'
                  ? 'bg-[#00288e] text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Semua Katalog ({data.products?.length || 0})
            </button>
            {(data.categories || []).map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3.5 py-1.5 rounded-xl font-bold transition-colors whitespace-nowrap ${
                  selectedCategory === cat.id
                    ? 'bg-[#00288e] text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* Product Grid */}
        <div className="flex-1 overflow-y-auto max-h-[calc(100vh-270px)] pr-1">
          {filteredProducts.length === 0 ? (
            <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center text-slate-400">
              <ShoppingBag className="w-12 h-12 mx-auto mb-3 text-slate-300" />
              <p className="font-semibold text-sm">Tidak ada produk ditemukan</p>
              <p className="text-xs text-slate-400 mt-1">Coba kata kunci lain atau tambahkan item kustom.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3">
              {filteredProducts.map(product => {
                const inCart = cart.find(c => c.productId === product.id);
                const price = product.promo_price || product.price;

                return (
                  <div
                    key={product.id}
                    onClick={() => addToCart(product)}
                    className={`group bg-white p-3 rounded-2xl border transition-all cursor-pointer relative flex flex-col justify-between select-none hover:shadow-md hover:border-[#00288e] ${
                      inCart ? 'border-[#00288e] ring-1 ring-[#00288e]/20 bg-blue-50/20' : 'border-slate-200'
                    }`}
                  >
                    {/* Badge if in cart */}
                    {inCart && (
                      <span className="absolute top-2 right-2 bg-[#00288e] text-white text-[10px] font-extrabold w-5 h-5 rounded-full flex items-center justify-center shadow-xs">
                        {inCart.quantity}
                      </span>
                    )}

                    {/* Product Image / Icon */}
                    <div className="w-full h-24 rounded-xl bg-slate-100 overflow-hidden mb-2.5 flex items-center justify-center">
                      {product.image ? (
                        <img
                          src={product.image}
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <ShoppingBag className="w-8 h-8 text-slate-300" />
                      )}
                    </div>

                    {/* Info */}
                    <div>
                      {product.sku && (
                        <span className="text-[10px] text-slate-400 font-mono block truncate">
                          {product.sku}
                        </span>
                      )}
                      <h4 className="font-bold text-xs text-slate-900 line-clamp-2 leading-snug mb-1 group-hover:text-[#00288e] transition-colors">
                        {product.name}
                      </h4>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between mt-1">
                      <span className="font-extrabold text-xs text-[#00288e]">
                        Rp {formatRupiah(price)}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {product.unit || 'pcs'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Mobile Floating Cart Summary (Only in catalog tab when cart not empty) */}
        {cart.length > 0 && (
          <div className="lg:hidden sticky bottom-2 left-0 right-0 z-30 bg-slate-900/95 backdrop-blur-md text-white p-3 rounded-2xl shadow-xl flex items-center justify-between border border-slate-700 animate-in slide-in-from-bottom-2">
            <div>
              <div className="text-[11px] text-slate-300">
                {cart.reduce((s, i) => s + i.quantity, 0)} item di keranjang
              </div>
              <div className="text-base font-black text-emerald-400">
                Rp {formatRupiah(grandTotal)}
              </div>
            </div>
            <button
              type="button"
              onClick={() => setMobileTab('checkout')}
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-slate-950 font-black text-xs rounded-xl shadow-md flex items-center gap-1.5 transition-all"
            >
              <span>Lanjut Bayar</span>
              <Banknote className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* RIGHT COLUMN: Active Cart / Struk & Cashier Checkout */}
      <div className={`w-full lg:w-[420px] xl:w-[460px] shrink-0 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col h-[calc(100vh-130px)] min-h-[580px] sticky top-3 overflow-hidden ${
        mobileTab === 'checkout' ? 'flex' : 'hidden lg:flex'
      }`}>
        
        {/* Zone 1: Cart Header (shrink-0) */}
        <div className="p-3.5 border-b border-slate-100 bg-slate-50/70 shrink-0 space-y-2.5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-1.5">
                <ShoppingBag className="w-4 h-4 text-[#00288e]" />
                Transaksi Kasir
              </h3>
              <p className="text-[11px] text-slate-500">
                Kasir: <strong className="text-slate-800">{adminUser?.name || 'Admin'}</strong>
              </p>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setShowLivePreviewModal(true)}
                className="px-2.5 py-1 text-[11px] font-bold text-slate-700 bg-white hover:bg-slate-100 rounded-lg border border-slate-200 flex items-center gap-1.5 shadow-2xs transition-colors"
                title="Buka Live Print Preview Struk"
              >
                <Eye className="w-3.5 h-3.5 text-[#00288e]" />
                <span>Preview</span>
                {cart.length > 0 && (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                )}
              </button>

              {cart.length > 0 && (
                <button
                  type="button"
                  onClick={resetCart}
                  className="px-2 py-1 text-[11px] text-red-600 hover:bg-red-50 rounded-lg font-bold flex items-center gap-1 transition-colors border border-transparent hover:border-red-200"
                >
                  <RotateCcw className="w-3 h-3" />
                  Reset
                </button>
              )}
            </div>
          </div>

          {/* Customer Type Selector */}
          <div className="space-y-1.5">
            <div className="flex gap-1.5 bg-slate-100/80 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => {
                  setCustomerType('walk-in');
                  setCustomerName('Pelanggan Langsung');
                  setCustomerPhone('');
                }}
                className={`flex-1 py-1 px-2 rounded-lg text-xs font-bold transition-all ${
                  customerType === 'walk-in'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Pelanggan Langsung
              </button>
              <button
                type="button"
                onClick={() => setCustomerType('custom')}
                className={`flex-1 py-1 px-2 rounded-lg text-xs font-bold transition-all ${
                  customerType === 'custom'
                    ? 'bg-[#00288e] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Catat Nama / WA
              </button>
            </div>

            {customerType === 'custom' && (
              <div className="grid grid-cols-2 gap-1.5 pt-0.5 animate-in fade-in duration-200">
                <input
                  type="text"
                  value={customerName === 'Pelanggan Langsung' ? '' : customerName}
                  onChange={e => setCustomerName(e.target.value)}
                  placeholder="Nama Pelanggan"
                  className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs outline-none focus:border-[#00288e] focus:ring-1 focus:ring-[#00288e]"
                />
                <input
                  type="text"
                  value={customerPhone}
                  onChange={e => setCustomerPhone(e.target.value)}
                  placeholder="No. WA (08...)"
                  className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs outline-none focus:border-[#00288e] focus:ring-1 focus:ring-[#00288e]"
                />
              </div>
            )}
          </div>
        </div>

        {/* Zone 2: Scrollable Middle Section for Cart Items & Payment Options */}
        <div className="flex-1 overflow-y-auto p-3.5 space-y-4 divide-y divide-slate-100">
          
          {/* Sub-section A: Cart Items */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                Daftar Item ({cart.reduce((s, i) => s + i.quantity, 0)})
              </span>
            </div>

            {cart.length === 0 ? (
              <div className="py-8 flex flex-col items-center justify-center text-center text-slate-400 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                <ShoppingBag className="w-8 h-8 text-slate-300 mb-1.5" />
                <p className="text-xs font-bold text-slate-600">Keranjang masih kosong</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Pilih produk di katalog atau klik tombol "+ Jasa / Item Kustom".
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {cart.map(item => (
                  <div
                    key={item.id}
                    className="p-2.5 bg-slate-50/80 rounded-xl border border-slate-200/80 space-y-1.5 hover:border-slate-300 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <h5 className="font-bold text-xs text-slate-900 leading-snug truncate" title={item.name}>
                          {item.name}
                        </h5>
                        <span className="text-[11px] text-slate-500">
                          @ Rp {formatRupiah(item.price)}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFromCart(item.id)}
                        className="text-slate-400 hover:text-red-600 p-1 transition-colors rounded hover:bg-red-50"
                        title="Hapus Item"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Qty controller and subtotal */}
                    <div className="flex items-center justify-between pt-0.5">
                      <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg p-0.5 shadow-2xs">
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="w-5 h-5 rounded flex items-center justify-center text-slate-600 hover:bg-slate-100"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={e => updateQuantity(item.id, parseInt(e.target.value) || 1)}
                          className="w-8 text-center font-extrabold text-xs outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="w-5 h-5 rounded flex items-center justify-center text-slate-600 hover:bg-slate-100"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <span className="font-extrabold text-xs text-slate-900">
                        Rp {formatRupiah(item.subtotal)}
                      </span>
                    </div>

                    {/* Optional note */}
                    <input
                      type="text"
                      value={item.notes || ''}
                      onChange={e => updateItemNotes(item.id, e.target.value)}
                      placeholder="Catatan pengerjaan (opsional)..."
                      className="w-full text-[10px] px-2 py-1 bg-white border border-slate-200 rounded text-slate-600 outline-none focus:border-[#00288e]"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Sub-section B: Ringkasan Diskon & Pajak */}
          <div className="pt-3 space-y-2 text-xs">
            <div className="flex justify-between text-slate-600 font-medium">
              <span>Subtotal Item</span>
              <span className="font-bold text-slate-800">Rp {formatRupiah(subtotal)}</span>
            </div>

            {/* Discount Row */}
            <div className="flex items-center justify-between text-slate-600">
              <div className="flex items-center gap-1.5">
                <span className="font-medium">Diskon</span>
                <div className="inline-flex rounded-md border border-slate-200 text-[10px] overflow-hidden bg-white">
                  <button
                    type="button"
                    onClick={() => setDiscountType('nominal')}
                    className={`px-1.5 py-0.5 font-bold transition-colors ${
                      discountType === 'nominal' ? 'bg-[#00288e] text-white' : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    Rp
                  </button>
                  <button
                    type="button"
                    onClick={() => setDiscountType('percent')}
                    className={`px-1.5 py-0.5 font-bold transition-colors ${
                      discountType === 'percent' ? 'bg-[#00288e] text-white' : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    %
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  min="0"
                  value={discountValue || ''}
                  onChange={e => setDiscountValue(Math.max(0, parseInt(e.target.value) || 0))}
                  placeholder="0"
                  className="w-24 text-right px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold outline-none focus:border-[#00288e]"
                />
                {discountAmount > 0 && (
                  <span className="text-[10px] text-red-600 font-bold">
                    (-Rp {formatRupiah(discountAmount)})
                  </span>
                )}
              </div>
            </div>

            {/* PPN Toggle */}
            <div className="flex items-center justify-between text-slate-600">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={taxEnabled}
                  onChange={e => setTaxEnabled(e.target.checked)}
                  className="w-3.5 h-3.5 rounded text-[#00288e] focus:ring-0 cursor-pointer"
                />
                <span className="font-medium">PPN 11%</span>
              </label>
              <span className="font-medium text-slate-700">
                {taxEnabled ? `Rp ${formatRupiah(taxAmount)}` : 'Rp 0'}
              </span>
            </div>
          </div>

          {/* Sub-section C: Metode Pembayaran */}
          <div className="pt-3 space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wider block">
                Metode Pembayaran
              </label>
              <span className="text-[10px] font-bold text-slate-400">
                {activePaymentMethods.length} Pilihan Aktif
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {activePaymentMethods.map(m => {
                const getMethodIcon = () => {
                  switch (m.type) {
                    case 'cash': return Banknote;
                    case 'qris': return QrCode;
                    case 'transfer': return CreditCard;
                    case 'debit': return CreditCard;
                    default: return CreditCard;
                  }
                };
                const Icon = getMethodIcon();
                const isSelected = paymentMethod === m.name || paymentMethod === m.id;

                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => {
                      setPaymentMethod(m.name);
                      if (m.type === 'cash' && cashReceived < grandTotal) {
                        setCashReceived(grandTotal);
                      }
                    }}
                    className={`py-2 px-2.5 rounded-xl font-bold text-xs flex flex-col items-center gap-1 border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#00288e] text-white border-[#00288e] shadow-xs ring-2 ring-[#00288e]/20'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="truncate max-w-full">{m.name}</span>
                  </button>
                );
              })}
            </div>

            {/* If Selected Method is CASH */}
            {currentMethodConfig?.type === 'cash' || paymentMethod === 'Tunai' ? (
              <div className="space-y-2.5 p-3 bg-slate-50/90 rounded-xl border border-slate-200">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-slate-700">Uang Diterima:</span>
                  <div className="relative w-40">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">
                      Rp
                    </span>
                    <input
                      type="number"
                      min="0"
                      value={cashReceived || ''}
                      onChange={e => setCashReceived(Math.max(0, parseInt(e.target.value) || 0))}
                      placeholder="0"
                      className="w-full pl-8 pr-2.5 py-1.5 text-right font-extrabold text-sm bg-white border border-slate-200 rounded-lg outline-none focus:border-[#00288e] focus:ring-1 focus:ring-[#00288e]"
                    />
                  </div>
                </div>

                {/* Quick Cash Suggestions */}
                <div className="flex flex-wrap gap-1.5 pt-0.5">
                  <button
                    type="button"
                    onClick={() => setCashReceived(grandTotal)}
                    className="px-2.5 py-1 rounded-lg bg-white hover:bg-slate-100 border border-slate-200 font-extrabold text-[11px] text-slate-900 transition-colors shadow-2xs cursor-pointer"
                  >
                    Uang Pas
                  </button>
                  {quickCashOptions.filter(amt => amt !== grandTotal).map(amt => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setCashReceived(amt)}
                      className="px-2.5 py-1 rounded-lg bg-white hover:bg-slate-100 border border-slate-200 font-bold text-[11px] text-slate-700 transition-colors shadow-2xs cursor-pointer"
                    >
                      {formatRupiah(amt)}
                    </button>
                  ))}
                </div>

                {/* Kembalian Highlight Box */}
                <div className={`p-2.5 rounded-xl flex items-center justify-between border transition-all ${
                  isCashInsufficient
                    ? 'bg-amber-50 text-amber-900 border-amber-200'
                    : 'bg-emerald-50 text-emerald-950 border-emerald-200'
                }`}>
                  <div>
                    <span className="text-[11px] font-extrabold block uppercase tracking-wide">
                      {isCashInsufficient ? '⚠️ Uang Masih Kurang' : 'KEMBALIAN'}
                    </span>
                    <span className="text-[10px] opacity-75">
                      {isCashInsufficient ? 'Nominal diterima belum cukup' : 'Kembalian ke pelanggan'}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className={`text-base font-black ${
                      isCashInsufficient ? 'text-amber-700' : 'text-emerald-700'
                    }`}>
                      Rp {formatRupiah(isCashInsufficient ? grandTotal - cashReceived : changeAmount)}
                    </span>
                  </div>
                </div>
              </div>
            ) : currentMethodConfig?.type === 'qris' || paymentMethod === 'QRIS' ? (
              <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-200 text-xs space-y-2 text-blue-900">
                <div className="flex items-center justify-between font-bold text-[#00288e]">
                  <div className="flex items-center gap-1.5">
                    <QrCode className="w-4 h-4" />
                    <span>Scan QRIS Kasir ({paymentMethod})</span>
                  </div>
                  <span className="text-[11px] font-mono font-bold">Rp {formatRupiah(grandTotal)}</span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Arahkan pelanggan scan barcode QRIS toko. Total transaksi: <strong className="text-slate-900">Rp {formatRupiah(grandTotal)}</strong>.
                </p>
                {currentMethodConfig?.account_number && (
                  <div className="text-[11px] bg-white p-2 rounded-lg border border-blue-200 flex justify-between items-center text-slate-800">
                    <span>NMID / ID Merchant:</span>
                    <span className="font-mono font-bold">{currentMethodConfig.account_number}</span>
                  </div>
                )}
                {currentMethodConfig?.notes && (
                  <p className="text-[10px] text-slate-500 italic bg-white/70 p-1.5 rounded-md">
                    Catatan: {currentMethodConfig.notes}
                  </p>
                )}
                {(currentMethodConfig?.qr_image_url || data.settings?.qris_image) && (
                  <div className="pt-1 flex items-center gap-2">
                    <img
                      src={currentMethodConfig?.qr_image_url || data.settings.qris_image}
                      alt="QRIS Toko"
                      referrerPolicy="no-referrer"
                      className="w-14 h-14 object-contain rounded-lg border border-white bg-white shadow-2xs"
                    />
                    <span className="text-[11px] text-slate-500 font-medium">QRIS Resmi Toko</span>
                  </div>
                )}
              </div>
            ) : currentMethodConfig?.type === 'transfer' || paymentMethod === 'Transfer Bank' ? (
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2">
                <div className="flex items-center justify-between font-bold text-slate-800">
                  <div className="flex items-center gap-1.5">
                    <CreditCard className="w-4 h-4 text-[#00288e]" />
                    <span>Rekening Transfer ({paymentMethod})</span>
                  </div>
                  <span className="text-[11px] font-mono font-bold text-[#00288e]">Rp {formatRupiah(grandTotal)}</span>
                </div>

                {currentMethodConfig?.account_number ? (
                  <div className="p-2 bg-white rounded-lg border border-slate-200 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-slate-900">{currentMethodConfig.name}</span>: <span className="font-mono text-slate-700">{currentMethodConfig.account_number}</span>
                      {currentMethodConfig.account_name && (
                        <div className="text-[10px] text-slate-400">a.n. {currentMethodConfig.account_name}</div>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(currentMethodConfig.account_number || '');
                        onShowToast(`Nomor rekening ${currentMethodConfig.name} disalin!`);
                      }}
                      className="text-[10px] px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded font-bold cursor-pointer"
                    >
                      Salin
                    </button>
                  </div>
                ) : data.settings?.bank_accounts && data.settings.bank_accounts.length > 0 ? (
                  <div className="space-y-1.5 pt-0.5">
                    {data.settings.bank_accounts.map((acc, idx) => (
                      <div key={idx} className="p-2 bg-white rounded-lg border border-slate-200 flex items-center justify-between text-xs">
                        <div>
                          <span className="font-bold text-slate-900">{acc.bank_name}</span>: <span className="font-mono text-slate-700">{acc.account_number}</span>
                          <div className="text-[10px] text-slate-400">a.n. {acc.holder_name}</div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(acc.account_number);
                            onShowToast(`Nomor rekening ${acc.bank_name} disalin!`);
                          }}
                          className="text-[10px] px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded font-bold cursor-pointer"
                        >
                          Salin
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-500">
                    Pastikan mutasi transfer sebesar <strong className="text-slate-800">Rp {formatRupiah(grandTotal)}</strong> sudah berhasil masuk.
                  </p>
                )}
                {currentMethodConfig?.notes && (
                  <p className="text-[10px] text-slate-500 italic bg-white/70 p-1.5 rounded-md">
                    Catatan: {currentMethodConfig.notes}
                  </p>
                )}
              </div>
            ) : (
              <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-200 text-xs space-y-1 text-amber-900">
                <div className="font-bold flex items-center justify-between">
                  <span>Pembayaran: {paymentMethod}</span>
                  <span className="font-mono">Rp {formatRupiah(grandTotal)}</span>
                </div>
                {currentMethodConfig?.account_number && (
                  <div className="text-[11px]">
                    No. Ref/Akun: <span className="font-mono font-bold">{currentMethodConfig.account_number}</span>
                  </div>
                )}
                {currentMethodConfig?.notes && (
                  <div className="text-[10px] text-slate-600 italic">
                    {currentMethodConfig.notes}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Zone 3: Sticky Fixed Bottom Action Area (shrink-0) */}
        <div className="p-3.5 border-t border-slate-200 bg-slate-50/95 shrink-0 space-y-2 backdrop-blur-xs shadow-lg">
          {/* Total Bayar Display */}
          <div className="flex items-baseline justify-between">
            <span className="text-xs font-black text-slate-500 uppercase tracking-wider">
              TOTAL BAYAR
            </span>
            <span className="text-2xl font-black text-[#00288e]">
              Rp {formatRupiah(grandTotal)}
            </span>
          </div>

          {/* Primary Action Button: Bayar & Cetak Struk */}
          <button
            type="button"
            onClick={() => handleProcessTransaction(true)}
            disabled={cart.length === 0 || isCashInsufficient || processingPayment}
            className="w-full h-12 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-black text-sm flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:pointer-events-none"
          >
            <Printer className="w-4 h-4" />
            <span>{processingPayment ? 'Memproses Transaksi...' : `BAYAR & CETAK STRUK`}</span>
          </button>

          {/* Secondary Action Button: Bayar Tanpa Cetak */}
          <button
            type="button"
            onClick={() => handleProcessTransaction(false)}
            disabled={cart.length === 0 || isCashInsufficient || processingPayment}
            className="w-full h-9 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
          >
            <span>Bayar Saja (Tanpa Cetak)</span>
          </button>

          {/* Tertiary Action Button: Live Print Preview */}
          <button
            type="button"
            onClick={() => setShowLivePreviewModal(true)}
            className="w-full h-9 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-all"
          >
            <Receipt className="w-3.5 h-3.5 text-emerald-400" />
            <span>Lihat Live Print Preview Struk</span>
          </button>

          {/* Bluetooth Printer Status Line */}
          <div className="pt-0.5 flex items-center justify-center">
            <button
              type="button"
              onClick={() => setIsPrinterModalOpen(true)}
              className="text-[10px] text-slate-500 hover:text-[#00288e] flex items-center gap-1.5 transition-colors"
            >
              <span className={`w-2 h-2 rounded-full ${printerState.connected ? 'bg-emerald-500' : 'bg-slate-300'}`} />
              <span>
                {printerState.connected
                  ? `Printer: ${printerState.deviceName || 'RPP02N'} (${printerState.paperSize})`
                  : 'Printer Bluetooth belum terhubung • Klik untuk hubungkan'}
              </span>
            </button>
          </div>
        </div>

      </div>

      {/* 3RD COLUMN: Desktop Docked Live Receipt Preview (Optional side-by-side) */}
      {isDesktopPreviewDocked && (
        <div className="hidden 2xl:flex w-[380px] shrink-0 h-[calc(100vh-130px)] min-h-[580px] sticky top-3 animate-in slide-in-from-right-4 duration-200">
          <LiveReceiptPreview
            cart={cart}
            customerName={customerType === 'walk-in' ? 'Pelanggan Langsung' : customerName}
            customerPhone={customerPhone}
            cashierName={adminUser?.name || 'Kasir'}
            paymentMethod={paymentMethod}
            cashReceived={paymentMethod === 'Tunai' ? cashReceived : grandTotal}
            subtotal={subtotal}
            discountAmount={discountAmount}
            discountType={discountType}
            taxAmount={taxAmount}
            grandTotal={grandTotal}
            changeAmount={changeAmount}
            settings={data.settings}
            printerState={printerState}
            onShowToast={onShowToast}
            onClose={() => setIsDesktopPreviewDocked(false)}
          />
        </div>
      )}

      {/* MOBILE TAB: Live Receipt Preview (When mobile tab is 'preview') */}
      {mobileTab === 'preview' && (
        <div className="lg:hidden flex-1 min-h-[520px]">
          <LiveReceiptPreview
            cart={cart}
            customerName={customerType === 'walk-in' ? 'Pelanggan Langsung' : customerName}
            customerPhone={customerPhone}
            cashierName={adminUser?.name || 'Kasir'}
            paymentMethod={paymentMethod}
            cashReceived={paymentMethod === 'Tunai' ? cashReceived : grandTotal}
            subtotal={subtotal}
            discountAmount={discountAmount}
            discountType={discountType}
            taxAmount={taxAmount}
            grandTotal={grandTotal}
            changeAmount={changeAmount}
            settings={data.settings}
            printerState={printerState}
            onShowToast={onShowToast}
            onClose={() => setMobileTab('checkout')}
          />
        </div>
      )}

      {/* MODAL: Custom Item / Jasa Percetakan */}
      {customItemModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-base text-slate-900">
                + Tambah Jasa / Item Kustom
              </h3>
              <button
                type="button"
                onClick={() => setCustomItemModal(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleAddCustomItem} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Nama Jasa / Produk:
                </label>
                <input
                  type="text"
                  required
                  value={customItemName}
                  onChange={e => setCustomItemName(e.target.value)}
                  placeholder="Contoh: Print Warna A4, Jilid Spiral, Laminating..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-[#00288e]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Harga Satuan (Rp):
                  </label>
                  <input
                    type="number"
                    min="100"
                    step="100"
                    required
                    value={customItemPrice}
                    onChange={e => setCustomItemPrice(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-[#00288e]"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Jumlah (Qty):
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={customItemQty}
                    onChange={e => setCustomItemQty(parseInt(e.target.value) || 1)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-[#00288e]"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Catatan Pengerjaan (Opsional):
                </label>
                <input
                  type="text"
                  value={customItemNotes}
                  onChange={e => setCustomItemNotes(e.target.value)}
                  placeholder="Contoh: Kertas Art Paper 260gr, bolak-balik..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-[#00288e]"
                />
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex justify-between font-bold text-slate-900">
                <span>Subtotal Item:</span>
                <span className="text-[#00288e]">
                  Rp {formatRupiah(customItemPrice * customItemQty)}
                </span>
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setCustomItemModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 font-bold text-slate-700"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#00288e] hover:bg-[#001f70] text-white font-bold shadow-xs"
                >
                  Tambahkan ke Struk
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Live Print Preview (Active Transaction / Cart) */}
      {showLivePreviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-slate-900 text-white rounded-2xl shadow-2xl max-w-lg w-full p-4 sm:p-5 border border-slate-700 max-h-[92vh] flex flex-col">
            <LiveReceiptPreview
              cart={cart}
              customerName={customerType === 'walk-in' ? 'Pelanggan Langsung' : customerName}
              customerPhone={customerPhone}
              cashierName={adminUser?.name || 'Kasir'}
              paymentMethod={paymentMethod}
              cashReceived={paymentMethod === 'Tunai' ? cashReceived : grandTotal}
              subtotal={subtotal}
              discountAmount={discountAmount}
              discountType={discountType}
              taxAmount={taxAmount}
              grandTotal={grandTotal}
              changeAmount={changeAmount}
              settings={data.settings}
              printerState={printerState}
              onShowToast={onShowToast}
              onClose={() => setShowLivePreviewModal(false)}
              isModal={true}
            />
          </div>
        </div>
      )}

      {/* MODAL: Transaksi Berhasil & Live Print Preview */}
      {successModalOpen && lastTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-slate-900 text-white rounded-2xl shadow-2xl max-w-lg w-full p-4 sm:p-5 border border-slate-700 max-h-[92vh] flex flex-col">
            
            {/* Header Success */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-sm sm:text-base text-white">
                    Transaksi Berhasil Disimpan!
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Nota: <strong className="text-white">{lastTx.orderNumber}</strong> • Total: <strong className="text-emerald-400">Rp {formatRupiah(lastTx.total)}</strong>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSuccessModalOpen(false)}
                className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 text-xl font-bold transition-colors"
                title="Tutup & Transaksi Baru"
              >
                &times;
              </button>
            </div>

            {/* Live Receipt Preview Component */}
            <div className="flex-1 overflow-hidden my-2.5">
              <LiveReceiptPreview
                transaction={lastTx}
                settings={data.settings}
                printerState={printerState}
                onShowToast={onShowToast}
                isModal={true}
              />
            </div>

            {/* Bottom Selesai Button */}
            <div className="pt-2 border-t border-slate-800 shrink-0">
              <button
                type="button"
                onClick={() => setSuccessModalOpen(false)}
                className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-black text-xs transition-all shadow-md active:scale-95"
              >
                Selesai & Mulai Transaksi Baru
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bluetooth Printer Modal */}
      <BluetoothPrinterModal
        isOpen={isPrinterModalOpen}
        onClose={() => setIsPrinterModalOpen(false)}
        settings={data.settings}
        onShowToast={onShowToast}
      />
    </div>
  );
};
