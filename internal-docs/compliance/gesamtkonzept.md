# Compliance-Gesamtkonzept IGZ

## Einleitung

Dieses Dokument beschreibt die strategische Compliance-Ausrichtung der Amazon-Affiliate-Vergleichsplattform IGZ. Es verbindet Datenschutz, Informationssicherheit, Lizenzierung und Betriebsrisiken mit dem konkreten Vercel-/Postgres-/Upstash-Betriebsmodell.

## Geltungsbereich

Geltungsbereich ist der gesamte IGZ-Codebestand unter `/workspace` einschließlich Next.js-App-Router, API-Routen, Cron-/Workflow-Jobs, Prisma-Datenmodell, Admin-Bereich und öffentlicher SEO-/Tool-Seiten (Chat, Barcode, Preisalarme). Externe Auftragsverarbeiter (Vercel, Postgres-Anbieter, Upstash, RapidAPI, OpenRouter, Resend, Amazon) sind einbezogen, soweit IGZ Daten an sie überträgt.

## Begriffe und Definitionen

| Begriff | Definition |
| --- | --- |
| IGZ | Öffentliche Vergleichs- und Review-Plattform inkl. Admin |
| Cache-first | Öffentliche Seiten lesen nur Postgres; keine Live-RapidAPI/OpenRouter-Calls im Page-Render |
| Cron-Entrypoint | Kurze Vercel-Cron-Route unter `/api/cron/*`, die Workflows enqueued |
| Workflow | Upstash-/QStash-gesteuerter Mehrschritt-Job unter `/api/workflows/*` |
| Schutzbedarf | Einstufung der Vertraulichkeit/Integrität/Verfügbarkeit von Daten |

## Verantwortlichkeiten

RACI-Matrix (R = Responsible, A = Accountable, C = Consulted, I = Informed):

| Aktivität | Product Owner | Engineering | Security/Compliance | Hosting (Vercel) |
| --- | --- | --- | --- | --- |
| Risikoakzeptanz festlegen | A | C | R | I |
| Secrets in Vercel Env pflegen | I | R | A | C |
| Schema-/Datenänderungen | C | R | C | I |
| Cron-/Quota-Betrieb | I | R | C | I |
| DSGVO-Dokumentation | A | C | R | I |
| Incident Response | A | R | R | C |

## Detailbeschreibung

### Risikoakzeptanzniveau

IGZ akzeptiert ein mittleres Betriebsrisiko für redaktionelle/affiliate Inhalte und ein niedriges Risiko für Admin-Zugänge sowie Secrets. Öffentliche KI-/Barcode-Endpunkte dürfen nicht unbeschränkt externe Quotas verbrennen; Cron-Jobs dürfen nicht anonym auslösbar sein.

### Schutzbedarfe

| Datenklasse | Beispiele | Vertraulichkeit | Integrität | Verfügbarkeit |
| --- | --- | --- | --- | --- |
| Öffentliche Produkt-/Review-Daten | Titel, Scores, Artikel | niedrig | hoch | mittel |
| Affiliate-Klicks | ASIN, Locale, Path | niedrig | mittel | niedrig |
| Nutzerformulare | Preisalarme, Erfahrungskommentare, Produkttest-Anfragen | hoch | hoch | mittel |
| Admin-Credentials / Secrets | `ADMIN_*`, API-Keys | sehr hoch | sehr hoch | hoch |
| Job-/Quota-Metadaten | `JobRun`, `ApiQuotaMonth` | mittel | hoch | mittel |

### Wichtige Datenflüsse

1. Vercel Cron → `/api/cron/*` (mit `CRON_SECRET`) → Upstash Workflow → RapidAPI/OpenRouter → Postgres.
2. Browser → öffentliche Seiten → Postgres (Server Components).
3. Browser → `/api/chat`, `/api/compare/ai`, `/api/barcode/lookup` (rate-limited) → OpenRouter/RapidAPI/Postgres.
4. Browser → `/api/out` → Amazon (nur allowlisted Hosts) + optional AffiliateClick-Logging.
5. Admin → NextAuth Credentials → Admin-APIs → Postgres.

### Betriebsmodell

- Hosting: Vercel (Next.js 15 App Router, Node.js Runtime für Prisma-Routen).
- DB: externes Postgres via aufgelöste URL-Helper (`src/lib/db/database-url.ts`).
- Jobs: Vercel Cron + Upstash Workflow/QStash + Redis-Locks.
- Secrets: ausschließlich Vercel Project Env (siehe `.env.example`).

### Zusammenspiel der Richtlinien

| Dokument | Rolle |
| --- | --- |
| `iso-27001.md` | Kontroll-Mapping |
| `dsgvo.md` | Verarbeitung personenbezogener Daten |
| `sicherheitsrichtlinien.md` | AuthZ/AuthN, Secrets, Logging |
| `lizenzdokumentation.md` | OSS-/Drittanbieterpflichten |
| `../architektur/architektur-uebersicht.md` | Technische Grenzen |
| `../audits/audit-dokumentation.md` | Prüffragen und Evidence |

## Nachweise und Artefakte

- `.env.example` – erforderliche Secrets ohne Klartextwerte
- `vercel.json` – Cron-Schedule
- `src/lib/security/*` – Cron-Auth, Redirect-Allowlist, Rate-Limits, IP-Hashing
- `CHANGELOG.md` – Änderungsprotokoll
- Prisma-Schema `prisma/schema.prisma`

## Risiken und Kontrollen

| Risiko | Auswirkung | Eintrittswahrscheinlichkeit | Massnahme | Kontrolle | Nachweis |
| --- | --- | --- | --- | --- | --- |
| Offene Cron-Trigger | Kosten/Quota-Missbrauch | mittel (vor Fix hoch) | `CRON_SECRET` Pflicht | Unit-Tests + manuelle 401-Prüfung | `src/lib/security/cron-auth.ts` |
| Open Redirect | Phishing über Domain-Trust | mittel | Amazon-Host-Allowlist + ASIN-Check | Unit-Tests | `src/lib/security/safe-amazon-redirect.ts` |
| Public AI/Barcode Abuse | OpenRouter/RapidAPI-Erschöpfung | hoch | IP-Rate-Limits | Tests + Redis-Keys | `src/lib/security/rate-limit.ts` |
| Secret Leak in Repo | Account-Übernahme | niedrig | Keine `.env` committen | `.gitignore`, Reviews | `.gitignore` |
| Destruktiver Schema-Push | Datenverlust | niedrig–mittel | Bewusster Build-Pfad dokumentieren | Change Review | `scripts/prisma-db-push.mjs` |

## Pflegeprozess

Bei jeder Änderung mit Wirkung auf Auth, Cron, externe APIs, personenbezogene Daten oder Deployment muss dieses Gesamtkonzept und die abhängigen Dokumente innerhalb derselben Änderung aktualisiert werden. Verantwortlich ist Engineering; Freigabe liegt bei Product Owner/Compliance.

## Revisionshistorie

| Datum | Autor/Rolle | Änderung | Anlass |
| --- | --- | --- | --- |
| 2026-07-20 | Daily Evolution Agent / Engineering | Erstfassung aus Codebase-Audit | Daily Evolution Pipeline + Compliance-Regel |
