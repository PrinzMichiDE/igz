import assert from "node:assert/strict";
import { hashClientIp } from "@/lib/security/client-ip";

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
  withEnv(
    {
      IP_HASH_SECRET: "unit-test-secret",
      AUTH_SECRET: undefined,
      NEXTAUTH_SECRET: undefined,
    },
    () => {
      const a = hashClientIp("203.0.113.10");
      const b = hashClientIp("203.0.113.10");
      const c = hashClientIp("203.0.113.11");
      assert.equal(a, b);
      assert.notEqual(a, c);
      assert.equal(a.length, 64);
      assert.notEqual(a, "203.0.113.10");
    },
  );

  console.log("client-ip tests passed");
}

run();
