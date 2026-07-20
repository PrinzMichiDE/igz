# Changelog

All notable changes to IGZ are documented in this file.

## [2026-07-20] – Daily evolution (security hardening)

### Added
- Shared cron authorization helper (`src/lib/security/cron-auth.ts`) requiring `Authorization: Bearer ${CRON_SECRET}` (or `x-cron-secret`) on all `/api/cron/*` routes. Production/Vercel without `CRON_SECRET` returns 503.
- Amazon affiliate redirect allowlist (`src/lib/security/safe-amazon-redirect.ts`) used by `/api/out` to block open redirects.
- IP rate limiting for expensive public APIs (`src/lib/security/rate-limit.ts`): `/api/chat`, `/api/compare/ai`, `/api/barcode/lookup` (Redis when available, in-memory fallback).
- HMAC-based client IP hashing (`src/lib/security/client-ip.ts`) for stored fingerprints; optional `IP_HASH_SECRET`.
- `npm test` script covering review published-at helpers and the new security modules.
- Root `CHANGELOG.md` and `/internal-docs` compliance documentation set.

### Fixed
- Unauthenticated cron endpoints that could trigger RapidAPI/OpenRouter spend and DB writes.
- Open redirect via `/api/out?to=`.
- Plain SHA-256 IP hashing without a secret on price alerts, experience comments, and product-test requests.

### Changed
- `.env.example` documents `CRON_SECRET` and `IP_HASH_SECRET`.

### Security notes
- Set `CRON_SECRET` in Vercel Project Env (Production + Preview). Vercel Cron sends the Bearer header automatically when the env var is present.
- Prefer setting `IP_HASH_SECRET` independently from session secrets.
