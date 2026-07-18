# IGZ – Amazon Affiliate Vergleichsplattform

Next.js-Plattform für automatisierte Amazon-Produktvergleiche und Testberichte.

- **Frontend:** Next.js 15 (App Router), Tailwind, DE/EN (`next-intl`)
- **Daten:** Externe Postgres-DB über `DATABASE_URL` (Prisma)
- **Amazon-Ingest:** RapidAPI [Real-Time Amazon Data](https://rapidapi.com/letscrape-6bRBa3QguO5/api/real-time-amazon-data)
- **Content:** OpenRouter (strukturierte Reviews/Comparisons)
- **Monetarisierung:** Amazon Affiliate Links (`AMAZON_PARTNER_TAG_DE` / `_US`)

## Architektur (kurz)

1. Cron synct Produkte via RapidAPI (`/search`, optional `/product-details`)
2. QuotaGuard begrenzt auf 100 Requests/Monat (BASIC)
3. OpenRouter generiert DE/EN-Inhalte aus DB-Daten
4. Public Pages lesen **nur Postgres** (cache-first, kein Live-API-Call pro Pageview)

## Setup

```bash
cp .env.example .env
# DATABASE_URL, RAPIDAPI_KEY, OPENROUTER_API_KEY, NEXTAUTH_SECRET setzen

npm install
npx prisma db push
npm run db:seed
npm run dev
```

App: [http://localhost:3000/de](http://localhost:3000/de)

## Wichtige Scripts

- `npm run dev` – lokaler Dev-Server
- `npm run build` / `npm start` – Production
- `npm run db:generate` – Prisma Client
- `npm run db:push` – Schema ohne Migration-History pushen
- `npm run db:migrate` – Migrationen
- `npm run db:seed` – Demo-Kategorien + Dummy-Products

## Cron Endpoints

- `GET /api/cron/sync-products?category=bluetooth-kopfhoerer&top=5`
- `GET /api/cron/generate-content?category=bluetooth-kopfhoerer&locales=de,en&comments=6`

`generate-content` erzeugt:
1. ausführliche authentische Testberichte (OpenRouter)
2. KI-synthetisierte Nutzererfahrungs-Kommentare je Produkt/Locale
3. Kategorie-Vergleiche

Daily schedules are defined in `vercel.json` (UTC):

- `sync-products` — every day at 06:00 UTC
- `generate-content` — every day at 07:00 UTC

Without a `category` query parameter, each run rotates through seeded categories by day. Vercel Cron invokes these paths on the schedule defined in `vercel.json`.

## Env

Siehe `.env.example`. Korrekt ist **`DATABASE_URL`** (nicht `DATEBASE_URL`).

## Sicherheit

- API-Keys niemals committen
- RapidAPI-Keys bei Leak rotieren
- Affiliate-Disclosure ist auf Content-Seiten eingebaut

## Rechtliches

Impressum/Datenschutz sind Platzhalter und müssen vor Go-Live ersetzt werden.
Contents müssen als redaktionell/KI-gestützt und affiliate-gekennzeichnet bleiben – keine erfundenen Labortests.
