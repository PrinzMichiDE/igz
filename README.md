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
- E-E-A-T: `/methodik`, `/ueber-uns`, `/bestenlisten`
- Innovative UI: Score-Breakdown, Decision Guide, Quick Compare, Article TOC, Reading Time
- Playbook: [`docs/seo-aeo-playbook.md`](docs/seo-aeo-playbook.md)
- Fokus-Nische Bluetooth-Kopfhörer (10 Ranking-Seiten): [`docs/niche-bluetooth-kopfhoerer.md`](docs/niche-bluetooth-kopfhoerer.md)
- Produkt-Duell: `/[locale]/vergleich` und `/[locale]/vergleich/[a]-vs-[b]`
- KI-Chat (OpenRouter Streaming): Floating Widget + `/api/chat`

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
- `npm run db:seed` – Demo-Kategorien + Dummy-Products

## Cron Endpoints

- `GET /api/cron/setup` — DB health check, schema push, seed if empty
- `GET /api/cron/sync-products?category=bluetooth-kopfhoerer&top=5`
- `GET /api/cron/generate-content?category=bluetooth-kopfhoerer&locales=de,en&comments=6`

`generate-content` erzeugt:
1. ausführliche authentische Testberichte (OpenRouter)
2. KI-synthetisierte Nutzererfahrungs-Kommentare je Produkt/Locale
3. Kategorie-Vergleiche

Daily schedules are defined in `vercel.json` (UTC):

- `setup` — every day at 05:55 UTC (wakes DB, pushes schema, seeds if needed)
- `sync-products` — every day at 06:00 UTC
- `generate-content` — every day at 07:00 UTC

Without a `category` query parameter, each run rotates through seeded categories by day. Vercel Cron invokes these paths on the schedule defined in `vercel.json`.

On deploy, `npm run build` runs `prisma db push` so the schema stays in sync.

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

Impressum/Datenschutz sind Platzhalter und müssen vor Go-Live ersetzt werden.
Contents müssen als redaktionell/KI-gestützt und affiliate-gekennzeichnet bleiben – keine erfundenen Labortests.
