-- ====================================================================
-- SUPABASE DATABASE SCHEMA & INITIAL DATA SEED
-- App: Fotokopi Salin Serupa - Jakarta Utara
-- ====================================================================

-- 1. TABEL PENGATURAN TOKO (store_settings)
CREATE TABLE IF NOT EXISTS public.store_settings (
  id TEXT PRIMARY KEY DEFAULT 'store-1',
  store_name TEXT NOT NULL,
  whatsapp TEXT NOT NULL,
  address TEXT NOT NULL,
  latitude NUMERIC(10, 7),
  longitude NUMERIC(10, 7),
  maps_url TEXT,
  logo TEXT,
  favicon TEXT,
  meta_title TEXT,
  meta_description TEXT,
  business_hours_weekdays TEXT,
  business_hours_sunday TEXT,
  payment_methods JSONB,
  printer_paper_size TEXT DEFAULT '58mm',
  printer_auto_print BOOLEAN DEFAULT TRUE,
  printer_open_drawer BOOLEAN DEFAULT FALSE,
  printer_footer_note TEXT DEFAULT 'Barang yang sudah dibeli tidak dapat ditukar/dikembalikan.',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. TABEL KONTEN LANDING PAGE (landing_content)
CREATE TABLE IF NOT EXISTS public.landing_content (
  id TEXT PRIMARY KEY DEFAULT 'landing-1',
  hero_headline TEXT NOT NULL,
  hero_headline_accent TEXT,
  hero_subheadline TEXT,
  hero_cta_primary TEXT,
  hero_cta_secondary TEXT,
  hero_badge_text TEXT,
  hero_trust_text TEXT,
  hero_image TEXT,
  hero_is_active BOOLEAN DEFAULT TRUE,
  tentang_title TEXT,
  tentang_description TEXT,
  tentang_image TEXT,
  tentang_cta_text TEXT,
  tentang_is_active BOOLEAN DEFAULT TRUE,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. TABEL KEUNGGULAN (keunggulan)
CREATE TABLE IF NOT EXISTS public.keunggulan (
  id TEXT PRIMARY KEY,
  icon TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  sort_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. TABEL LAYANAN (services)
CREATE TABLE IF NOT EXISTS public.services (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL,
  image TEXT,
  badge TEXT,
  sort_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. TABEL KATEGORI PRODUK & ATK (categories)
CREATE TABLE IF NOT EXISTS public.categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  image TEXT,
  sort_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. TABEL PRODUK & ATK (products)
CREATE TABLE IF NOT EXISTS public.products (
  id TEXT PRIMARY KEY,
  sku TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  category_id TEXT REFERENCES public.categories(id) ON DELETE SET NULL,
  description TEXT,
  price NUMERIC(12, 2) NOT NULL DEFAULT 0,
  promo_price NUMERIC(12, 2),
  stock INT DEFAULT 0,
  unit TEXT NOT NULL DEFAULT 'Pcs',
  image TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. TABEL PROMOSI (promotions)
CREATE TABLE IF NOT EXISTS public.promotions (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  image TEXT,
  normal_price NUMERIC(12, 2) NOT NULL,
  promo_price NUMERIC(12, 2) NOT NULL,
  start_date DATE,
  end_date DATE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. TABEL TESTIMONI (testimonials)
CREATE TABLE IF NOT EXISTS public.testimonials (
  id TEXT PRIMARY KEY,
  customer_name TEXT NOT NULL,
  avatar TEXT,
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT NOT NULL,
  sort_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. TABEL FAQ (faqs)
CREATE TABLE IF NOT EXISTS public.faqs (
  id TEXT PRIMARY KEY,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  sort_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. TABEL PESANAN (orders)
CREATE TABLE IF NOT EXISTS public.orders (
  id TEXT PRIMARY KEY,
  customer_name TEXT NOT NULL,
  whatsapp TEXT NOT NULL,
  notes TEXT,
  pickup_method TEXT NOT NULL DEFAULT 'Ambil di toko',
  subtotal NUMERIC(12, 2) NOT NULL DEFAULT 0,
  total NUMERIC(12, 2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'Baru' CHECK (status IN ('Baru', 'Diproses', 'Siap Diambil', 'Selesai', 'Dibatalkan')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. TABEL ITEM PESANAN (order_items)
CREATE TABLE IF NOT EXISTS public.order_items (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id TEXT REFERENCES public.products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  price NUMERIC(12, 2) NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  subtotal NUMERIC(12, 2) NOT NULL
);

-- 12. TABEL DOKUMEN CETAK (order_documents)
CREATE TABLE IF NOT EXISTS public.order_documents (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  size INT NOT NULL,
  type TEXT,
  data_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- INDEXES FOR PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_active ON public.products(is_active);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON public.order_items(order_id);

-- ====================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ====================================================================

ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.landing_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.keunggulan ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promotions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_documents ENABLE ROW LEVEL SECURITY;

-- Allow Public Read Access for active catalog items
CREATE POLICY "Public Read Settings" ON public.store_settings FOR SELECT USING (true);
CREATE POLICY "Public Read Landing" ON public.landing_content FOR SELECT USING (true);
CREATE POLICY "Public Read Keunggulan" ON public.keunggulan FOR SELECT USING (true);
CREATE POLICY "Public Read Services" ON public.services FOR SELECT USING (true);
CREATE POLICY "Public Read Categories" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Public Read Products" ON public.products FOR SELECT USING (true);
CREATE POLICY "Public Read Promotions" ON public.promotions FOR SELECT USING (true);
CREATE POLICY "Public Read Testimonials" ON public.testimonials FOR SELECT USING (true);
CREATE POLICY "Public Read FAQs" ON public.faqs FOR SELECT USING (true);

-- Allow Public Create Orders & Items
CREATE POLICY "Public Insert Orders" ON public.orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Public Insert Order Items" ON public.order_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Public Insert Order Documents" ON public.order_documents FOR INSERT WITH CHECK (true);

-- Allow Full Access for Authenticated Users (Admins) / Service Role
CREATE POLICY "Admin Full Access Settings" ON public.store_settings FOR ALL USING (true);
CREATE POLICY "Admin Full Access Landing" ON public.landing_content FOR ALL USING (true);
CREATE POLICY "Admin Full Access Keunggulan" ON public.keunggulan FOR ALL USING (true);
CREATE POLICY "Admin Full Access Services" ON public.services FOR ALL USING (true);
CREATE POLICY "Admin Full Access Categories" ON public.categories FOR ALL USING (true);
CREATE POLICY "Admin Full Access Products" ON public.products FOR ALL USING (true);
CREATE POLICY "Admin Full Access Promotions" ON public.promotions FOR ALL USING (true);
CREATE POLICY "Admin Full Access Testimonials" ON public.testimonials FOR ALL USING (true);
CREATE POLICY "Admin Full Access FAQs" ON public.faqs FOR ALL USING (true);
CREATE POLICY "Admin Full Access Orders" ON public.orders FOR ALL USING (true);
CREATE POLICY "Admin Full Access Order Items" ON public.order_items FOR ALL USING (true);

-- ====================================================================
-- SEED INITIAL DATA
-- ====================================================================

INSERT INTO public.store_settings (
  id, store_name, whatsapp, address, latitude, longitude, maps_url, logo, favicon, meta_title, meta_description, business_hours_weekdays, business_hours_sunday
) VALUES (
  'store-1',
  'Fotokopi Salin Serupa - Jakarta Utara',
  '+62 812-9229-0876',
  'Jl. Empang Damai No.62, RT.10/RW.4, Kapuk Muara, Kecamatan Penjaringan, Jakarta Utara, Daerah Khusus Ibukota Jakarta 14460',
  -6.128765,
  106.772543,
  'https://www.google.com/maps/search/?api=1&query=Jl.+Empang+Damai+No.62+RT.10%2FRW.4+Kapuk+Muara+Kecamatan+Penjaringan+Jakarta+Utara+14460',
  '/logo.png',
  '/logo.png',
  'Fotokopi Salin Serupa - Jakarta Utara | Fotokopi, Printing & ATK',
  'Fotokopi Salin Serupa Jakarta Utara menyediakan layanan fotokopi, printing, scan, jilid, laminasi, percetakan dan berbagai kebutuhan ATK.',
  '09:00 - 21:00 WIB',
  '09:00 - 20:30 WIB'
) ON CONFLICT (id) DO UPDATE SET
  store_name = EXCLUDED.store_name,
  whatsapp = EXCLUDED.whatsapp,
  address = EXCLUDED.address;

INSERT INTO public.landing_content (
  id, hero_headline, hero_headline_accent, hero_subheadline, hero_cta_primary, hero_cta_secondary, hero_badge_text, hero_trust_text, hero_image, hero_is_active,
  tentang_title, tentang_description, tentang_image, tentang_cta_text, tentang_is_active
) VALUES (
  'landing-1',
  'Solusi Fotokopi, Printing & ATK Terlengkap di',
  'Jakarta Utara',
  'Kami menyediakan layanan percetakan cepat, penjilidan profesional, dan berbagai kebutuhan alat tulis kantor untuk mahasiswa, profesional, dan bisnis lokal.',
  'Pesan Sekarang',
  'Lihat Katalog',
  'Buka Hari Ini • 09:00 - 21:00',
  'Dipercaya oleh 1000+ pelanggan di Jakarta Utara',
  'https://images.unsplash.com/photo-1562654501-a0ccc0fc3fb1?auto=format&fit=crop&w=1200&q=80',
  TRUE,
  'Tentang Fotokopi Salin Serupa',
  'Fotokopi Salin Serupa - Jakarta Utara hadir untuk membantu memenuhi berbagai kebutuhan fotokopi, printing, dokumen, dan alat tulis kantor bagi pelanggan pribadi, pelajar, mahasiswa, maupun kebutuhan bisnis.',
  'https://images.unsplash.com/photo-1541872703-74c5e44368f9?auto=format&fit=crop&w=800&q=80',
  'Hubungi Kami',
  TRUE
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.categories (id, name, slug, description, sort_order, is_active) VALUES
('cat-1', 'Kertas', 'kertas', 'Kertas HVS, Buffalo, Photo, HVS Warna', 1, TRUE),
('cat-2', 'ATK', 'atk', 'Alat Tulis Kantor Dasar & Spesial', 2, TRUE),
('cat-3', 'Buku', 'buku', 'Buku Tulis, Buku Kas, Kwitansi, Ledger', 3, TRUE),
('cat-4', 'Pulpen', 'pulpen', 'Pulpen Gel, Ballpoint, Marker, Spidol', 4, TRUE),
('cat-5', 'Pensil', 'pensil', 'Pensil 2B, Mekanik, Penghapus, Rautan', 5, TRUE),
('cat-6', 'Map', 'map', 'Stopmap, Business File, Snelhecter, Binder', 6, TRUE),
('cat-7', 'Folder', 'folder', 'Folder Plastik, Document Bag, Odner', 7, TRUE),
('cat-8', 'Printer & Tinta', 'printer-tinta', 'Tinta Printer Epson, Canon, HP, Kertas Foto', 8, TRUE),
('cat-9', 'Perlengkapan Kantor', 'perlengkapan-kantor', 'Stapler, Lakban, Gunting, Pemotong Kertas', 9, TRUE),
('cat-10', 'Produk Printing', 'produk-printing', 'Jasa Print Warna, Fotokopi, Jilid Hardcover', 10, TRUE)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.products (id, sku, name, slug, category_id, description, price, promo_price, stock, unit, image, is_active) VALUES
('prd-1', 'KRT-A4-75', 'Kertas HVS A4 75gsm PaperOne', 'kertas-hvs-a4-75gsm-paperone', 'cat-1', 'Kertas HVS putih bersih ukuran A4 gramatur 75gsm cocok untuk cetak dokumen & fotokopi.', 48000, 45000, 120, 'Rim', 'https://images.unsplash.com/photo-1586075010923-2dd4570fb338?auto=format&fit=crop&w=600&q=80', TRUE),
('prd-2', 'KRT-F4-70', 'Kertas HVS F4 70gsm Sinar Dunia', 'kertas-hvs-f4-70gsm-sinar-dunia', 'cat-1', 'Kertas HVS ukuran Folio/F4 70gsm standar untuk surat perizinan & laporan kerja.', 52000, NULL, 85, 'Rim', 'https://images.unsplash.com/photo-1586075010923-2dd4570fb338?auto=format&fit=crop&w=600&q=80', TRUE),
('prd-3', 'PLP-FST-C600', 'Pulpen Gel Faster C600 Hitam', 'pulpen-gel-faster-c600-hitam', 'cat-4', 'Pulpen gel hitam lancar, mata pena 0.5mm anti macet cocok untuk tanda tangan dan menulis.', 3500, NULL, 300, 'Pcs', 'https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?auto=format&fit=crop&w=600&q=80', TRUE),
('prd-4', 'PLP-PLT-G2', 'Pulpen Pilot G2 0.5mm Black', 'pulpen-pilot-g2-05mm-black', 'cat-4', 'Pulpen retractable gel berkualitas tinggi dengan rubber grip nyaman dipakai.', 18000, 15500, 60, 'Pcs', 'https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?auto=format&fit=crop&w=600&q=80', TRUE),
('prd-5', 'PNS-FC-2B', 'Pensil 2B Faber-Castell Original', 'pensil-2b-faber-castell-original', 'cat-5', 'Pensil 2B standar komputer OMR ujian nasional dan menggambar.', 5000, NULL, 250, 'Pcs', 'https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?auto=format&fit=crop&w=600&q=80', TRUE),
('prd-6', 'MAP-BF-A4', 'Map Business File A4 Plastik Bening', 'map-business-file-a4-plastik-bening', 'cat-6', 'Map plastik penyimpan dokumen dengan pengunci snelhecter di dalamnya.', 4000, NULL, 180, 'Pcs', 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=600&q=80', TRUE)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.services (id, name, description, icon, image, badge, sort_order, is_active) VALUES
('srv-1', 'Fotokopi & Print B/W', 'Hasil tajam, cepat, dan rapi. Melayani berbagai ukuran kertas A4, F4, A3 hingga A0.', 'file_copy', 'https://images.unsplash.com/photo-1562654501-a0ccc0fc3fb1?auto=format&fit=crop&w=800&q=80', 'Paling Dicari', 1, TRUE),
('srv-2', 'Print Warna', 'Kualitas tajam & warna cerah untuk dokumen tugas, presentasi, brosur, & poster.', 'auto_awesome', NULL, NULL, 2, TRUE),
('srv-3', 'Scan Dokumen', 'Resolusi tinggi s.d 600dpi, langsung ubah dokumen fisik menjadi PDF/JPEG.', 'scanner', NULL, NULL, 3, TRUE),
('srv-4', 'Jilid & Finishing', 'Softcover, Hardcover, Lakban, Spiral Kawat/Plastik, Laminasi Doff/Glossy.', 'menu_book', NULL, NULL, 4, TRUE)
ON CONFLICT (id) DO NOTHING;
