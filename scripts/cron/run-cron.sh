#!/usr/bin/env bash
# Helper: run one IGZ cron path with CRON_SECRET.
# Usage: ./scripts/cron/run-cron.sh sync-products
#        ./scripts/cron/run-cron.sh generate-content
#        ./scripts/cron/run-cron.sh generate-game-reviews
set -euo pipefail

SITE="${IGZ_SITE_URL:-${NEXT_PUBLIC_SITE_URL:-https://igz.vercel.app}}"
SECRET="${CRON_SECRET:-}"

if [[ -z "$SECRET" ]]; then
  echo "CRON_SECRET is not set" >&2
  exit 1
fi

case "${1:-}" in
  sync-products)
    PATH_Q="/api/cron/sync-products"
    ;;
  generate-content)
    PATH_Q="/api/cron/generate-content?products=3&chain=0&locales=de&comments=2"
    ;;
  generate-game-reviews)
    PATH_Q="/api/cron/generate-game-reviews?locales=de&count=10"
    ;;
  *)
    echo "Usage: $0 {sync-products|generate-content|generate-game-reviews}" >&2
    exit 1
    ;;
esac

echo "GET ${SITE}${PATH_Q}"
curl -fsS -H "Authorization: Bearer ${SECRET}" "${SITE}${PATH_Q}"
echo
