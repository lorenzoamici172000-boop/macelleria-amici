-- ==============================================
-- Migration: 002_storage_and_cron
-- Storage buckets, cron jobs, additional indexes
-- ==============================================

-- ==============================================
-- STORAGE BUCKETS
-- Run via Supabase SQL editor or management API
-- ==============================================

-- Create storage buckets (if not exists)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('site-assets', 'site-assets', true, 10485760, ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/svg+xml', 'image/x-icon']),
  ('product-images', 'product-images', true, 10485760, ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']),
  ('media', 'media', true, 10485760, ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO NOTHING;

-- ==============================================
-- STORAGE POLICIES
-- ==============================================

-- site-assets: public read, admin write
CREATE POLICY "Public read site-assets" ON storage.objects
  FOR SELECT USING (bucket_id = 'site-assets');

CREATE POLICY "Admin write site-assets" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'site-assets'
    AND is_admin(auth.uid())
  );

CREATE POLICY "Admin update site-assets" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'site-assets'
    AND is_admin(auth.uid())
  );

CREATE POLICY "Admin delete site-assets" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'site-assets'
    AND is_admin(auth.uid())
  );

-- product-images: public read, admin write
CREATE POLICY "Public read product-images" ON storage.objects
  FOR SELECT USING (bucket_id = 'product-images');

CREATE POLICY "Admin write product-images" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'product-images'
    AND is_admin(auth.uid())
  );

CREATE POLICY "Admin update product-images" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'product-images'
    AND is_admin(auth.uid())
  );

CREATE POLICY "Admin delete product-images" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'product-images'
    AND is_admin(auth.uid())
  );

-- media: public read, admin write
CREATE POLICY "Public read media" ON storage.objects
  FOR SELECT USING (bucket_id = 'media');

CREATE POLICY "Admin write media" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'media'
    AND is_admin(auth.uid())
  );

CREATE POLICY "Admin delete media" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'media'
    AND is_admin(auth.uid())
  );

-- ==============================================
-- PG_CRON SCHEDULED JOBS (if pg_cron extension is enabled)
-- ==============================================

-- Release expired stock reservations every 5 minutes
-- SELECT cron.schedule(
--   'release-expired-stock',
--   '*/5 * * * *',
--   $$SELECT release_expired_reservations()$$
-- );

-- Aggregate analytics daily at 4:00 AM
-- SELECT cron.schedule(
--   'aggregate-daily-stats',
--   '0 4 * * *',
--   $$SELECT net.http_post(
--     url := current_setting('app.settings.supabase_url') || '/functions/v1/aggregate-stats',
--     headers := jsonb_build_object(
--       'Content-Type', 'application/json',
--       'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
--     ),
--     body := '{}'
--   )$$
-- );

-- Sync reviews daily at 3:00 AM
-- SELECT cron.schedule(
--   'sync-google-reviews',
--   '0 3 * * *',
--   $$SELECT net.http_post(
--     url := current_setting('app.settings.supabase_url') || '/functions/v1/sync-reviews',
--     headers := jsonb_build_object(
--       'Content-Type', 'application/json',
--       'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
--     ),
--     body := '{}'
--   )$$
-- );

-- ==============================================
-- ADDITIONAL INDEXES for performance
-- ==============================================

-- Full text search on products
CREATE INDEX IF NOT EXISTS idx_products_search
  ON products USING GIN (
    to_tsvector('italian', name || ' ' || COALESCE(description, ''))
  );

-- Orders by user and date
CREATE INDEX IF NOT EXISTS idx_orders_user_created
  ON orders(user_id, created_at DESC);

-- Active reservations for cleanup
CREATE INDEX IF NOT EXISTS idx_reservations_active_expiry
  ON stock_reservations(status, expires_at)
  WHERE status = 'active';

-- Analytics non-admin events
CREATE INDEX IF NOT EXISTS idx_analytics_events_nonadmin
  ON analytics_events(created_at, event_name)
  WHERE is_admin = false;

-- Cart items with product join
CREATE INDEX IF NOT EXISTS idx_cart_items_product
  ON cart_items(product_id);

-- Product display ordering
CREATE INDEX IF NOT EXISTS idx_products_display
  ON products(display_order, name)
  WHERE is_active = true;
