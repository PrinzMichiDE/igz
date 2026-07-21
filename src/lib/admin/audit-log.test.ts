import assert from "node:assert/strict";
import {
  isAdminAuditEntityType,
  normalizeAuditPagination,
} from "@/lib/admin/audit-log";

function run() {
  assert.deepEqual(normalizeAuditPagination({}), {
    page: 1,
    limit: 50,
    offset: 0,
  });

  assert.deepEqual(normalizeAuditPagination({ page: "3", limit: "25" }), {
    page: 3,
    limit: 25,
    offset: 50,
  });

  assert.deepEqual(normalizeAuditPagination({ page: "0", limit: "999" }), {
    page: 1,
    limit: 100,
    offset: 0,
  });

  assert.deepEqual(normalizeAuditPagination({ page: "abc", limit: "5" }), {
    page: 1,
    limit: 10,
    offset: 0,
  });

  assert.equal(isAdminAuditEntityType("price_alert"), true);
  assert.equal(isAdminAuditEntityType("product"), true);
  assert.equal(isAdminAuditEntityType("unknown"), false);
  assert.equal(isAdminAuditEntityType(""), false);

  console.log("audit-log tests passed");
}

run();
