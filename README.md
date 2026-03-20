# Macelleria Amici — Production-Ready E-Commerce

Sito web dinamico per macelleria con e-commerce, prenotazioni, admin panel completo, autenticazione utenti, pagamenti Stripe, gestione stock atomica e tema grafico personalizzabile.

## Stack Tecnologico

- **Frontend**: Next.js 14 (App Router), TypeScript strict, Tailwind CSS, shadcn/ui
- **Backend**: Supabase (PostgreSQL, Auth, Storage, Edge Functions, RPC)
- **Pagamenti**: Stripe (Checkout Sessions, Webhooks, Refunds)
- **Deploy**: Netlify
- **Font personalizzato**: Brush Script MT (display font)
- **Testing**: Vitest + Testing Library + Playwright

## Architettura

```
src/
├── app/                    # Next.js App Router pages
│   ├── (public)/          # Public routes (navbar + footer layout)
│   │   ├── page.tsx       # Home
│   │   ├── prodotti/      # Products listing + [slug] detail
│   │   ├── carrello/      # Cart
│   │   ├── checkout/      # Checkout + conferma
│   │   ├── preferiti/     # Wishlist
│   │   ├── login/         # Customer login
│   │   ├── registrazione/ # Registration
│   │   ├── account/       # User account + profile
│   │   ├── i-miei-ordini/ # User orders
│   │   ├── recensioni/    # Reviews
│   │   ├── chi-siamo/     # About
│   │   ├── contatti/      # Contacts
│   │   ├── privacy-policy/
│   │   ├── cookie-policy/
│   │   └── [slug]/        # Dynamic admin-created pages
│   ├── admin/             # Admin area (separate layout)
│   │   ├── page.tsx       # Admin login (separate)
│   │   ├── dashboard/     # Dashboard with reservations focus
│   │   ├── ordini/        # Order management
│   │   ├── prodotti/      # Product CRUD
│   │   ├── categorie/     # Category management
│   │   ├── pagine/        # Page management
│   │   ├── recensioni/    # Review management
│   │   ├── statistiche/   # Analytics dashboard
│   │   ├── media/         # Media library
│   │   └── impostazioni/  # Settings (tema, attività, spedizione, navigazione)
│   ├── api/               # API routes
│   │   ├── checkout/      # Order creation (server-side)
│   │   ├── webhooks/stripe/ # Stripe webhook handler
│   │   ├── admin/refund/  # Admin refund endpoint
│   │   ├── analytics/     # Event tracking
│   │   ├── stock/release/ # Expired stock release
│   │   └── revalidate/    # Cache invalidation
│   ├── not-found.tsx      # 404
│   ├── error.tsx          # Global error
│   └── layout.tsx         # Root layout with providers
├── components/
│   ├── ui/                # Atomic UI (Button, Input, etc.)
│   ├── layout/            # Navbar, Footer, HeroSection
│   ├── products/          # ProductCard, ProductDetail
│   ├── reviews/           # ReviewsPreview, ReviewsList
│   ├── admin/             # AdminSidebar
│   ├── shared/            # WhatsAppFloating, ContactsContent
│   └── checkout/          # Checkout components
├── hooks/                 # React hooks & providers
│   ├── useAuth.tsx        # Auth context + profile
│   ├── useLocale.tsx      # i18n context
│   └── useTheme.tsx       # Theme CSS variables provider
├── services/              # Data access layer
│   ├── settings.ts        # Site & business settings
│   ├── products.ts        # Products CRUD + search
│   ├── cart.ts            # Cart operations
│   ├── wishlist.ts        # Wishlist operations
│   ├── orders.ts          # Orders + state machine
│   ├── reviews.ts         # Reviews management
│   ├── navigation.ts      # Pages + nav links
│   └── analytics.ts       # Event tracking + summaries
├── lib/supabase/          # Supabase clients
│   ├── client.ts          # Browser client
│   ├── server.ts          # Server client + admin client
│   └── middleware.ts       # Session refresh + route protection
├── types/                 # TypeScript types
│   └── index.ts           # Complete type definitions
├── utils/                 # Pure utilities
│   ├── currency.ts        # Monetary functions (cents-based)
│   ├── validation.ts      # Zod schemas
│   └── helpers.ts         # General helpers
├── i18n/                  # Internationalization
│   └── translations.ts    # IT + EN translations
└── middleware.ts           # Next.js middleware
```

## Decisioni Architetturali Chiave

### 1. Calcoli Monetari in Centesimi
Tutti i prezzi, sconti, IVA, spedizione e totali sono in centesimi interi. Nessun float. La conversione in EUR decimale avviene solo nel render UI.

### 2. Stock Atomico via RPC
Il decremento stock e la creazione righe ordine avvengono in un'unica transazione PostgreSQL via `create_order_with_stock()`. Impossibile vendere l'ultimo pezzo a due utenti.

### 3. Webhook Stripe come Unica Fonte di Verità
Lo stato "Pagato" viene impostato SOLO dal webhook Stripe verificato server-side. Il frontend non può mai confermare un pagamento.

### 4. Reservation Stock 15 Minuti
Lo stock viene bloccato tramite `stock_reservations` con scadenza. Un cron job rilascia le reservation scadute.

### 5. RLS su Ogni Tabella
Row Level Security attiva su tutte le tabelle. Gli utenti vedono solo i propri dati. L'admin è verificato via `is_admin()`.

### 6. Sessione Admin Separata
Login admin (/admin) è completamente separato dal login cliente. Interfaccia, layout e flusso distinti.

### 7. Font Personalizzato con Fallback
Brush Script MT è precaricato come font display. Fallback: Georgia → serif. Il layout non si rompe mai se il font non carica.

### 8. Multilingua senza rompere routing
Le route restano in italiano. Solo l'interfaccia UI cambia lingua. Il cambio lingua non invalida carrello o sessione.

## Setup

### 1. Clona e installa
```bash
git clone <repo>
cd macelleria-amici
npm install
```

### 2. Configura environment
```bash
cp .env.example .env.local
# Inserisci le tue chiavi Supabase, Stripe, Google
```

### 3. Setup database
```bash
# Esegui le migrazioni su Supabase
supabase db push
# Esegui il seed iniziale
supabase db seed
```

### 4. Crea account admin
```sql
-- In Supabase SQL editor, dopo aver creato un utente via Auth:
UPDATE profiles SET role = 'admin' WHERE email = 'admin@macelleria-amici.it';
```

### 5. Configura Storage Buckets
Crea questi bucket in Supabase Storage (tutti pubblici in lettura):
- `site-assets` (logo, favicon, hero)
- `product-images`
- `media`

### 6. Deploy Edge Functions
```bash
supabase functions deploy sync-reviews
supabase functions deploy aggregate-stats
```

### 7. Configura Cron Jobs
In Supabase Dashboard → Database → Cron Jobs:
- `sync-reviews`: giornaliero alle 03:00
- `aggregate-stats`: giornaliero alle 04:00
- Stock release: ogni 5 minuti via API `/api/stock/release`

### 8. Configura Stripe Webhook
In Stripe Dashboard → Webhooks:
- URL: `https://your-domain.netlify.app/api/webhooks/stripe`
- Eventi: `checkout.session.completed`, `checkout.session.expired`, `charge.refunded`

### 9. Avvia development
```bash
npm run dev
```

### 10. Deploy su Netlify
```bash
git push # Con Netlify CI/CD configurato
# Oppure: netlify deploy --prod
```

## Test

```bash
npm run test          # Unit tests
npm run test:watch    # Watch mode
npm run test:e2e      # E2E tests (Playwright)
npm run type-check    # TypeScript check
```

## Font Personalizzato

Il file `public/fonts/BrushScriptMT.ttf` è il font display principale del sito. Viene caricato con `@font-face` e `font-display: swap`. Usato per:
- Logo
- Titoli principali
- Nomi prodotti
- Navigation bar
- CTA

Modificabile dall'admin nel pannello Tema.

## Schema Database

Vedi `supabase/migrations/001_initial_schema.sql` per lo schema completo con:
- 25+ tabelle
- Tipi enum per stati ordine/pagamento
- RPC per transazioni atomiche stock
- Trigger auto-create profilo su signup
- RLS policies per ogni tabella
- Indici ottimizzati

## Sicurezza

- ✅ RLS su tutte le tabelle
- ✅ Service role key solo lato server
- ✅ Stripe webhook con verifica firma
- ✅ Idempotency key su ordini
- ✅ Validazione server-side di tutti gli input
- ✅ Rate limiting su login (via Supabase)
- ✅ Audit log azioni admin
- ✅ Upload con whitelist formati e limiti dimensione
- ✅ Nessun localStorage per dati business
- ✅ Route admin protette con middleware

## Stato del Progetto

Questa è una **base production-ready**, non una demo. Include:
- [x] Architettura completa
- [x] Schema DB con RLS
- [x] Tipi TypeScript completi
- [x] Servizi dati isolati
- [x] Auth con profili persistenti
- [x] Carrello persistente su DB
- [x] Wishlist persistente su DB
- [x] Checkout con Stripe
- [x] Webhook Stripe verificato
- [x] Transazioni atomiche stock
- [x] State machine ordini
- [x] Admin panel separato
- [x] Tema globale configurabile
- [x] Multilingua IT/EN
- [x] Font personalizzato Brush Script MT
- [x] Edge functions per cron jobs
- [x] Unit tests critici
- [x] SEO base
- [x] Accessibilità base
