# IGZ external crontab (curl → Vercel / self-hosted)

Use this on a VPS or local scheduler when you trigger jobs **outside**
Vercel Cron (e.g. Hobby cron limits, or a dedicated worker host).

Vercel already defines schedules in `vercel.json`. External crontab is
optional and must send `Authorization: Bearer $CRON_SECRET`.

## Required env on the cron host

```bash
export IGZ_SITE_URL="https://igz.vercel.app"
export CRON_SECRET="your-cron-secret"
```

## Install

```bash
# Edit paths/secrets, then:
crontab -e
# paste entries from scripts/cron/igz.crontab
```

Or:

```bash
crontab scripts/cron/igz.crontab
```

## The three jobs you asked for

| Job | Path | Suggested UTC |
| --- | --- | --- |
| Sync products | `/api/cron/sync-products` | `0 6 * * *` |
| Generate Amazon reviews | `/api/cron/generate-content?...` | `0 7 * * *` |
| Generate game reviews | `/api/cron/generate-game-reviews?...` | `0 10 * * *` |

Times are **UTC** (same as Vercel Cron).

## Manual smoke test

```bash
curl -sS -H "Authorization: Bearer $CRON_SECRET" \
  "$IGZ_SITE_URL/api/cron/sync-products"

curl -sS -H "Authorization: Bearer $CRON_SECRET" \
  "$IGZ_SITE_URL/api/cron/generate-content?products=3&chain=0&locales=de&comments=2"

curl -sS -H "Authorization: Bearer $CRON_SECRET" \
  "$IGZ_SITE_URL/api/cron/generate-game-reviews?locales=de&count=10"
```

Expect JSON with `"ok": true` (or a clear skip reason).
