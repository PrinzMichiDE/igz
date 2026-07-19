# IGZ – Amazon Affiliate Vergleichsplattform

Next.js-Plattform für automatisierte Amazon-Produktvergleiche und Testberichte.

- **Frontend:** Next.js 15 (App Router), Tailwind, DE/EN (`next-intl`)
- **Daten:** Externe Postgres-DB über `DATABASE_URL` (Prisma)
- **Amazon-Ingest:** RapidAPI [Real-Time Amazon Data](https://rapidapi.com/letscrape-6bRBa3QguO5/api/real-time-amazon-data)
- **Content:** OpenRouter (strukturierte Reviews/Comparisons)
- **Monetarisierung:** Amazon Affiliate Links (`AMAZON_PARTNER_TAG_DE` / `_US`)

## Architektur (kurz)

1. Cron synct Produkte via RapidAPI (`/search`, optional `/product-details`)
2. Produktbilder werden beim Sync als Binärdaten in Postgres gespeichert (`imageData`/`imageMimeType`) und über `/api/product-image/[id]` ausgeliefert
3. QuotaGuard begrenzt auf 100 Requests/Monat (BASIC)
4. OpenRouter generiert DE/EN-Inhalte aus DB-Daten (ausführliche Tests + UX-Kommentare)
5. Public Pages lesen **nur Postgres** (cache-first, kein Live-API-Call pro Pageview)

## SEO & AEO

- Canonical + hreflang (`de`/`en`/`x-default`)
- Open Graph / Twitter Cards
- `sitemap.xml`, `robots.txt`, `feed.xml`, `llms.txt`, `ai.txt`, `humans.txt`
- IndexNow (`INDEXNOW_KEY`, Cron `/api/cron/indexnow`)
- Google/Bing Verification Envs
- JSON-LD: Organization, WebSite, Breadcrumb, Product/Review, FAQ, ItemList, QAPage
- AEO-Blöcke: Direct Answer, Key Takeaways, Speakable selectors
- E-E-A-T: `/methodik`, `/redaktionelle-richtlinien`, `/ueber-uns`, `/bestenlisten`
- Innovative UI: Score-Breakdown, Decision Guide, Quick Compare, Article TOC, Reading Time
- Playbook: [`docs/seo-aeo-playbook.md`](docs/seo-aeo-playbook.md)
- Fokus-Nische Bluetooth-Kopfhörer (10 Ranking-Seiten): [`docs/niche-bluetooth-kopfhoerer.md`](docs/niche-bluetooth-kopfhoerer.md)
- Produkt-Duell: `/[locale]/vergleich` und `/[locale]/vergleich/[a]-vs-[b]`
- KI-Chat (OpenRouter Streaming): Floating Widget + `/api/chat`
- Barcode-Scanner im Laden: `/[locale]/scanner` + `/api/barcode/lookup` (EAN/UPC/ASIN → Produkttest)

## Setup

```bash
cp .env.example .env
# DATABASE_URL, RAPIDAPI_KEY, OPENROUTER_API_KEY, NEXTAUTH_SECRET setzen

npm install
npm run db:seed
npm run dev
```

App: [http://localhost:3000/de](http://localhost:3000/de)

Prisma läuft automatisch über `db:prepare` bei:
- `npm run dev` (`predev`)
- `npm run build` (`prebuild`) – auch auf Vercel
- `npm start` (`prestart`)

`db:prepare` führt `prisma generate` + `prisma migrate deploy` aus (Fallback: `prisma db push`).
Optional überspringen: `PRISMA_SKIP_SCHEMA_SYNC=1`.

Auf Vercel muss `DATABASE_URL` als Environment Variable gesetzt sein (Build + Runtime).

## Wichtige Scripts

- `npm run dev` – lokaler Dev-Server (+ automatisches Prisma-Prepare)
- `npm run build` / `npm start` – Production (+ automatisches Prisma-Prepare)
- `npm run db:prepare` – Prisma Client + Schema-Sync
- `npm run db:generate` – Prisma Client
- `npm run db:deploy` – Migrationen in Production anwenden
- `npm run db:push` – Schema ohne Migration-History pushen
- `npm run db:migrate` – lokale Migration erzeugen
- `npm run db:seed` – Kategorien (Nischen + Top 50), entfernt Demo-Produkte

## Cron Endpoints (QStash Workflow)

Vercel Cron triggert nur noch **kurze** Endpoints. Die schwere Arbeit läuft als **Upstash Workflow** (QStash) in vielen kleinen Steps – damit entfallen `FUNCTION_INVOCATION_TIMEOUT` / 504 Gateways.

- `GET /api/cron/setup` → Workflow `/api/workflows/setup`
- `GET /api/cron/sync-categories?limit=50` → `/api/workflows/sync-categories`
- `GET /api/cron/sync-products?category=…&top=3` → `/api/workflows/sync-products`
- `GET /api/cron/generate-content?category=…&product=asin-or-slug&locales=de&comments=3&products=3&force=1&guides=0` → `/api/workflows/generate-content` (OpenRouter via QStash `context.call`, no Vercel 60s wait). Automatically backfills products that still lack a published review (highest Amazon rating first).
- `GET /api/cron/indexnow` — bleibt direkt (kurz)

Ohne `QSTASH_TOKEN` fallen die Cron-Routes auf Inline-Ausführung zurück (lokal).

`generate-content` erzeugt pro Step getrennt:
1. Testberichte (OpenRouter)
2. Nutzererfahrungs-Kommentare
3. Kategorie-Vergleiche + Kaufberatung

Schedules (`vercel.json`, UTC): setup 05:55 · sync-categories 05:58 · sync-products 06:00 · generate-content 01:30 / 07:00 / 13:00 (self-chains across all categories until backlog clears) · generate-entertainment 02:15 (Filme/Serien/Videospiele, 10–20 Tests/Tag) · indexnow 08:00.

Benötigte Env (auch auf Vercel setzen): `QSTASH_TOKEN`, `QSTASH_URL`, `QSTASH_CURRENT_SIGNING_KEY`, `QSTASH_NEXT_SIGNING_KEY`, `UPSTASH_WORKFLOW_URL`, `KV_REST_API_URL`, `KV_REST_API_TOKEN`.

## Vercel / Postgres

- Link **Vercel Postgres** in the project or set `DATABASE_URL` to a real `postgresql://...` connection string.
- Build uses `scripts/prisma-db-push.mjs`, which skips invalid/placeholder/`prisma+postgres://` values and falls back to `POSTGRES_PRISMA_URL` / `POSTGRES_URL` / `POSTGRES_URL_NON_POOLING`.
- Cron jobs need the database env vars on the **Production** environment.

## Env

Siehe `.env.example`. Korrekt ist **`DATABASE_URL`** (nicht `DATEBASE_URL`).

## Sicherheit

- API-Keys niemals committen
- RapidAPI-Keys bei Leak rotieren
- Affiliate-Disclosure ist auf Content-Seiten eingebaut

## Rechtliches

Impressum und Datenschutzerklärung sind mit den Angaben von Michel Fritzsch hinterlegt.
Contents müssen als redaktionell/KI-gestützt und affiliate-gekennzeichnet bleiben – keine erfundenen Labortests.
