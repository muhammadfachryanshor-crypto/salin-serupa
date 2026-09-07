import React, { useState } from 'react';
import { ShoppingBag, Search, Menu, X, Download } from 'lucide-react';
import { StoreSettings } from '../types';
import { generateWhatsAppInquiryUrl } from '../utils';

interface NavbarProps {
  settings: StoreSettings;
  cartCount: number;
  onOpenCart: () => void;
  onSearch: (query: string) => void;
  searchQuery: string;
  onNavigateAdmin: () => void;
  pwaInstallPrompt?: any;
  onInstallPWA?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  settings,
  cartCount,
  onOpenCart,
  onSearch,
  searchQuery,
  onNavigateAdmin,
  pwaInstallPrompt,
  onInstallPWA
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeNav, setActiveNav] = useState('Beranda');
  const [logoError, setLogoError] = useState(false);

  const navItems = [
    { label: 'Beranda', href: '#' },
    { label: 'Layanan', href: '#layanan' },
    { label: 'Katalog', href: '#katalog' },
    { label: 'Lacak Pesanan', href: '#tracking' },
    { label: 'Promo', href: '#promo' },
    { label: 'Tentang Kami', href: '#tentang' },
    { label: 'Kontak', href: '#kontak' }
  ];

  const handleNavClick = (label: string, href: string) => {
    setActiveNav(label);
    setMobileMenuOpen(false);
    if (href.startsWith('#')) {
      const target = document.querySelector(href);
      if (target) {
        target.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  const waUrl = generateWhatsAppInquiryUrl(settings.whatsapp);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[#f7f9fb]/95 backdrop-blur-md border-b border-[#e0e3e5] shadow-xs">
      <div className="max-w-7xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between gap-4">
        {/* Logo */}
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();
            handleNavClick('Beranda', '#');
          }}
          className="flex items-center gap-2.5 text-[#00288e] font-bold text-xl tracking-tight group shrink-0"
        >
          {settings.logo && !logoError ? (
            <img
              src={settings.logo}
              alt={settings.store_name}
              onError={() => setLogoError(true)}
              referrerPolicy="no-referrer"
              className="h-10 sm:h-11 w-auto object-contain max-w-[180px] group-hover:scale-105 transition-transform drop-shadow-xs"
            />
          ) : (
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-[#00288e] text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
                <span className="material-symbols-outlined text-2xl">print</span>
              </div>
              <span className="font-extrabold text-slate-900 text-lg sm:text-xl">
                {settings.store_name ? settings.store_name.replace(' - Jakarta Utara', '') : 'Salin Serupa'}
              </span>
            </div>
          )}
        </a>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-6">
          {navItems.map((item) => (
            <a
              key={item.label}
              href={item.href}
              onClick={(e) => {
                e.preventDefault();
                handleNavClick(item.label, item.href);
              }}
              className={`text-sm font-semibold transition-colors py-1 ${
                activeNav === item.label
                  ? 'text-[#00288e] border-b-2 border-[#00288e]'
                  : 'text-[#444653] hover:text-[#00288e]'
              }`}
            >
              {item.label}
            </a>
          ))}
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Search Box */}
          <div className="hidden lg:flex relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari produk / ATK..."
              value={searchQuery}
              onChange={(e) => onSearch(e.target.value)}
              className="pl-9 pr-4 py-1.5 bg-[#f2f4f6] border border-[#c4c5d5] rounded-full text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-[#00288e] focus:ring-1 focus:ring-[#00288e] w-44 focus:w-56 transition-all"
            />
          </div>

          {/* Cart Icon Button */}
          <button
            onClick={onOpenCart}
            aria-label="Keranjang Belanja"
            className="relative p-2 rounded-full bg-white border border-[#e0e3e5] text-slate-700 hover:text-[#00288e] hover:border-[#00288e] transition-all shadow-xs"
          >
            <ShoppingBag className="w-5 h-5" />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-[#00288e] text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center animate-pulse">
                {cartCount}
              </span>
            )}
          </button>

          {/* PWA Install Button (if prompt available) */}
          {pwaInstallPrompt && onInstallPWA && (
            <button
              onClick={onInstallPWA}
              title="Install Aplikasi"
              className="hidden sm:flex items-center gap-1.5 bg-[#dde1ff] text-[#001453] px-3 py-1.5 rounded-full text-xs font-semibold hover:bg-[#b8c4ff] transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Install App</span>
            </button>
          )}

          {/* WhatsApp CTA */}
          <a
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-[#006e2f] text-white px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-full text-xs sm:text-sm font-semibold flex items-center gap-1.5 hover:bg-opacity-90 transition-all shadow-xs hover:shadow-md"
          >
            <span className="material-symbols-outlined text-[18px]">chat</span>
            <span className="hidden sm:inline">WhatsApp Kami</span>
          </a>

          {/* Mobile Hamburger Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle Navigation"
            className="md:hidden p-2 text-slate-800 hover:text-[#00288e]"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-[#e0e3e5] px-4 pt-3 pb-6 space-y-3 animate-in fade-in slide-in-from-top-2">
          {/* Mobile Search */}
          <div className="relative mb-3">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari layanan atau produk ATK..."
              value={searchQuery}
              onChange={(e) => onSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-[#f2f4f6] border border-[#c4c5d5] rounded-xl text-sm font-medium focus:outline-none focus:border-[#00288e]"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            {navItems.map((item) => (
              <a
                key={item.label}
                href={item.href}
                onClick={(e) => {
                  e.preventDefault();
                  handleNavClick(item.label, item.href);
                }}
                className={`block px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
                  activeNav === item.label
                    ? 'bg-[#00288e] text-white'
                    : 'bg-[#f7f9fb] text-slate-700 hover:bg-[#e0e3e5]'
                }`}
              >
                {item.label}
              </a>
            ))}
          </div>

          {pwaInstallPrompt && onInstallPWA && (
            <button
              onClick={() => {
                onInstallPWA();
                setMobileMenuOpen(false);
              }}
              className="w-full mt-2 flex items-center justify-center gap-2 bg-[#dde1ff] text-[#001453] py-2 rounded-xl text-sm font-bold"
            >
              <Download className="w-4 h-4" />
              <span>Install Aplikasi PWA Salin Serupa</span>
            </button>
          )}
        </div>
      )}
    </nav>
  );
};
