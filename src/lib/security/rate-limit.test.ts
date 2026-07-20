import assert from "node:assert/strict";
import {
  checkRateLimit,
  resetMemoryRateLimits,
} from "@/lib/security/rate-limit";

async function run() {
  resetMemoryRateLimits();

  const first = await checkRateLimit({
    key: "test-bucket",
    limit: 2,
    windowSeconds: 60,
  });
  assert.equal(first.allowed, true);
  assert.equal(first.remaining, 1);

  const second = await checkRateLimit({
    key: "test-bucket",
    limit: 2,
    windowSeconds: 60,
  });
  assert.equal(second.allowed, true);
  assert.equal(second.remaining, 0);

  const third = await checkRateLimit({
    key: "test-bucket",
    limit: 2,
    windowSeconds: 60,
  });
  assert.equal(third.allowed, false);
  assert.equal(third.remaining, 0);

  const other = await checkRateLimit({
    key: "other-bucket",
    limit: 1,
    windowSeconds: 60,
  });
  assert.equal(other.allowed, true);

  resetMemoryRateLimits();
  const afterReset = await checkRateLimit({
    key: "test-bucket",
    limit: 2,
    windowSeconds: 60,
  });
  assert.equal(afterReset.allowed, true);

  console.log("rate-limit tests passed");
}

run();
