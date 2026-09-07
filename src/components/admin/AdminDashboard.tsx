import React, { useState } from 'react';
import { AppData, Order } from '../../types';
import { getSupabaseClient, getSupabaseHeaders } from '../../lib/supabase';
import { updateOrderStatusInSupabase } from '../../lib/supabaseData';
import { AdminOverview } from './AdminOverview';
import { AdminProducts } from './AdminProducts';
import { AdminServices } from './AdminServices';
import { AdminPromotions } from './AdminPromotions';
import { AdminOrders } from './AdminOrders';
import { AdminCMS } from './AdminCMS';
import { AdminSettings } from './AdminSettings';
import { AdminPOS } from './AdminPOS';
import {
  LayoutDashboard,
  Package,
  FileText,
  ShoppingBag,
  Tag,
  Globe,
  Settings,
  LogOut,
  Menu,
  X,
  ArrowLeft,
  UserCheck,
  Printer
} from 'lucide-react';

interface AdminDashboardProps {
  data: AppData;
  token: string;
  adminUser: any;
  onLogout: () => void;
  onBackToWebsite: () => void;
  onRefreshData: () => void;
  onShowToast: (msg: string, type?: 'success' | 'error') => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  data,
  token,
  adminUser,
  onLogout,
  onBackToWebsite,
  onRefreshData,
  onShowToast
}) => {
  const [activeTab, setActiveTab] = useState('ringkasan');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [logoError, setLogoError] = useState(false);

  const sidebarNav = [
    { id: 'pos', label: 'POS Kasir (Printer BT)', icon: Printer },
    { id: 'ringkasan', label: 'Ringkasan', icon: LayoutDashboard },
    { id: 'produk', label: 'Katalog Produk', icon: Package },
    { id: 'layanan', label: 'Layanan Bento', icon: FileText },
    { id: 'pesanan', label: 'Pesanan Masuk', icon: ShoppingBag, badge: data.orders?.filter(o => o.status === 'Baru').length || 0 },
    { id: 'promo', label: 'Promo & Diskon', icon: Tag },
    { id: 'cms', label: 'CMS Landing Page', icon: Globe },
    { id: 'pengaturan', label: 'Pengaturan Toko', icon: Settings }
  ];

  const handleUpdateOrderStatus = async (orderId: string, status: Order['status']) => {
    // 1. Optimistic update in memory
    const targetOrder = data.orders?.find(o => o.id === orderId);
    if (targetOrder) {
      targetOrder.status = status;
    }

    try {
      const client = getSupabaseClient();
      if (client) {
        try {
          await updateOrderStatusInSupabase(client, orderId, status);
        } catch (supaErr: any) {
          console.warn('Direct Supabase order status update failed, falling back to API:', supaErr);
        }
      }

      let res = await fetch(`/api/admin/orders/${encodeURIComponent(orderId)}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          ...getSupabaseHeaders()
        },
        body: JSON.stringify({ status })
      });

      if (!res.ok) {
        // Fallback endpoint
        res = await fetch(`/api/orders/${encodeURIComponent(orderId)}/status`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            ...getSupabaseHeaders()
          },
          body: JSON.stringify({ status })
        });
      }

      if (res.ok) {
        onShowToast(`Status pesanan ${orderId} diubah menjadi "${status}"`);
      } else {
        onShowToast('Gagal memperbarui status pesanan di server', 'error');
      }
      onRefreshData();
    } catch (err) {
      onShowToast('Gagal mengupdate status pesanan', 'error');
      onRefreshData();
    }
  };

  return (
    <div className="min-h-screen bg-[#f7f9fb] flex flex-col md:flex-row font-sans text-slate-800">
      {/* Mobile Header Bar */}
      <div className="md:hidden bg-white border-b border-[#e0e3e5] p-4 flex items-center justify-between sticky top-0 z-40 shadow-xs">
        <div className="flex items-center gap-2">
          {data.settings?.logo && !logoError ? (
            <img
              src={data.settings.logo}
              alt="Logo"
              onError={() => setLogoError(true)}
              referrerPolicy="no-referrer"
              className="h-7 w-auto object-contain max-w-[120px]"
            />
          ) : (
            <div className="flex items-center gap-1.5">
              <div className="w-7 h-7 rounded-lg bg-[#00288e] text-white flex items-center justify-center font-bold">
                <span className="material-symbols-outlined text-base">print</span>
              </div>
              <span className="font-bold text-sm text-slate-900">Admin Salin Serupa</span>
            </div>
          )}
        </div>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 text-slate-700 hover:text-[#00288e]"
        >
          {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Sidebar Navigation */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-[#e0e3e5] flex flex-col justify-between transition-transform duration-300 transform md:translate-x-0 md:static ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div>
          {/* Sidebar Header */}
          <div className="p-6 border-b border-[#f2f4f6]">
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                onBackToWebsite();
              }}
              className="flex items-center gap-2 text-[#00288e] font-extrabold text-lg"
            >
              {data.settings?.logo && !logoError ? (
                <img
                  src={data.settings.logo}
                  alt="Logo"
                  onError={() => setLogoError(true)}
                  referrerPolicy="no-referrer"
                  className="h-9 w-auto object-contain max-w-[150px]"
                />
              ) : (
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-xl bg-[#00288e] text-white flex items-center justify-center shadow-xs">
                    <span className="material-symbols-outlined text-xl">print</span>
                  </div>
                  <span className="text-slate-900 text-base font-extrabold">Salin Serupa</span>
                </div>
              )}
            </a>
            <span className="inline-block mt-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Admin CMS Panel v1.0
            </span>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1">
            {sidebarNav.map((nav) => {
              const Icon = nav.icon;
              const isActive = activeTab === nav.id;
              return (
                <button
                  key={nav.id}
                  onClick={() => {
                    setActiveTab(nav.id);
                    setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-[#00288e] text-white shadow-xs'
                      : 'text-slate-600 hover:bg-[#f2f4f6] hover:text-[#00288e]'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="w-4 h-4" />
                    <span>{nav.label}</span>
                  </div>
                  {!!nav.badge && nav.badge > 0 && (
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      isActive ? 'bg-white text-[#00288e]' : 'bg-[#00288e] text-white'
                    }`}>
                      {nav.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-[#f2f4f6] space-y-2">
          <button
            onClick={onBackToWebsite}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl border border-[#c4c5d5] text-xs font-semibold text-slate-700 hover:bg-[#f2f4f6] transition-colors"
          >
            <ArrowLeft className="w-4 h-4 text-slate-500" />
            <span>Ke Website Utama</span>
          </button>

          <button
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-red-50 text-red-700 text-xs font-semibold hover:bg-red-100 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Keluar Sesi Admin</span>
          </button>
        </div>
      </aside>

      {/* Overlay Backdrop for Mobile */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
        />
      )}

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 flex flex-col">
        {/* Top Navbar */}
        <header className="hidden md:flex bg-white border-b border-[#e0e3e5] px-8 py-4 items-center justify-between sticky top-0 z-30">
          <div>
            <h1 className="text-lg font-extrabold text-[#191c1e] capitalize">
              {sidebarNav.find(n => n.id === activeTab)?.label || 'Dashboard Admin'}
            </h1>
            <p className="text-xs text-slate-400">{data.settings.store_name}</p>
          </div>

          <div className="flex items-center gap-3">
            {activeTab !== 'pos' && (
              <button
                onClick={() => setActiveTab('pos')}
                className="bg-[#00288e] hover:bg-[#001f70] text-white px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Buka Kasir POS</span>
              </button>
            )}

            <div className="flex items-center gap-2.5 bg-[#f2f4f6] px-3 py-1.5 rounded-full border border-[#e0e3e5]">
              <UserCheck className="w-4 h-4 text-[#006e2f]" />
              <span className="text-xs font-bold text-slate-700">{adminUser?.name || 'Admin'}</span>
            </div>
          </div>
        </header>

        {/* Dynamic Active Tab View */}
        <div className="p-4 sm:p-6 md:p-8 flex-1">
          {activeTab === 'pos' && (
            <AdminPOS
              data={data}
              token={token}
              adminUser={adminUser}
              onRefreshData={onRefreshData}
              onShowToast={onShowToast}
            />
          )}

          {activeTab === 'ringkasan' && (
            <AdminOverview
              data={data}
              onNavigateTab={(t) => setActiveTab(t)}
              onUpdateOrderStatus={handleUpdateOrderStatus}
            />
          )}

          {activeTab === 'produk' && (
            <AdminProducts
              products={data.products}
              categories={data.categories}
              token={token}
              onRefreshData={onRefreshData}
              onShowToast={onShowToast}
            />
          )}

          {activeTab === 'layanan' && (
            <AdminServices
              services={data.services}
              token={token}
              onRefreshData={onRefreshData}
              onShowToast={onShowToast}
            />
          )}

          {activeTab === 'pesanan' && (
            <AdminOrders
              orders={data.orders}
              settings={data.settings}
              onUpdateOrderStatus={handleUpdateOrderStatus}
              onShowToast={onShowToast}
            />
          )}

          {activeTab === 'promo' && (
            <AdminPromotions
              promotions={data.promotions}
              token={token}
              onRefreshData={onRefreshData}
              onShowToast={onShowToast}
            />
          )}

          {activeTab === 'cms' && (
            <AdminCMS
              landing={data.landing}
              token={token}
              onRefreshData={onRefreshData}
              onShowToast={onShowToast}
            />
          )}

          {activeTab === 'pengaturan' && (
            <AdminSettings
              settings={data.settings}
              token={token}
              onRefreshData={onRefreshData}
              onShowToast={onShowToast}
            />
          )}
        </div>
      </main>
    </div>
  );
};
