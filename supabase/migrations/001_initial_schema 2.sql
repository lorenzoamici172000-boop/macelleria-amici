-- ==============================================
-- Macelleria Amici - Complete Database Schema
-- Migration: 001_initial_schema
-- ==============================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For fuzzy text search

-- ==============================================
-- ENUM TYPES
-- ==============================================

CREATE TYPE order_status AS ENUM (
  'new', 'reserved', 'pending_payment', 'paid',
  'picked_up', 'preparing', 'completed', 'cancelled', 'failed'
);

CREATE TYPE payment_status AS ENUM (
  'not_required', 'pending', 'authorized', 'paid',
  'failed', 'canceled', 'refunded', 'partially_refunded', 'refund_failed_retry'
);

CREATE TYPE order_type AS ENUM ('online_payment', 'in_store_payment');
CREATE TYPE fulfillment_type AS ENUM ('pickup', 'shipping');
CREATE TYPE order_item_status AS ENUM ('active', 'refunded', 'unavailable', 'cancelled');
CREATE TYPE invoice_type AS ENUM ('private', 'company');
CREATE TYPE page_status AS ENUM ('draft', 'published');
CREATE TYPE reservation_status AS ENUM ('active', 'confirmed', 'expired', 'cancelled');

-- ==============================================
-- PROFILES
-- ==============================================

CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL DEFAULT '',
  last_name TEXT NOT NULL DEFAULT '',
  username TEXT NOT NULL,
  username_lower TEXT GENERATED ALWAYS AS (LOWER(username)) STORED,
  email TEXT NOT NULL DEFAULT '',
  phone TEXT DEFAULT '',
  role TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('customer', 'admin')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT username_format CHECK (
    LENGTH(username) >= 6 AND
    LENGTH(username) <= 13 AND
    username ~ '^[a-zA-Z0-9_]+$' AND
    username !~ '^_' AND
    username !~ '_$'
  ),
  CONSTRAINT username_unique UNIQUE (username_lower)
);

CREATE INDEX idx_profiles_username_lower ON profiles(username_lower);
CREATE INDEX idx_profiles_role ON profiles(role);

-- ==============================================
-- SHIPPING ADDRESSES
-- ==============================================

CREATE TABLE shipping_addresses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL DEFAULT '',
  last_name TEXT NOT NULL DEFAULT '',
  street TEXT NOT NULL DEFAULT '',
  street_number TEXT NOT NULL DEFAULT '',
  zip_code TEXT NOT NULL DEFAULT '',
  city TEXT NOT NULL DEFAULT '',
  province TEXT NOT NULL DEFAULT '',
  country TEXT NOT NULL DEFAULT 'Italia',
  phone TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT one_shipping_per_user UNIQUE (user_id)
);

-- ==============================================
-- BILLING ADDRESSES
-- ==============================================

CREATE TABLE billing_addresses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  addressee_name TEXT NOT NULL DEFAULT '',
  street TEXT NOT NULL DEFAULT '',
  street_number TEXT NOT NULL DEFAULT '',
  zip_code TEXT NOT NULL DEFAULT '',
  city TEXT NOT NULL DEFAULT '',
  province TEXT NOT NULL DEFAULT '',
  country TEXT NOT NULL DEFAULT 'Italia',
  phone TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT one_billing_per_user UNIQUE (user_id)
);

-- ==============================================
-- INVOICE PROFILES
-- ==============================================

CREATE TABLE invoice_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  invoice_type invoice_type NOT NULL DEFAULT 'private',
  first_name TEXT DEFAULT '',
  last_name TEXT DEFAULT '',
  tax_code TEXT DEFAULT '',
  company_name TEXT DEFAULT '',
  vat_number TEXT DEFAULT '',
  sdi_code TEXT DEFAULT '',
  pec TEXT DEFAULT '',
  full_address TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT one_invoice_per_user UNIQUE (user_id)
);

-- ==============================================
-- SITE SETTINGS (singleton pattern)
-- ==============================================

CREATE TABLE site_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  logo_url TEXT DEFAULT '',
  favicon_url TEXT DEFAULT '',
  hero_image_url TEXT DEFAULT '',
  hero_button_text TEXT DEFAULT 'Scopri i prodotti',
  hero_button_link TEXT DEFAULT '/prodotti',
  reviews_section_enabled BOOLEAN NOT NULL DEFAULT true,
  reviews_button_text TEXT DEFAULT 'Vedi di più',
  whatsapp_floating_enabled BOOLEAN NOT NULL DEFAULT true,
  -- Theme colors
  color_primary TEXT DEFAULT '#1a1a1a',
  color_primary_foreground TEXT DEFAULT '#c0c0c0',
  color_secondary TEXT DEFAULT '#c0c0c0',
  color_secondary_foreground TEXT DEFAULT '#1a1a1a',
  color_accent TEXT DEFAULT '#8a8a8a',
  color_background TEXT DEFAULT '#ffffff',
  color_foreground TEXT DEFAULT '#1a1a1a',
  color_navbar_bg TEXT DEFAULT '#1a1a1a',
  color_navbar_text TEXT DEFAULT '#c0c0c0',
  color_footer_bg TEXT DEFAULT '#1a1a1a',
  color_footer_text TEXT DEFAULT '#c0c0c0',
  color_muted TEXT DEFAULT '#f5f5f5',
  color_border TEXT DEFAULT '#e5e5e5',
  -- Fonts
  font_display TEXT DEFAULT 'BrushScriptMT',
  font_body TEXT DEFAULT 'system-ui',
  font_display_url TEXT DEFAULT '',
  font_body_url TEXT DEFAULT '',
  -- Buttons
  button_border_radius TEXT DEFAULT '0.5rem',
  button_padding TEXT DEFAULT '0.75rem 1.5rem',
  -- Hero button styling
  hero_btn_bg TEXT DEFAULT '#1a1a1a',
  hero_btn_text TEXT DEFAULT '#c0c0c0',
  hero_btn_hover_bg TEXT DEFAULT '#333333',
  hero_btn_border TEXT DEFAULT '#c0c0c0',
  hero_btn_radius TEXT DEFAULT '0.5rem',
  hero_btn_font_size TEXT DEFAULT '1.125rem',
  -- Login/Register button styling
  login_btn_bg TEXT DEFAULT 'transparent',
  login_btn_text TEXT DEFAULT '#c0c0c0',
  login_btn_border TEXT DEFAULT '#c0c0c0',
  register_btn_bg TEXT DEFAULT '#c0c0c0',
  register_btn_text TEXT DEFAULT '#1a1a1a',
  register_btn_border TEXT DEFAULT '#c0c0c0',
  --
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================
-- BUSINESS SETTINGS (singleton pattern)
-- ==============================================

CREATE TABLE business_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_name TEXT NOT NULL DEFAULT 'Macelleria Amici',
  operational_address TEXT DEFAULT 'Via Luigi Capuana 6A, Roma, 00137',
  legal_address TEXT DEFAULT 'Via Nomentana 761, Roma, 00137',
  phone TEXT DEFAULT '06 64505881',
  whatsapp TEXT DEFAULT '3757059237',
  email TEXT DEFAULT '',
  website TEXT DEFAULT '',
  opening_hours JSONB DEFAULT '[]'::JSONB,
  -- Opening hours format: [{day: 0-6, open: "09:00", close: "19:00", closed: false}]
  pickup_slots JSONB DEFAULT '[]'::JSONB,
  -- Pickup slots format: [{day: 0-6, slots: ["09:00-10:00", "10:00-11:00"...]}]
  extraordinary_closures JSONB DEFAULT '[]'::JSONB,
  -- Format: [{date: "2025-12-25", reason: "Natale"}]
  holidays JSONB DEFAULT '[]'::JSONB,
  google_maps_embed_url TEXT DEFAULT '',
  facebook_url TEXT DEFAULT '',
  instagram_url TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================
-- CATEGORIES
-- ==============================================

CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT DEFAULT '',
  display_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_categories_slug ON categories(slug);
CREATE INDEX idx_categories_active ON categories(is_active);

-- ==============================================
-- PRODUCTS
-- ==============================================

CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT DEFAULT '',
  price_cent INT NOT NULL CHECK (price_cent > 0),
  discount_price_cent INT DEFAULT NULL CHECK (discount_price_cent IS NULL OR discount_price_cent > 0),
  stock INT NOT NULL DEFAULT 0 CHECK (stock >= 0),
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  vat_rate INT NOT NULL DEFAULT 2200, -- 22.00% stored as basis points (2200 = 22%)
  pickup_enabled BOOLEAN NOT NULL DEFAULT true,
  shipping_enabled BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  display_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT valid_discount CHECK (
    discount_price_cent IS NULL OR discount_price_cent < price_cent
  )
);

CREATE INDEX idx_products_slug ON products(slug);
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_active ON products(is_active);
CREATE INDEX idx_products_name_trgm ON products USING GIN (name gin_trgm_ops);
CREATE INDEX idx_products_description_trgm ON products USING GIN (description gin_trgm_ops);
CREATE INDEX idx_products_stock ON products(stock);

-- ==============================================
-- PRODUCT IMAGES
-- ==============================================

CREATE TABLE product_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  alt_text TEXT DEFAULT '',
  display_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_product_images_product ON product_images(product_id);

-- ==============================================
-- PAGES
-- ==============================================

CREATE TABLE pages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  content JSONB DEFAULT '{}'::JSONB,
  status page_status NOT NULL DEFAULT 'draft',
  meta_title TEXT DEFAULT '',
  meta_description TEXT DEFAULT '',
  featured_image_url TEXT DEFAULT '',
  display_order INT NOT NULL DEFAULT 0,
  is_system BOOLEAN NOT NULL DEFAULT false, -- true for Chi Siamo, Privacy, Cookie etc.
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_pages_slug ON pages(slug);
CREATE INDEX idx_pages_status ON pages(status);

-- ==============================================
-- NAVIGATION LINKS
-- ==============================================

CREATE TABLE navigation_links (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  label_it TEXT NOT NULL,
  label_en TEXT DEFAULT '',
  href TEXT NOT NULL,
  display_order INT NOT NULL DEFAULT 0,
  is_visible BOOLEAN NOT NULL DEFAULT true,
  page_id UUID REFERENCES pages(id) ON DELETE SET NULL,
  is_system BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_nav_links_order ON navigation_links(display_order);

-- ==============================================
-- MEDIA ASSETS
-- ==============================================

CREATE TABLE media_assets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  filename TEXT NOT NULL,
  url TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  size_bytes INT NOT NULL DEFAULT 0,
  alt_text TEXT DEFAULT '',
  uploaded_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================
-- WISHLISTS
-- ==============================================

CREATE TABLE wishlists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT one_wishlist_per_user UNIQUE (user_id)
);

-- ==============================================
-- WISHLIST ITEMS
-- ==============================================

CREATE TABLE wishlist_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wishlist_id UUID NOT NULL REFERENCES wishlists(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_wishlist_item UNIQUE (wishlist_id, product_id)
);

CREATE INDEX idx_wishlist_items_wishlist ON wishlist_items(wishlist_id);

-- ==============================================
-- CARTS
-- ==============================================

CREATE TABLE carts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT one_cart_per_user UNIQUE (user_id)
);

-- ==============================================
-- CART ITEMS
-- ==============================================

CREATE TABLE cart_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cart_id UUID NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity INT NOT NULL DEFAULT 1 CHECK (quantity > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_cart_item UNIQUE (cart_id, product_id)
);

CREATE INDEX idx_cart_items_cart ON cart_items(cart_id);

-- ==============================================
-- STOCK RESERVATIONS
-- ==============================================

CREATE TABLE stock_reservations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id),
  product_id UUID NOT NULL REFERENCES products(id),
  quantity INT NOT NULL CHECK (quantity > 0),
  status reservation_status NOT NULL DEFAULT 'active',
  expires_at TIMESTAMPTZ NOT NULL,
  order_id UUID DEFAULT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_reservations_status ON stock_reservations(status);
CREATE INDEX idx_reservations_expires ON stock_reservations(expires_at);
CREATE INDEX idx_reservations_user ON stock_reservations(user_id);

-- ==============================================
-- SHIPPING RULES
-- ==============================================

CREATE TABLE shipping_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  zip_code TEXT NOT NULL CHECK (zip_code ~ '^\d{5}$'),
  cost_cent INT NOT NULL CHECK (cost_cent >= 0),
  is_active BOOLEAN NOT NULL DEFAULT true,
  description TEXT DEFAULT '',
  estimated_days TEXT DEFAULT '',
  priority INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Prevent duplicate active rules for same ZIP
CREATE UNIQUE INDEX idx_shipping_rules_unique_active
  ON shipping_rules(zip_code) WHERE is_active = true;

-- ==============================================
-- ORDERS
-- ==============================================

CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id),
  order_number SERIAL NOT NULL,
  order_status order_status NOT NULL DEFAULT 'new',
  payment_status payment_status NOT NULL DEFAULT 'pending',
  order_type order_type NOT NULL,
  fulfillment_type fulfillment_type NOT NULL,
  subtotal_cent INT NOT NULL DEFAULT 0,
  vat_total_cent INT NOT NULL DEFAULT 0,
  shipping_total_cent INT NOT NULL DEFAULT 0,
  grand_total_cent INT NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'EUR',
  invoice_requested BOOLEAN NOT NULL DEFAULT false,
  notes TEXT DEFAULT '',
  -- Pickup data
  pickup_date DATE DEFAULT NULL,
  pickup_slot TEXT DEFAULT NULL,
  -- Shipping snapshot
  shipping_zip TEXT DEFAULT NULL,
  shipping_address_snapshot JSONB DEFAULT NULL,
  billing_address_snapshot JSONB DEFAULT NULL,
  invoice_profile_snapshot JSONB DEFAULT NULL,
  -- Stripe
  stripe_session_id TEXT DEFAULT NULL,
  stripe_payment_intent_id TEXT DEFAULT NULL,
  -- Idempotency
  idempotency_key TEXT DEFAULT NULL UNIQUE,
  -- Mixed order link
  related_order_id UUID DEFAULT NULL REFERENCES orders(id),
  -- Soft delete
  is_deleted BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_orders_user ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(order_status);
CREATE INDEX idx_orders_payment ON orders(payment_status);
CREATE INDEX idx_orders_number ON orders(order_number);
CREATE INDEX idx_orders_created ON orders(created_at DESC);
CREATE INDEX idx_orders_stripe_session ON orders(stripe_session_id);

-- ==============================================
-- ORDER ITEMS
-- ==============================================

CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  product_name_snapshot TEXT NOT NULL,
  product_slug_snapshot TEXT DEFAULT '',
  quantity INT NOT NULL CHECK (quantity > 0),
  unit_price_cent INT NOT NULL,
  discount_price_cent INT DEFAULT NULL,
  vat_rate_snapshot INT NOT NULL DEFAULT 2200,
  row_total_cent INT NOT NULL,
  row_vat_cent INT NOT NULL DEFAULT 0,
  row_status order_item_status NOT NULL DEFAULT 'active',
  refund_cent INT NOT NULL DEFAULT 0,
  stripe_refund_id TEXT DEFAULT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_order_items_order ON order_items(order_id);

-- ==============================================
-- PAYMENTS (log of payment events)
-- ==============================================

CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id),
  stripe_event_id TEXT DEFAULT NULL,
  stripe_payment_intent_id TEXT DEFAULT NULL,
  event_type TEXT NOT NULL, -- e.g. 'checkout.session.completed', 'charge.refunded'
  amount_cent INT NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'EUR',
  status TEXT NOT NULL DEFAULT '',
  metadata JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_payments_order ON payments(order_id);
CREATE INDEX idx_payments_stripe_event ON payments(stripe_event_id);

-- ==============================================
-- REVIEWS
-- ==============================================

CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  google_review_id TEXT UNIQUE,
  author_name TEXT NOT NULL DEFAULT '',
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  text TEXT DEFAULT '',
  review_date TIMESTAMPTZ DEFAULT NOW(),
  is_visible BOOLEAN NOT NULL DEFAULT true,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  source TEXT NOT NULL DEFAULT 'google',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_reviews_visible ON reviews(is_visible);
CREATE INDEX idx_reviews_date ON reviews(review_date DESC);

-- ==============================================
-- REVIEW SYNC LOGS
-- ==============================================

CREATE TABLE review_sync_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  status TEXT NOT NULL DEFAULT 'pending', -- pending, success, failed
  reviews_imported INT NOT NULL DEFAULT 0,
  error_message TEXT DEFAULT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================
-- ANALYTICS EVENTS
-- ==============================================

CREATE TABLE analytics_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_name TEXT NOT NULL,
  page_path TEXT DEFAULT '',
  referrer TEXT DEFAULT '',
  utm_source TEXT DEFAULT '',
  utm_medium TEXT DEFAULT '',
  utm_campaign TEXT DEFAULT '',
  source_type TEXT DEFAULT 'direct', -- direct, whatsapp, facebook, instagram, referrer
  user_id UUID DEFAULT NULL,
  session_id TEXT DEFAULT '',
  product_id UUID DEFAULT NULL,
  metadata JSONB DEFAULT '{}'::JSONB,
  is_admin BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_analytics_name ON analytics_events(event_name);
CREATE INDEX idx_analytics_created ON analytics_events(created_at);
CREATE INDEX idx_analytics_source ON analytics_events(source_type);
CREATE INDEX idx_analytics_admin ON analytics_events(is_admin);

-- ==============================================
-- ANALYTICS DAILY SUMMARY
-- ==============================================

CREATE TABLE analytics_daily_summary (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  summary_date DATE NOT NULL,
  page_views INT NOT NULL DEFAULT 0,
  unique_visitors INT NOT NULL DEFAULT 0,
  registrations INT NOT NULL DEFAULT 0,
  logins INT NOT NULL DEFAULT 0,
  orders_created INT NOT NULL DEFAULT 0,
  orders_completed INT NOT NULL DEFAULT 0,
  whatsapp_clicks INT NOT NULL DEFAULT 0,
  facebook_clicks INT NOT NULL DEFAULT 0,
  instagram_clicks INT NOT NULL DEFAULT 0,
  hero_cta_clicks INT NOT NULL DEFAULT 0,
  reviews_cta_clicks INT NOT NULL DEFAULT 0,
  product_views JSONB DEFAULT '{}'::JSONB,
  cart_additions JSONB DEFAULT '{}'::JSONB,
  checkout_starts INT NOT NULL DEFAULT 0,
  checkout_completes INT NOT NULL DEFAULT 0,
  source_breakdown JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_summary_date UNIQUE (summary_date)
);

CREATE INDEX idx_summary_date ON analytics_daily_summary(summary_date DESC);

-- ==============================================
-- ADMIN AUDIT LOGS
-- ==============================================

CREATE TABLE admin_audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_id UUID NOT NULL REFERENCES profiles(id),
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT DEFAULT NULL,
  old_value JSONB DEFAULT NULL,
  new_value JSONB DEFAULT NULL,
  ip_address TEXT DEFAULT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_admin ON admin_audit_logs(admin_id);
CREATE INDEX idx_audit_created ON admin_audit_logs(created_at DESC);
CREATE INDEX idx_audit_action ON admin_audit_logs(action);

-- ==============================================
-- HELPER FUNCTIONS
-- ==============================================

-- Check if user is admin
CREATE OR REPLACE FUNCTION is_admin(user_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = user_id AND role = 'admin'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Auto-update updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOR tbl IN
    SELECT unnest(ARRAY[
      'profiles', 'shipping_addresses', 'billing_addresses', 'invoice_profiles',
      'site_settings', 'business_settings', 'categories', 'products',
      'pages', 'navigation_links', 'carts', 'cart_items',
      'stock_reservations', 'shipping_rules', 'orders', 'order_items',
      'reviews', 'analytics_daily_summary'
    ])
  LOOP
    EXECUTE format(
      'CREATE TRIGGER trg_%s_updated_at
       BEFORE UPDATE ON %I
       FOR EACH ROW EXECUTE FUNCTION update_updated_at()',
      tbl, tbl
    );
  END LOOP;
END;
$$;

-- ==============================================
-- RPC: ATOMIC STOCK RESERVATION + ORDER CREATION
-- ==============================================

CREATE OR REPLACE FUNCTION create_order_with_stock(
  p_user_id UUID,
  p_order_type order_type,
  p_fulfillment_type fulfillment_type,
  p_items JSONB, -- [{product_id, quantity}]
  p_shipping_zip TEXT DEFAULT NULL,
  p_notes TEXT DEFAULT '',
  p_invoice_requested BOOLEAN DEFAULT false,
  p_pickup_date DATE DEFAULT NULL,
  p_pickup_slot TEXT DEFAULT NULL,
  p_shipping_address JSONB DEFAULT NULL,
  p_billing_address JSONB DEFAULT NULL,
  p_invoice_profile JSONB DEFAULT NULL,
  p_idempotency_key TEXT DEFAULT NULL,
  p_related_order_id UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_order_id UUID;
  v_subtotal INT := 0;
  v_vat_total INT := 0;
  v_shipping_cost INT := 0;
  v_item RECORD;
  v_product RECORD;
  v_effective_price INT;
  v_row_total INT;
  v_row_vat INT;
BEGIN
  -- Check idempotency
  IF p_idempotency_key IS NOT NULL THEN
    SELECT id INTO v_order_id FROM orders
    WHERE idempotency_key = p_idempotency_key AND user_id = p_user_id;
    IF v_order_id IS NOT NULL THEN
      RETURN v_order_id;
    END IF;
  END IF;

  -- Calculate shipping cost if applicable
  IF p_fulfillment_type = 'shipping' AND p_shipping_zip IS NOT NULL THEN
    SELECT cost_cent INTO v_shipping_cost
    FROM shipping_rules
    WHERE zip_code = p_shipping_zip AND is_active = true
    LIMIT 1;

    IF v_shipping_cost IS NULL THEN
      RAISE EXCEPTION 'Shipping not available for ZIP: %', p_shipping_zip;
    END IF;
  END IF;

  -- Create order first (we'll update totals after)
  INSERT INTO orders (
    id, user_id, order_type, fulfillment_type,
    order_status, payment_status,
    shipping_zip, shipping_address_snapshot,
    billing_address_snapshot, invoice_profile_snapshot,
    notes, invoice_requested, pickup_date, pickup_slot,
    idempotency_key, related_order_id,
    shipping_total_cent
  ) VALUES (
    uuid_generate_v4(), p_user_id, p_order_type, p_fulfillment_type,
    CASE WHEN p_order_type = 'in_store_payment' THEN 'reserved' ELSE 'new' END,
    CASE WHEN p_order_type = 'in_store_payment' THEN 'not_required' ELSE 'pending' END,
    p_shipping_zip, p_shipping_address,
    p_billing_address, p_invoice_profile,
    p_notes, p_invoice_requested, p_pickup_date, p_pickup_slot,
    p_idempotency_key, p_related_order_id,
    v_shipping_cost
  ) RETURNING id INTO v_order_id;

  -- Process each item atomically
  FOR v_item IN SELECT * FROM jsonb_to_recordset(p_items) AS x(product_id UUID, quantity INT)
  LOOP
    -- Lock and check product
    SELECT * INTO v_product FROM products
    WHERE id = v_item.product_id AND is_active = true
    FOR UPDATE;

    IF v_product IS NULL THEN
      RAISE EXCEPTION 'Product not found or inactive: %', v_item.product_id;
    END IF;

    IF v_product.stock < v_item.quantity THEN
      RAISE EXCEPTION 'Insufficient stock for product: % (available: %, requested: %)',
        v_product.name, v_product.stock, v_item.quantity;
    END IF;

    -- Decrement stock atomically
    UPDATE products
    SET stock = stock - v_item.quantity
    WHERE id = v_item.product_id AND stock >= v_item.quantity;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Race condition: stock changed for product: %', v_product.name;
    END IF;

    -- Calculate prices in cents
    v_effective_price := COALESCE(v_product.discount_price_cent, v_product.price_cent);
    v_row_total := v_effective_price * v_item.quantity;
    -- VAT: price is inclusive, extract VAT amount
    -- Formula: vat_amount = total - (total * 10000 / (10000 + vat_rate))
    v_row_vat := v_row_total - (v_row_total * 10000 / (10000 + v_product.vat_rate));

    -- Insert order item
    INSERT INTO order_items (
      order_id, product_id, product_name_snapshot, product_slug_snapshot,
      quantity, unit_price_cent, discount_price_cent,
      vat_rate_snapshot, row_total_cent, row_vat_cent
    ) VALUES (
      v_order_id, v_item.product_id, v_product.name, v_product.slug,
      v_item.quantity, v_product.price_cent, v_product.discount_price_cent,
      v_product.vat_rate, v_row_total, v_row_vat
    );

    v_subtotal := v_subtotal + v_row_total;
    v_vat_total := v_vat_total + v_row_vat;

    -- Mark any active reservation as confirmed
    UPDATE stock_reservations
    SET status = 'confirmed', order_id = v_order_id
    WHERE user_id = p_user_id
      AND product_id = v_item.product_id
      AND status = 'active';
  END LOOP;

  -- Update order totals
  UPDATE orders SET
    subtotal_cent = v_subtotal,
    vat_total_cent = v_vat_total,
    grand_total_cent = v_subtotal + v_shipping_cost
  WHERE id = v_order_id;

  RETURN v_order_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==============================================
-- RPC: RESERVE STOCK (15 min)
-- ==============================================

CREATE OR REPLACE FUNCTION reserve_stock(
  p_user_id UUID,
  p_items JSONB -- [{product_id, quantity}]
)
RETURNS BOOLEAN AS $$
DECLARE
  v_item RECORD;
  v_product RECORD;
BEGIN
  -- Cancel any existing active reservations for this user
  UPDATE stock_reservations
  SET status = 'cancelled'
  WHERE user_id = p_user_id AND status = 'active';

  FOR v_item IN SELECT * FROM jsonb_to_recordset(p_items) AS x(product_id UUID, quantity INT)
  LOOP
    SELECT * INTO v_product FROM products
    WHERE id = v_item.product_id AND is_active = true
    FOR UPDATE;

    IF v_product IS NULL OR v_product.stock < v_item.quantity THEN
      -- Rollback any reservations made in this call
      UPDATE stock_reservations
      SET status = 'cancelled'
      WHERE user_id = p_user_id AND status = 'active'
        AND created_at > NOW() - INTERVAL '1 second';
      RETURN false;
    END IF;

    -- Temporarily decrement stock
    UPDATE products SET stock = stock - v_item.quantity
    WHERE id = v_item.product_id;

    INSERT INTO stock_reservations (user_id, product_id, quantity, status, expires_at)
    VALUES (p_user_id, v_item.product_id, v_item.quantity, 'active', NOW() + INTERVAL '15 minutes');
  END LOOP;

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==============================================
-- RPC: RELEASE EXPIRED RESERVATIONS
-- ==============================================

CREATE OR REPLACE FUNCTION release_expired_reservations()
RETURNS INT AS $$
DECLARE
  v_count INT := 0;
  v_reservation RECORD;
BEGIN
  FOR v_reservation IN
    SELECT * FROM stock_reservations
    WHERE status = 'active' AND expires_at < NOW()
    FOR UPDATE SKIP LOCKED
  LOOP
    -- Return stock
    UPDATE products SET stock = stock + v_reservation.quantity
    WHERE id = v_reservation.product_id;

    UPDATE stock_reservations SET status = 'expired'
    WHERE id = v_reservation.id;

    v_count := v_count + 1;
  END LOOP;

  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==============================================
-- RPC: PROCESS REFUND (admin only)
-- ==============================================

CREATE OR REPLACE FUNCTION process_refund(
  p_admin_id UUID,
  p_order_item_id UUID,
  p_refund_cent INT,
  p_stripe_refund_id TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  v_item RECORD;
  v_order RECORD;
BEGIN
  -- Verify admin
  IF NOT is_admin(p_admin_id) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  SELECT * INTO v_item FROM order_items WHERE id = p_order_item_id FOR UPDATE;
  IF v_item IS NULL THEN RAISE EXCEPTION 'Order item not found'; END IF;

  SELECT * INTO v_order FROM orders WHERE id = v_item.order_id FOR UPDATE;

  -- Update item
  UPDATE order_items SET
    row_status = 'refunded',
    refund_cent = p_refund_cent,
    stripe_refund_id = p_stripe_refund_id
  WHERE id = p_order_item_id;

  -- Return stock
  IF v_item.product_id IS NOT NULL THEN
    UPDATE products SET stock = stock + v_item.quantity
    WHERE id = v_item.product_id;
  END IF;

  -- Update order totals and payment status
  UPDATE orders SET
    grand_total_cent = grand_total_cent - p_refund_cent,
    payment_status = CASE
      WHEN (SELECT COUNT(*) FROM order_items WHERE order_id = v_order.id AND row_status = 'active') = 0
        THEN 'refunded'::payment_status
      ELSE 'partially_refunded'::payment_status
    END
  WHERE id = v_order.id;

  -- Audit log
  INSERT INTO admin_audit_logs (admin_id, action, entity_type, entity_id, new_value)
  VALUES (p_admin_id, 'refund', 'order_item', p_order_item_id::TEXT,
    jsonb_build_object('refund_cent', p_refund_cent, 'stripe_refund_id', p_stripe_refund_id));

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==============================================
-- ROW LEVEL SECURITY POLICIES
-- ==============================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipping_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE navigation_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE media_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE wishlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE wishlist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipping_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_sync_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_daily_summary ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_audit_logs ENABLE ROW LEVEL SECURITY;

-- ---- PROFILES ----
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id AND role = 'customer'); -- Can't promote self
CREATE POLICY "Admin can view all profiles" ON profiles
  FOR SELECT USING (is_admin(auth.uid()));
CREATE POLICY "Admin can update all profiles" ON profiles
  FOR UPDATE USING (is_admin(auth.uid()));
CREATE POLICY "Service can insert profiles" ON profiles
  FOR INSERT WITH CHECK (true); -- Handled by trigger on auth.users

-- ---- SHIPPING ADDRESSES ----
CREATE POLICY "Users manage own shipping" ON shipping_addresses
  FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Admin reads all shipping" ON shipping_addresses
  FOR SELECT USING (is_admin(auth.uid()));

-- ---- BILLING ADDRESSES ----
CREATE POLICY "Users manage own billing" ON billing_addresses
  FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Admin reads all billing" ON billing_addresses
  FOR SELECT USING (is_admin(auth.uid()));

-- ---- INVOICE PROFILES ----
CREATE POLICY "Users manage own invoice" ON invoice_profiles
  FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Admin reads all invoices" ON invoice_profiles
  FOR SELECT USING (is_admin(auth.uid()));

-- ---- SITE SETTINGS (public read, admin write) ----
CREATE POLICY "Anyone can read site_settings" ON site_settings
  FOR SELECT USING (true);
CREATE POLICY "Admin can modify site_settings" ON site_settings
  FOR ALL USING (is_admin(auth.uid()));

-- ---- BUSINESS SETTINGS (public read, admin write) ----
CREATE POLICY "Anyone can read business_settings" ON business_settings
  FOR SELECT USING (true);
CREATE POLICY "Admin can modify business_settings" ON business_settings
  FOR ALL USING (is_admin(auth.uid()));

-- ---- CATEGORIES (public read, admin write) ----
CREATE POLICY "Anyone can read categories" ON categories
  FOR SELECT USING (true);
CREATE POLICY "Admin manages categories" ON categories
  FOR ALL USING (is_admin(auth.uid()));

-- ---- PRODUCTS (public read active, admin all) ----
CREATE POLICY "Anyone can read active products" ON products
  FOR SELECT USING (is_active = true OR is_admin(auth.uid()));
CREATE POLICY "Admin manages products" ON products
  FOR ALL USING (is_admin(auth.uid()));

-- ---- PRODUCT IMAGES (public read, admin write) ----
CREATE POLICY "Anyone can read product images" ON product_images
  FOR SELECT USING (true);
CREATE POLICY "Admin manages product images" ON product_images
  FOR ALL USING (is_admin(auth.uid()));

-- ---- PAGES ----
CREATE POLICY "Anyone can read published pages" ON pages
  FOR SELECT USING (status = 'published' OR is_admin(auth.uid()));
CREATE POLICY "Admin manages pages" ON pages
  FOR ALL USING (is_admin(auth.uid()));

-- ---- NAVIGATION LINKS ----
CREATE POLICY "Anyone can read visible nav links" ON navigation_links
  FOR SELECT USING (is_visible = true OR is_admin(auth.uid()));
CREATE POLICY "Admin manages nav links" ON navigation_links
  FOR ALL USING (is_admin(auth.uid()));

-- ---- MEDIA ASSETS ----
CREATE POLICY "Anyone can read media" ON media_assets
  FOR SELECT USING (true);
CREATE POLICY "Admin manages media" ON media_assets
  FOR ALL USING (is_admin(auth.uid()));

-- ---- WISHLISTS ----
CREATE POLICY "Users manage own wishlist" ON wishlists
  FOR ALL USING (auth.uid() = user_id);

-- ---- WISHLIST ITEMS ----
CREATE POLICY "Users manage own wishlist items" ON wishlist_items
  FOR ALL USING (
    wishlist_id IN (SELECT id FROM wishlists WHERE user_id = auth.uid())
  );

-- ---- CARTS ----
CREATE POLICY "Users manage own cart" ON carts
  FOR ALL USING (auth.uid() = user_id);

-- ---- CART ITEMS ----
CREATE POLICY "Users manage own cart items" ON cart_items
  FOR ALL USING (
    cart_id IN (SELECT id FROM carts WHERE user_id = auth.uid())
  );

-- ---- STOCK RESERVATIONS ----
CREATE POLICY "Users can see own reservations" ON stock_reservations
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admin manages reservations" ON stock_reservations
  FOR ALL USING (is_admin(auth.uid()));

-- ---- SHIPPING RULES ----
CREATE POLICY "Anyone can read active shipping rules" ON shipping_rules
  FOR SELECT USING (is_active = true OR is_admin(auth.uid()));
CREATE POLICY "Admin manages shipping rules" ON shipping_rules
  FOR ALL USING (is_admin(auth.uid()));

-- ---- ORDERS ----
CREATE POLICY "Users read own orders" ON orders
  FOR SELECT USING (auth.uid() = user_id AND is_deleted = false);
CREATE POLICY "Admin reads all orders" ON orders
  FOR SELECT USING (is_admin(auth.uid()));
CREATE POLICY "Admin updates orders" ON orders
  FOR UPDATE USING (is_admin(auth.uid()));
-- Insert via RPC function (SECURITY DEFINER)

-- ---- ORDER ITEMS ----
CREATE POLICY "Users read own order items" ON order_items
  FOR SELECT USING (
    order_id IN (SELECT id FROM orders WHERE user_id = auth.uid())
  );
CREATE POLICY "Admin reads all order items" ON order_items
  FOR SELECT USING (is_admin(auth.uid()));
CREATE POLICY "Admin updates order items" ON order_items
  FOR UPDATE USING (is_admin(auth.uid()));

-- ---- PAYMENTS ----
CREATE POLICY "Users read own payments" ON payments
  FOR SELECT USING (
    order_id IN (SELECT id FROM orders WHERE user_id = auth.uid())
  );
CREATE POLICY "Admin reads all payments" ON payments
  FOR SELECT USING (is_admin(auth.uid()));

-- ---- REVIEWS (public read, admin write) ----
CREATE POLICY "Anyone can read visible reviews" ON reviews
  FOR SELECT USING (is_visible = true OR is_admin(auth.uid()));
CREATE POLICY "Admin manages reviews" ON reviews
  FOR ALL USING (is_admin(auth.uid()));

-- ---- REVIEW SYNC LOGS ----
CREATE POLICY "Admin reads sync logs" ON review_sync_logs
  FOR SELECT USING (is_admin(auth.uid()));

-- ---- ANALYTICS EVENTS ----
CREATE POLICY "Insert events (authenticated or anon)" ON analytics_events
  FOR INSERT WITH CHECK (true);
CREATE POLICY "Admin reads analytics" ON analytics_events
  FOR SELECT USING (is_admin(auth.uid()));

-- ---- ANALYTICS DAILY SUMMARY ----
CREATE POLICY "Admin reads summaries" ON analytics_daily_summary
  FOR SELECT USING (is_admin(auth.uid()));

-- ---- ADMIN AUDIT LOGS ----
CREATE POLICY "Admin reads audit logs" ON admin_audit_logs
  FOR SELECT USING (is_admin(auth.uid()));

-- ==============================================
-- TRIGGER: Auto-create profile on user signup
-- ==============================================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, first_name, last_name, username)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'username', 'user_' || LEFT(NEW.id::TEXT, 8))
  );

  -- Auto-create wishlist
  INSERT INTO wishlists (user_id) VALUES (NEW.id);
  -- Auto-create cart
  INSERT INTO carts (user_id) VALUES (NEW.id);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ==============================================
-- STORAGE BUCKETS (run via Supabase dashboard or API)
-- ==============================================
-- These need to be created via Supabase Storage API:
-- Bucket: 'site-assets' (public) - logo, favicon, hero, page images
-- Bucket: 'product-images' (public) - product images
-- Bucket: 'media' (public) - general media uploads

-- Storage policies would be:
-- site-assets: public read, admin write
-- product-images: public read, admin write
-- media: public read, admin write
