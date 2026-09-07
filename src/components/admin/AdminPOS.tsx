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
  DollarSign
} from 'lucide-react';
import { AppData, Product, StoreSettings } from '../../types';
import {
  bluetoothPrinter,
  PrinterDeviceState,
  POSTransaction,
  POSCartItem
} from '../../lib/bluetoothPrinter';
import { BluetoothPrinterModal } from './BluetoothPrinterModal';
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

  // Customer & Payment Info
  const [customerType, setCustomerType] = useState<'walk-in' | 'custom'>('walk-in');
  const [customerName, setCustomerName] = useState('Pelanggan Langsung');
  const [customerPhone, setCustomerPhone] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'Tunai' | 'QRIS' | 'Transfer Bank' | 'Debit'>('Tunai');
  const [cashReceived, setCashReceived] = useState<number>(0);
  const [discountType, setDiscountType] = useState<'nominal' | 'percent'>('nominal');
  const [discountValue, setDiscountValue] = useState<number>(0);
  const [taxEnabled, setTaxEnabled] = useState(false);

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

  const quickCashOptions = [
    grandTotal,
    10000,
    20000,
    50000,
    100000,
    200000,
    500000
  ].filter((v, idx, arr) => arr.indexOf(v) === idx && (v >= grandTotal || v === grandTotal));

  return (
    <div className="flex flex-col xl:flex-row gap-6 h-full min-h-[calc(100vh-140px)] text-slate-800">
      
      {/* LEFT COLUMN: Product Catalog & Fast Add */}
      <div className="flex-1 flex flex-col space-y-4">
        
        {/* Top Action Bar: Search, Category, Custom Item & Bluetooth Bar */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
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
            <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
              {/* Add Custom Item Button */}
              <button
                type="button"
                onClick={() => setCustomItemModal(true)}
                className="px-3 py-2 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-colors"
                title="Tambah Jasa Fotokopi / Jilid / Kustom"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Jasa / Item Kustom</span>
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
                  {printerState.connected ? printerState.deviceName || 'Printer BT' : 'Hubungkan Printer'}
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
        <div className="flex-1 overflow-y-auto max-h-[calc(100vh-280px)] pr-1">
          {filteredProducts.length === 0 ? (
            <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center text-slate-400">
              <ShoppingBag className="w-12 h-12 mx-auto mb-3 text-slate-300" />
              <p className="font-semibold text-sm">Tidak ada produk ditemukan</p>
              <p className="text-xs text-slate-400 mt-1">Coba kata kunci lain atau tambahkan item kustom.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 gap-3">
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
      </div>

      {/* RIGHT COLUMN: Active Cart / Struk & Cashier Checkout */}
      <div className="w-full xl:w-[420px] bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between overflow-hidden">
        
        {/* Cart Header */}
        <div className="p-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-[#00288e]" />
                Transaksi Berjalan
              </h3>
              <p className="text-[11px] text-slate-400">
                Kasir: <strong className="text-slate-700">{adminUser?.name || 'Admin'}</strong>
              </p>
            </div>

            {cart.length > 0 && (
              <button
                type="button"
                onClick={resetCart}
                className="text-[11px] text-red-600 hover:text-red-700 font-semibold flex items-center gap-1 hover:underline"
              >
                <RotateCcw className="w-3 h-3" />
                Reset
              </button>
            )}
          </div>

          {/* Customer Type Selector */}
          <div className="space-y-2">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setCustomerType('walk-in');
                  setCustomerName('Pelanggan Langsung');
                  setCustomerPhone('');
                }}
                className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold border transition-colors ${
                  customerType === 'walk-in'
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                Pelanggan Langsung
              </button>
              <button
                type="button"
                onClick={() => setCustomerType('custom')}
                className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold border transition-colors ${
                  customerType === 'custom'
                    ? 'bg-[#00288e] text-white border-[#00288e]'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                Catat Nama / WA
              </button>
            </div>

            {customerType === 'custom' && (
              <div className="grid grid-cols-2 gap-2 pt-1">
                <input
                  type="text"
                  value={customerName === 'Pelanggan Langsung' ? '' : customerName}
                  onChange={e => setCustomerName(e.target.value)}
                  placeholder="Nama Pelanggan"
                  className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs outline-none focus:border-[#00288e]"
                />
                <input
                  type="text"
                  value={customerPhone}
                  onChange={e => setCustomerPhone(e.target.value)}
                  placeholder="No. WA (08...)"
                  className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs outline-none focus:border-[#00288e]"
                />
              </div>
            )}
          </div>
        </div>

        {/* Cart Item List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[220px] max-h-[300px]">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
              <ShoppingBag className="w-10 h-10 text-slate-300 mb-2" />
              <p className="text-xs font-bold text-slate-500">Keranjang masih kosong</p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Klik produk dari katalog atau tambahkan item kustom.
              </p>
            </div>
          ) : (
            cart.map(item => (
              <div
                key={item.id}
                className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <h5 className="font-bold text-xs text-slate-900 leading-snug">
                      {item.name}
                    </h5>
                    <span className="text-[11px] text-slate-500">
                      @ Rp {formatRupiah(item.price)}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeFromCart(item.id)}
                    className="text-slate-400 hover:text-red-600 p-1 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Qty controller and subtotal */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-lg p-0.5">
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="w-6 h-6 rounded flex items-center justify-center text-slate-600 hover:bg-slate-100"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={e => updateQuantity(item.id, parseInt(e.target.value) || 1)}
                      className="w-10 text-center font-bold text-xs outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="w-6 h-6 rounded flex items-center justify-center text-slate-600 hover:bg-slate-100"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>

                  <span className="font-bold text-xs text-slate-900">
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
            ))
          )}
        </div>

        {/* Calculations & Payment Methods */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50 space-y-3">
          
          {/* Subtotal, Discount, Tax */}
          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal</span>
              <span>Rp {formatRupiah(subtotal)}</span>
            </div>

            {/* Discount Row */}
            <div className="flex items-center justify-between text-slate-600">
              <div className="flex items-center gap-1.5">
                <span>Diskon</span>
                <div className="inline-flex rounded border border-slate-200 text-[10px] overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setDiscountType('nominal')}
                    className={`px-1.5 py-0.5 font-bold ${
                      discountType === 'nominal' ? 'bg-[#00288e] text-white' : 'bg-white text-slate-600'
                    }`}
                  >
                    Rp
                  </button>
                  <button
                    type="button"
                    onClick={() => setDiscountType('percent')}
                    className={`px-1.5 py-0.5 font-bold ${
                      discountType === 'percent' ? 'bg-[#00288e] text-white' : 'bg-white text-slate-600'
                    }`}
                  >
                    %
                  </button>
                </div>
              </div>
              <input
                type="number"
                min="0"
                value={discountValue || ''}
                onChange={e => setDiscountValue(Math.max(0, parseInt(e.target.value) || 0))}
                placeholder="0"
                className="w-24 text-right px-2 py-0.5 bg-white border border-slate-200 rounded text-xs outline-none"
              />
            </div>

            {/* PPN Toggle */}
            <div className="flex items-center justify-between text-slate-600">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={taxEnabled}
                  onChange={e => setTaxEnabled(e.target.checked)}
                  className="rounded text-[#00288e] focus:ring-0"
                />
                <span>PPN 11%</span>
              </label>
              <span>{taxEnabled ? `Rp ${formatRupiah(taxAmount)}` : 'Rp 0'}</span>
            </div>

            {/* GRAND TOTAL */}
            <div className="flex justify-between items-baseline pt-2 border-t border-slate-200">
              <span className="font-extrabold text-sm text-slate-900">TOTAL BAYAR</span>
              <span className="font-extrabold text-lg text-[#00288e]">
                Rp {formatRupiah(grandTotal)}
              </span>
            </div>
          </div>

          {/* Payment Method Selector */}
          <div className="space-y-2 pt-1">
            <label className="text-[11px] font-bold text-slate-600 block">Metode Pembayaran:</label>
            <div className="grid grid-cols-3 gap-1.5">
              {[
                { id: 'Tunai', label: 'Tunai', icon: Banknote },
                { id: 'QRIS', label: 'QRIS', icon: QrCode },
                { id: 'Transfer Bank', label: 'Transfer', icon: CreditCard }
              ].map(m => {
                const Icon = m.icon;
                const isSelected = paymentMethod === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => {
                      setPaymentMethod(m.id as any);
                      if (m.id === 'Tunai' && cashReceived < grandTotal) {
                        setCashReceived(grandTotal);
                      }
                    }}
                    className={`py-2 px-1.5 rounded-xl font-bold text-xs flex flex-col items-center gap-1 border transition-all ${
                      isSelected
                        ? 'bg-[#00288e] text-white border-[#00288e] shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{m.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Cash Received & Change (If Tunai) */}
          {paymentMethod === 'Tunai' && (
            <div className="space-y-2 p-3 bg-white rounded-xl border border-slate-200">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-700">Uang Tunai Diterima:</span>
                <div className="relative w-36">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">
                    Rp
                  </span>
                  <input
                    type="number"
                    value={cashReceived || ''}
                    onChange={e => setCashReceived(Math.max(0, parseInt(e.target.value) || 0))}
                    placeholder="0"
                    className="w-full pl-8 pr-2 py-1 text-right font-bold text-xs bg-slate-50 border border-slate-200 rounded-lg outline-none focus:bg-white focus:border-[#00288e]"
                  />
                </div>
              </div>

              {/* Quick Cash Options */}
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => setCashReceived(grandTotal)}
                  className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 font-bold text-[10px] text-slate-700"
                >
                  Uang Pas
                </button>
                {quickCashOptions.map(amt => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setCashReceived(amt)}
                    className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 font-bold text-[10px] text-slate-700"
                  >
                    {formatRupiah(amt)}
                  </button>
                ))}
              </div>

              {/* Change Highlight */}
              <div className={`p-2 rounded-lg flex items-center justify-between text-xs font-bold ${
                isCashInsufficient
                  ? 'bg-amber-50 text-amber-800 border border-amber-200'
                  : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              }`}>
                <span>{isCashInsufficient ? 'Kurang:' : 'KEMBALIAN:'}</span>
                <span className="text-sm">
                  Rp {formatRupiah(isCashInsufficient ? grandTotal - cashReceived : changeAmount)}
                </span>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-2 space-y-2">
            <button
              type="button"
              onClick={() => handleProcessTransaction(true)}
              disabled={cart.length === 0 || isCashInsufficient || processingPayment}
              className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-sm transition-colors disabled:opacity-50"
            >
              <Printer className="w-4 h-4" />
              <span>{processingPayment ? 'Memproses...' : 'BAYAR & CETAK STRUK'}</span>
            </button>

            <button
              type="button"
              onClick={() => handleProcessTransaction(false)}
              disabled={cart.length === 0 || isCashInsufficient || processingPayment}
              className="w-full py-2 px-4 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 font-bold text-xs transition-colors disabled:opacity-50"
            >
              Bayar Tanpa Cetak
            </button>
          </div>
        </div>
      </div>

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

      {/* MODAL: Transaksi Berhasil & Cetak Struk */}
      {successModalOpen && lastTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200 text-center animate-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-3">
              <CheckCircle2 className="w-6 h-6" />
            </div>

            <h3 className="font-extrabold text-lg text-slate-900">
              Transaksi Berhasil!
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Nota: <strong className="text-slate-800">{lastTx.orderNumber}</strong>
            </p>

            <div className="my-4 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2 text-left">
              <div className="flex justify-between text-slate-600">
                <span>Total Belanja:</span>
                <span className="font-bold text-slate-900">Rp {formatRupiah(lastTx.total)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Metode Pembayaran:</span>
                <span className="font-bold text-slate-900">{lastTx.paymentMethod}</span>
              </div>
              {lastTx.paymentMethod === 'Tunai' && (
                <>
                  <div className="flex justify-between text-slate-600">
                    <span>Uang Diterima:</span>
                    <span>Rp {formatRupiah(lastTx.cashReceived)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-emerald-800 pt-1 border-t border-slate-200">
                    <span>Kembalian:</span>
                    <span>Rp {formatRupiah(lastTx.change)}</span>
                  </div>
                </>
              )}
            </div>

            <div className="space-y-2">
              <button
                type="button"
                onClick={async () => {
                  if (printerState.connected) {
                    const res = await bluetoothPrinter.printTransaction(lastTx, data.settings);
                    if (res.success) {
                      onShowToast('Struk berhasil dicetak ulang!', 'success');
                    } else {
                      onShowToast(`Gagal mencetak: ${res.error}`, 'error');
                    }
                  } else {
                    bluetoothPrinter.printThermalViaBrowser(lastTx, data.settings);
                  }
                }}
                className="w-full py-2.5 px-4 rounded-xl bg-[#00288e] hover:bg-[#001f70] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-colors"
              >
                <Printer className="w-4 h-4" />
                <span>Cetak Ulang Struk</span>
              </button>

              <button
                type="button"
                onClick={() => bluetoothPrinter.printThermalViaBrowser(lastTx, data.settings)}
                className="w-full py-2 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center gap-2 transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Cetak Struk Browser / PDF</span>
              </button>

              {lastTx.customerPhone && (
                <button
                  type="button"
                  onClick={() => {
                    const cleanPhone = lastTx.customerPhone!.replace(/\D/g, '');
                    const phoneWithCode = cleanPhone.startsWith('0') ? '62' + cleanPhone.slice(1) : cleanPhone;
                    const itemsText = lastTx.items.map(it => `- ${it.name} (${it.quantity}x) = Rp ${formatRupiah(it.subtotal)}`).join('%0A');
                    const waText = `*STRUK PEMBELIAN ${encodeURIComponent(data.settings.store_name || 'SALIN SERUPA')}*%0A` +
                      `No. Nota: ${lastTx.orderNumber}%0A` +
                      `Tanggal: ${lastTx.createdAt.slice(0, 16)}%0A` +
                      `-------------------------------%0A` +
                      `${itemsText}%0A` +
                      `-------------------------------%0A` +
                      `*Total: Rp ${formatRupiah(lastTx.total)}*%0A` +
                      `Metode: ${lastTx.paymentMethod}%0A` +
                      (lastTx.paymentMethod === 'Tunai' ? `Kembalian: Rp ${formatRupiah(lastTx.change)}%0A` : '') +
                      `Terima kasih telah bertransaksi di ${encodeURIComponent(data.settings.store_name)}!`;

                    window.open(`https://wa.me/${phoneWithCode}?text=${waText}`, '_blank');
                  }}
                  className="w-full py-2 px-4 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold text-xs flex items-center justify-center gap-2 transition-colors"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Kirim Struk via WhatsApp Pelanggan</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => setSuccessModalOpen(false)}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs transition-colors mt-2"
              >
                Transaksi Baru (Selesai)
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
