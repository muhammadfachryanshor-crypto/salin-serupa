import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { AppData, Product, Category, Service, Promotion, Testimonial, FAQ, Order, StoreSettings, LandingContent } from '../types';
import { initialAppData } from '../data/initialData';
import { getSupabaseCredentials } from './supabase';

/**
 * Get a SupabaseClient instance using given credentials or fallback to env / localStorage
 */
export function getSupabaseClientForContext(overrideUrl?: string, overrideKey?: string): SupabaseClient | null {
  if (overrideUrl && overrideKey && !overrideUrl.includes('your-project.supabase.co')) {
    return createClient(overrideUrl, overrideKey);
  }
  const creds = getSupabaseCredentials();
  if (creds.url && creds.key) {
    return createClient(creds.url, creds.key);
  }
  return null;
}

/**
 * Fast ping to check if the Supabase REST endpoint is reachable and resolving.
 * Fails fast in ~100ms on invalid DNS/unreachable hosts instead of hanging queries.
 */
async function isEndpointReachable(client: any): Promise<boolean> {
  try {
    const rawUrl = client?.supabaseUrl || client?.restUrl;
    if (typeof rawUrl === 'string' && typeof fetch !== 'undefined') {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 1500);
      try {
        const pingUrl = `${rawUrl.replace(/\/rest\/v1\/?$/, '')}/rest/v1/`;
        const res = await fetch(pingUrl, {
          method: 'GET',
          signal: controller.signal,
          headers: { Accept: 'application/json' }
        });
        return res.status > 0;
      } finally {
        clearTimeout(timer);
      }
    }
  } catch {
    return false;
  }
  return true;
}

/**
 * Load complete AppData from Supabase database tables.
 * Falls back to initialAppData if tables are empty or connection fails.
 */
export async function fetchAppDataFromSupabase(client: SupabaseClient): Promise<{ data: AppData; fromSupabase: boolean }> {
  try {
    const reachable = await isEndpointReachable(client);
    if (!reachable) {
      console.info('Supabase belum aktif atau URL tidak dapat dijangkau; menggunakan data awal toko.');
      return { data: initialAppData, fromSupabase: false };
    }

    const queryPromise = Promise.all([
      client.from('store_settings').select('*').limit(1).maybeSingle(),
      client.from('landing_content').select('*').limit(1).maybeSingle(),
      client.from('keunggulan').select('*').order('sort_order', { ascending: true }),
      client.from('services').select('*').order('sort_order', { ascending: true }),
      client.from('categories').select('*').order('sort_order', { ascending: true }),
      client.from('products').select('*').order('created_at', { ascending: false }),
      client.from('promotions').select('*').order('created_at', { ascending: false }),
      client.from('testimonials').select('*').order('sort_order', { ascending: true }),
      client.from('faqs').select('*').order('sort_order', { ascending: true }),
      client.from('orders').select('*').order('created_at', { ascending: false })
    ]);

    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Supabase fetch timed out after 3000ms')), 3000)
    );

    const [
      settingsRes,
      landingRes,
      keunggulanRes,
      servicesRes,
      categoriesRes,
      productsRes,
      promotionsRes,
      testimonialsRes,
      faqsRes,
      ordersRes
    ] = await Promise.race([queryPromise, timeoutPromise]);

    // Check if at least settings or products returned data
    const hasData = Boolean(settingsRes.data || (productsRes.data && productsRes.data.length > 0));

    if (!hasData) {
      return { data: initialAppData, fromSupabase: false };
    }

    // Map store settings
    const settings: StoreSettings = settingsRes.data ? {
      id: settingsRes.data.id || 'store-1',
      store_name: settingsRes.data.store_name || initialAppData.settings.store_name,
      whatsapp: settingsRes.data.whatsapp || initialAppData.settings.whatsapp,
      address: settingsRes.data.address || initialAppData.settings.address,
      latitude: Number(settingsRes.data.latitude) || initialAppData.settings.latitude,
      longitude: Number(settingsRes.data.longitude) || initialAppData.settings.longitude,
      maps_url: settingsRes.data.maps_url || initialAppData.settings.maps_url,
      logo: settingsRes.data.logo || initialAppData.settings.logo,
      favicon: settingsRes.data.favicon || initialAppData.settings.favicon,
      meta_title: settingsRes.data.meta_title || initialAppData.settings.meta_title,
      meta_description: settingsRes.data.meta_description || initialAppData.settings.meta_description,
      business_hours_weekdays: settingsRes.data.business_hours_weekdays || initialAppData.settings.business_hours_weekdays,
      business_hours_sunday: settingsRes.data.business_hours_sunday || initialAppData.settings.business_hours_sunday
    } : initialAppData.settings;

    // Map landing content
    const landing: LandingContent = {
      hero: {
        headline: landingRes.data?.hero_headline || initialAppData.landing.hero.headline,
        headline_accent: landingRes.data?.hero_headline_accent || initialAppData.landing.hero.headline_accent,
        subheadline: landingRes.data?.hero_subheadline || initialAppData.landing.hero.subheadline,
        cta_primary: landingRes.data?.hero_cta_primary || initialAppData.landing.hero.cta_primary,
        cta_secondary: landingRes.data?.hero_cta_secondary || initialAppData.landing.hero.cta_secondary,
        badge_text: landingRes.data?.hero_badge_text || initialAppData.landing.hero.badge_text,
        trust_text: landingRes.data?.hero_trust_text || initialAppData.landing.hero.trust_text,
        hero_image: landingRes.data?.hero_image || initialAppData.landing.hero.hero_image,
        is_active: landingRes.data?.hero_is_active ?? true
      },
      tentang: {
        title: landingRes.data?.tentang_title || initialAppData.landing.tentang.title,
        description: landingRes.data?.tentang_description || initialAppData.landing.tentang.description,
        image: landingRes.data?.tentang_image || initialAppData.landing.tentang.image,
        cta_text: landingRes.data?.tentang_cta_text || initialAppData.landing.tentang.cta_text,
        is_active: landingRes.data?.tentang_is_active ?? true
      },
      keunggulan: keunggulanRes.data && keunggulanRes.data.length > 0 ? keunggulanRes.data.map((k: any) => ({
        id: k.id,
        icon: k.icon,
        title: k.title,
        description: k.description,
        sort_order: k.sort_order || 0,
        is_active: k.is_active ?? true
      })) : initialAppData.landing.keunggulan
    };

    // Map categories
    const categories: Category[] = categoriesRes.data && categoriesRes.data.length > 0 ? categoriesRes.data.map((c: any) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      description: c.description || '',
      image: c.image,
      sort_order: c.sort_order || 0,
      is_active: c.is_active ?? true
    })) : initialAppData.categories;

    // Map products
    const products: Product[] = productsRes.data && productsRes.data.length > 0 ? productsRes.data.map((p: any) => ({
      id: p.id,
      sku: p.sku,
      name: p.name,
      slug: p.slug,
      category_id: p.category_id,
      description: p.description || '',
      price: Number(p.price) || 0,
      promo_price: p.promo_price ? Number(p.promo_price) : undefined,
      stock: p.stock ?? 100,
      unit: p.unit || 'Pcs',
      image: p.image || '',
      is_active: p.is_active ?? true,
      created_at: p.created_at,
      updated_at: p.updated_at
    })) : initialAppData.products;

    // Map services
    const services: Service[] = servicesRes.data && servicesRes.data.length > 0 ? servicesRes.data.map((s: any) => ({
      id: s.id,
      name: s.name,
      description: s.description,
      icon: s.icon,
      image: s.image,
      badge: s.badge,
      sort_order: s.sort_order || 0,
      is_active: s.is_active ?? true
    })) : initialAppData.services;

    // Map promotions
    const promotions: Promotion[] = promotionsRes.data && promotionsRes.data.length > 0 ? promotionsRes.data.map((pr: any) => ({
      id: pr.id,
      title: pr.title,
      description: pr.description,
      image: pr.image,
      normal_price: Number(pr.normal_price) || 0,
      promo_price: Number(pr.promo_price) || 0,
      start_date: pr.start_date,
      end_date: pr.end_date,
      is_active: pr.is_active ?? true
    })) : initialAppData.promotions;

    // Map testimonials
    const testimonials: Testimonial[] = testimonialsRes.data && testimonialsRes.data.length > 0 ? testimonialsRes.data.map((t: any) => ({
      id: t.id,
      customer_name: t.customer_name,
      avatar: t.avatar,
      rating: t.rating || 5,
      comment: t.comment,
      sort_order: t.sort_order || 0,
      is_active: t.is_active ?? true
    })) : initialAppData.testimonials;

    // Map FAQs
    const faqs: FAQ[] = faqsRes.data && faqsRes.data.length > 0 ? faqsRes.data.map((f: any) => ({
      id: f.id,
      question: f.question,
      answer: f.answer,
      sort_order: f.sort_order || 0,
      is_active: f.is_active ?? true
    })) : initialAppData.faqs;

    // Fetch order items & documents if orders exist
    let orders: Order[] = [];
    if (ordersRes.data && ordersRes.data.length > 0) {
      const orderIds = ordersRes.data.map((o: any) => o.id);
      const [itemsRes, docsRes] = await Promise.all([
        client.from('order_items').select('*').in('order_id', orderIds),
        client.from('order_documents').select('*').in('order_id', orderIds)
      ]);

      const itemsByOrder: Record<string, any[]> = {};
      (itemsRes.data || []).forEach((item: any) => {
        if (!itemsByOrder[item.order_id]) itemsByOrder[item.order_id] = [];
        itemsByOrder[item.order_id].push({
          id: item.id,
          product_id: item.product_id,
          product_name: item.product_name,
          price: Number(item.price) || 0,
          quantity: item.quantity || 1,
          subtotal: Number(item.subtotal) || 0
        });
      });

      const docsByOrder: Record<string, any[]> = {};
      (docsRes.data || []).forEach((doc: any) => {
        if (!docsByOrder[doc.order_id]) docsByOrder[doc.order_id] = [];
        docsByOrder[doc.order_id].push({
          id: doc.id,
          name: doc.name,
          size: doc.size,
          type: doc.type,
          data_url: doc.data_url
        });
      });

      orders = ordersRes.data.map((o: any) => ({
        id: o.id,
        customer_name: o.customer_name,
        whatsapp: o.whatsapp,
        notes: o.notes || '',
        pickup_method: o.pickup_method || 'Ambil di toko',
        subtotal: Number(o.subtotal) || 0,
        total: Number(o.total) || 0,
        status: o.status || 'Baru',
        created_at: o.created_at,
        items: itemsByOrder[o.id] || [],
        documents: docsByOrder[o.id] || []
      }));
    } else {
      orders = initialAppData.orders;
    }

    return {
      data: {
        settings,
        landing,
        services,
        categories,
        products,
        promotions,
        testimonials,
        faqs,
        orders
      },
      fromSupabase: true
    };
  } catch (err: any) {
    console.warn('Pemberitahuan data Supabase: fallback ke data awal toko.', err?.message || err);
    return { data: initialAppData, fromSupabase: false };
  }
}

// --- SUPABASE MUTATION HELPERS ---

export async function saveSettingsToSupabase(client: SupabaseClient, settings: StoreSettings) {
  const { error } = await client.from('store_settings').upsert({
    id: 'store-1',
    store_name: settings.store_name,
    whatsapp: settings.whatsapp,
    address: settings.address,
    latitude: settings.latitude,
    longitude: settings.longitude,
    maps_url: settings.maps_url,
    logo: settings.logo,
    favicon: settings.favicon,
    meta_title: settings.meta_title,
    meta_description: settings.meta_description,
    business_hours_weekdays: settings.business_hours_weekdays,
    business_hours_sunday: settings.business_hours_sunday,
    updated_at: new Date().toISOString()
  });
  if (error) throw new Error(`Supabase Error: ${error.message}`);
}

export async function saveLandingToSupabase(client: SupabaseClient, landing: LandingContent) {
  const { error } = await client.from('landing_content').upsert({
    id: 'landing-1',
    hero_headline: landing.hero.headline,
    hero_headline_accent: landing.hero.headline_accent,
    hero_subheadline: landing.hero.subheadline,
    hero_cta_primary: landing.hero.cta_primary,
    hero_cta_secondary: landing.hero.cta_secondary,
    hero_badge_text: landing.hero.badge_text,
    hero_trust_text: landing.hero.trust_text,
    hero_image: landing.hero.hero_image,
    hero_is_active: landing.hero.is_active,
    tentang_title: landing.tentang.title,
    tentang_description: landing.tentang.description,
    tentang_image: landing.tentang.image,
    tentang_cta_text: landing.tentang.cta_text,
    tentang_is_active: landing.tentang.is_active,
    updated_at: new Date().toISOString()
  });
  if (error) throw new Error(`Supabase Error: ${error.message}`);
}

export async function saveProductToSupabase(client: SupabaseClient, product: Partial<Product> & { id?: string }) {
  const id = product.id || `prd-${Date.now()}`;
  const slug = product.slug || (product.name ? product.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') : `product-${Date.now()}`);
  const sku = product.sku || `SKU-${Math.floor(1000 + Math.random() * 9000)}`;

  const { error } = await client.from('products').upsert({
    id,
    sku,
    name: product.name,
    slug,
    category_id: product.category_id || 'cat-1',
    description: product.description || '',
    price: product.price || 0,
    promo_price: product.promo_price || null,
    stock: product.stock ?? 100,
    unit: product.unit || 'Pcs',
    image: product.image || '',
    is_active: product.is_active ?? true,
    updated_at: new Date().toISOString()
  });
  if (error) throw new Error(`Supabase Error: ${error.message}`);
  return id;
}

export async function deleteProductFromSupabase(client: SupabaseClient, id: string) {
  const { error } = await client.from('products').delete().eq('id', id);
  if (error) throw new Error(`Supabase Error: ${error.message}`);
}

export async function saveCategoryToSupabase(client: SupabaseClient, category: Partial<Category> & { id?: string }) {
  const id = category.id || `cat-${Date.now()}`;
  const slug = category.slug || (category.name ? category.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') : `cat-${Date.now()}`);

  const { error } = await client.from('categories').upsert({
    id,
    name: category.name,
    slug,
    description: category.description || '',
    image: category.image || '',
    sort_order: category.sort_order || 0,
    is_active: category.is_active ?? true
  });
  if (error) throw new Error(`Supabase Error: ${error.message}`);
}

export async function deleteCategoryFromSupabase(client: SupabaseClient, id: string) {
  const { error } = await client.from('categories').delete().eq('id', id);
  if (error) throw new Error(`Supabase Error: ${error.message}`);
}

export async function saveServiceToSupabase(client: SupabaseClient, service: Partial<Service> & { id?: string }) {
  const id = service.id || `srv-${Date.now()}`;

  const { error } = await client.from('services').upsert({
    id,
    name: service.name,
    description: service.description,
    icon: service.icon || 'file_copy',
    image: service.image || '',
    badge: service.badge || '',
    sort_order: service.sort_order || 0,
    is_active: service.is_active ?? true
  });
  if (error) throw new Error(`Supabase Error: ${error.message}`);
}

export async function deleteServiceFromSupabase(client: SupabaseClient, id: string) {
  const { error } = await client.from('services').delete().eq('id', id);
  if (error) throw new Error(`Supabase Error: ${error.message}`);
}

export async function savePromotionToSupabase(client: SupabaseClient, promo: Partial<Promotion> & { id?: string }) {
  const id = promo.id || `prm-${Date.now()}`;

  const { error } = await client.from('promotions').upsert({
    id,
    title: promo.title,
    description: promo.description,
    image: promo.image || '',
    normal_price: promo.normal_price || 0,
    promo_price: promo.promo_price || 0,
    start_date: promo.start_date || null,
    end_date: promo.end_date || null,
    is_active: promo.is_active ?? true
  });
  if (error) throw new Error(`Supabase Error: ${error.message}`);
}

export async function deletePromotionFromSupabase(client: SupabaseClient, id: string) {
  const { error } = await client.from('promotions').delete().eq('id', id);
  if (error) throw new Error(`Supabase Error: ${error.message}`);
}

export async function saveTestimonialToSupabase(client: SupabaseClient, testimonial: Partial<Testimonial> & { id?: string }) {
  const id = testimonial.id || `tst-${Date.now()}`;

  const { error } = await client.from('testimonials').upsert({
    id,
    customer_name: testimonial.customer_name,
    avatar: testimonial.avatar || '',
    rating: testimonial.rating || 5,
    comment: testimonial.comment,
    sort_order: testimonial.sort_order || 0,
    is_active: testimonial.is_active ?? true
  });
  if (error) throw new Error(`Supabase Error: ${error.message}`);
}

export async function deleteTestimonialFromSupabase(client: SupabaseClient, id: string) {
  const { error } = await client.from('testimonials').delete().eq('id', id);
  if (error) throw new Error(`Supabase Error: ${error.message}`);
}

export async function saveFaqToSupabase(client: SupabaseClient, faq: Partial<FAQ> & { id?: string }) {
  const id = faq.id || `faq-${Date.now()}`;

  const { error } = await client.from('faqs').upsert({
    id,
    question: faq.question,
    answer: faq.answer,
    sort_order: faq.sort_order || 0,
    is_active: faq.is_active ?? true
  });
  if (error) throw new Error(`Supabase Error: ${error.message}`);
}

export async function deleteFaqFromSupabase(client: SupabaseClient, id: string) {
  const { error } = await client.from('faqs').delete().eq('id', id);
  if (error) throw new Error(`Supabase Error: ${error.message}`);
}

export async function createOrderInSupabase(client: SupabaseClient, orderData: any) {
  const orderId = orderData.id || `#ORD-${String(Math.floor(100 + Math.random() * 900))}`;

  const { error: orderErr } = await client.from('orders').insert({
    id: orderId,
    customer_name: orderData.customer_name || 'Pelanggan',
    whatsapp: orderData.whatsapp || '',
    notes: orderData.notes || '',
    pickup_method: orderData.pickup_method || 'Ambil di toko',
    subtotal: Number(orderData.subtotal) || 0,
    total: Number(orderData.total) || 0,
    status: orderData.status || 'Baru'
  });

  if (orderErr) throw new Error(`Supabase Error: ${orderErr.message}`);

  if (Array.isArray(orderData.items) && orderData.items.length > 0) {
    const itemRows = orderData.items.map((item: any, idx: number) => ({
      id: item.id || `itm-${Date.now()}-${idx}`,
      order_id: orderId,
      product_id: item.product?.id || item.product_id || null,
      product_name: item.product?.name || item.product_name || 'Produk',
      price: Number(item.product?.price || item.price) || 0,
      quantity: item.quantity || 1,
      subtotal: Number(item.subtotal || ((item.product?.price || item.price) * (item.quantity || 1))) || 0
    }));
    await client.from('order_items').insert(itemRows);
  }

  if (Array.isArray(orderData.documents) && orderData.documents.length > 0) {
    const docRows = orderData.documents.map((doc: any, idx: number) => ({
      id: doc.id || `doc-${Date.now()}-${idx}`,
      order_id: orderId,
      name: doc.name || 'Dokumen',
      size: doc.size || 0,
      type: doc.type || 'application/pdf',
      data_url: doc.data_url || ''
    }));
    await client.from('order_documents').insert(docRows);
  }

  return orderId;
}

export async function updateOrderStatusInSupabase(client: SupabaseClient, orderId: string, status: string) {
  const { error } = await client.from('orders').update({
    status,
    updated_at: new Date().toISOString()
  }).eq('id', orderId);

  if (error) throw new Error(`Supabase Error: ${error.message}`);
}
