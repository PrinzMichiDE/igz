import assert from "node:assert/strict";
import { maskEmail } from "@/lib/admin/mask-email";

function run() {
  assert.equal(maskEmail("user@example.com"), "u***@example.com");
  assert.equal(maskEmail("  User@Example.COM  "), "u***@example.com");
  assert.equal(maskEmail("ab@test.de"), "a***@test.de");
  assert.equal(maskEmail("invalid"), "***");
  assert.equal(maskEmail("@nodomain.com"), "***");

  console.log("mask-email tests passed");
}

run();
