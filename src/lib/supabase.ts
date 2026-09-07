import { createClient, SupabaseClient } from '@supabase/supabase-js';

export const getSupabaseCredentials = (): { url: string; key: string; source: 'env' | 'localStorage' | 'none' } => {
  const envUrl = (import.meta as any).env?.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
  const envKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';

  const localUrl = typeof window !== 'undefined' ? localStorage.getItem('supabase_url') || '' : '';
  const localKey = typeof window !== 'undefined' ? localStorage.getItem('supabase_anon_key') || '' : '';

  if (localUrl && localKey && !localUrl.includes('your-project.supabase.co')) {
    return { url: localUrl, key: localKey, source: 'localStorage' };
  }

  if (envUrl && envKey && !envUrl.includes('your-project.supabase.co')) {
    return { url: envUrl, key: envKey, source: 'env' };
  }

  return { url: '', key: '', source: 'none' };
};

export const isSupabaseConfigured = (): boolean => {
  const { url, key } = getSupabaseCredentials();
  return Boolean(url && key);
};

let cachedInstance: SupabaseClient | null = null;
let cachedKey = '';

export const getSupabaseClient = (): SupabaseClient | null => {
  const { url, key } = getSupabaseCredentials();
  if (!url || !key) return null;

  const currentKey = `${url}:${key}`;
  if (!cachedInstance || cachedKey !== currentKey) {
    cachedInstance = createClient(url, key);
    cachedKey = currentKey;
  }
  return cachedInstance;
};

export const saveSupabaseCredentials = (url: string, key: string) => {
  if (typeof window !== 'undefined') {
    if (url && key) {
      localStorage.setItem('supabase_url', url.trim());
      localStorage.setItem('supabase_anon_key', key.trim());
    } else {
      localStorage.removeItem('supabase_url');
      localStorage.removeItem('supabase_anon_key');
    }
    cachedInstance = null;
    cachedKey = '';
  }
};

export const clearSupabaseCredentials = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('supabase_url');
    localStorage.removeItem('supabase_anon_key');
    cachedInstance = null;
    cachedKey = '';
  }
};

export const testSupabaseConnection = async (testUrl?: string, testKey?: string) => {
  const credentials = (testUrl && testKey) 
    ? { url: testUrl.trim(), key: testKey.trim() }
    : getSupabaseCredentials();

  if (!credentials.url || !credentials.key) {
    return {
      success: false,
      message: 'URL atau API Key Supabase belum diisi.',
      code: 'MISSING_CREDENTIALS'
    };
  }

  try {
    const tempClient = createClient(credentials.url, credentials.key);
    const { error } = await tempClient.from('store_settings').select('id').limit(1);

    if (error) {
      // If table doesn't exist yet vs network error
      if (error.code === '42P01' || error.message.includes('relation') || error.message.includes('does not exist')) {
        return {
          success: false,
          message: 'Koneksi ke Supabase berhasil! Namun tabel `store_settings` belum ada.',
          code: 'TABLE_MISSING',
          details: 'Silakan jalankan script supabase_schema.sql di SQL Editor Supabase.'
        };
      }
      return {
        success: false,
        message: `Gagal terhubung ke Supabase: ${error.message}`,
        code: 'SUPABASE_ERROR',
        details: error.message
      };
    }

    return {
      success: true,
      message: 'Koneksi ke Supabase & tabel database BERHASIL!',
      code: 'SUCCESS'
    };
  } catch (err: any) {
    return {
      success: false,
      message: `Gagal terhubung: ${err.message || 'Kesalahan jaringan / URL invalid.'}`,
      code: 'NETWORK_ERROR'
    };
  }
};

export const getSupabaseHeaders = (): Record<string, string> => {
  const { url, key } = getSupabaseCredentials();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (url && key) {
    headers['x-supabase-url'] = url;
    headers['x-supabase-key'] = key;
  }
  return headers;
};

export const supabase = getSupabaseClient();

