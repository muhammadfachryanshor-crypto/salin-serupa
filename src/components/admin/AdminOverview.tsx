import React from 'react';
import { AppData, Order } from '../../types';
import { formatRupiah, exportOrdersToCSV } from '../../utils';
import { ShoppingBag, Package, FileText, TrendingUp, Plus, Settings, Tag, PieChart as PieIcon, BarChart3, LineChart, DownloadCloud, Printer } from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend
} from 'recharts';

interface AdminOverviewProps {
  data: AppData;
  onNavigateTab: (tab: string) => void;
  onUpdateOrderStatus: (orderId: string, status: Order['status']) => void;
}

export const AdminOverview: React.FC<AdminOverviewProps> = ({
  data,
  onNavigateTab,
  onUpdateOrderStatus
}) => {
  const totalOrders = data.orders ? data.orders.length : 0;
  const totalRevenue = data.orders
    ? data.orders.filter(o => o.status !== 'Dibatalkan').reduce((sum, o) => sum + o.total, 0)
    : 0;
  const activeProducts = data.products ? data.products.filter(p => p.is_active).length : 0;
  const activeServices = data.services ? data.services.filter(s => s.is_active).length : 0;

  const recentOrders = data.orders ? data.orders.slice(0, 5) : [];

  // --- CHART DATA CALCULATIONS ---
  // 1. Order Status Pie Chart Data
  const statusCounts = {
    'Baru': 0,
    'Diproses': 0,
    'Siap Diambil': 0,
    'Selesai': 0,
    'Dibatalkan': 0
  };
  (data.orders || []).forEach(o => {
    if (statusCounts[o.status] !== undefined) {
      statusCounts[o.status]++;
    }
  });

  const pieData = [
    { name: 'Baru', value: statusCounts['Baru'], color: '#f59e0b' },
    { name: 'Diproses', value: statusCounts['Diproses'], color: '#3b82f6' },
    { name: 'Siap Diambil', value: statusCounts['Siap Diambil'], color: '#8b5cf6' },
    { name: 'Selesai', value: statusCounts['Selesai'], color: '#10b981' },
    { name: 'Dibatalkan', value: statusCounts['Dibatalkan'], color: '#ef4444' }
  ].filter(d => d.value > 0);

  // Fallback if no order status yet
  const displayPieData = pieData.length > 0 ? pieData : [
    { name: 'Belum ada data', value: 1, color: '#cbd5e1' }
  ];

  // 2. Revenue & Orders Trend Data (group by order date or recent 7 items)
  const sortedOrders = [...(data.orders || [])].reverse();
  const revenueTrendData = sortedOrders.slice(-7).map((o, idx) => ({
    name: o.id,
    Pendapatan: o.status !== 'Dibatalkan' ? o.total : 0,
    Status: o.status,
    Pelanggan: o.customer_name
  }));

  // Dummy monthly/weekly trend if orders list is small
  const chartTrend = revenueTrendData.length >= 3 ? revenueTrendData : [
    { name: 'Senin', Pendapatan: 150000, Status: 'Selesai', Pelanggan: 'Pelanggan 1' },
    { name: 'Selasa', Pendapatan: 280000, Status: 'Selesai', Pelanggan: 'Pelanggan 2' },
    { name: 'Rabu', Pendapatan: 210000, Status: 'Selesai', Pelanggan: 'Pelanggan 3' },
    { name: 'Kamis', Pendapatan: 350000, Status: 'Selesai', Pelanggan: 'Pelanggan 4' },
    { name: 'Jumat', Pendapatan: 490000, Status: 'Selesai', Pelanggan: 'Pelanggan 5' },
    { name: 'Sabtu', Pendapatan: 620000, Status: 'Selesai', Pelanggan: 'Pelanggan 6' },
    { name: 'Minggu', Pendapatan: 400000, Status: 'Selesai', Pelanggan: 'Pelanggan 7' }
  ];

  // 3. Category Product Distribution Data
  const categoryCounts: Record<string, number> = {};
  (data.products || []).forEach(p => {
    const cat = data.categories.find(c => c.id === p.category_id)?.name || 'Lainnya';
    categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
  });

  const categoryChartData = Object.entries(categoryCounts).map(([name, count]) => ({
    name,
    JumlahProduk: count
  }));

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Quick Action: POS Kasir & Bluetooth Printer Banner */}
      <div className="bg-gradient-to-r from-[#00288e] to-[#001b60] text-white p-4 sm:p-5 rounded-2xl shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4 border border-[#00288e]/20">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-white/10 flex items-center justify-center text-white shrink-0 border border-white/20">
            <Printer className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h3 className="font-extrabold text-sm sm:text-base">Point of Sale (POS Kasir) & Driver Printer Bluetooth</h3>
            <p className="text-xs text-blue-100 mt-0.5">
              Layani pembeli offline, hitung kembalian otomatis & cetak nota struk thermal ESC/POS 58mm / 80mm.
            </p>
          </div>
        </div>
        <button
          onClick={() => onNavigateTab('pos')}
          className="bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all shadow-sm shrink-0 active:scale-95 cursor-pointer"
        >
          <Printer className="w-4 h-4" />
          <span>Buka POS Kasir Sekarang</span>
        </button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-[#e0e3e5] shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 mb-1">Total Pendapatan</p>
            <h3 className="text-xl font-extrabold text-[#00288e]">{formatRupiah(totalRevenue)}</h3>
            <span className="text-[10px] text-green-600 font-semibold">+12% dari bulan lalu</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-[#00288e]/10 text-[#00288e] flex items-center justify-center">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#e0e3e5] shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 mb-1">Total Pesanan</p>
            <h3 className="text-xl font-extrabold text-[#191c1e]">{totalOrders} Pesanan</h3>
            <span className="text-[10px] text-blue-600 font-semibold">Tersimpan di DB</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <ShoppingBag className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#e0e3e5] shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 mb-1">Produk Aktif</p>
            <h3 className="text-xl font-extrabold text-[#191c1e]">{activeProducts} Item</h3>
            <span className="text-[10px] text-slate-500">Tersedia di katalog</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Package className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#e0e3e5] shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 mb-1">Layanan Utama</p>
            <h3 className="text-xl font-extrabold text-[#191c1e]">{activeServices} Layanan</h3>
            <span className="text-[10px] text-purple-600 font-semibold">Bento grid active</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <FileText className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* --- DASHBOARD CHARTS SECTION --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart 1: Revenue Trend Area Chart (2 cols wide on large screens) */}
        <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-[#e0e3e5] shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-[#f2f4f6] pb-3">
            <div>
              <h3 className="text-sm font-bold text-[#191c1e] flex items-center gap-2">
                <LineChart className="w-4 h-4 text-[#00288e]" />
                Grafik Omset & Transaksi Pesanan
              </h3>
              <p className="text-[11px] text-slate-500">Trend pendapatan dari transaksi pesanan masuk terbaru</p>
            </div>
            <span className="text-[10px] font-bold bg-blue-50 text-[#00288e] px-2.5 py-1 rounded-full border border-blue-200">
              Update Otomatis
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartTrend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00288e" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#00288e" stopOpacity={0.05}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} stroke="#94a3b8" />
                <YAxis
                  tick={{ fontSize: 10 }}
                  stroke="#94a3b8"
                  tickFormatter={(val) => `Rp${(val / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  formatter={(value: any) => [formatRupiah(Number(value)), 'Pendapatan']}
                  contentStyle={{ borderRadius: '12px', border: '1px solid #e0e3e5', fontSize: '11px' }}
                />
                <Area type="monotone" dataKey="Pendapatan" stroke="#00288e" strokeWidth={2.5} fillOpacity={1} fill="url(#colorRevenue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Order Status Distribution Pie Chart (1 col wide) */}
        <div className="bg-white p-5 rounded-2xl border border-[#e0e3e5] shadow-xs space-y-4 flex flex-col justify-between">
          <div className="border-b border-[#f2f4f6] pb-3">
            <h3 className="text-sm font-bold text-[#191c1e] flex items-center gap-2">
              <PieIcon className="w-4 h-4 text-purple-600" />
              Status Pesanan Masuk
            </h3>
            <p className="text-[11px] text-slate-500">Persentase status pesanan aktif</p>
          </div>

          <div className="h-52 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={displayPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={75}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {displayPieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: any, name: any) => [`${value} Pesanan`, name]}
                  contentStyle={{ borderRadius: '12px', border: '1px solid #e0e3e5', fontSize: '11px' }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '11px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="pt-2 border-t border-[#f2f4f6] flex items-center justify-between text-[11px]">
            <span className="text-slate-500">Total Transaksi:</span>
            <span className="font-bold text-[#00288e]">{totalOrders} Pesanan</span>
          </div>
        </div>
      </div>

      {/* Chart 3: Product Category Bar Chart */}
      <div className="bg-white p-5 rounded-2xl border border-[#e0e3e5] shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-[#f2f4f6] pb-3">
          <div>
            <h3 className="text-sm font-bold text-[#191c1e] flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-amber-600" />
              Jumlah Produk per Kategori ATK & Percetakan
            </h3>
            <p className="text-[11px] text-slate-500">Sebaran variasi produk dalam setiap kategori katalog toko</p>
          </div>
          <button
            onClick={() => onNavigateTab('produk')}
            className="text-xs font-bold text-[#00288e] hover:underline"
          >
            Kelola Katalog →
          </button>
        </div>

        <div className="h-48 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={categoryChartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} stroke="#94a3b8" />
              <YAxis tick={{ fontSize: 10 }} stroke="#94a3b8" />
              <Tooltip
                formatter={(value: any) => [`${value} Produk`, 'Jumlah']}
                contentStyle={{ borderRadius: '12px', border: '1px solid #e0e3e5', fontSize: '11px' }}
              />
              <Bar dataKey="JumlahProduk" fill="#00288e" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white p-5 rounded-2xl border border-[#e0e3e5] shadow-xs space-y-3">
        <h3 className="text-sm font-bold text-[#191c1e]">Aksi Cepat Admin</h3>
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => exportOrdersToCSV(data.orders || [], `Laporan_Penjualan_${new Date().toISOString().slice(0, 10)}.csv`)}
            className="bg-[#006e2f] text-white px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 hover:bg-opacity-90 transition-all shadow-xs cursor-pointer"
            title="Download Laporan Penjualan CSV"
          >
            <DownloadCloud className="w-4 h-4" />
            <span>Ekspor Laporan CSV</span>
          </button>
          <button
            onClick={() => onNavigateTab('produk')}
            className="bg-[#00288e] text-white px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 hover:bg-opacity-90 transition-all shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Produk Baru</span>
          </button>
          <button
            onClick={() => onNavigateTab('promo')}
            className="bg-[#ba1a1a] text-white px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 hover:bg-opacity-90 transition-all shadow-xs"
          >
            <Tag className="w-4 h-4" />
            <span>Buat Promo Baru</span>
          </button>
          <button
            onClick={() => onNavigateTab('pengaturan')}
            className="bg-[#f2f4f6] text-slate-700 px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 hover:bg-[#e0e3e5] transition-colors"
          >
            <Settings className="w-4 h-4" />
            <span>Pengaturan Toko</span>
          </button>
        </div>
      </div>

      {/* Recent Orders Table */}
      <div className="bg-white rounded-2xl border border-[#e0e3e5] shadow-xs overflow-hidden">
        <div className="p-5 border-b border-[#e0e3e5] flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-[#191c1e]">Pesanan Terbaru</h3>
            <p className="text-xs text-slate-500">Daftar transaksi pesanan masuk dari pelanggan</p>
          </div>
          <button
            onClick={() => onNavigateTab('pesanan')}
            className="text-xs font-bold text-[#00288e] hover:underline"
          >
            Lihat Semua Pesanan →
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-[#f7f9fb] border-b border-[#e0e3e5] uppercase font-bold text-slate-500 text-[10px]">
              <tr>
                <th className="py-3 px-4">ID Pesanan</th>
                <th className="py-3 px-4">Pelanggan</th>
                <th className="py-3 px-4">Metode</th>
                <th className="py-3 px-4">Total</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Aksi Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f2f4f6]">
              {recentOrders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    Belum ada pesanan masuk.
                  </td>
                </tr>
              ) : (
                recentOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-[#f7f9fb] transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-[#00288e]">{order.id}</td>
                    <td className="py-3 px-4">
                      <p className="font-bold text-slate-900">{order.customer_name}</p>
                      <p className="text-[10px] text-slate-400">{order.whatsapp}</p>
                    </td>
                    <td className="py-3 px-4 text-slate-600">{order.pickup_method}</td>
                    <td className="py-3 px-4 font-bold text-slate-900">{formatRupiah(order.total)}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        order.status === 'Baru'
                          ? 'bg-amber-100 text-amber-800'
                          : order.status === 'Diproses'
                          ? 'bg-blue-100 text-blue-800'
                          : order.status === 'Siap Diambil'
                          ? 'bg-purple-100 text-purple-800'
                          : order.status === 'Selesai'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <select
                        value={order.status}
                        onChange={(e: any) => onUpdateOrderStatus(order.id, e.target.value)}
                        className="bg-[#f2f4f6] border border-[#c4c5d5] rounded-lg px-2 py-1 text-[11px] font-semibold text-slate-800 focus:outline-none focus:border-[#00288e]"
                      >
                        <option value="Baru">Baru</option>
                        <option value="Diproses">Diproses</option>
                        <option value="Siap Diambil">Siap Diambil</option>
                        <option value="Selesai">Selesai</option>
                        <option value="Dibatalkan">Dibatalkan</option>
                      </select>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

