import assert from "node:assert/strict";
import {
  clampReviewPublishedAt,
  dateBetween2020AndNow,
  parseAmazonDateString,
  resolveReviewPublishedAt,
  stableHash32,
} from "@/lib/reviews/published-at";

function run() {
  assert.equal(parseAmazonDateString("5. Juni 2018")?.getUTCFullYear(), 2018);
  assert.equal(parseAmazonDateString("June 5, 2018")?.getUTCFullYear(), 2018);
  assert.equal(parseAmazonDateString("05.06.2018")?.getUTCDate(), 5);
  assert.equal(parseAmazonDateString("2018-06-05")?.getUTCMonth(), 5);

  const now = new Date("2026-07-19T12:00:00.000Z");
  const pre2020 = clampReviewPublishedAt(
    new Date("2015-03-01T00:00:00.000Z"),
    "B00TESTASIN",
    now,
  );
  assert.ok(pre2020.getTime() >= Date.UTC(2020, 0, 1));
  assert.ok(pre2020.getTime() <= now.getTime());

  const a = dateBetween2020AndNow("B00TESTASIN", now);
  const b = dateBetween2020AndNow("B00TESTASIN", now);
  assert.equal(a.toISOString(), b.toISOString());
  assert.notEqual(stableHash32("A"), stableHash32("B"));

  const fromDetails = resolveReviewPublishedAt({
    productId: "p1",
    asin: "B00OLDITEM",
    createdAt: new Date("2024-01-01"),
    rawDetailsJson: {
      product_information: {
        "Date First Available": "March 12, 2016",
      },
    },
    now,
  });
  assert.ok(fromDetails.getUTCFullYear() >= 2020);

  const modern = resolveReviewPublishedAt({
    productId: "p2",
    asin: "B0NEWITEM1",
    createdAt: new Date("2023-05-10T00:00:00.000Z"),
    rawDetailsJson: {
      product_information: {
        "Im Angebot von Amazon.de seit": "10. Mai 2023",
      },
    },
    now,
  });
  assert.equal(modern.getUTCFullYear(), 2023);
  assert.equal(modern.getUTCMonth(), 4);
  assert.equal(modern.getUTCDate(), 10);

  console.log("published-at tests passed");
}

run();
