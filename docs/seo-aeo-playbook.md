# SEO & AEO Playbook: Sichtbarkeit in Google, Gemini, ChatGPT & Co.

Ziel: maximale organische Auffindbarkeit. **Platz 1 kann niemand garantieren** – er entsteht aus technischer Exzellenz + thematischer Autorität + Links/Erwähnungen + kontinuierlichem Content.

## Was technisch bereits gebaut ist

- Canonical, hreflang, Open Graph, Twitter
- `sitemap.xml`, `robots.txt`, `feed.xml`
- `llms.txt`, `ai.txt`, `humans.txt`
- IndexNow-Ping (Bing/Copilot/ChatGPT-Discovery-Hilfe)
- JSON-LD: Product/Review, FAQ, QAPage, ItemList, Breadcrumb, Organization
- AEO-Blöcke: Direct Answer, Key Takeaways, Speakable
- E-E-A-T-Seiten: Methodik, Über uns, Bestenlisten
- Interne Verlinkung zwischen Produkt, Kategorie, Bestenlisten, Methodik

## Sofort nach Deploy (Pflicht)

1. Eigene Domain auf `NEXT_PUBLIC_SITE_URL` setzen (HTTPS)
2. Google Search Console + Bing Webmaster Tools verifizieren
   - `GOOGLE_SITE_VERIFICATION`
   - `BING_SITE_VERIFICATION`
3. Sitemap einreichen: `https://deine-domain/sitemap.xml`
4. `INDEXNOW_KEY` setzen (UUID) und Cron `/api/cron/indexnow` laufen lassen
5. Impressum/Datenschutz mit echten Angaben füllen (Trust/Legal)

## Ranking-Strategie für Google (klassisch)

### 1) Nische vor Breite
Starte mit **1–3 Kategorien**, nicht mit 100. Dominiere z.B. „beste Bluetooth-Kopfhörer 2026“ bevor du expandierst.

### 2) Suchintention treffen
Je Seite genau eine Hauptintention:
- Kategorie = Vergleich / Bestenliste
- Produkt = ausführlicher Testbericht + Kaufentscheidung
- Bestenlisten-Hub = Orientierungsseite

### 3) Content-Qualität
- 7+ Abschnitte, konkrete Alltagsszenen
- Unique angles (für wen geeignet / nicht geeignet)
- Regelmäßige Refreshs (Preis/Score/Fazit aktualisieren)

### 4) Offpage
- Erwähnungen in Foren, Reddit, Fachblogs
- Digitale PR zu „Bestenlisten“-Updates
- Keine PBNs / Spam

### 5) Core Web Vitals & UX
- Schnelle Server Components (bereits cache-first)
- Mobile CTA, klare Hierarchie, wenig Layout-Shift

## AEO-Strategie (Gemini, ChatGPT, Perplexity, Copilot)

Answer Engines zitieren Seiten mit:
1. **Klarer Direktantwort** oben auf der Seite
2. **Kurzen Faktenlisten** (Key Takeaways)
3. **Strukturierten Daten** (FAQ/Product/QAPage)
4. **Transparenter Methodik** (E-E-A-T)
5. **Frische, crawlbaren URLs** (Sitemap + IndexNow)
6. **Erlaubnis für AI-Crawler** in `robots.txt` / `ai.txt` / `llms.txt`

### Praxisregeln für zitierfähige Inhalte
- Erste 2–3 Sätze beantworten die Frage direkt
- Zahlen/Scores konsistent zwischen Text, Tabelle und Schema
- Keine erfundenen Labortests
- Affiliate klar kennzeichnen (Trust)

## Wochen-Rhythmus (empfohlen)

| Tag | Aktion |
|---|---|
| Mo | RapidAPI Sync (Top-Kategorie) |
| Mo | OpenRouter: Reviews + Comments + Comparison |
| Mo | IndexNow Ping |
| Mi | 1 Content-Refresh (Fazit/Preis/Takeaways) |
| Fr | Search Console: Queries prüfen, Titles/H1 schärfen |

## KPI-Dashboard (manuell zuerst)

- GSC: Impressions/CTR/Average Position für Money-Keywords
- Bing Webmaster: Indexabdeckung
- Brand Mentions in AI-Antworten (manuell testen: „bester … Test 2026“)
- Affiliate CTR / EPC

## Realistische Erwartung

- Technische SEO/AEO = Fundament
- Platz 1 in kompetitiven Amazon-Nischen braucht oft Monate + Backlinks + Fokus
- Mit enger Nische und sauberem Setup sind Top-10 / Featured Snippets / AI-Citations deutlich realistischer als „Platz 1 überall“
