import React, { useState } from 'react';
import { Order, OrderDocument, StoreSettings } from '../../types';
import { formatRupiah, exportOrdersToCSV, generateWhatsAppStatusUpdateUrl } from '../../utils';
import { Search, ShoppingBag, Eye, X, MessageSquare, Download, FileText, File, DownloadCloud, Send, Printer } from 'lucide-react';
import { bluetoothPrinter, POSTransaction } from '../../lib/bluetoothPrinter';

interface AdminOrdersProps {
  orders: Order[];
  settings?: StoreSettings;
  onUpdateOrderStatus: (orderId: string, status: Order['status']) => void;
  onShowToast?: (msg: string, type?: 'success' | 'error') => void;
}

export const AdminOrders: React.FC<AdminOrdersProps> = ({ orders, settings, onUpdateOrderStatus, onShowToast }) => {
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const filteredOrders = orders.filter((o) => {
    const matchesSearch =
      o.id.toLowerCase().includes(search.toLowerCase()) ||
      o.customer_name.toLowerCase().includes(search.toLowerCase()) ||
      o.whatsapp.includes(search);
    const matchesStatus = filterStatus === 'all' || o.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const formatFileSize = (bytes: number) => {
    if (!bytes) return '';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const handleExportCSV = () => {
    const nowStr = new Date().toISOString().slice(0, 10);
    exportOrdersToCSV(filteredOrders, `Laporan_Penjualan_Salin_Serupa_${nowStr}.csv`);
  };

  const handleStatusChangeWithNotification = (order: Order, newStatus: Order['status']) => {
    onUpdateOrderStatus(order.id, newStatus);
    if (selectedOrder && selectedOrder.id === order.id) {
      setSelectedOrder({ ...selectedOrder, status: newStatus });
    }

    // Generate WhatsApp status update URL and open in new tab
    const waUrl = generateWhatsAppStatusUpdateUrl(order.whatsapp, order.customer_name, order.id, newStatus);
    window.open(waUrl, '_blank');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#191c1e]">Kelola Pesanan Masuk</h2>
          <p className="text-xs text-slate-500">Pantau, unduh laporan penjualan CSV, dan perbarui status ke pembeli</p>
        </div>

        {/* Export CSV Button */}
        <button
          onClick={handleExportCSV}
          className="bg-[#006e2f] hover:bg-[#005724] text-white px-4 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-xs shrink-0 active:scale-95 cursor-pointer"
          title="Ekspor seluruh data pesanan yang tampil ke file CSV / Excel"
        >
          <DownloadCloud className="w-4 h-4" />
          <span>Ekspor Laporan CSV</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari No. Order / Nama / WA..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white border border-[#c4c5d5] rounded-xl text-xs font-medium focus:outline-none focus:border-[#00288e]"
          />
        </div>

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="bg-white border border-[#c4c5d5] rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none"
        >
          <option value="all">Semua Status ({orders.length})</option>
          <option value="Baru">Baru</option>
          <option value="Diproses">Diproses</option>
          <option value="Siap Diambil">Siap Diambil</option>
          <option value="Selesai">Selesai</option>
          <option value="Dibatalkan">Dibatalkan</option>
        </select>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-2xl border border-[#e0e3e5] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-[#f7f9fb] border-b border-[#e0e3e5] uppercase font-bold text-slate-500 text-[10px]">
              <tr>
                <th className="py-3 px-4">No. Order</th>
                <th className="py-3 px-4">Waktu</th>
                <th className="py-3 px-4">Nama Pelanggan & WA</th>
                <th className="py-3 px-4">Dokumen</th>
                <th className="py-3 px-4">Metode Pengambilan</th>
                <th className="py-3 px-4">Total</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f2f4f6]">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400">
                    Tidak ada pesanan ditemukan.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((o) => {
                  const docCount = o.documents?.length || 0;
                  return (
                    <tr key={o.id} className="hover:bg-[#f7f9fb] transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-[#00288e]">{o.id}</td>
                      <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                        {new Date(o.created_at).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' })}
                      </td>
                      <td className="py-3 px-4">
                        <p className="font-bold text-slate-900">{o.customer_name}</p>
                        <a
                          href={`https://wa.me/${o.whatsapp.replace(/[^0-9]/g, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[11px] text-[#006e2f] hover:underline flex items-center gap-1"
                        >
                          <MessageSquare className="w-3 h-3" />
                          <span>{o.whatsapp}</span>
                        </a>
                      </td>
                      <td className="py-3 px-4">
                        {docCount > 0 ? (
                          <span className="inline-flex items-center gap-1 bg-blue-50 text-[#00288e] px-2 py-0.5 rounded-lg text-[11px] font-bold border border-blue-200">
                            <FileText className="w-3 h-3" /> {docCount} File
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[11px]">-</span>
                        )}
                      </td>
                      <td className="py-3 px-4">{o.pickup_method}</td>
                      <td className="py-3 px-4 font-extrabold text-[#00288e]">{formatRupiah(o.total)}</td>
                      <td className="py-3 px-4">
                        <div className="flex flex-col gap-1 items-start">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                            o.status === 'Baru'
                              ? 'bg-amber-100 text-amber-800 border border-amber-200'
                              : o.status === 'Diproses'
                              ? 'bg-blue-100 text-blue-800 border border-blue-200'
                              : o.status === 'Siap Diambil'
                              ? 'bg-purple-100 text-purple-800 border border-purple-200'
                              : o.status === 'Selesai'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : 'bg-red-100 text-red-800 border border-red-200'
                          }`}>
                            {o.status}
                          </span>
                          <div className="flex items-center gap-1.5">
                            <select
                              value={o.status}
                              onChange={(e: any) => handleStatusChangeWithNotification(o, e.target.value)}
                              className="bg-white border border-[#c4c5d5] rounded-lg px-2 py-1 text-[11px] font-semibold text-slate-800 focus:outline-none focus:border-[#00288e] hover:bg-[#f7f9fb] cursor-pointer"
                            >
                              <option value="Baru">Baru</option>
                              <option value="Diproses">Diproses</option>
                              <option value="Siap Diambil">Siap Diambil</option>
                              <option value="Selesai">Selesai</option>
                              <option value="Dibatalkan">Dibatalkan</option>
                            </select>

                            <a
                              href={generateWhatsAppStatusUpdateUrl(o.whatsapp, o.customer_name, o.id, o.status)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 bg-[#25D366]/15 text-[#006e2f] hover:bg-[#25D366] hover:text-white rounded-lg transition-all"
                              title="Kirim pesan status terbaru ke WA pembeli"
                            >
                              <Send className="w-3.5 h-3.5" />
                            </a>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => setSelectedOrder(o)}
                          className="bg-[#00288e] text-white px-2.5 py-1 rounded-lg text-[11px] font-bold inline-flex items-center gap-1 hover:bg-opacity-90"
                        >
                          <Eye className="w-3.5 h-3.5" /> Detail
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl relative border border-[#e0e3e5] max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setSelectedOrder(null)}
              className="absolute top-4 right-4 p-1 text-slate-400 hover:text-slate-700"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center justify-between mb-4 pr-6">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-[#00288e] text-white flex items-center justify-center">
                  <ShoppingBag className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">Rincian Pesanan {selectedOrder.id}</h3>
                  <p className="text-[11px] text-slate-500">
                    Status saat ini: <span className="font-bold text-[#00288e]">{selectedOrder.status}</span>
                  </p>
                </div>
              </div>

              <select
                value={selectedOrder.status}
                onChange={(e: any) => handleStatusChangeWithNotification(selectedOrder, e.target.value)}
                className="bg-[#f7f9fb] border border-[#c4c5d5] rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-800 focus:outline-none focus:border-[#00288e]"
              >
                <option value="Baru">Baru</option>
                <option value="Diproses">Diproses</option>
                <option value="Siap Diambil">Siap Diambil</option>
                <option value="Selesai">Selesai</option>
                <option value="Dibatalkan">Dibatalkan</option>
              </select>
            </div>

            <div className="space-y-4 text-xs">
              {/* WhatsApp Notification Link Banner */}
              <div className="bg-[#25D366]/10 border border-[#25D366]/30 p-3 rounded-2xl flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-[#006e2f] shrink-0" />
                  <span className="text-[11px] font-bold text-[#006e2f]">Kirim Update Status ke WA Pembeli:</span>
                </div>
                <a
                  href={generateWhatsAppStatusUpdateUrl(selectedOrder.whatsapp, selectedOrder.customer_name, selectedOrder.id, selectedOrder.status)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-[#25D366] text-white px-3 py-1.5 rounded-xl font-bold text-[11px] flex items-center gap-1.5 hover:bg-[#1eb956] transition-all shadow-xs shrink-0"
                >
                  <Send className="w-3.5 h-3.5" /> Kirim WA
                </a>
              </div>
              <div className="bg-[#f7f9fb] p-3 rounded-xl border space-y-1">
                <p><strong>Nama:</strong> {selectedOrder.customer_name}</p>
                <p><strong>WhatsApp:</strong> {selectedOrder.whatsapp}</p>
                <p><strong>Metode:</strong> {selectedOrder.pickup_method}</p>
                <p><strong>Catatan:</strong> {selectedOrder.notes || 'Tidak ada catatan'}</p>
              </div>

              {/* Uploaded Documents List in Modal */}
              {selectedOrder.documents && selectedOrder.documents.length > 0 && (
                <div className="bg-blue-50/70 border border-blue-200 p-3 rounded-2xl space-y-2">
                  <h4 className="font-bold text-[#00288e] flex items-center gap-1.5 text-xs">
                    <FileText className="w-4 h-4" /> Dokumen Lampiran Pelanggan ({selectedOrder.documents.length})
                  </h4>
                  <div className="space-y-2">
                    {selectedOrder.documents.map((doc) => (
                      <div key={doc.id} className="bg-white p-2.5 rounded-xl border border-blue-100 flex items-center justify-between">
                        <div className="flex items-center gap-2 min-w-0 pr-2">
                          <File className="w-4 h-4 text-[#00288e] shrink-0" />
                          <div className="min-w-0">
                            <p className="font-bold text-slate-900 truncate text-xs">{doc.name}</p>
                            <p className="text-[10px] text-slate-500">{formatFileSize(doc.size)}</p>
                          </div>
                        </div>
                        <a
                          href={doc.data_url}
                          download={doc.name}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="bg-[#00288e] text-white px-3 py-1.5 rounded-xl font-bold flex items-center gap-1 text-[11px] hover:bg-opacity-90 transition-all shrink-0 shadow-xs"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Unduh File</span>
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <h4 className="font-bold text-slate-700 mb-2">Item Dipesan:</h4>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {selectedOrder.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center bg-white p-2 rounded border text-xs">
                      <span>{item.product_name} x {item.quantity}</span>
                      <span className="font-bold text-[#00288e]">{formatRupiah(item.subtotal)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-2 border-t flex justify-between items-center text-sm font-extrabold text-[#00288e]">
                <span>Total Tagihan:</span>
                <span>{formatRupiah(selectedOrder.total)}</span>
              </div>

              {/* Thermal Print Button */}
              {settings && (
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={async () => {
                      const tx: POSTransaction = {
                        id: selectedOrder.id,
                        orderNumber: selectedOrder.id,
                        createdAt: selectedOrder.created_at,
                        customerName: selectedOrder.customer_name,
                        customerPhone: selectedOrder.whatsapp,
                        cashierName: selectedOrder.cashier_name || 'Admin',
                        items: selectedOrder.items.map(it => ({
                          id: it.id,
                          productId: it.product_id,
                          name: it.product_name,
                          price: it.price,
                          quantity: it.quantity,
                          subtotal: it.subtotal
                        })),
                        subtotal: selectedOrder.subtotal,
                        discount: selectedOrder.discount || 0,
                        tax: 0,
                        total: selectedOrder.total,
                        paymentMethod: (selectedOrder.payment_method as any) || 'Tunai',
                        cashReceived: selectedOrder.cash_received || selectedOrder.total,
                        change: selectedOrder.cash_change || 0
                      };

                      if (bluetoothPrinter.getState().connected) {
                        const res = await bluetoothPrinter.printTransaction(tx, settings);
                        if (res.success) {
                          onShowToast?.('Struk pesanan berhasil dicetak ke printer Bluetooth!', 'success');
                        } else {
                          onShowToast?.(`Gagal mencetak: ${res.error}`, 'error');
                        }
                      } else {
                        onShowToast?.('Membuka dialog cetak thermal browser...');
                        bluetoothPrinter.printThermalViaBrowser(tx, settings);
                      }
                    }}
                    className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
                  >
                    <Printer className="w-4 h-4" />
                    <span>Cetak Struk Thermal (Bluetooth / Kasir)</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
