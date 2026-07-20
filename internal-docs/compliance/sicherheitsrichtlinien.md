# Sicherheitsrichtlinien IGZ

## Einleitung

Technische Sicherheitsrichtlinien für Authentifizierung, Autorisierung, Secrets, Verschlüsselung, Logging und Vulnerability-Management der IGZ-Plattform.

## Geltungsbereich

Alle Server Components, Route Handlers, Cron-/Workflow-Jobs, Admin-UI und öffentliche APIs im Repository.

## Begriffe und Definitionen

| Begriff | Definition |
| --- | --- |
| Admin-Session | NextAuth-Session nach Credentials-Login |
| Cron-Secret | Shared Secret für Vercel-Cron-Aufrufe |
| Node Runtime | `export const runtime = "nodejs"` für Prisma/Node-APIs |

## Verantwortlichkeiten

| Aktivität | Product Owner | Engineering | Security | Vercel Admin |
| --- | --- | --- | --- | --- |
| Passwort-/Secret-Policy | A | R | R | C |
| AuthZ in Routen | I | R | A | I |
| Patch-Management | I | R | C | C |
| Incident-Triage | A | R | R | C |

## Detailbeschreibung

### Authentifizierung

- Admin: NextAuth v5 Credentials (`ADMIN_EMAIL` / `ADMIN_PASSWORD`) in `src/lib/auth.ts`.
- Cron: `Authorization: Bearer ${CRON_SECRET}` oder Header `x-cron-secret` via `authorizeCronRequest`.
- Workflows: Upstash/QStash Signing Keys (`QSTASH_*`).

### Autorisierung / Rollenmodell

| Rolle | Rechte |
| --- | --- |
| Anonymous | Öffentliche Seiten, rate-limited Public APIs |
| Admin | `/api/admin/*`, Admin-UI nach Session |
| Cron/System | `/api/cron/*` mit Secret |

MFA ist derzeit nicht implementiert (**offen**).

### Passwort- und MFA-Regeln

- Admin-Passwort nur über Env; kein Default in Production.
- Rotation bei Verdacht auf Leak.
- MFA: geplant/offen.

### Netzwerkzonierung

- Edge Middleware (`next-intl`) ohne Prisma.
- DB-/File-/AI-Routen auf Node.js Runtime.
- Externe Egress zu RapidAPI, OpenRouter, Upstash, Resend, Amazon, IndexNow.

### Secrets-Management

- Ausschließlich Vercel Project Env / lokales `.env` (nicht committen).
- Erforderliche Keys siehe `.env.example` inkl. `CRON_SECRET`, `IP_HASH_SECRET`.

### Verschlüsselung

- In transit: HTTPS (Vercel), DB SSL via URL/`sslmode=require` wo managed.
- At rest: abhängig vom Postgres-Anbieter (**offen** nachzuweisen).
- IP-Fingerprints: HMAC-SHA256.

### Logging / Monitoring

- Application JSON errors ohne Secrets.
- `JobRun` / Quota-Tabellen für Pipeline-Sichtbarkeit.
- Redis-Locks/Counter für Job-Koordination und Rate-Limits.

### Backup / Patch / Vulnerability

- DB-Backups: Anbieter-Feature (**offen** dokumentieren).
- Patches: Daily Evolution `npm audit` + gezielte Updates; keine blind force-downgrades.
- Schema-Sync im Build: `scripts/prisma-db-push.mjs` – destruktive Optionen bewusst reviewen.

### Spezielle API-Regeln

1. Cron: immer `authorizeCronRequest`.
2. Public AI/Barcode: `enforceIpRateLimit`.
3. `/api/out`: nur Amazon-Allowlist + ASIN-Bindung.
4. Admin: `auth()` / `requireAdminSession()`.

## Nachweise und Artefakte

- `src/lib/security/*`
- `src/lib/auth.ts`, `src/lib/admin.ts`
- `.env.example`
- Tests unter `src/lib/security/*.test.ts`

## Risiken und Kontrollen

| Risiko | Auswirkung | Eintrittswahrscheinlichkeit | Massnahme | Kontrolle | Nachweis |
| --- | --- | --- | --- | --- | --- |
| Admin-Brute-Force | Übernahme | mittel | Starke Passwörter; künftig Lockout | Login-Review | `auth.ts` |
| Secret in Client Bundle | Leak | niedrig | Keine Server-Secrets in Client Components | Code-Review | Architekturregel |
| Unauth Cron | Kostenexplosion | niedrig (nach Fix) | CRON_SECRET | Tests | `cron-auth.test.ts` |
| Open Redirect | Phishing | niedrig (nach Fix) | Allowlist | Tests | `safe-amazon-redirect.test.ts` |

## Pflegeprozess

Sicherheitsrelevante PRs aktualisieren diese Richtlinie und `CHANGELOG.md`. Daily Evolution prüft Cron-/Public-API-Oberfläche.

## Revisionshistorie

| Datum | Autor/Rolle | Änderung | Anlass |
| --- | --- | --- | --- |
| 2026-07-20 | Daily Evolution Agent / Security | Erstfassung inkl. neuer Security-Module | Daily Evolution |
