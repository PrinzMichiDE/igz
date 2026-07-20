# IGDB / Twitch API einrichten (Videospiel-Reviews)

IGZ holt Spieledaten über die [IGDB API](https://api-docs.igdb.com/).  
Authentifizierung läuft über eine **Twitch-Developer-App** mit **Client Credentials**  
(kein User-Login, kein Browser-OAuth-Flow).

## 1. Twitch-Konto vorbereiten

1. Account auf [twitch.tv](https://www.twitch.tv/) (kostenlos).
2. **Zwei-Faktor-Authentifizierung (2FA)** aktivieren (Pflicht für Developer Console).
3. Entwicklerportal öffnen: [dev.twitch.tv/console](https://dev.twitch.tv/console)

## 2. Application anlegen

1. **Applications** → **Register Your Application**
2. Felder:
   - **Name:** z. B. `IGZ IGDB`
   - **OAuth Redirect URLs:** siehe Abschnitt unten
   - **Category:** z. B. *Application Integration* oder *Website*
   - **Client Type:** **Confidential** (wichtig – sonst kein Client Secret)
3. Speichern / anlegen.

### Auth Redirect URLs – was eintragen?

IGDB nutzt bei uns **keinen Redirect-Login**. Twitch verlangt das Feld trotzdem.

Trage **mindestens eine gültige HTTPS-URL** ein, z. B.:

```text
https://igz.vercel.app/
```

Optional zusätzlich lokal:

```text
http://localhost
```

oder

```text
http://localhost:3000
```

Hinweise:

- Mehrere URLs: eine URL **pro Zeile** (je nach UI) bzw. wie die Console es vorgibt.
- Die Redirect-URL wird von IGZ **nicht aufgerufen**.
- Keine wilden `*` / Platzhalter – Twitch erwartet konkrete URLs.

## 3. Client ID & Client Secret

1. In der App auf **Manage**
2. **Client ID** kopieren → das ist `IGDB_CLIENT_ID`
3. **New Secret** → Secret einmalig anzeigen/kopieren → `IGDB_CLIENT_SECRET`  
   (Secret später nicht mehr einsehbar – bei Verlust neu erzeugen)

## 4. In Vercel / lokal setzen

### Vercel (Production + Preview)

Project → **Settings** → **Environment Variables**:

```env
IGDB_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
IGDB_CLIENT_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

Danach **Redeploy**, damit Build/Cron die Vars sehen.

### Lokal (`.env` / `.env.local`)

```env
IGDB_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
IGDB_CLIENT_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

## 5. Kurz testen

1. Admin → **Spiele (IGDB)** → eine [IGDB-ID](https://www.igdb.com/) eintragen und Review erzeugen  
   (ID steht in der IGDB-API bzw. oft in Tools/URLs der Datenbank; Beispiel-ID z. B. bekannte Spiele über die API abfragen).
2. Oder Cron (mit `CRON_SECRET`):

```http
GET /api/cron/generate-game-reviews?force=1&igdbId=1942
Authorization: Bearer <CRON_SECRET>
```

Erfolg: Spiel unter `/de/spiele/...` mit Cover, Screenshots, Trailern und Store-Links.

## 6. Typische Fehler

| Symptom | Ursache |
| --- | --- |
| `IGDB_CLIENT_ID / IGDB_CLIENT_SECRET not configured` | Env fehlt oder kein Redeploy |
| Twitch OAuth `401` / `403` | Falsches Secret, App nicht Confidential, 2FA fehlt |
| IGDB `401` | Token ok, aber Client-ID-Header falsch / veraltet |
| Redirect-URL-Fehler in der Console | URL ungültig oder Feld leer – `https://igz.vercel.app/` eintragen |

## Referenzen

- IGDB Getting Started: https://api-docs.igdb.com/#getting-started  
- Twitch App Access Tokens: https://dev.twitch.tv/docs/authentication/getting-tokens-oauth/#client-credentials-grant-flow  
