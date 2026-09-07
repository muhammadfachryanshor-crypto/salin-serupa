import React, { useState, useEffect } from 'react';
import { AppData, CartItem, Product, Service, StoreSettings } from './types';
import { initialAppData } from './data/initialData';
import { getSupabaseClient, getSupabaseHeaders } from './lib/supabase';
import { fetchAppDataFromSupabase, createOrderInSupabase } from './lib/supabaseData';

// Customer Components
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { Keunggulan } from './components/Keunggulan';
import { Layanan } from './components/Layanan';
import { KatalogProduk } from './components/KatalogProduk';
import { TrackingOrder } from './components/TrackingOrder';
import { ProductDetailModal } from './components/ProductDetailModal';
import { CartDrawer } from './components/CartDrawer';
import { CheckoutFormModal } from './components/CheckoutFormModal';
import { PromoSection } from './components/PromoSection';
import { TentangToko } from './components/TentangToko';
import { LokasiJamOperasional } from './components/LokasiJamOperasional';
import { Testimoni } from './components/Testimoni';
import { FAQSection } from './components/FAQSection';
import { Footer } from './components/Footer';
import { FloatingWhatsApp } from './components/FloatingWhatsApp';
import { PWAInstallBanner } from './components/PWAInstallBanner';
import { ToastNotification, ToastMessage } from './components/ToastNotification';

// Admin Components
import { AdminLogin } from './components/admin/AdminLogin';
import { AdminDashboard } from './components/admin/AdminDashboard';

export function App() {
  const [appData, setAppData] = useState<AppData>(() => {
    try {
      const saved = localStorage.getItem('salin_serupa_app_data');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.settings && parsed.products) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Could not load cached app data:', e);
    }
    return initialAppData;
  });

  useEffect(() => {
    try {
      localStorage.setItem('salin_serupa_app_data', JSON.stringify(appData));
    } catch (e) {
      // ignore storage quota errors if base64 images are large
    }
  }, [appData]);

  const [view, setView] = useState<'customer' | 'admin-login' | 'admin-dashboard'>('customer');
  const [adminToken, setAdminToken] = useState<string | null>(null);
  const [adminUser, setAdminUser] = useState<any>(null);

  // Cart & Modals State
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('cart_salinserupa');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Toast System
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // PWA Prompt
  const [pwaPrompt, setPwaPrompt] = useState<any>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  const handleDismissToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // Fetch initial data from Supabase or server
  const loadInitialData = async () => {
    try {
      const client = getSupabaseClient();
      if (client) {
        const { data, fromSupabase } = await fetchAppDataFromSupabase(client);
        if (fromSupabase) {
          setAppData(data);
          // Also ping server API to keep server inMemoryData in sync with Supabase
          fetch('/api/initial-data', { headers: getSupabaseHeaders() }).catch(() => {});
          return;
        }
      }

      const res = await fetch('/api/initial-data', {
        headers: getSupabaseHeaders()
      });
      if (res.ok) {
        const data = await res.json();
        setAppData(data);
      }
    } catch (err) {
      console.log('Using fallback app data');
    }
  };

  useEffect(() => {
    loadInitialData();

    // Check stored admin session
    const token = localStorage.getItem('salinserupa_admin_token');
    if (token) {
      setAdminToken(token);
      setAdminUser({ name: 'Admin Salin Serupa', role: 'admin' });
    }

    // Secret Admin Route Listener (/admin/login, /admin, #admin, #admin/login)
    const handleRouteCheck = () => {
      const path = window.location.pathname.toLowerCase();
      const hash = window.location.hash.toLowerCase();
      if (path === '/admin/login' || path === '/admin' || hash === '#admin' || hash === '#admin/login' || hash === '#/admin/login') {
        const storedToken = localStorage.getItem('salinserupa_admin_token');
        setView(storedToken ? 'admin-dashboard' : 'admin-login');
      }
    };

    handleRouteCheck();
    window.addEventListener('popstate', handleRouteCheck);
    window.addEventListener('hashchange', handleRouteCheck);

    // PWA Install Prompt Listener
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setPwaPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => {
      window.removeEventListener('popstate', handleRouteCheck);
      window.removeEventListener('hashchange', handleRouteCheck);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  // Save cart to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('cart_salinserupa', JSON.stringify(cart));
    } catch (e) {
      // ignore
    }
  }, [cart]);

  // Cart Actions
  const handleAddToCart = (product: Product, quantity: number = 1) => {
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        return prev.map(item =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prev, { product, quantity }];
    });
    showToast(`"${product.name}" ditambahkan ke keranjang!`);
  };

  const handleUpdateCartQuantity = (productId: string, quantity: number) => {
    setCart(prev => prev.map(item => item.product.id === productId ? { ...item, quantity } : item));
  };

  const handleRemoveCartItem = (productId: string) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
    showToast('Item telah dihapus dari keranjang', 'info');
  };

  const handleClearCart = () => {
    setCart([]);
  };

  const handleSubmitOrder = async (orderPayload: any) => {
    const client = getSupabaseClient();
    if (client) {
      try {
        const orderId = await createOrderInSupabase(client, orderPayload);
        const newOrder = {
          id: orderId,
          ...orderPayload,
          status: 'Baru',
          created_at: new Date().toISOString()
        };
        handleClearCart();
        showToast('Pesanan berhasil dibuat!');
        loadInitialData();
        return newOrder;
      } catch (e: any) {
        console.warn('Direct order save failed, falling back to API:', e);
      }
    }

    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: getSupabaseHeaders(),
      body: JSON.stringify(orderPayload)
    });
    const data = await res.json();
    if (res.ok && data.success) {
      handleClearCart();
      showToast('Pesanan berhasil dibuat!');
      loadInitialData();
      return data.order;
    }
    throw new Error('Gagal memproses pesanan');
  };

  // PWA Install Action
  const handleInstallPWA = () => {
    if (pwaPrompt) {
      pwaPrompt.prompt();
      pwaPrompt.userChoice.then((choice: any) => {
        if (choice.outcome === 'accepted') {
          showToast('Terima kasih telah menginstall aplikasi PWA Salin Serupa!');
        }
        setPwaPrompt(null);
      });
    }
  };

  // Admin Auth Handlers
  const handleAdminLoginSuccess = (token: string, user: any) => {
    setAdminToken(token);
    setAdminUser(user);
    localStorage.setItem('salinserupa_admin_token', token);
    setView('admin-dashboard');
    showToast('Berhasil login sebagai Admin');
  };

  const handleAdminLogout = () => {
    if (adminToken) {
      fetch('/api/admin/logout', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${adminToken}` }
      }).catch(() => {});
    }
    setAdminToken(null);
    setAdminUser(null);
    localStorage.removeItem('salinserupa_admin_token');
    setView('customer');
    showToast('Anda telah keluar dari sesi admin', 'info');
  };

  const handleBackToWebsite = () => {
    if (window.location.hash.startsWith('#admin')) {
      window.history.pushState("", document.title, window.location.pathname + window.location.search);
    } else if (window.location.pathname === '/admin/login' || window.location.pathname === '/admin') {
      window.history.pushState("", document.title, '/');
    }
    setView('customer');
  };

  // Render Admin Login
  if (view === 'admin-login') {
    return (
      <AdminLogin
        onLoginSuccess={handleAdminLoginSuccess}
        onBackToWebsite={handleBackToWebsite}
      />
    );
  }

  // Render Admin Dashboard
  if (view === 'admin-dashboard') {
    if (!adminToken) {
      setView('admin-login');
      return null;
    }
    return (
      <AdminDashboard
        data={appData}
        token={adminToken}
        adminUser={adminUser}
        onLogout={handleAdminLogout}
        onBackToWebsite={handleBackToWebsite}
        onRefreshData={loadInitialData}
        onShowToast={showToast}
      />
    );
  }

  // Render Customer Website (PWA Landing Page)
  const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <div className="min-h-screen bg-[#f7f9fb] text-[#191c1e] font-sans selection:bg-[#00288e] selection:text-white">
      {/* Toast System */}
      <ToastNotification toasts={toasts} onDismiss={handleDismissToast} />

      {/* Navbar */}
      <Navbar
        settings={appData.settings}
        cartCount={cartCount}
        onOpenCart={() => setCartOpen(true)}
        searchQuery={searchQuery}
        onSearch={setSearchQuery}
        onNavigateAdmin={() => setView(adminToken ? 'admin-dashboard' : 'admin-login')}
        pwaInstallPrompt={pwaPrompt}
        onInstallPWA={handleInstallPWA}
      />

      {/* Main Content Sections */}
      <main>
        {/* Hero Section */}
        <Hero
          content={appData.landing.hero}
          settings={appData.settings}
          onPesanSekarang={() => {
            const target = document.querySelector('#layanan');
            if (target) target.scrollIntoView({ behavior: 'smooth' });
          }}
          onLihatKatalog={() => {
            const target = document.querySelector('#katalog');
            if (target) target.scrollIntoView({ behavior: 'smooth' });
          }}
        />

        {/* Keunggulan Toko */}
        <Keunggulan items={appData.landing.keunggulan} />

        {/* Layanan Unggulan Bento Grid */}
        <Layanan
          services={appData.services}
          settings={appData.settings}
        />

        {/* Katalog Produk & ATK */}
        <KatalogProduk
          products={appData.products}
          categories={appData.categories}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onAddToCart={handleAddToCart}
          onOpenDetail={(p) => setSelectedProduct(p)}
        />

        {/* Lacak Pesanan Realtime */}
        <TrackingOrder
          orders={appData.orders}
          settings={appData.settings}
        />

        {/* Promo Section */}
        <PromoSection
          promotions={appData.promotions}
          settings={appData.settings}
        />

        {/* Tentang Toko */}
        <TentangToko
          content={appData.landing.tentang}
          settings={appData.settings}
        />

        {/* Lokasi & Jam Operasional */}
        <LokasiJamOperasional settings={appData.settings} />

        {/* Testimoni Pelanggan */}
        <Testimoni testimonials={appData.testimonials} />

        {/* FAQ Section */}
        <FAQSection faqs={appData.faqs} />
      </main>

      {/* Footer */}
      <Footer
        settings={appData.settings}
        onNavigateAdmin={() => setView(adminToken ? 'admin-dashboard' : 'admin-login')}
      />

      {/* Floating WhatsApp Button */}
      <FloatingWhatsApp settings={appData.settings} />

      {/* PWA Install Banner */}
      {pwaPrompt && <PWAInstallBanner onInstall={handleInstallPWA} />}

      {/* Modals & Drawers */}
      <ProductDetailModal
        product={selectedProduct}
        categories={appData.categories}
        settings={appData.settings}
        onClose={() => setSelectedProduct(null)}
        onAddToCart={handleAddToCart}
      />

      <CartDrawer
        isOpen={cartOpen}
        onClose={() => setCartOpen(false)}
        items={cart}
        onUpdateQuantity={handleUpdateCartQuantity}
        onRemoveItem={handleRemoveCartItem}
        onClearCart={handleClearCart}
        onProceedCheckout={() => {
          setCartOpen(false);
          setCheckoutOpen(true);
        }}
      />

      <CheckoutFormModal
        isOpen={checkoutOpen}
        onClose={() => setCheckoutOpen(false)}
        items={cart}
        settings={appData.settings}
        onSubmitOrder={handleSubmitOrder}
      />
    </div>
  );
}

export default App;
