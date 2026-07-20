# Lizenzdokumentation IGZ

## Einleitung

Dieses Dokument erfasst die wesentlichen Open-Source- und Drittanbieter-Komponenten von IGZ, abgeleitet aus `package.json` / `package-lock.json`, sowie daraus folgende Pflichten und Risiken.

## Geltungsbereich

Produktive Runtime- und Build-Abhängigkeiten der Next.js-Anwendung. Betriebliche SaaS-APIs (RapidAPI, OpenRouter, Upstash, Resend, Amazon Associates) sind als kommerzielle Dienste gesondert aufgeführt.

## Begriffe und Definitionen

| Begriff | Definition |
| --- | --- |
| Runtime-Dependency | Paket unter `dependencies` |
| Dev-Dependency | Paket unter `devDependencies` |
| Copyleft | Lizenz mit Weitergabepflichten (z. B. GPL) – hier zu prüfen |

## Verantwortlichkeiten

| Aktivität | Product Owner | Engineering | Legal/Compliance | Maintainer |
| --- | --- | --- | --- | --- |
| Dependency-Auswahl | C | R | C | I |
| Lizenzprüfung | A | C | R | I |
| Updates/Patches | I | R | C | C |

## Detailbeschreibung

### Kern-Runtime (Auswahl aus package.json)

| Komponente | Version (range) | Lizenztyp (üblich) | Pflichten | Risiko | Freigabestatus |
| --- | --- | --- | --- | --- | --- |
| next | 15.5.20 | MIT | Notice behalten | Supply-chain / advisory | freigegeben |
| react / react-dom | 19.1.0 | MIT | Notice behalten | gering | freigegeben |
| @prisma/client / prisma | ^7.8.0 | Apache-2.0 | Notice behalten | transitive hono advisory | freigegeben mit Beobachtung |
| next-auth | ^5.0.0-beta.31 | ISC | Notice behalten | Beta-API | freigegeben |
| next-intl | ^4.13.2 | MIT | Notice behalten | gering | freigegeben |
| zod | ^4.4.3 | MIT | Notice behalten | gering | freigegeben |
| @upstash/redis / qstash / workflow | diverse | MIT (typisch) | Notice behalten | Betriebsabhängigkeit | freigegeben |
| pg | ^8.22.0 | MIT | Notice behalten | gering | freigegeben |
| lucide-react | ^1.25.0 | ISC | Notice behalten | gering | freigegeben |
| geist | ^1.7.2 | SIL OFL / Font Terms | Font-Lizenz beachten | bundling | freigegeben |
| html5-qrcode | ^2.3.8 | Apache-2.0 | Notice behalten | Browser-Kamera | freigegeben |
| react-markdown | ^10.1.0 | MIT | Notice behalten | XSS bei unsicherem HTML – hier Markdown | freigegeben |

Quelle: `package.json`. Exakte Lockfile-Versionen: `package-lock.json`.

### Kommerzielle Dienste

| Dienst | Zweck | Vertrag/Terms | Datenbezug |
| --- | --- | --- | --- |
| Vercel | Hosting/Cron | Vercel Terms | Request-Logs, Env |
| Postgres (Neon/Vercel Postgres o. ä.) | Primärdaten | Anbieter-AVV | Produkt-/Nutzerdaten |
| RapidAPI Amazon Data | Produkt-Ingest | RapidAPI Terms | API-Keys, Produktdaten |
| OpenRouter | KI-Inhalte/Chat | OpenRouter Terms | Prompts/Responses |
| Upstash | Redis/QStash/Workflow | Upstash Terms | Locks/Counter/Jobs |
| Resend | Preisalarm-E-Mails | Resend Terms | E-Mail-Adressen |
| Amazon Associates | Affiliate | Associates Operating Agreement | Klicks/Tags |

### Prüfprozess

1. Neue Dependency nur mit klarer Lizenz und Pflegebedarf.
2. Vor Major-Upgrades `npm audit` und Regressionstests (`npm test`, Lint).
3. Copyleft-Lizenzen bedürfen expliziter Freigabe (aktuell keine direkte GPL-Runtime erkannt; bei Unklarheit Legal einbeziehen).

## Nachweise und Artefakte

- `package.json`, `package-lock.json`
- Dieses Dokument
- `CHANGELOG.md` bei dependency-relevanten Änderungen

## Risiken und Kontrollen

| Risiko | Auswirkung | Eintrittswahrscheinlichkeit | Massnahme | Kontrolle | Nachweis |
| --- | --- | --- | --- | --- | --- |
| Lizenzverletzung | Abmahnung/Umstellung | niedrig | Nur gängige permissive Lizenzen | Review bei neuen Deps | package.json |
| Vulnerable transitive Deps | Sicherheit | mittel | npm audit im Daily Evolution | Audit-Report | Automation Memory / CI |
| Unklare Font-Lizenz | Compliance | niedrig | Geist gemäß Projektterms nutzen | Docs | geist Package |

## Pflegeprozess

Bei jeder Änderung an `package.json` wird diese Datei auf neue Komponenten und Freigabestatus geprüft. Mindestens bei Daily-Evolution-Läufen mit Dependency-Fokus aktualisieren.

## Revisionshistorie

| Datum | Autor/Rolle | Änderung | Anlass |
| --- | --- | --- | --- |
| 2026-07-20 | Daily Evolution Agent / Engineering | Erstfassung aus package.json | Compliance-Struktur |
