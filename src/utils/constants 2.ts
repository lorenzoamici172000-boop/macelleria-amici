// ==============================================
// Application Constants
// ==============================================

/** Stock reservation duration in minutes */
export const STOCK_RESERVATION_MINUTES = 15;

/** Maximum Stripe session expiry aligned with stock reservation (seconds) */
export const STRIPE_SESSION_EXPIRY_SECONDS = STOCK_RESERVATION_MINUTES * 60;

/** Products per page default */
export const PRODUCTS_PER_PAGE = 10;

/** Maximum file upload size in bytes (10MB) */
export const MAX_UPLOAD_SIZE_BYTES = 10 * 1024 * 1024;

/** Allowed image MIME types */
export const ALLOWED_IMAGE_MIMES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
] as const;

/** Storage bucket names */
export const BUCKETS = {
  SITE_ASSETS: 'site-assets',
  PRODUCT_IMAGES: 'product-images',
  MEDIA: 'media',
} as const;

/** Reservation age thresholds (days) */
export const RESERVATION_AGE = {
  NEW_MAX_DAYS: 7,
  OLD_MAX_DAYS: 30,
} as const;

/** Low stock threshold for admin alerts */
export const LOW_STOCK_THRESHOLD = 5;

/** Default currency */
export const DEFAULT_CURRENCY = 'EUR';

/** Default VAT rate in basis points (22%) */
export const DEFAULT_VAT_RATE_BP = 2200;

/** Available VAT rates for product configuration */
export const VAT_RATES = [
  { value: 2200, label: '22%' },
  { value: 1000, label: '10%' },
  { value: 500, label: '5%' },
  { value: 400, label: '4%' },
  { value: 0, label: '0% (Esente)' },
] as const;

/** Username validation constraints */
export const USERNAME = {
  MIN_LENGTH: 6,
  MAX_LENGTH: 13,
  PATTERN: /^[a-zA-Z0-9_]+$/,
} as const;

/** Meta tag limits */
export const SEO = {
  TITLE_MAX: 60,
  DESCRIPTION_MAX: 155,
} as const;

/** Default nero + argento theme colors */
export const DEFAULT_THEME = {
  primary: '#1a1a1a',
  primaryForeground: '#c0c0c0',
  secondary: '#c0c0c0',
  secondaryForeground: '#1a1a1a',
  accent: '#8a8a8a',
  background: '#ffffff',
  foreground: '#1a1a1a',
  navbarBg: '#1a1a1a',
  navbarText: '#c0c0c0',
  footerBg: '#1a1a1a',
  footerText: '#c0c0c0',
  muted: '#f5f5f5',
  border: '#e5e5e5',
} as const;

/** Default fonts */
export const DEFAULT_FONTS = {
  display: 'BrushScriptMT',
  body: 'system-ui',
  displayFallback: 'Georgia, serif',
  bodyFallback: '-apple-system, sans-serif',
} as const;

/** WhatsApp number format helper */
export const WHATSAPP = {
  DEFAULT_NUMBER: '3757059237',
  COUNTRY_CODE: '39',
} as const;
