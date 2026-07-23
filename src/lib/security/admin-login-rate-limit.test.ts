import assert from "node:assert/strict";
import {
  ADMIN_LOGIN_RATE_LIMIT,
  isAdminCredentialsAuthRequest,
} from "@/lib/security/admin-login-rate-limit";

function run() {
  assert.equal(
    isAdminCredentialsAuthRequest("/api/auth/callback/credentials"),
    true,
  );
  assert.equal(
    isAdminCredentialsAuthRequest("/api/auth/signin/credentials"),
    true,
  );
  assert.equal(isAdminCredentialsAuthRequest("/api/auth/session"), false);
  assert.equal(isAdminCredentialsAuthRequest("/api/auth/signout"), false);

  assert.equal(ADMIN_LOGIN_RATE_LIMIT.limit, 10);
  assert.equal(ADMIN_LOGIN_RATE_LIMIT.windowSeconds, 3600);

  console.log("admin-login-rate-limit tests passed");
}

run();
