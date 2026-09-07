export interface PaymentMethodConfig {
  id: string;
  name: string;
  type: 'cash' | 'qris' | 'transfer' | 'debit' | 'other';
  enabled: boolean;
  account_name?: string;
  account_number?: string;
  qr_image_url?: string;
  notes?: string;
}

export interface StoreSettings {
  id: string;
  store_name: string;
  whatsapp: string;
  address: string;
  latitude: number;
  longitude: number;
  maps_url: string;
  logo: string;
  favicon: string;
  meta_title: string;
  meta_description: string;
  business_hours_weekdays: string;
  business_hours_sunday: string;
  payment_methods?: PaymentMethodConfig[];
  qris_image?: string;
  printer_paper_size?: '58mm' | '80mm';
  printer_auto_print?: boolean;
  printer_open_drawer?: boolean;
  printer_footer_note?: string;
}

export interface KeunggulanItem {
  id: string;
  icon: string;
  title: string;
  description: string;
  sort_order: number;
  is_active: boolean;
}

export interface LandingContent {
  hero: {
    headline: string;
    headline_accent: string;
    subheadline: string;
    cta_primary: string;
    cta_secondary: string;
    badge_text: string;
    trust_text: string;
    hero_image: string;
    is_active: boolean;
  };
  tentang: {
    title: string;
    description: string;
    image: string;
    cta_text: string;
    is_active: boolean;
  };
  keunggulan: KeunggulanItem[];
}

export interface Service {
  id: string;
  name: string;
  description: string;
  icon: string;
  image?: string;
  badge?: string;
  sort_order: number;
  is_active: boolean;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  image?: string;
  sort_order: number;
  is_active: boolean;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  slug: string;
  category_id: string;
  description: string;
  price: number;
  promo_price?: number;
  stock: number;
  unit: string;
  image: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Promotion {
  id: string;
  title: string;
  description: string;
  image: string;
  normal_price: number;
  promo_price: number;
  start_date?: string;
  end_date?: string;
  is_active: boolean;
}

export interface Testimonial {
  id: string;
  customer_name: string;
  avatar: string;
  rating: number;
  comment: string;
  is_active: boolean;
  sort_order: number;
}

export interface FAQ {
  id: string;
  question: string;
  answer: string;
  sort_order: number;
  is_active: boolean;
}

export interface OrderItem {
  id: string;
  order_id?: string;
  product_id: string;
  product_name: string;
  price: number;
  quantity: number;
  subtotal: number;
}

export interface OrderDocument {
  id: string;
  name: string;
  size: number;
  type: string;
  data_url: string;
}

export interface Order {
  id: string;
  customer_name: string;
  whatsapp: string;
  notes: string;
  pickup_method: 'Ambil di toko' | 'Pesanan sesuai kesepakatan';
  subtotal: number;
  total: number;
  status: 'Baru' | 'Diproses' | 'Siap Diambil' | 'Selesai' | 'Dibatalkan';
  created_at: string;
  items: OrderItem[];
  documents?: OrderDocument[];
  payment_method?: string;
  cash_received?: number;
  cash_change?: number;
  discount?: number;
  cashier_name?: string;
  source?: 'online' | 'pos';
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface AppData {
  settings: StoreSettings;
  landing: LandingContent;
  services: Service[];
  categories: Category[];
  products: Product[];
  promotions: Promotion[];
  testimonials: Testimonial[];
  faqs: FAQ[];
  orders: Order[];
}
