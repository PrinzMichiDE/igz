import assert from "node:assert/strict";
import { NextRequest } from "next/server";
import {
  authorizeCronRequest,
  extractCronSecret,
  safeEqual,
} from "@/lib/security/cron-auth";

function withEnv(
  values: Record<string, string | undefined>,
  fn: () => void,
) {
  const previous = new Map<string, string | undefined>();
  for (const [key, value] of Object.entries(values)) {
    previous.set(key, process.env[key]);
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
  try {
    fn();
  } finally {
    for (const [key, value] of previous) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
}

function run() {
  assert.equal(safeEqual("abc", "abc"), true);
  assert.equal(safeEqual("abc", "abd"), false);
  assert.equal(safeEqual("abc", "abcd"), false);

  const bearerReq = new NextRequest("http://localhost/api/cron/setup", {
    headers: { authorization: "Bearer super-secret" },
  });
  assert.equal(extractCronSecret(bearerReq), "super-secret");

  const headerReq = new NextRequest("http://localhost/api/cron/setup", {
    headers: { "x-cron-secret": "header-secret" },
  });
  assert.equal(extractCronSecret(headerReq), "header-secret");

  withEnv(
    {
      CRON_SECRET: "expected",
      VERCEL: undefined,
      NODE_ENV: "test",
    },
    () => {
      const ok = authorizeCronRequest(
        new NextRequest("http://localhost/api/cron/setup", {
          headers: { authorization: "Bearer expected" },
        }),
      );
      assert.equal(ok, null);

      const denied = authorizeCronRequest(
        new NextRequest("http://localhost/api/cron/setup"),
      );
      assert.ok(denied);
      assert.equal(denied.status, 401);
    },
  );

  withEnv(
    {
      CRON_SECRET: undefined,
      VERCEL: "1",
      NODE_ENV: "production",
    },
    () => {
      const misconfigured = authorizeCronRequest(
        new NextRequest("http://localhost/api/cron/setup"),
      );
      assert.ok(misconfigured);
      assert.equal(misconfigured.status, 503);
    },
  );

  withEnv(
    {
      CRON_SECRET: undefined,
      VERCEL: undefined,
      NODE_ENV: "development",
    },
    () => {
      const local = authorizeCronRequest(
        new NextRequest("http://localhost/api/cron/setup"),
      );
      assert.equal(local, null);
    },
  );

  console.log("cron-auth tests passed");
}

run();
