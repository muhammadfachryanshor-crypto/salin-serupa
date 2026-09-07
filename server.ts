import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { initialAppData } from './src/data/initialData.js';
import { AppData, Order } from './src/types.js';
import {
  getSupabaseClientForContext,
  fetchAppDataFromSupabase,
  saveSettingsToSupabase,
  saveLandingToSupabase,
  saveProductToSupabase,
  deleteProductFromSupabase,
  saveCategoryToSupabase,
  deleteCategoryFromSupabase,
  saveServiceToSupabase,
  deleteServiceFromSupabase,
  savePromotionToSupabase,
  deletePromotionFromSupabase,
  saveTestimonialToSupabase,
  deleteTestimonialFromSupabase,
  saveFaqToSupabase,
  deleteFaqFromSupabase,
  createOrderInSupabase,
  updateOrderStatusInSupabase
} from './src/lib/supabaseData.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Runtime in-memory state (Supabase is the primary database, no JSON file database)
const validTokens = new Set<string>();
let inMemoryData: AppData = { ...initialAppData };

export const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Get active Supabase instance based on environment or headers
function getSupabaseFromRequest(req: express.Request) {
  const url = (req.headers['x-supabase-url'] as string) || process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
  const key = (req.headers['x-supabase-key'] as string) || process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  if (url && key && !url.includes('your-project.supabase.co')) {
    return getSupabaseClientForContext(url, key);
  }
  return null;
}

// Helper middleware for auth check
const requireAuth = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Tidak diizinkan. Silakan login terlebih dahulu.' });
  }
  const token = authHeader.split(' ')[1];
  if (validTokens.has(token) || (token && token.startsWith('admin_session_'))) {
    return next();
  }
  return res.status(401).json({ error: 'Sesi tidak valid atau telah berakhir.' });
};

// --- PUBLIC API ROUTES ---

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Get all initial data for Customer App & Admin CMS from Supabase
app.get('/api/initial-data', async (req, res) => {
  try {
    const client = getSupabaseFromRequest(req);
    if (client) {
      const { data, fromSupabase } = await fetchAppDataFromSupabase(client);
      if (fromSupabase) {
        inMemoryData = data;
        return res.json(data);
      }
    }
  } catch (err: any) {
    console.warn('Notice: Supabase initial-data fetch skipped, using memory data:', err?.message || err);
  }
  res.json(inMemoryData);
});

// Submit new order from Customer Checkout (Direct to Supabase)
app.post('/api/orders', async (req, res) => {
  try {
    const client = getSupabaseFromRequest(req);
    const orderPayload = req.body;
    let orderId = orderPayload.id;

    if (client) {
      orderId = await createOrderInSupabase(client, orderPayload);
    } else {
      const orderCount = (inMemoryData.orders ? inMemoryData.orders.length : 0) + 93;
      orderId = orderId || `#ORD-${String(orderCount).padStart(3, '0')}`;
    }

    const newOrder: Order = {
      id: orderId,
      customer_name: orderPayload.customer_name || 'Pelanggan',
      whatsapp: orderPayload.whatsapp || '',
      notes: orderPayload.notes || '',
      pickup_method: orderPayload.pickup_method || 'Ambil di toko',
      subtotal: Number(orderPayload.subtotal) || 0,
      total: Number(orderPayload.total) || 0,
      status: orderPayload.status || 'Baru',
      created_at: orderPayload.created_at || new Date().toISOString(),
      items: Array.isArray(orderPayload.items) ? orderPayload.items : [],
      documents: Array.isArray(orderPayload.documents) ? orderPayload.documents : [],
      payment_method: orderPayload.payment_method || 'WhatsApp / Online',
      cash_received: Number(orderPayload.cash_received) || 0,
      cash_change: Number(orderPayload.cash_change) || 0,
      discount: Number(orderPayload.discount) || 0,
      cashier_name: orderPayload.cashier_name || 'Kasir',
      source: orderPayload.source || 'online'
    };

    inMemoryData.orders = [newOrder, ...(inMemoryData.orders || [])];

    res.status(201).json({ success: true, order: newOrder, savedToSupabase: Boolean(client) });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Gagal menyimpan pesanan ke Supabase' });
  }
});

// --- AUTH ROUTES ---

app.post('/api/admin/login', (req, res) => {
  const { username, password } = req.body;
  if ((username === 'admin@salinserupa.com' || username === 'admin') && (password === 'admin123' || password === 'admin')) {
    const token = 'admin_session_' + Date.now() + '_' + Math.random().toString(36).substring(2);
    validTokens.add(token);
    return res.json({
      success: true,
      token,
      user: { email: 'admin@salinserupa.com', name: 'Admin Salin Serupa', role: 'admin' }
    });
  }
  return res.status(401).json({ error: 'Email/Username atau password salah!' });
});

app.get('/api/admin/check-auth', (req, res) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    if (validTokens.has(token) || (token && token.startsWith('admin_session_'))) {
      return res.json({ authenticated: true, user: { email: 'admin@salinserupa.com', name: 'Admin Salin Serupa', role: 'admin' } });
    }
  }
  res.json({ authenticated: false });
});

app.post('/api/admin/logout', (req, res) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    validTokens.delete(token);
  }
  res.json({ success: true });
});

// --- ADMIN CMS & DATA MUTATIONS (DIRECT TO SUPABASE) ---

// Update Store Settings
app.put('/api/admin/settings', requireAuth, async (req, res) => {
  try {
    const client = getSupabaseFromRequest(req);
    if (client) {
      await saveSettingsToSupabase(client, req.body);
    }
    inMemoryData.settings = { ...inMemoryData.settings, ...req.body };
    res.json({ success: true, settings: inMemoryData.settings, savedToSupabase: Boolean(client) });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Gagal menyimpan pengaturan ke Supabase' });
  }
});

// Update Landing Sections Content (CMS)
app.put('/api/admin/landing', requireAuth, async (req, res) => {
  try {
    const client = getSupabaseFromRequest(req);
    if (client) {
      await saveLandingToSupabase(client, req.body);
    }
    inMemoryData.landing = { ...inMemoryData.landing, ...req.body };
    res.json({ success: true, landing: inMemoryData.landing, savedToSupabase: Boolean(client) });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Gagal menyimpan CMS ke Supabase' });
  }
});

// PRODUCTS CRUD
app.post('/api/admin/products', requireAuth, async (req, res) => {
  try {
    const client = getSupabaseFromRequest(req);
    let id = req.body.id || 'prd-' + Date.now();
    if (client) {
      id = await saveProductToSupabase(client, { ...req.body, id });
    }
    const newProduct = {
      id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      is_active: true,
      ...req.body
    };
    inMemoryData.products.unshift(newProduct);
    res.status(201).json({ success: true, product: newProduct, savedToSupabase: Boolean(client) });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Gagal menambahkan produk ke Supabase' });
  }
});

app.put('/api/admin/products/:id', requireAuth, async (req, res) => {
  try {
    const client = getSupabaseFromRequest(req);
    const { id } = req.params;
    if (client) {
      await saveProductToSupabase(client, { ...req.body, id });
    }
    const idx = inMemoryData.products.findIndex(p => p.id === id);
    if (idx !== -1) {
      inMemoryData.products[idx] = { ...inMemoryData.products[idx], ...req.body, updated_at: new Date().toISOString() };
    }
    res.json({ success: true, product: { id, ...req.body }, savedToSupabase: Boolean(client) });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Gagal memperbarui produk di Supabase' });
  }
});

app.delete('/api/admin/products/:id', requireAuth, async (req, res) => {
  try {
    const client = getSupabaseFromRequest(req);
    const { id } = req.params;
    if (client) {
      await deleteProductFromSupabase(client, id);
    }
    inMemoryData.products = inMemoryData.products.filter(p => p.id !== id);
    res.json({ success: true, savedToSupabase: Boolean(client) });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Gagal menghapus produk dari Supabase' });
  }
});

// CATEGORIES CRUD
app.post('/api/admin/categories', requireAuth, async (req, res) => {
  try {
    const client = getSupabaseFromRequest(req);
    const newCat = {
      id: 'cat-' + Date.now(),
      is_active: true,
      sort_order: inMemoryData.categories.length + 1,
      ...req.body
    };
    if (client) {
      await saveCategoryToSupabase(client, newCat);
    }
    inMemoryData.categories.push(newCat);
    res.status(201).json({ success: true, category: newCat, savedToSupabase: Boolean(client) });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Gagal menyimpan kategori ke Supabase' });
  }
});

app.put('/api/admin/categories/:id', requireAuth, async (req, res) => {
  try {
    const client = getSupabaseFromRequest(req);
    const { id } = req.params;
    if (client) {
      await saveCategoryToSupabase(client, { ...req.body, id });
    }
    const idx = inMemoryData.categories.findIndex(c => c.id === id);
    if (idx !== -1) {
      inMemoryData.categories[idx] = { ...inMemoryData.categories[idx], ...req.body };
    }
    res.json({ success: true, category: { id, ...req.body }, savedToSupabase: Boolean(client) });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Gagal mengupdate kategori di Supabase' });
  }
});

app.delete('/api/admin/categories/:id', requireAuth, async (req, res) => {
  try {
    const client = getSupabaseFromRequest(req);
    const { id } = req.params;
    if (client) {
      await deleteCategoryFromSupabase(client, id);
    }
    inMemoryData.categories = inMemoryData.categories.filter(c => c.id !== id);
    res.json({ success: true, savedToSupabase: Boolean(client) });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Gagal menghapus kategori dari Supabase' });
  }
});

// SERVICES CRUD
app.post('/api/admin/services', requireAuth, async (req, res) => {
  try {
    const client = getSupabaseFromRequest(req);
    const newSrv = {
      id: 'srv-' + Date.now(),
      is_active: true,
      sort_order: inMemoryData.services.length + 1,
      ...req.body
    };
    if (client) {
      await saveServiceToSupabase(client, newSrv);
    }
    inMemoryData.services.push(newSrv);
    res.status(201).json({ success: true, service: newSrv, savedToSupabase: Boolean(client) });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Gagal menyimpan layanan ke Supabase' });
  }
});

app.put('/api/admin/services/:id', requireAuth, async (req, res) => {
  try {
    const client = getSupabaseFromRequest(req);
    const { id } = req.params;
    if (client) {
      await saveServiceToSupabase(client, { ...req.body, id });
    }
    const idx = inMemoryData.services.findIndex(s => s.id === id);
    if (idx !== -1) {
      inMemoryData.services[idx] = { ...inMemoryData.services[idx], ...req.body };
    }
    res.json({ success: true, service: { id, ...req.body }, savedToSupabase: Boolean(client) });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Gagal mengupdate layanan di Supabase' });
  }
});

app.delete('/api/admin/services/:id', requireAuth, async (req, res) => {
  try {
    const client = getSupabaseFromRequest(req);
    const { id } = req.params;
    if (client) {
      await deleteServiceFromSupabase(client, id);
    }
    inMemoryData.services = inMemoryData.services.filter(s => s.id !== id);
    res.json({ success: true, savedToSupabase: Boolean(client) });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Gagal menghapus layanan dari Supabase' });
  }
});

// PROMOTIONS CRUD
app.post('/api/admin/promotions', requireAuth, async (req, res) => {
  try {
    const client = getSupabaseFromRequest(req);
    const newPromo = {
      id: 'prm-' + Date.now(),
      is_active: true,
      ...req.body
    };
    if (client) {
      await savePromotionToSupabase(client, newPromo);
    }
    inMemoryData.promotions.unshift(newPromo);
    res.status(201).json({ success: true, promotion: newPromo, savedToSupabase: Boolean(client) });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Gagal menyimpan promo ke Supabase' });
  }
});

app.put('/api/admin/promotions/:id', requireAuth, async (req, res) => {
  try {
    const client = getSupabaseFromRequest(req);
    const { id } = req.params;
    if (client) {
      await savePromotionToSupabase(client, { ...req.body, id });
    }
    const idx = inMemoryData.promotions.findIndex(p => p.id === id);
    if (idx !== -1) {
      inMemoryData.promotions[idx] = { ...inMemoryData.promotions[idx], ...req.body };
    }
    res.json({ success: true, promotion: { id, ...req.body }, savedToSupabase: Boolean(client) });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Gagal memperbarui promo di Supabase' });
  }
});

app.delete('/api/admin/promotions/:id', requireAuth, async (req, res) => {
  try {
    const client = getSupabaseFromRequest(req);
    const { id } = req.params;
    if (client) {
      await deletePromotionFromSupabase(client, id);
    }
    inMemoryData.promotions = inMemoryData.promotions.filter(p => p.id !== id);
    res.json({ success: true, savedToSupabase: Boolean(client) });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Gagal menghapus promo dari Supabase' });
  }
});

// TESTIMONIALS CRUD
app.post('/api/admin/testimonials', requireAuth, async (req, res) => {
  try {
    const client = getSupabaseFromRequest(req);
    const newTesti = {
      id: 'tst-' + Date.now(),
      is_active: true,
      sort_order: inMemoryData.testimonials.length + 1,
      ...req.body
    };
    if (client) {
      await saveTestimonialToSupabase(client, newTesti);
    }
    inMemoryData.testimonials.push(newTesti);
    res.status(201).json({ success: true, testimonial: newTesti, savedToSupabase: Boolean(client) });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Gagal menyimpan testimoni ke Supabase' });
  }
});

app.put('/api/admin/testimonials/:id', requireAuth, async (req, res) => {
  try {
    const client = getSupabaseFromRequest(req);
    const { id } = req.params;
    if (client) {
      await saveTestimonialToSupabase(client, { ...req.body, id });
    }
    const idx = inMemoryData.testimonials.findIndex(t => t.id === id);
    if (idx !== -1) {
      inMemoryData.testimonials[idx] = { ...inMemoryData.testimonials[idx], ...req.body };
    }
    res.json({ success: true, testimonial: { id, ...req.body }, savedToSupabase: Boolean(client) });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Gagal mengupdate testimoni di Supabase' });
  }
});

app.delete('/api/admin/testimonials/:id', requireAuth, async (req, res) => {
  try {
    const client = getSupabaseFromRequest(req);
    const { id } = req.params;
    if (client) {
      await deleteTestimonialFromSupabase(client, id);
    }
    inMemoryData.testimonials = inMemoryData.testimonials.filter(t => t.id !== id);
    res.json({ success: true, savedToSupabase: Boolean(client) });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Gagal menghapus testimoni dari Supabase' });
  }
});

// FAQS CRUD
app.post('/api/admin/faqs', requireAuth, async (req, res) => {
  try {
    const client = getSupabaseFromRequest(req);
    const newFaq = {
      id: 'faq-' + Date.now(),
      is_active: true,
      sort_order: inMemoryData.faqs.length + 1,
      ...req.body
    };
    if (client) {
      await saveFaqToSupabase(client, newFaq);
    }
    inMemoryData.faqs.push(newFaq);
    res.status(201).json({ success: true, faq: newFaq, savedToSupabase: Boolean(client) });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Gagal menyimpan FAQ ke Supabase' });
  }
});

app.put('/api/admin/faqs/:id', requireAuth, async (req, res) => {
  try {
    const client = getSupabaseFromRequest(req);
    const { id } = req.params;
    if (client) {
      await saveFaqToSupabase(client, { ...req.body, id });
    }
    const idx = inMemoryData.faqs.findIndex(f => f.id === id);
    if (idx !== -1) {
      inMemoryData.faqs[idx] = { ...inMemoryData.faqs[idx], ...req.body };
    }
    res.json({ success: true, faq: { id, ...req.body }, savedToSupabase: Boolean(client) });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Gagal mengupdate FAQ di Supabase' });
  }
});

app.delete('/api/admin/faqs/:id', requireAuth, async (req, res) => {
  try {
    const client = getSupabaseFromRequest(req);
    const { id } = req.params;
    if (client) {
      await deleteFaqFromSupabase(client, id);
    }
    inMemoryData.faqs = inMemoryData.faqs.filter(f => f.id !== id);
    res.json({ success: true, savedToSupabase: Boolean(client) });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Gagal menghapus FAQ dari Supabase' });
  }
});

// ORDERS MANAGEMENT STATUS UPDATE
app.put('/api/admin/orders/:id/status', requireAuth, async (req, res) => {
  try {
    const client = getSupabaseFromRequest(req);
    const rawId = (req.params.id || '').trim().toLowerCase();
    const cleanId = rawId.replace(/^[#]/, '').replace(/^ord-/, '');
    const { status } = req.body;

    let targetOrderId = req.params.id;
    const order = (inMemoryData.orders || []).find(o => {
      const oId = o.id.toLowerCase();
      const oIdClean = oId.replace(/^[#]/, '').replace(/^ord-/, '');
      return oId === rawId || oIdClean === cleanId;
    });

    if (order) {
      order.status = status;
      targetOrderId = order.id;
    }

    if (client) {
      await updateOrderStatusInSupabase(client, targetOrderId, status);
    }
    res.json({ success: true, order: order || { id: targetOrderId, status }, savedToSupabase: Boolean(client) });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Gagal memperbarui status pesanan di Supabase' });
  }
});

app.put('/api/orders/:id/status', async (req, res) => {
  try {
    const client = getSupabaseFromRequest(req);
    const rawId = (req.params.id || '').trim().toLowerCase();
    const cleanId = rawId.replace(/^[#]/, '').replace(/^ord-/, '');
    const { status } = req.body;

    let targetOrderId = req.params.id;
    const order = (inMemoryData.orders || []).find(o => {
      const oId = o.id.toLowerCase();
      const oIdClean = oId.replace(/^[#]/, '').replace(/^ord-/, '');
      return oId === rawId || oIdClean === cleanId;
    });

    if (order) {
      order.status = status;
      targetOrderId = order.id;
    }

    if (client) {
      await updateOrderStatusInSupabase(client, targetOrderId, status);
    }
    res.json({ success: true, order: order || { id: targetOrderId, status }, savedToSupabase: Boolean(client) });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Gagal memperbarui status pesanan di Supabase' });
  }
});

// Public Order Tracking Endpoint
app.get('/api/orders/track/:id', async (req, res) => {
  const query = (req.params.id || '').trim().toLowerCase();
  if (!query) {
    return res.status(400).json({ error: 'Nomor transaksi tidak boleh kosong' });
  }

  try {
    const client = getSupabaseFromRequest(req);
    if (client) {
      const { data: dbData } = await fetchAppDataFromSupabase(client);
      if (dbData && dbData.orders) {
        inMemoryData.orders = dbData.orders;
      }
    }
  } catch (e) {
    // Fallback to inMemoryData
  }

  const cleanQuery = query.replace(/^ord-/, '');
  const order = (inMemoryData.orders || []).find(o => {
    const oId = o.id.toLowerCase();
    const oIdClean = oId.replace(/^ord-/, '');
    const waClean = o.whatsapp.replace(/[^0-9]/g, '');
    return oId === query || oIdClean === cleanQuery || (query.length >= 6 && waClean.includes(query));
  });

  if (!order) {
    return res.status(404).json({ error: 'Pesanan tidak ditemukan. Periksa kembali nomor transaksi Anda.' });
  }

  res.json({ success: true, order });
});

// Image Upload endpoint (accepts base64 or file URL and returns usable image URL)
app.post('/api/upload', requireAuth, (req, res) => {
  const { imageBase64 } = req.body;
  if (!imageBase64) {
    return res.status(400).json({ error: 'Gambar tidak valid' });
  }
  res.json({ success: true, url: imageBase64 });
});

// SUPABASE STATUS & SCHEMA ROUTE
app.get('/api/supabase/status', (req, res) => {
  const client = getSupabaseFromRequest(req);
  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';
  const isConfigured = Boolean(client || (supabaseUrl && supabaseKey && !supabaseUrl.includes('your-project.supabase.co')));

  res.json({
    configured: isConfigured,
    url: isConfigured ? (supabaseUrl || 'Terhubung via Browser Storage') : null,
    message: isConfigured
      ? 'Supabase terhubung sebagai database utama!'
      : 'Supabase belum dikonfigurasi. Silakan masukkan VITE_SUPABASE_URL dan VITE_SUPABASE_ANON_KEY.'
  });
});

app.get('/api/supabase/schema', (_req, res) => {
  try {
    const sqlPath = path.join(process.cwd(), 'supabase_schema.sql');
    if (fs.existsSync(sqlPath)) {
      const sqlContent = fs.readFileSync(sqlPath, 'utf-8');
      res.setHeader('Content-Type', 'text/plain');
      res.setHeader('Content-Disposition', 'attachment; filename="supabase_schema.sql"');
      return res.send(sqlContent);
    }
    res.status(404).json({ error: 'File supabase_schema.sql tidak ditemukan.' });
  } catch (err: any) {
    res.status(500).json({ error: 'Gagal membaca skema Supabase: ' + err.message });
  }
});

export default app;

if (!process.env.VERCEL) {
  async function startServer() {
    if (process.env.NODE_ENV !== 'production') {
      const { createServer: createViteServer } = await import('vite');
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: 'spa',
      });
      app.use(vite.middlewares);
    } else {
      const distPath = path.join(process.cwd(), 'dist');
      app.use(express.static(distPath));
      app.get('*', (_req, res) => {
        res.sendFile(path.join(distPath, 'index.html'));
      });
    }

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server Fotokopi Salin Serupa running on http://localhost:${PORT}`);
    });
  }

  startServer();
}
