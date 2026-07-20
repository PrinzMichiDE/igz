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
| 2026-07-20 | Daily Evolution Agent | Prozess etabliert + Security-Eintrag | Daily Evolution |
