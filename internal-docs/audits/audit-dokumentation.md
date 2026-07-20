# Audit-Dokumentation IGZ

## Einleitung

Dieses Dokument definiert Prüffragen, Evidence-Pfade und Stichprobenmethodik für interne/externe Audits der IGZ-Plattform.

## Geltungsbereich

Anwendungssicherheit, Datenschutzkontrollen, Betriebs-/Cron-Sicherheit, Dependency-Lage und Dokumentationsvollständigkeit unter `/internal-docs`.

## Begriffe und Definitionen

| Begriff | Definition |
| --- | --- |
| Evidence | Nachvollziehbarer Beleg im Repo oder Betriebsartefakt |
| Feststellung | Audit-Ergebnis mit Schweregrad |
| Stichprobe | Gezielte Auswahl von Routen/Configs |

## Verantwortlichkeiten

| Aktivität | Auditor | Engineering | Product Owner | Compliance |
| --- | --- | --- | --- | --- |
| Auditumfang festlegen | R | C | A | C |
| Evidence bereitstellen | I | R | I | C |
| Abweichungen schließen | C | R | A | C |

## Detailbeschreibung

### Auditkriterien

- Workspace-Regeln Vercel-first / Secrets / Cron-Schutz
- DSGVO-Mindestanforderungen für Formulare
- ISO-Kontrollmapping Status „umgesetzt/teilweise/offen“
- Test-Gate: `npm test` grün vor Merge auf `master`

### Prüffragen und Evidence

| # | Prüffrage | Evidence-Pfad | Methode |
| --- | --- | --- | --- |
| 1 | Sind Cron-Routen ohne Secret blockiert? | `src/app/api/cron/*/route.ts`, `cron-auth.ts` | Code-Review + Unit-Test |
| 2 | Ist `CRON_SECRET` in `.env.example` dokumentiert? | `.env.example` | Dokumentenprüfung |
| 3 | Verhindert `/api/out` Open Redirects? | `out/route.ts`, `safe-amazon-redirect.ts` | Unit-Tests mit Evil-Host |
| 4 | Haben Public AI/Barcode Rate-Limits? | `chat`, `compare/ai`, `barcode/lookup` | Code-Review |
| 5 | Werden IPs gehasht gespeichert? | `client-ip.ts`, Formular-Routen | Code-Review |
| 6 | Ist Admin ohne Session geschützt? | `src/lib/admin.ts`, `/api/admin/*` | Stichprobe 3 Routen |
| 7 | Laufen Prisma-Routen auf Node? | `export const runtime` | Stichprobe |
| 8 | Existiert CHANGELOG-Eintrag für Security-Fixes? | `CHANGELOG.md` | Dokumentenprüfung |
| 9 | Sind AVV/SCC-Nachweise vorhanden? | Unternehmensablage (**offen**) | Interview |
| 10 | `npm audit` – kritische Findings? | `npm audit` | Scanner |

### Stichprobenmethodik

Pro Audit mindestens: 2 Cron-Routen, 2 Admin-Routen, 2 Public-APIs, 1 Formular mit PII, Dependency-Scan, Dokumentations-Checkliste `/internal-docs`.

### Feststellungen (Stand 2026-07-20)

| ID | Feststellung | Schwere | Status | Massnahme | Verantwortlich |
| --- | --- | --- | --- | --- | --- |
| F-001 | Cron-Endpunkte waren unauthentifiziert | hoch | geschlossen | CRON_SECRET Auth | Engineering |
| F-002 | `/api/out` Open Redirect | mittel | geschlossen | Amazon-Allowlist | Engineering |
| F-003 | Public AI/Barcode ohne IP-Throttle | hoch | geschlossen | Rate-Limits | Engineering |
| F-004 | Plain SHA-256 IP hashes | mittel | geschlossen | HMAC | Engineering |
| F-005 | Kein Admin MFA / Login-Throttle | mittel | offen | Lockout/MFA planen | Product/Engineering |
| F-006 | AVV-/SCC-Ablage nicht im Repo | niedrig | offen | Unternehmensnachweise | Compliance |
| F-007 | npm moderate advisories (transitive) | mittel | beobachtet | kein force-downgrade; monitor | Engineering |

## Nachweise und Artefakte

- `src/lib/security/*.test.ts`
- `CHANGELOG.md` Eintrag 2026-07-20
- Automation Memory (Daily Evolution)

## Risiken und Kontrollen

| Risiko | Auswirkung | Eintrittswahrscheinlichkeit | Massnahme | Kontrolle | Nachweis |
| --- | --- | --- | --- | --- | --- |
| Evidence veraltet | Scheinsicherheit | mittel | Docs bei Code-Change mitziehen | PR-Checkliste | Revisionshistorie |
| Offene Findings ohne Owner | Dauerhafte Lücke | mittel | Owner + Termin | Audit-Follow-up | Tabelle Feststellungen |

## Pflegeprozess

Nach jedem Daily-Evolution-Lauf mit Security-Bezug: Feststellungen aktualisieren, geschlossene Items mit Evidence verknüpfen.

## Revisionshistorie

| Datum | Autor/Rolle | Änderung | Anlass |
| --- | --- | --- | --- |
| 2026-07-20 | Daily Evolution Agent / Auditor | Erstes Audit inkl. Schließung F-001–F-004 | Daily Evolution Pipeline |
