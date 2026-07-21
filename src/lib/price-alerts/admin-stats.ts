import type { PriceAlertStatus } from "@prisma/client";

export type PriceAlertStatusCounts = {
  active: number;
  triggered: number;
  unsubscribed: number;
  failed: number;
  total: number;
};

const STATUS_KEYS: PriceAlertStatus[] = [
  "active",
  "triggered",
  "unsubscribed",
  "failed",
];

export function aggregatePriceAlertCounts(
  rows: { status: PriceAlertStatus }[],
): PriceAlertStatusCounts {
  const counts: PriceAlertStatusCounts = {
    active: 0,
    triggered: 0,
    unsubscribed: 0,
    failed: 0,
    total: rows.length,
  };

  for (const row of rows) {
    switch (row.status) {
      case "active":
        counts.active += 1;
        break;
      case "triggered":
        counts.triggered += 1;
        break;
      case "unsubscribed":
        counts.unsubscribed += 1;
        break;
      case "failed":
        counts.failed += 1;
        break;
      default: {
        const _exhaustive: never = row.status;
        throw new Error(`Unknown price alert status: ${_exhaustive}`);
      }
    }
  }

  return counts;
}

export function isAdminPriceAlertStatus(
  value: string,
): value is PriceAlertStatus {
  return STATUS_KEYS.includes(value as PriceAlertStatus);
}
