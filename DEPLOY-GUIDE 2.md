# ============================================
# GUIDA DEPLOY COMPLETA
# Macelleria Amici — Netlify + Supabase
# ============================================

## INDICE
1. Configurazione Supabase
2. Configurazione Stripe
3. Configurazione Google Places API
4. Preparazione progetto locale
5. Deploy su Netlify
6. Configurazione DNS e dominio
7. Post-deploy: verifiche e test
8. Manutenzione e cron jobs

---

## ═══════════════════════════════════════════
## 1. CONFIGURAZIONE SUPABASE
## ═══════════════════════════════════════════

### 1.1 Crea un progetto Supabase

1. Vai su https://supabase.com e crea un account (o accedi)
2. Clicca "New Project"
3. Scegli:
   - Organization: la tua
   - Name: `macelleria-amici`
   - Database Password: genera una password forte e SALVALA
   - Region: `eu-west-1` (Irlanda) o `eu-central-1` (Francoforte) per latenza minima dall'Italia
4. Clicca "Create new project" e attendi 2-3 minuti

### 1.2 Recupera le chiavi

Vai in **Project Settings → API** e copia:

```
NEXT_PUBLIC_SUPABASE_URL = https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY = eyJhbGciOi...  (chiave pubblica, safe per il client)
SUPABASE_SERVICE_ROLE_KEY = eyJhbGciOi...  (chiave segreta, SOLO server)
```

⚠️ La `SERVICE_ROLE_KEY` NON deve MAI finire nel frontend o in un repository pubblico.

### 1.3 Esegui le migrazioni database

Vai in **SQL Editor** nel pannello Supabase e:

**Passo A — Schema principale:**
1. Apri il file `supabase/migrations/001_initial_schema.sql`
2. Copia TUTTO il contenuto
3. Incollalo nell'SQL Editor di Supabase
4. Clicca "Run"
5. Verifica che non ci siano errori (dovrebbe mostrare "Success")

**Passo B — Storage e indici:**
1. Apri il file `supabase/migrations/002_storage_and_cron.sql`
2. Copia e incolla nell'SQL Editor
3. Clicca "Run"

**Passo C — Dati iniziali (seed):**
1. Apri il file `supabase/seed/001_initial_data.sql`
2. Copia e incolla nell'SQL Editor
3. Clicca "Run"

### 1.4 Verifica le tabelle

Vai in **Table Editor** e verifica che esistano tutte queste tabelle:
- profiles, shipping_addresses, billing_addresses, invoice_profiles
- site_settings, business_settings
- categories, products, product_images
- pages, navigation_links, media_assets
- wishlists, wishlist_items, carts, cart_items
- stock_reservations, shipping_rules
- orders, order_items, payments
- reviews, review_sync_logs
- analytics_events, analytics_daily_summary
- admin_audit_logs

### 1.5 Configura Storage Buckets

Vai in **Storage** e verifica che esistano 3 bucket:
- `site-assets` (pubblico)
- `product-images` (pubblico)
- `media` (pubblico)

Se non sono stati creati automaticamente dalla migrazione:
1. Clicca "New bucket"
2. Nome: `site-assets`, spunta "Public bucket"
3. Ripeti per `product-images` e `media`

### 1.6 Crea l'account admin

**IMPORTANTE: l'admin NON si crea dalla registrazione pubblica.**

**Opzione A — Tramite script (consigliata):**

```bash
# Dalla cartella del progetto
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co \
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi... \
ADMIN_EMAIL=admin@macelleria-amici.it \
ADMIN_PASSWORD=UnaPasswordMoltoForte123! \
node scripts/bootstrap-admin.mjs
```

**Opzione B — Manuale da Supabase Dashboard:**

1. Vai in **Authentication → Users**
2. Clicca "Add user" → "Create new user"
3. Email: `admin@macelleria-amici.it`
4. Password: la tua password forte
5. Spunta "Auto Confirm User"
6. Clicca "Create user"
7. Copia l'`id` dell'utente appena creato
8. Vai in **SQL Editor** ed esegui:

```sql
UPDATE profiles 
SET role = 'admin' 
WHERE email = 'admin@macelleria-amici.it';
```

9. Verifica nel Table Editor che nella tabella `profiles` ci sia un record con `role = 'admin'`

### 1.7 Configura Auth

Vai in **Authentication → URL Configuration**:

- Site URL: `http://localhost:3000` (per development)
- Redirect URLs: aggiungi:
  - `http://localhost:3000/**`
  - `https://macelleria-amici.netlify.app/**`
  - `https://tuodominio.it/**` (se hai un dominio custom)

Vai in **Authentication → Email Templates** (opzionale):
- Puoi personalizzare i template email di conferma e reset password

### 1.8 Configura Email (opzionale ma consigliato)

Per le email transazionali (conferma ordine, rimborsi, ecc.):

**Opzione A — Resend (consigliata, gratuita fino a 3000 email/mese):**
1. Vai su https://resend.com e crea un account
2. Aggiungi e verifica il tuo dominio
3. Crea un'API key
4. Salva come `RESEND_API_KEY` nelle variabili d'ambiente

**Opzione B — Supabase SMTP custom:**
1. Vai in **Project Settings → Authentication → SMTP Settings**
2. Configura il tuo server SMTP


## ═══════════════════════════════════════════
## 2. CONFIGURAZIONE STRIPE
## ═══════════════════════════════════════════

### 2.1 Crea account Stripe

1. Vai su https://dashboard.stripe.com e registrati
2. Completa la verifica dell'attività (dati macelleria, conto bancario, ecc.)

### 2.2 Recupera le chiavi

In **Developers → API keys**:

```
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = pk_test_...  (o pk_live_... in produzione)
STRIPE_SECRET_KEY = sk_test_...  (o sk_live_... in produzione)
```

### 2.3 Configura il Webhook

1. Vai in **Developers → Webhooks**
2. Clicca "Add endpoint"
3. URL endpoint: `https://macelleria-amici.netlify.app/api/webhooks/stripe`
   (o se usi Edge Function: `https://xxxxx.supabase.co/functions/v1/stripe-webhook`)
4. Seleziona questi eventi:
   - `checkout.session.completed`
   - `checkout.session.expired`
   - `charge.refunded`
5. Clicca "Add endpoint"
6. Copia il **Signing secret**: `whsec_...`

```
STRIPE_WEBHOOK_SECRET = whsec_...
```

### 2.4 Test con Stripe CLI (opzionale, per development)

```bash
# Installa Stripe CLI
brew install stripe/stripe-cli/stripe  # macOS
# oppure scarica da https://stripe.com/docs/stripe-cli

# Login
stripe login

# Forward webhooks al tuo dev server
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# Copia il webhook secret mostrato e usalo come STRIPE_WEBHOOK_SECRET locale
```


## ═══════════════════════════════════════════
## 3. CONFIGURAZIONE GOOGLE PLACES API
## ═══════════════════════════════════════════

Per la sincronizzazione automatica delle recensioni Google:

### 3.1 Crea un progetto Google Cloud

1. Vai su https://console.cloud.google.com
2. Crea un nuovo progetto: `macelleria-amici`
3. Abilita l'API: **Places API (New)**
4. Vai in **Credentials → Create Credentials → API Key**
5. Copia la chiave API
6. (Opzionale) Limita la chiave solo a "Places API"

### 3.2 Trova il Place ID

1. Vai su https://developers.google.com/maps/documentation/places/web-service/place-id
2. Cerca "Macelleria Amici Roma"
3. Copia il Place ID (es: `ChIJ...`)

```
GOOGLE_PLACES_API_KEY = AIza...
GOOGLE_PLACE_ID = ChIJ...
```

### 3.3 Per la mappa nella pagina Contatti

Vai su https://www.google.com/maps, cerca l'indirizzo, clicca "Condividi → Incorpora una mappa", copia l'URL dell'iframe e salvalo nelle impostazioni attività dal pannello admin.


## ═══════════════════════════════════════════
## 4. PREPARAZIONE PROGETTO LOCALE
## ═══════════════════════════════════════════

### 4.1 Estrai il progetto

```bash
tar xzf macelleria-amici.tar.gz
cd macelleria-amici
```

### 4.2 Installa le dipendenze

```bash
npm install
```

### 4.3 Crea il file .env.local

```bash
cp .env.example .env.local
```

Modifica `.env.local` con i tuoi valori:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Google
GOOGLE_PLACES_API_KEY=AIza...
GOOGLE_PLACE_ID=ChIJ...

# Site
NEXT_PUBLIC_SITE_URL=https://macelleria-amici.netlify.app

# Email
EMAIL_FROM=noreply@tuodominio.it
RESEND_API_KEY=re_... (opzionale)
```

### 4.4 Test locale

```bash
npm run dev
```

Apri http://localhost:3000 e verifica:
- [ ] Home carica con Hero e recensioni
- [ ] Navbar mostra Login/Registrati
- [ ] /prodotti carica (vuoto è ok, non ci sono ancora prodotti)
- [ ] /admin mostra login admin separato
- [ ] Login admin funziona con le credenziali create
- [ ] Dashboard admin carica

### 4.5 Inizializza Git

```bash
git init
git add .
git commit -m "Initial commit - Macelleria Amici"
```

### 4.6 Push su GitHub/GitLab

```bash
# Crea un repository PRIVATO su GitHub
git remote add origin https://github.com/tuousername/macelleria-amici.git
git branch -M main
git push -u origin main
```

⚠️ Assicurati che il repository sia **PRIVATO**. Il file `.env.local` è nel `.gitignore` e non verrà caricato.


## ═══════════════════════════════════════════
## 5. DEPLOY SU NETLIFY
## ═══════════════════════════════════════════

### 5.1 Crea account Netlify

1. Vai su https://app.netlify.com
2. Registrati (consigliato: con GitHub)

### 5.2 Collega il repository

1. Clicca "Add new site" → "Import an existing project"
2. Scegli "GitHub" (o GitLab)
3. Autorizza Netlify ad accedere ai tuoi repository
4. Seleziona `macelleria-amici`

### 5.3 Configura build settings

Netlify dovrebbe rilevare automaticamente Next.js. Verifica:

```
Build command:    npm run build
Publish directory: .next
```

Se non viene installato automaticamente, aggiungi il plugin:
- Vai in **Plugins** → Cerca `@netlify/plugin-nextjs` → Installa

### 5.4 Configura variabili d'ambiente

Vai in **Site settings → Environment variables** e aggiungi TUTTE queste:

```
NEXT_PUBLIC_SUPABASE_URL          = https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY     = eyJhbGciOi...
SUPABASE_SERVICE_ROLE_KEY         = eyJhbGciOi...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = pk_live_...
STRIPE_SECRET_KEY                 = sk_live_...
STRIPE_WEBHOOK_SECRET             = whsec_...
GOOGLE_PLACES_API_KEY             = AIza...
GOOGLE_PLACE_ID                   = ChIJ...
NEXT_PUBLIC_SITE_URL              = https://macelleria-amici.netlify.app
EMAIL_FROM                        = noreply@tuodominio.it
RESEND_API_KEY                    = re_... (se usi Resend)
```

⚠️ Per Stripe in produzione usa le chiavi `pk_live_` e `sk_live_`, non quelle di test.

### 5.5 Deploy

1. Clicca "Deploy site"
2. Attendi il build (3-5 minuti la prima volta)
3. Se il build fallisce, controlla i log per errori
4. Una volta completato, Netlify ti assegna un URL: `https://macelleria-amici.netlify.app`

### 5.6 Verifica il deploy

Apri `https://macelleria-amici.netlify.app` e verifica:
- [ ] Home carica correttamente
- [ ] Font Brush Script MT si carica
- [ ] Tema nero/argento applicato
- [ ] Navbar funziona
- [ ] /admin mostra login separato
- [ ] Login admin funziona
- [ ] /prodotti carica


## ═══════════════════════════════════════════
## 6. CONFIGURAZIONE DNS E DOMINIO (opzionale)
## ═══════════════════════════════════════════

Se hai un dominio custom (es: `macelleria-amici.it`):

### 6.1 Su Netlify

1. Vai in **Domain settings → Add custom domain**
2. Inserisci `macelleria-amici.it`
3. Netlify ti mostrerà i DNS da configurare

### 6.2 Sul tuo registrar DNS

Aggiungi un record CNAME:
```
Tipo:   CNAME
Nome:   @  (o www)
Valore: macelleria-amici.netlify.app
```

Oppure usa i nameserver Netlify (consigliato):
```
dns1.p01.nsone.net
dns2.p01.nsone.net
dns3.p01.nsone.net
dns4.p01.nsone.net
```

### 6.3 HTTPS

Netlify configura automaticamente il certificato SSL con Let's Encrypt. Attendi 5-15 minuti dopo la configurazione DNS.

### 6.4 Aggiorna le configurazioni

Dopo aver configurato il dominio custom:

1. **Netlify**: Aggiorna `NEXT_PUBLIC_SITE_URL` a `https://macelleria-amici.it`
2. **Supabase**: Vai in Authentication → URL Configuration:
   - Site URL: `https://macelleria-amici.it`
   - Aggiungi `https://macelleria-amici.it/**` ai redirect URLs
3. **Stripe**: Aggiorna l'URL del webhook a `https://macelleria-amici.it/api/webhooks/stripe`
4. Rideploy su Netlify


## ═══════════════════════════════════════════
## 7. POST-DEPLOY: VERIFICHE E CONFIGURAZIONE
## ═══════════════════════════════════════════

### 7.1 Configura il sito dal pannello admin

1. Vai su `https://tuosito.it/admin`
2. Accedi con le credenziali admin
3. Configura in ordine:

**Impostazioni → Dati attività:**
- Nome attività, indirizzi, telefono, WhatsApp
- URL Google Maps embed
- Orari di apertura
- Fasce di ritiro

**Impostazioni → Navigazione:**
- Carica il logo (formato consigliato: PNG trasparente, max 200x60px)
- Carica il favicon (formato: PNG 32x32 o ICO)
- Carica l'immagine Hero (formato: JPG/WebP, 1920x1080 o più grande)

**Impostazioni → Tema:**
- Verifica colori nero/argento
- Personalizza se necessario
- Attiva/disattiva WhatsApp flottante
- Attiva/disattiva sezione recensioni

**Impostazioni → Spedizione:**
- Aggiungi le regole CAP per la spedizione
- Es: CAP 00137 → 5.00€, CAP 00100 → 7.00€

**Prodotti:**
- Crea le categorie (Manzo, Maiale, Pollo, ecc.)
- Aggiungi i prodotti con prezzi, stock, IVA, immagini

**Pagine:**
- Modifica la pagina "Chi siamo"
- Modifica Privacy Policy e Cookie Policy con i testi reali

### 7.2 Testa il flusso completo

1. **Registrazione**: crea un account utente di test
2. **Carrello**: aggiungi prodotti al carrello
3. **Checkout**: completa un ordine di test
   - Con pagamento online (usa carta test Stripe: `4242 4242 4242 4242`)
   - Con prenotazione in negozio
4. **Admin**: verifica che l'ordine appaia nella dashboard
5. **Admin**: testa il cambio stato ordine
6. **Admin**: testa il rimborso (in modalità test)

### 7.3 Carte di test Stripe

```
Pagamento riuscito:    4242 4242 4242 4242
Pagamento rifiutato:   4000 0000 0000 0002
3D Secure richiesto:   4000 0025 0000 3155
Scadenza: qualsiasi data futura
CVC: qualsiasi 3 cifre
```


## ═══════════════════════════════════════════
## 8. CRON JOBS E MANUTENZIONE
## ═══════════════════════════════════════════

### 8.1 Configura i job schedulati

Ci sono 3 processi automatici da configurare:

**A) Rilascio stock scaduto (ogni 5 minuti):**

Opzione 1 — Supabase pg_cron (consigliata):
```sql
-- Esegui nell'SQL Editor di Supabase
SELECT cron.schedule(
  'release-expired-stock',
  '*/5 * * * *',
  $$SELECT release_expired_reservations()$$
);
```

Opzione 2 — Cron esterno (es. cron-job.org):
- URL: `https://tuosito.it/api/stock/release`
- Metodo: POST
- Header: `Authorization: Bearer TUA_SERVICE_ROLE_KEY`
- Frequenza: ogni 5 minuti

**B) Sincronizzazione recensioni Google (giornaliera):**

Opzione 1 — Deploy Edge Function + pg_cron:
```bash
# Dal terminale
npx supabase functions deploy sync-reviews --no-verify-jwt
```

Poi in SQL Editor:
```sql
SELECT cron.schedule(
  'sync-google-reviews',
  '0 3 * * *',  -- ogni giorno alle 3:00
  $$SELECT net.http_post(
    url := 'https://xxxxx.supabase.co/functions/v1/sync-reviews',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer TUA_SERVICE_ROLE_KEY"}'::jsonb,
    body := '{}'::jsonb
  )$$
);
```

Opzione 2 — Cron esterno:
- URL: `https://xxxxx.supabase.co/functions/v1/sync-reviews`
- Frequenza: giornaliera, ore 3:00

**C) Aggregazione statistiche (giornaliera):**

```bash
npx supabase functions deploy aggregate-stats --no-verify-jwt
```

```sql
SELECT cron.schedule(
  'aggregate-daily-stats',
  '0 4 * * *',  -- ogni giorno alle 4:00
  $$SELECT net.http_post(
    url := 'https://xxxxx.supabase.co/functions/v1/aggregate-stats',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer TUA_SERVICE_ROLE_KEY"}'::jsonb,
    body := '{}'::jsonb
  )$$
);
```

### 8.2 Deploy delle Edge Functions

```bash
# Installa Supabase CLI
npm install -g supabase

# Login
npx supabase login

# Link al progetto
npx supabase link --project-ref xxxxx

# Deploy tutte le funzioni
npx supabase functions deploy sync-reviews --no-verify-jwt
npx supabase functions deploy aggregate-stats --no-verify-jwt
npx supabase functions deploy release-stock --no-verify-jwt
npx supabase functions deploy send-email --no-verify-jwt
npx supabase functions deploy stripe-webhook --no-verify-jwt
```

Configura i secrets per le Edge Functions:
```bash
npx supabase secrets set STRIPE_SECRET_KEY=sk_live_...
npx supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_...
npx supabase secrets set GOOGLE_PLACES_API_KEY=AIza...
npx supabase secrets set GOOGLE_PLACE_ID=ChIJ...
npx supabase secrets set RESEND_API_KEY=re_...
npx supabase secrets set EMAIL_FROM=noreply@tuodominio.it
```

### 8.3 Backup

Supabase Pro include backup automatici giornalieri. Per il piano gratuito:

```bash
# Backup manuale del database
npx supabase db dump -f backup_$(date +%Y%m%d).sql
```

Consiglio: configura un backup automatico settimanale con uno script.

### 8.4 Monitoraggio

- **Supabase Dashboard → Logs**: controlla errori database e auth
- **Netlify → Deploys**: controlla build logs
- **Stripe Dashboard → Events**: controlla webhook e pagamenti
- **Admin → Dashboard**: controlla prenotazioni, stock, sync recensioni
- **Admin → Statistiche**: controlla traffico e ordini


## ═══════════════════════════════════════════
## TROUBLESHOOTING
## ═══════════════════════════════════════════

### Build Netlify fallisce

1. Controlla che tutte le env vars siano configurate in Netlify
2. Verifica i log di build per l'errore specifico
3. Errore comune: `@netlify/plugin-nextjs` non installato → installalo da Plugins

### Login non funziona

1. Verifica le chiavi Supabase in Netlify env vars
2. Verifica Site URL e Redirect URLs in Supabase Auth
3. Controlla la console browser per errori

### Webhook Stripe non funziona

1. Verifica l'URL del webhook in Stripe Dashboard
2. Verifica che `STRIPE_WEBHOOK_SECRET` sia corretto
3. Controlla i log webhook in Stripe → Developers → Webhooks → il tuo endpoint → Recent events
4. Su Netlify: controlla Function logs per errori

### Immagini non si caricano

1. Verifica che i bucket Storage esistano e siano pubblici
2. Verifica le policy RLS sullo storage
3. Controlla che `images.remotePatterns` in `next.config.js` includa il dominio Supabase

### Font non si carica

1. Verifica che `public/fonts/BrushScriptMT.ttf` esista
2. Il file dovrebbe essere servito automaticamente da Netlify
3. Controlla la console browser per errori 404 su `/fonts/BrushScriptMT.ttf`

### Admin non accessibile

1. Verifica che il profilo admin abbia `role = 'admin'` nella tabella profiles
2. Verifica con: `SELECT id, email, role FROM profiles WHERE role = 'admin';`


## ═══════════════════════════════════════════
## CHECKLIST FINALE PRE-LANCIO
## ═══════════════════════════════════════════

- [ ] Supabase: tutte le tabelle create
- [ ] Supabase: RLS attivo su tutte le tabelle
- [ ] Supabase: storage buckets creati e pubblici
- [ ] Supabase: account admin creato con role = 'admin'
- [ ] Supabase: Auth URLs configurati per il dominio
- [ ] Stripe: chiavi LIVE (non test) configurate
- [ ] Stripe: webhook configurato con URL corretto
- [ ] Stripe: webhook testa con successo
- [ ] Google: Places API key configurata
- [ ] Netlify: tutte le env vars configurate
- [ ] Netlify: build completato con successo
- [ ] Netlify: dominio custom configurato (se applicabile)
- [ ] Netlify: HTTPS attivo
- [ ] Admin: logo caricato
- [ ] Admin: favicon caricato
- [ ] Admin: immagine Hero caricata
- [ ] Admin: dati attività compilati
- [ ] Admin: orari configurati
- [ ] Admin: almeno una categoria creata
- [ ] Admin: almeno un prodotto creato
- [ ] Admin: regole spedizione configurate
- [ ] Admin: Privacy Policy compilata
- [ ] Admin: Cookie Policy compilata
- [ ] Cron: stock release configurato (ogni 5 min)
- [ ] Cron: sync recensioni configurato (giornaliero)
- [ ] Cron: aggregazione stats configurata (giornaliera)
- [ ] Test: registrazione utente funziona
- [ ] Test: login/logout funziona
- [ ] Test: aggiunta carrello funziona
- [ ] Test: checkout con Stripe test card funziona
- [ ] Test: prenotazione in negozio funziona
- [ ] Test: ordine visibile in admin
- [ ] Test: cambio stato ordine da admin funziona
- [ ] Test: cambio lingua IT/EN funziona
- [ ] Test: sito responsive su mobile
- [ ] Test: pulsante WhatsApp visibile e funzionante
- [ ] Stripe: passare a chiavi LIVE
