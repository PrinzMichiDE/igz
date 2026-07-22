import assert from "node:assert/strict";
import {
  aggregateJobRunCounts,
  buildJobRunWhere,
  countRecentFailedJobs,
  isAdminJobStatus,
  isAdminJobType,
  normalizeJobRunPagination,
} from "@/lib/jobs/admin-stats";

function run() {
  const counts = aggregateJobRunCounts([
    { status: "succeeded" },
    { status: "succeeded" },
    { status: "failed" },
    { status: "skipped" },
    { status: "running" },
    { status: "pending" },
  ]);

  assert.equal(counts.total, 6);
  assert.equal(counts.succeeded, 2);
  assert.equal(counts.failed, 1);
  assert.equal(counts.skipped, 1);
  assert.equal(counts.running, 1);
  assert.equal(counts.pending, 1);

  assert.equal(isAdminJobType("generate_review"), true);
  assert.equal(isAdminJobType("unknown"), false);

  assert.equal(isAdminJobStatus("failed"), true);
  assert.equal(isAdminJobStatus("cancelled"), false);

  assert.deepEqual(normalizeJobRunPagination({}), {
    page: 1,
    limit: 50,
    offset: 0,
  });

  assert.deepEqual(normalizeJobRunPagination({ page: "2", limit: "20" }), {
    page: 2,
    limit: 20,
    offset: 20,
  });

  assert.deepEqual(buildJobRunWhere({ status: "failed" }), {
    status: "failed",
  });

  assert.deepEqual(
    buildJobRunWhere({ type: "sync_search", status: "succeeded" }),
    { type: "sync_search", status: "succeeded" },
  );

  assert.equal(buildJobRunWhere(undefined), undefined);

  const now = new Date("2026-07-22T12:00:00Z");
  const recent = countRecentFailedJobs(
    [
      { status: "failed", createdAt: new Date("2026-07-22T10:00:00Z") },
      { status: "failed", createdAt: new Date("2026-07-20T10:00:00Z") },
      { status: "succeeded", createdAt: new Date("2026-07-22T11:00:00Z") },
    ],
    24,
    now,
  );
  assert.equal(recent, 1);

  console.log("jobs admin-stats tests passed");
}

run();
