import assert from "node:assert/strict";
import { isAllowedAmazonRedirectTarget } from "@/lib/security/safe-amazon-redirect";

function run() {
  assert.equal(
    isAllowedAmazonRedirectTarget(
      "https://www.amazon.de/dp/B0TESTASIN1?tag=nerdiction-21",
      "B0TESTASIN1",
    ),
    true,
  );

  assert.equal(
    isAllowedAmazonRedirectTarget(
      "https://www.amazon.com/dp/B0TESTASIN1?tag=x",
      "B0TESTASIN1",
    ),
    true,
  );

  assert.equal(
    isAllowedAmazonRedirectTarget("https://evil.example/phish", "B0TESTASIN1"),
    false,
  );

  assert.equal(
    isAllowedAmazonRedirectTarget(
      "https://www.amazon.de.evil.example/dp/B0TESTASIN1",
      "B0TESTASIN1",
    ),
    false,
  );

  assert.equal(
    isAllowedAmazonRedirectTarget(
      "https://www.amazon.de/dp/B0OTHERASIN?tag=x",
      "B0TESTASIN1",
    ),
    false,
  );

  assert.equal(
    isAllowedAmazonRedirectTarget("javascript:alert(1)", "B0TESTASIN1"),
    false,
  );

  assert.equal(
    isAllowedAmazonRedirectTarget(
      "https://user:pass@www.amazon.de/dp/B0TESTASIN1",
      "B0TESTASIN1",
    ),
    false,
  );

  assert.equal(isAllowedAmazonRedirectTarget("https://amzn.to/abc123"), true);

  console.log("safe-amazon-redirect tests passed");
}

run();
