-- ==============================================
-- SEED: Initial data for Macelleria Amici
-- ==============================================

-- Site Settings (singleton)
INSERT INTO site_settings (
  logo_url, favicon_url, hero_image_url,
  hero_button_text, hero_button_link,
  color_primary, color_primary_foreground,
  color_navbar_bg, color_navbar_text,
  color_footer_bg, color_footer_text,
  font_display, font_body
) VALUES (
  '', '', '',
  'Scopri i prodotti', '/prodotti',
  '#1a1a1a', '#c0c0c0',
  '#1a1a1a', '#c0c0c0',
  '#1a1a1a', '#c0c0c0',
  'BrushScriptMT', 'system-ui'
);

-- Business Settings (singleton)
INSERT INTO business_settings (
  business_name, operational_address, legal_address,
  phone, whatsapp, opening_hours, pickup_slots
) VALUES (
  'Macelleria Amici',
  'Via Luigi Capuana 6A, Roma, 00137',
  'Via Nomentana 761, Roma, 00137',
  '06 64505881',
  '3757059237',
  '[
    {"day": 1, "open": "08:00", "close": "13:30", "closed": false},
    {"day": 1, "open": "16:00", "close": "19:30", "closed": false},
    {"day": 2, "open": "08:00", "close": "13:30", "closed": false},
    {"day": 2, "open": "16:00", "close": "19:30", "closed": false},
    {"day": 3, "open": "08:00", "close": "13:30", "closed": false},
    {"day": 3, "open": "16:00", "close": "19:30", "closed": false},
    {"day": 4, "open": "08:00", "close": "13:30", "closed": false},
    {"day": 4, "open": "16:00", "close": "19:30", "closed": false},
    {"day": 5, "open": "08:00", "close": "13:30", "closed": false},
    {"day": 5, "open": "16:00", "close": "19:30", "closed": false},
    {"day": 6, "open": "08:00", "close": "13:30", "closed": false},
    {"day": 0, "open": "00:00", "close": "00:00", "closed": true}
  ]'::JSONB,
  '[
    {"day": 1, "slots": ["09:00-10:00", "10:00-11:00", "11:00-12:00", "12:00-13:00", "16:30-17:30", "17:30-18:30", "18:30-19:00"]},
    {"day": 2, "slots": ["09:00-10:00", "10:00-11:00", "11:00-12:00", "12:00-13:00", "16:30-17:30", "17:30-18:30", "18:30-19:00"]},
    {"day": 3, "slots": ["09:00-10:00", "10:00-11:00", "11:00-12:00", "12:00-13:00", "16:30-17:30", "17:30-18:30", "18:30-19:00"]},
    {"day": 4, "slots": ["09:00-10:00", "10:00-11:00", "11:00-12:00", "12:00-13:00", "16:30-17:30", "17:30-18:30", "18:30-19:00"]},
    {"day": 5, "slots": ["09:00-10:00", "10:00-11:00", "11:00-12:00", "12:00-13:00", "16:30-17:30", "17:30-18:30", "18:30-19:00"]},
    {"day": 6, "slots": ["09:00-10:00", "10:00-11:00", "11:00-12:00", "12:00-13:00"]}
  ]'::JSONB
);

-- Default Categories
INSERT INTO categories (name, slug, display_order) VALUES
  ('Manzo', 'manzo', 1),
  ('Maiale', 'maiale', 2),
  ('Pollo', 'pollo', 3),
  ('Agnello', 'agnello', 4),
  ('Salumi', 'salumi', 5),
  ('Preparati', 'preparati', 6);

-- System Pages
INSERT INTO pages (title, slug, status, is_system, meta_title, meta_description) VALUES
  ('Chi siamo', 'chi-siamo', 'published', true,
   'Chi siamo - Macelleria Amici', 'Scopri la storia di Macelleria Amici a Roma'),
  ('Privacy Policy', 'privacy-policy', 'published', true,
   'Privacy Policy - Macelleria Amici', 'Informativa sulla privacy'),
  ('Cookie Policy', 'cookie-policy', 'published', true,
   'Cookie Policy - Macelleria Amici', 'Informativa sui cookie');

-- Default Navigation Links
INSERT INTO navigation_links (label_it, label_en, href, display_order, is_system, is_visible) VALUES
  ('Home', 'Home', '/', 1, true, true),
  ('Prodotti', 'Products', '/prodotti', 2, true, true),
  ('Chi siamo', 'About Us', '/chi-siamo', 3, true, true),
  ('Recensioni', 'Reviews', '/recensioni', 4, true, true),
  ('Contatti', 'Contacts', '/contatti', 5, true, true);

-- NOTE: Admin account must be created manually via Supabase Auth dashboard
-- or via a secure bootstrap script. Example:
--
-- 1. Create user in Supabase Auth with email: admin@macelleria-amici.it
-- 2. Then run:
--    UPDATE profiles SET role = 'admin' WHERE email = 'admin@macelleria-amici.it';
--
-- NEVER create admin from public registration.
