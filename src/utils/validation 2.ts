import { z } from 'zod';

// ---- Username validation ----
export const usernameSchema = z
  .string()
  .min(6, 'Minimo 6 caratteri')
  .max(13, 'Massimo 13 caratteri')
  .regex(/^[a-zA-Z0-9_]+$/, 'Solo lettere, numeri e underscore')
  .refine((val) => !val.startsWith('_'), 'Non può iniziare con underscore')
  .refine((val) => !val.endsWith('_'), 'Non può finire con underscore');

// ---- Registration ----
export const registrationSchema = z
  .object({
    firstName: z.string().min(1, 'Nome obbligatorio').max(100),
    lastName: z.string().min(1, 'Cognome obbligatorio').max(100),
    username: usernameSchema,
    email: z.string().email('Email non valida'),
    password: z.string().min(8, 'Minimo 8 caratteri'),
    confirmPassword: z.string(),
    acceptPrivacy: z.literal(true, {
      errorMap: () => ({ message: 'Devi accettare la Privacy Policy' }),
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Le password non coincidono',
    path: ['confirmPassword'],
  });

export type RegistrationData = z.infer<typeof registrationSchema>;

// ---- Login ----
export const loginSchema = z.object({
  email: z.string().email('Email non valida'),
  password: z.string().min(1, 'Password obbligatoria'),
});

export type LoginData = z.infer<typeof loginSchema>;

// ---- Profile update ----
export const profileUpdateSchema = z.object({
  firstName: z.string().min(1, 'Nome obbligatorio').max(100),
  lastName: z.string().min(1, 'Cognome obbligatorio').max(100),
  phone: z.string().max(20).optional(),
});

// ---- Address ----
export const addressSchema = z.object({
  first_name: z.string().min(1, 'Obbligatorio'),
  last_name: z.string().min(1, 'Obbligatorio'),
  street: z.string().min(1, 'Obbligatorio'),
  street_number: z.string().min(1, 'Obbligatorio'),
  zip_code: z.string().regex(/^\d{5}$/, 'CAP non valido (5 cifre)'),
  city: z.string().min(1, 'Obbligatorio'),
  province: z.string().min(1, 'Obbligatorio'),
  country: z.string().min(1, 'Obbligatorio'),
  phone: z.string().min(1, 'Obbligatorio'),
});

// ---- Invoice Profile ----
export const invoicePrivateSchema = z.object({
  invoice_type: z.literal('private'),
  first_name: z.string().min(1, 'Obbligatorio'),
  last_name: z.string().min(1, 'Obbligatorio'),
  tax_code: z.string().min(16, 'Codice fiscale non valido').max(16),
  full_address: z.string().min(1, 'Obbligatorio'),
});

export const invoiceCompanySchema = z.object({
  invoice_type: z.literal('company'),
  company_name: z.string().min(1, 'Obbligatorio'),
  vat_number: z.string().min(11, 'Partita IVA non valida').max(11),
  sdi_code: z.string().min(1, 'Obbligatorio').max(7),
  pec: z.string().email('PEC non valida'),
  full_address: z.string().min(1, 'Obbligatorio'),
});

export const invoiceProfileSchema = z.discriminatedUnion('invoice_type', [
  invoicePrivateSchema,
  invoiceCompanySchema,
]);

// ---- ZIP code ----
export const zipCodeSchema = z.string().regex(/^\d{5}$/, 'CAP non valido');

// ---- Product (admin) ----
export const productSchema = z.object({
  name: z.string().min(1, 'Nome obbligatorio').max(200),
  slug: z.string().min(1, 'Slug obbligatorio').max(200).regex(/^[a-z0-9-]+$/, 'Solo lettere minuscole, numeri e trattini'),
  description: z.string().max(5000).optional(),
  price_cent: z.number().int().positive('Prezzo deve essere maggiore di zero'),
  discount_price_cent: z.number().int().positive().nullable().optional(),
  stock: z.number().int().min(0, 'Stock non può essere negativo'),
  category_id: z.string().uuid().nullable().optional(),
  vat_rate: z.number().int().min(0).max(10000),
  pickup_enabled: z.boolean(),
  shipping_enabled: z.boolean(),
  is_active: z.boolean(),
  display_order: z.number().int().min(0),
});

// ---- Shipping Rule (admin) ----
export const shippingRuleSchema = z.object({
  zip_code: z.string().regex(/^\d{5}$/, 'CAP non valido (5 cifre)'),
  cost_cent: z.number().int().min(0),
  is_active: z.boolean(),
  description: z.string().max(500).optional(),
  estimated_days: z.string().max(100).optional(),
  priority: z.number().int().min(0).optional(),
});

// ---- Page (admin) ----
export const pageSchema = z.object({
  title: z.string().min(1, 'Titolo obbligatorio').max(200),
  slug: z.string().min(1).max(200).regex(/^[a-z0-9-]+$/),
  content: z.record(z.unknown()).optional(),
  status: z.enum(['draft', 'published']),
  meta_title: z.string().max(60).optional(),
  meta_description: z.string().max(155).optional(),
  featured_image_url: z.string().optional(),
});

// ---- Checkout ----
export const checkoutSchema = z.object({
  orderType: z.enum(['online_payment', 'in_store_payment']),
  fulfillmentType: z.enum(['pickup', 'shipping']),
  notes: z.string().max(1000).optional(),
  pickupDate: z.string().optional(),
  pickupSlot: z.string().optional(),
  shippingZip: z.string().optional(),
  invoiceRequested: z.boolean(),
  acceptTerms: z.literal(true, {
    errorMap: () => ({ message: 'Devi accettare le condizioni' }),
  }),
});

// ---- Upload validation ----
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export function validateImageFile(file: File): string | null {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return 'Formato non supportato. Usa JPG, PNG o WebP.';
  }
  if (file.size > MAX_FILE_SIZE) {
    return 'File troppo grande. Massimo 10MB.';
  }
  return null;
}

// ---- Slug generator ----
export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}
