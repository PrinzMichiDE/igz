# DSGVO-Dokumentation IGZ

## Einleitung

Verzeichnis der Verarbeitungstätigkeiten und datenschutzrelevanten Maßnahmen für IGZ als öffentlich erreichbare Affiliate-/Review-Website mit optionalen Nutzerinteraktionen.

## Geltungsbereich

Verarbeitungen durch die IGZ-Anwendung und eingesetzte Auftragsverarbeiter. Keine vollständige Unternehmens-DSFA außerhalb dieses Produkts.

## Begriffe und Definitionen

| Begriff | Definition |
| --- | --- |
| Betroffene | Website-Nutzer, Kommentar-/Alarm-/Anfrage-Absender, Admin |
| AV | Auftragsverarbeiter |
| TOM | Technisch-organisatorische Maßnahmen |
| ipHash | HMAC-Fingerprint der Client-IP, kein Klartext-IP-Store |

## Verantwortlichkeiten

| Aktivität | Verantwortlicher (A) | Engineering (R) | Hosting-AV (C) | Betroffene (I) |
| --- | --- | --- | --- | --- |
| Zweckbindung festlegen | A | C | I | I |
| Löschkonzepte umsetzen | A | R | C | I |
| Betroffenenanfragen | A | R | C | I |
| AV-Verträge | A | C | R | I |

## Detailbeschreibung

### Verzeichnis von Verarbeitungstätigkeiten

| Tätigkeit | Datenkategorien | Rechtsgrundlage | Speicherort | Frist (Ist/Ziel) |
| --- | --- | --- | --- | --- |
| Seitenauslieferung / Logs | IP/UA in Hosting-Logs | Art. 6 Abs. 1 lit. f | Vercel | Anbieter-Retention (offen bestätigen) |
| Affiliate-Klick-Tracking | ASIN, Locale, Path, Referrer | Art. 6 Abs. 1 lit. f | Postgres `AffiliateClick` | betrieblich begrenzen (offen) |
| Preisalarme | E-Mail, Zielpreis, ipHash, Token | Art. 6 Abs. 1 lit. a (Consent im Formular) | `PriceAlert` | bis Unsubscribe/Löschung |
| Erfahrungskommentare | Name, optional E-Mail, Text, Rating, ipHash | Art. 6 Abs. 1 lit. a / f | `ProductExperienceComment` | bis Löschung/Moderation |
| Produkttest-Anfragen | Name, E-Mail, Firma, Nachricht, ipHash | Art. 6 Abs. 1 lit. b/f | `ProductTestRequest` | bis Bearbeitung + Aufbewahrung (offen) |
| Admin-Login | E-Mail/Passwort (Env, nicht DB) | Art. 6 Abs. 1 lit. f | Env Secrets | Session laut NextAuth |
| KI-Chat / Compare | Prompt-Inhalte an OpenRouter | Art. 6 Abs. 1 lit. f | OpenRouter (extern) | Anbieter-Policy |
| Barcode-Lookup | Barcode/GTIN | Art. 6 Abs. 1 lit. f | ggf. RapidAPI | transient + Cache in Produktdaten |

### Betroffenenrechte

Umsetzungspfad: Kontaktseite / Admin-Löschung für Kommentare und Test-Requests; Preisalarm-Unsubscribe unter `/api/price-alerts/unsubscribe`. Auskunft/Löschung weiterer Daten erfordert manuelle DB-/Log-Prüfung beim Verantwortlichen.

### TOMs (Auszug)

- TLS in Transit (Vercel/HTTPS)
- Secrets nur in Env
- Cron-Auth, Rate-Limits, Redirect-Allowlist
- IP nur als HMAC-Hash speichern (`IP_HASH_SECRET` / Auth-Secret)
- Admin-Bereich sessiongeschützt

### Auftragsverarbeiter / Empfänger

Vercel, Postgres-Anbieter, Upstash, RapidAPI, OpenRouter, Resend, Amazon (Redirect/Affiliate).

### Drittlandtransfers

Je nach Anbieterstandort (häufig USA) – Standardvertragsklauseln der Anbieter nutzen. **Offen:** konkrete AVV-/SCC-Nachweise pro Anbieter im Unternehmensordner ablegen.

### DSFA-Schwellenwertanalyse

| Kriterium | Bewertung |
| --- | --- |
| Systematische umfangreiche Überwachung | nein |
| Sensitive Daten i.S.d. Art. 9 | nein (Standardformulare) |
| Automatisierte Entscheidungen mit Rechtswirkung | nein |
| Großflächiges Matching/Scoring von Personen | nein |

**Ergebnis:** Keine verpflichtende DSFA allein aufgrund der aktuellen Produktfunktionen; bei Einführung von Tracking-Pixels/Profiling neu bewerten.

## Nachweise und Artefakte

- Formular-Routen unter `src/app/api/price-alerts`, `experience-comments`, `contact/product-test`
- Privacy-Content `src/lib/legal/privacy-content.tsx`
- IP-Hashing `src/lib/security/client-ip.ts`

## Risiken und Kontrollen

| Risiko | Auswirkung | Eintrittswahrscheinlichkeit | Massnahme | Kontrolle | Nachweis |
| --- | --- | --- | --- | --- | --- |
| Klartext-IP Speicherung | Identifizierbarkeit | niedrig (nach Fix) | HMAC-Hash | Code-Review | `client-ip.ts` |
| Fehlende Löschfristen | Verstoß Aufbewahrung | mittel | Fristen definieren + Jobs | Audit-Frage | dieses Dokument (offen) |
| Unerlaubte Weitergabe an KI | Zweckänderung | mittel | Rate-Limit + keine PII in System-Prompts erzwingen | Prompt-Review | `src/app/api/chat/route.ts` |

## Pflegeprozess

Bei neuen Formularen/Tracking muss dieses Verzeichnis vor Go-Live ergänzt werden. Offene Fristen/AVV sind explizit nachzuziehen.

## Revisionshistorie

| Datum | Autor/Rolle | Änderung | Anlass |
| --- | --- | --- | --- |
| 2026-07-20 | Daily Evolution Agent / Compliance | Erstfassung; HMAC-IP und Rate-Limits dokumentiert | Daily Evolution |
