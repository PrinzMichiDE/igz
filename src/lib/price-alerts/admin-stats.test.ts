import assert from "node:assert/strict";
import {
  aggregatePriceAlertCounts,
  isAdminPriceAlertStatus,
} from "@/lib/price-alerts/admin-stats";

function run() {
  const counts = aggregatePriceAlertCounts([
    { status: "active" },
    { status: "active" },
    { status: "triggered" },
    { status: "unsubscribed" },
    { status: "failed" },
  ]);

  assert.equal(counts.total, 5);
  assert.equal(counts.active, 2);
  assert.equal(counts.triggered, 1);
  assert.equal(counts.unsubscribed, 1);
  assert.equal(counts.failed, 1);

  assert.equal(isAdminPriceAlertStatus("active"), true);
  assert.equal(isAdminPriceAlertStatus("pending"), false);

  console.log("price-alerts admin-stats tests passed");
}

run();
