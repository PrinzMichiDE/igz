import assert from "node:assert/strict";
import {
  affiliateSinceDate,
  aggregateAffiliateLocaleCounts,
  buildAffiliateClickWhere,
  countRecentAffiliateClicks,
  isAffiliateLocale,
  isAffiliatePeriodDays,
  normalizeAffiliatePagination,
  normalizeAffiliatePeriodDays,
} from "@/lib/affiliate/admin-analytics";

function run() {
  assert.equal(normalizeAffiliatePeriodDays("7"), 7);
  assert.equal(normalizeAffiliatePeriodDays("30"), 30);
  assert.equal(normalizeAffiliatePeriodDays("90"), 90);
  assert.equal(normalizeAffiliatePeriodDays("14"), 30);
  assert.equal(normalizeAffiliatePeriodDays(undefined), 30);

  assert.equal(isAffiliatePeriodDays("7"), true);
  assert.equal(isAffiliatePeriodDays("14"), false);

  const now = new Date("2026-07-24T12:00:00.000Z");
  const since = affiliateSinceDate(7, now);
  assert.equal(since.toISOString(), "2026-07-17T12:00:00.000Z");

  const pagination = normalizeAffiliatePagination({ page: "2", limit: "25" });
  assert.equal(pagination.page, 2);
  assert.equal(pagination.limit, 25);
  assert.equal(pagination.offset, 25);

  assert.deepEqual(buildAffiliateClickWhere(), undefined);
  assert.deepEqual(buildAffiliateClickWhere({ locale: "de" }), {
    locale: "de",
  });
  assert.deepEqual(
    buildAffiliateClickWhere({ since, locale: "en", asin: "B012345678" }),
    {
      createdAt: { gte: since },
      locale: "en",
      asin: "B012345678",
    },
  );

  assert.equal(isAffiliateLocale("de"), true);
  assert.equal(isAffiliateLocale("fr"), false);

  const recent = countRecentAffiliateClicks(
    [
      { createdAt: new Date("2026-07-24T10:00:00.000Z") },
      { createdAt: new Date("2026-07-22T10:00:00.000Z") },
    ],
    24,
    now,
  );
  assert.equal(recent, 1);

  const localeCounts = aggregateAffiliateLocaleCounts([
    { locale: "de" },
    { locale: "de" },
    { locale: "en" },
  ]);
  assert.equal(localeCounts.de, 2);
  assert.equal(localeCounts.en, 1);
  assert.equal(localeCounts.total, 3);

  console.log("affiliate admin-analytics tests passed");
}

run();
