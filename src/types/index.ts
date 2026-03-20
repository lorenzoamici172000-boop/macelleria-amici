// ==============================================
// Macelleria Amici - Type Definitions
// ==============================================

// ---- Database Row Types ----

export interface Profile {
  id: string;
  first_name: string;
  last_name: string;
  username: string;
  username_lower: string;
  email: string;
  phone: string;
  role: 'customer' | 'admin';
  created_at: string;
  updated_at: string;
}

export interface ShippingAddress {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  street: string;
  street_number: string;
  zip_code: string;
  city: string;
  province: string;
  country: string;
  phone: string;
  created_at: string;
  updated_at: string;
}

export interface BillingAddress {
  id: string;
  user_id: string;
  addressee_name: string;
  street: string;
  street_number: string;
  zip_code: string;
  city: string;
  province: string;
  country: string;
  phone: string;
  created_at: string;
  updated_at: string;
}

export interface InvoiceProfile {
  id: string;
  user_id: string;
  invoice_type: 'private' | 'company';
  first_name: string;
  last_name: string;
  tax_code: string;
  company_name: string;
  vat_number: string;
  sdi_code: string;
  pec: string;
  full_address: string;
  created_at: string;
  updated_at: string;
}

export interface SiteSettings {
  id: string;
  logo_url: string;
  favicon_url: string;
  hero_image_url: string;
  hero_button_text: string;
  hero_button_link: string;
  reviews_section_enabled: boolean;
  reviews_button_text: string;
  whatsapp_floating_enabled: boolean;
  // Theme colors
  color_primary: string;
  color_primary_foreground: string;
  color_secondary: string;
  color_secondary_foreground: string;
  color_accent: string;
  color_background: string;
  color_foreground: string;
  color_navbar_bg: string;
  color_navbar_text: string;
  color_footer_bg: string;
  color_footer_text: string;
  color_muted: string;
  color_border: string;
  // Fonts
  font_display: string;
  font_body: string;
  font_display_url: string;
  font_body_url: string;
  // Buttons
  button_border_radius: string;
  button_padding: string;
  // Hero button
  hero_btn_bg: string;
  hero_btn_text: string;
  hero_btn_hover_bg: string;
  hero_btn_border: string;
  hero_btn_radius: string;
  hero_btn_font_size: string;
  // Auth buttons
  login_btn_bg: string;
  login_btn_text: string;
  login_btn_border: string;
  register_btn_bg: string;
  register_btn_text: string;
  register_btn_border: string;
  created_at: string;
  updated_at: string;
}

export interface BusinessSettings {
  id: string;
  business_name: string;
  operational_address: string;
  legal_address: string;
  phone: string;
  whatsapp: string;
  email: string;
  website: string;
  opening_hours: OpeningHour[];
  pickup_slots: PickupSlotDay[];
  extraordinary_closures: ExtraordinaryClosure[];
  holidays: Holiday[];
  google_maps_embed_url: string;
  facebook_url: string;
  instagram_url: string;
  created_at: string;
  updated_at: string;
}

export interface OpeningHour {
  day: number; // 0=Sun, 1=Mon...6=Sat
  open: string;
  close: string;
  closed: boolean;
}

export interface PickupSlotDay {
  day: number;
  slots: string[];
}

export interface ExtraordinaryClosure {
  date: string;
  reason: string;
}

export interface Holiday {
  date: string;
  name: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  price_cent: number;
  discount_price_cent: number | null;
  stock: number;
  category_id: string | null;
  vat_rate: number; // basis points, e.g. 2200 = 22%
  pickup_enabled: boolean;
  shipping_enabled: boolean;
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
  // Joined
  category?: Category;
  images?: ProductImage[];
}

export interface ProductImage {
  id: string;
  product_id: string;
  url: string;
  alt_text: string;
  display_order: number;
  created_at: string;
}

export interface Page {
  id: string;
  title: string;
  slug: string;
  content: Record<string, unknown>;
  status: 'draft' | 'published';
  meta_title: string;
  meta_description: string;
  featured_image_url: string;
  display_order: number;
  is_system: boolean;
  created_at: string;
  updated_at: string;
}

export interface NavigationLink {
  id: string;
  label_it: string;
  label_en: string;
  href: string;
  display_order: number;
  is_visible: boolean;
  page_id: string | null;
  is_system: boolean;
  created_at: string;
  updated_at: string;
}

export interface WishlistItem {
  id: string;
  wishlist_id: string;
  product_id: string;
  created_at: string;
  product?: Product;
}

export interface CartItem {
  id: string;
  cart_id: string;
  product_id: string;
  quantity: number;
  created_at: string;
  updated_at: string;
  product?: Product;
}

export interface Cart {
  id: string;
  user_id: string;
  items: CartItem[];
  created_at: string;
  updated_at: string;
}

export type OrderStatus =
  | 'new' | 'reserved' | 'pending_payment' | 'paid'
  | 'picked_up' | 'preparing' | 'completed' | 'cancelled' | 'failed';

export type PaymentStatus =
  | 'not_required' | 'pending' | 'authorized' | 'paid'
  | 'failed' | 'canceled' | 'refunded' | 'partially_refunded' | 'refund_failed_retry';

export type OrderType = 'online_payment' | 'in_store_payment';
export type FulfillmentType = 'pickup' | 'shipping';
export type OrderItemStatus = 'active' | 'refunded' | 'unavailable' | 'cancelled';

export interface Order {
  id: string;
  user_id: string;
  order_number: number;
  order_status: OrderStatus;
  payment_status: PaymentStatus;
  order_type: OrderType;
  fulfillment_type: FulfillmentType;
  subtotal_cent: number;
  vat_total_cent: number;
  shipping_total_cent: number;
  grand_total_cent: number;
  currency: string;
  invoice_requested: boolean;
  notes: string;
  pickup_date: string | null;
  pickup_slot: string | null;
  shipping_zip: string | null;
  shipping_address_snapshot: ShippingAddress | null;
  billing_address_snapshot: BillingAddress | null;
  invoice_profile_snapshot: InvoiceProfile | null;
  stripe_session_id: string | null;
  stripe_payment_intent_id: string | null;
  idempotency_key: string | null;
  related_order_id: string | null;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
  // Joined
  items?: OrderItem[];
  user?: Profile;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string | null;
  product_name_snapshot: string;
  product_slug_snapshot: string;
  quantity: number;
  unit_price_cent: number;
  discount_price_cent: number | null;
  vat_rate_snapshot: number;
  row_total_cent: number;
  row_vat_cent: number;
  row_status: OrderItemStatus;
  refund_cent: number;
  stripe_refund_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface ShippingRule {
  id: string;
  zip_code: string;
  cost_cent: number;
  is_active: boolean;
  description: string;
  estimated_days: string;
  priority: number;
  created_at: string;
  updated_at: string;
}

export interface Review {
  id: string;
  google_review_id: string | null;
  author_name: string;
  rating: number;
  text: string;
  review_date: string;
  is_visible: boolean;
  is_featured: boolean;
  source: string;
  created_at: string;
  updated_at: string;
}

export interface ReviewSyncLog {
  id: string;
  status: 'pending' | 'success' | 'failed';
  reviews_imported: number;
  error_message: string | null;
  created_at: string;
}

export interface AnalyticsEvent {
  event_name: string;
  page_path?: string;
  referrer?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  source_type?: string;
  user_id?: string | null;
  session_id?: string;
  product_id?: string | null;
  metadata?: Record<string, unknown>;
  is_admin?: boolean;
}

export interface AnalyticsDailySummary {
  id: string;
  summary_date: string;
  page_views: number;
  unique_visitors: number;
  registrations: number;
  logins: number;
  orders_created: number;
  orders_completed: number;
  whatsapp_clicks: number;
  facebook_clicks: number;
  instagram_clicks: number;
  hero_cta_clicks: number;
  reviews_cta_clicks: number;
  product_views: Record<string, number>;
  cart_additions: Record<string, number>;
  checkout_starts: number;
  checkout_completes: number;
  source_breakdown: Record<string, number>;
  created_at: string;
  updated_at: string;
}

export interface AdminAuditLog {
  id: string;
  admin_id: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  old_value: Record<string, unknown> | null;
  new_value: Record<string, unknown> | null;
  ip_address: string | null;
  created_at: string;
}

// ---- UI Helper Types ----

export type Locale = 'it' | 'en';

export interface PaginationParams {
  page: number;
  pageSize: number;
}

export interface ProductFilters {
  search?: string;
  category?: string;
  onlyAvailable?: boolean;
  minPrice?: number;
  maxPrice?: number;
  onlyDiscounted?: boolean;
  onlyShippable?: boolean;
  onlyPickup?: boolean;
  sortBy?: ProductSortOption;
}

export type ProductSortOption =
  | 'name_asc' | 'price_asc' | 'price_desc'
  | 'newest' | 'discount_desc' | 'available_first';

export interface CheckoutData {
  orderType: OrderType;
  fulfillmentType: FulfillmentType;
  shippingAddress?: ShippingAddress;
  billingAddress?: BillingAddress;
  invoiceRequested: boolean;
  invoiceProfile?: InvoiceProfile;
  notes: string;
  pickupDate?: string;
  pickupSlot?: string;
  shippingZip?: string;
  idempotencyKey: string;
}

// ---- State Machine ----

export const ORDER_STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  new: ['reserved', 'pending_payment', 'cancelled', 'failed'],
  reserved: ['pending_payment', 'paid', 'picked_up', 'preparing', 'cancelled'],
  pending_payment: ['paid', 'failed', 'cancelled'],
  paid: ['preparing', 'picked_up', 'completed'],
  picked_up: ['completed'],
  preparing: ['picked_up', 'completed'],
  completed: [],
  cancelled: [],
  failed: ['new'],
};

export const ORDER_STATUS_LABELS_IT: Record<OrderStatus, string> = {
  new: 'Nuovo',
  reserved: 'Prenotato',
  pending_payment: 'In attesa di pagamento',
  paid: 'Pagato',
  picked_up: 'Ritirato',
  preparing: 'In preparazione',
  completed: 'Completato',
  cancelled: 'Annullato',
  failed: 'Fallito',
};

export const ORDER_STATUS_LABELS_EN: Record<OrderStatus, string> = {
  new: 'New',
  reserved: 'Reserved',
  pending_payment: 'Pending Payment',
  paid: 'Paid',
  picked_up: 'Picked Up',
  preparing: 'Preparing',
  completed: 'Completed',
  cancelled: 'Cancelled',
  failed: 'Failed',
};

export const PAYMENT_STATUS_LABELS_IT: Record<PaymentStatus, string> = {
  not_required: 'Non richiesto',
  pending: 'In attesa',
  authorized: 'Autorizzato',
  paid: 'Pagato',
  failed: 'Fallito',
  canceled: 'Annullato',
  refunded: 'Rimborsato',
  partially_refunded: 'Parzialmente rimborsato',
  refund_failed_retry: 'Rimborso fallito da rifare',
};

export const PAYMENT_STATUS_LABELS_EN: Record<PaymentStatus, string> = {
  not_required: 'Not Required',
  pending: 'Pending',
  authorized: 'Authorized',
  paid: 'Paid',
  failed: 'Failed',
  canceled: 'Canceled',
  refunded: 'Refunded',
  partially_refunded: 'Partially Refunded',
  refund_failed_retry: 'Refund Failed - Retry',
};
