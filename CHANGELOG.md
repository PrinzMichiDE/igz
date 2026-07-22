# Changelog

All notable changes to IGZ are documented in this file.

## [2026-07-22] – Job runs admin panel

### Added
- Admin panel at `/admin/jobs` with status/type filters, pagination, duration metrics, and error visibility.
- Protected API route `GET /api/admin/job-runs` for programmatic job history access.
- Job run aggregation helpers: `aggregateJobRunCounts`, `countRecentFailedJobs`, pagination and filter builders.
- Dashboard card showing failed jobs in the last 24 hours with link to the jobs panel.
- Unit tests for job admin stats helpers.

### Changed
- Admin navigation includes Jobs section.
- Dashboard “Letzte Jobs” section links to the full jobs viewer.

## [2026-07-21] – Global audit log & affiliate click rate limit

### Added
- Global admin audit log viewer at `/admin/audit` with entity-type filters and pagination.
- Protected API route `GET /api/admin/audit-logs` for programmatic audit access.
- `logAdminAction()` coverage on all mutating admin routes: articles, products, experience comments, test requests, and game review generation.
- Extended audit helpers: `listAdminAuditLogs`, `countAdminAuditLogs`, `normalizeAuditPagination`, entity-type validation.
- Unit tests for audit pagination and entity-type helpers.

### Fixed
- `/api/out` affiliate redirect now enforces IP rate limiting (60 req/hour) to prevent affiliate-click DB spam.

### Changed
- Admin navigation includes Audit-Log section.
- Destructive admin actions (product/article/comment delete) now leave immutable audit trails.

## [2026-07-21] – Price alerts admin & audit logging

### Added
- Admin panel at `/admin/price-alerts` with status filters, masked emails, product links, and cancel action.
- Protected API routes: `GET /api/admin/price-alerts`, `PATCH /api/admin/price-alerts/[id]`.
- `AdminAuditLog` Prisma model and `logAdminAction()` helper for operational audit trails.
- Email masking helper (`src/lib/admin/mask-email.ts`) for DSGVO-friendly admin list views.
- Dashboard card linking to active price alerts count.
- Unit tests for mask-email and price-alert admin stats aggregation.

### Fixed
- Public `POST /api/price-alerts` now enforces IP rate limiting (12 req/hour) via shared rate-limit module.

### Changed
- Admin navigation includes Preisalarme section.

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
