# Prozess-Changelog IGZ

## Einleitung

Dieses Prozessdokument ergänzt das technische `CHANGELOG.md` um Begründung, Risiko, Prüfung, Freigabe und Rollback für wesentliche Änderungen.

## Geltungsbereich

Alle produktionsrelevanten Änderungen an Sicherheit, Architektur, Datenflüssen, Cron/Workflows und Compliance-Dokumentation.

## Begriffe und Definitionen

| Begriff | Definition |
| --- | --- |
| Daily Evolution | Automatisierter 24h-Verbesserungszyklus |
| Rollback | Rückkehr auf letzten grünen `master`-Stand |
| Gate | Pflichtprüfung vor Merge (`npm test`) |

## Verantwortlichkeiten

| Aktivität | Automation/Agent | Engineering | Product Owner | Compliance |
| --- | --- | --- | --- | --- |
| Änderung umsetzen | R | A | I | I |
| Tests ausführen | R | A | I | I |
| Merge nach master | R | A | C | I |
| Rollback auslösen | R | A | C | I |

## Detailbeschreibung

### Eintrag 2026-07-23 – System-Health & Admin-Login-Härtung

| Feld | Inhalt |
| --- | --- |
| Änderung | `/admin/health` Panel, `GET /api/admin/health`, Env-/Cron-Health-Helpers, Login-Rate-Limit (10/h), Audit für Login-Erfolg/-Fehler, Tests |
| Begründung | Operatoren hatten keine zentrale Sicht auf DB/Env/Cron-Konfiguration; Admin-Login nutzt einzelne Credentials ohne Brute-Force-Schutz |
| Auswirkung | Frühe Erkennung fehlender `CRON_SECRET`/QStash/DB; Cron-Pipeline-Recency aus `JobRun`; Login-Versuche begrenzt und auditierbar |
| Risiko | Gering – read-only Health-Checks; Rate-Limit nutzt bestehendes Modul; Audit blockiert Login nicht |
| Betroffene Komponenten | `src/lib/admin/system-health.ts`, `src/lib/admin/collect-system-health.ts`, `src/lib/security/admin-login-rate-limit.ts`, `src/app/admin/health`, `src/app/api/admin/health`, `src/lib/auth.ts`, `src/app/api/auth/[...nextauth]/route.ts` |
| Prüfung | `npm test` grün (11 Testdateien) |
| Freigabe | Merge auf `master` nach grünem Gate |
| Rollback | Revert Commit; keine Schema-Änderung |

### Eintrag 2026-07-22 – Job-Runs Admin-Panel

| Feld | Inhalt |
| --- | --- |
| Änderung | `/admin/jobs` Viewer, `GET /api/admin/job-runs`, Job-Aggregations-Helpers, Dashboard-Karte für Fehler in 24h, Tests |
| Begründung | Cron/Workflow-Läufe waren nur als Kurzliste im Dashboard sichtbar; Operatoren konnten Fehler, Typen und Dauer nicht filtern oder paginieren |
| Auswirkung | Vollständige Sicht auf `JobRun`-Historie; schnelle Erkennung fehlgeschlagener Sync-/Generierungs-Jobs; API für externe Monitoring-Integration |
| Risiko | Gering – read-only Admin-Zugriff, bestehende Auth-Session erforderlich |
| Betroffene Komponenten | `src/lib/jobs/admin-stats.ts`, `src/app/admin/jobs`, `src/app/api/admin/job-runs`, `src/app/admin/page.tsx`, `src/components/admin/admin-nav.tsx` |
| Prüfung | `npm test` grün |
| Freigabe | Merge auf `master` nach grünem Gate |
| Rollback | Revert Commit; keine Schema-Änderung |

### Eintrag 2026-07-21 (b) – Global Audit-Log & Affiliate Rate-Limit

| Feld | Inhalt |
| --- | --- |
| Änderung | `/admin/audit` Viewer, `GET /api/admin/audit-logs`, Audit-Logging auf allen mutierenden Admin-Routen, IP-Rate-Limit auf `/api/out` (60/h), Tests |
| Begründung | Audit-Infrastruktur existierte nur für Preisalarme; destruktive Admin-Aktionen (Produkt/Artikel-Löschung) ohne Nachweis; `/api/out` schrieb unbegrenzt `affiliateClick`-Zeilen |
| Auswirkung | Vollständige Audit-Spur für Admin-Mutationen; Operatoren können alle Aktionen filtern/paginieren; Affiliate-Spam → 429 |
| Risiko | Gering – reine Erweiterung bestehender Audit-Tabelle und Rate-Limit-Modul |
| Betroffene Komponenten | `src/lib/admin/audit-log.ts`, `src/app/admin/audit`, `src/app/api/admin/audit-logs`, Admin-Mutator-Routen, `src/app/api/out/route.ts` |
| Prüfung | `npm test` grün |
| Freigabe | Merge auf `master` nach grünem Gate |
| Rollback | Revert Commit; Audit-Einträge bleiben harmlos erhalten |

### Eintrag 2026-07-21 – Preisalarme Admin & Audit-Log

| Feld | Inhalt |
| --- | --- |
| Änderung | Admin-Panel `/admin/price-alerts`, geschützte Admin-API, `AdminAuditLog`-Modell, IP-Rate-Limit auf `POST /api/price-alerts`, Tests |
| Begründung | Preisalarme waren für Operatoren unsichtbar; Admin-Aktionen ohne Audit-Spur; öffentliche API ohne shared Rate-Limit |
| Auswirkung | Operatoren sehen/stornieren Alarme; Stornierungen werden in `AdminAuditLog` protokolliert; aggressive Clients → 429 |
| Risiko | Schema-Migration `AdminAuditLog` muss via Build/`db push` auf Vercel Postgres laufen |
| Betroffene Komponenten | `prisma/schema.prisma`, `src/app/admin/price-alerts`, `src/app/api/admin/price-alerts/*`, `src/lib/admin/audit-log.ts`, `src/app/api/price-alerts/route.ts` |
| Prüfung | `npm test` grün |
| Freigabe | Merge auf `master` nach grünem Gate |
| Rollback | Revert Commit; `AdminAuditLog`-Tabelle kann bestehen bleiben (harmlos) |

### Eintrag 2026-07-20 – Security Hardening

| Feld | Inhalt |
| --- | --- |
| Änderung | Cron-Auth, Amazon-Redirect-Allowlist, Public-API-Rate-Limits, HMAC-IP-Hashing, Tests, CHANGELOG, `/internal-docs` |
| Begründung | Audit fand unauthentifizierte Cron-Trigger, Open Redirect und Quota-Missbrauchsrisiko |
| Auswirkung | Vercel benötigt `CRON_SECRET`; ungültige `/api/out`-Ziele → 400; aggressive API-Clients → 429 |
| Risiko | Fehlendes `CRON_SECRET` auf Vercel stoppt Cron (fail-closed, beabsichtigt) |
| Betroffene Komponenten | `src/app/api/cron/*`, `src/app/api/out`, chat/compare/barcode, Formular-IP-Hashing, `.env.example` |
| Prüfung | `npm test` grün; `npm run lint` ohne Errors |
| Freigabe | Merge auf `master` nach grünem Gate |
| Rollback | `git revert` des Evolution-Commits / Reset auf vorherigen `master` SHA; Env `CRON_SECRET` kann bleiben |

### Änderungsprozess

1. Feature-Branch (Cloud: `cursor/daily-evolution-pipeline-*`).
2. Atomare Security-/Feature-Änderung + Tests.
3. `npm test` (bei Fail max. 3 Fix-Versuche, sonst Rollback).
4. Commit/Push, PR, Merge nach `master` für Production-Deploy.

## Nachweise und Artefakte

- Root `CHANGELOG.md`
- Git-History auf `master`
- Testausgabe `npm test`

## Risiken und Kontrollen

| Risiko | Auswirkung | Eintrittswahrscheinlichkeit | Massnahme | Kontrolle | Nachweis |
| --- | --- | --- | --- | --- | --- |
| Merge ohne Tests | Regression | mittel | Test-Gate | `npm test` | CI/Agent-Log |
| Undokumentierte Prod-Änderung | Audit-Lücke | mittel | Prozess-Changelog pflegen | Review | dieses Dokument |

## Pflegeprozess

Jeder Daily-Evolution-Lauf mit Codeänderung erzeugt einen Eintrag hier und in `CHANGELOG.md`.

## Revisionshistorie

| Datum | Autor/Rolle | Änderung | Anlass |
| --- | --- | --- | --- |
| 2026-07-22 | Daily Evolution Agent | Job-Runs Admin-Panel | Daily Evolution |
| 2026-07-21 | Daily Evolution Agent | Global Audit-Log + Affiliate Rate-Limit | Daily Evolution |
| 2026-07-21 | Daily Evolution Agent | Preisalarme-Admin + Audit-Log | Daily Evolution |
| 2026-07-20 | Daily Evolution Agent | Prozess etabliert + Security-Eintrag | Daily Evolution |
