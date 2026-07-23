import assert from "node:assert/strict";
import type { JobType } from "@prisma/client";
import {
  aggregateHealthStatus,
  CRON_PIPELINE_CHECKS,
  ENV_HEALTH_CHECKS,
  evaluateCronPipeline,
  evaluateCronPipelines,
  evaluateEnvCheck,
  evaluateEnvChecks,
  formatMinutesAgo,
  isHostedRuntime,
  isJobRecent,
  statusBadgeClass,
  statusLabel,
} from "@/lib/admin/system-health";

function run() {
  const hostedEnv = {
    VERCEL: "1",
    NODE_ENV: "production",
    AUTH_SECRET: "secret",
    ADMIN_EMAIL: "admin@test.com",
    ADMIN_PASSWORD: "pw",
    OPENROUTER_API_KEY: "or",
    RAPIDAPI_KEY: "rapid",
  } as NodeJS.ProcessEnv;

  assert.equal(isHostedRuntime(hostedEnv), true);
  assert.equal(isHostedRuntime({ NODE_ENV: "development" }), false);

  const missingCron = evaluateEnvCheck(
    ENV_HEALTH_CHECKS.find((c) => c.id === "cron_secret")!,
    hostedEnv,
  );
  assert.equal(missingCron.present, false);
  assert.equal(missingCron.required, true);
  assert.equal(missingCron.status, "error");

  const localEnv = {
    NODE_ENV: "development",
    AUTH_SECRET: "secret",
    ADMIN_EMAIL: "admin@test.com",
    ADMIN_PASSWORD: "pw",
    OPENROUTER_API_KEY: "or",
    RAPIDAPI_KEY: "rapid",
  } as NodeJS.ProcessEnv;

  const optionalCron = evaluateEnvCheck(
    ENV_HEALTH_CHECKS.find((c) => c.id === "cron_secret")!,
    localEnv,
  );
  assert.equal(optionalCron.required, false);
  assert.equal(optionalCron.status, "warn");

  const envResults = evaluateEnvChecks(undefined, localEnv);
  assert.ok(envResults.some((row) => row.id === "auth_secret" && row.status === "ok"));

  assert.equal(aggregateHealthStatus(["ok", "warn"]), "warn");
  assert.equal(aggregateHealthStatus(["ok", "error"]), "error");
  assert.equal(aggregateHealthStatus(["ok"]), "ok");

  const now = new Date("2026-07-23T12:00:00.000Z");
  const recent = new Date("2026-07-23T11:30:00.000Z");
  const stale = new Date("2026-07-20T12:00:00.000Z");

  assert.equal(isJobRecent(recent, 2, now), true);
  assert.equal(isJobRecent(stale, 2, now), false);
  assert.equal(formatMinutesAgo(recent, now), "vor 30 Min.");

  const runs = [
    {
      type: "generate_review" as JobType,
      status: "succeeded",
      createdAt: recent,
    },
    {
      type: "generate_review" as JobType,
      status: "failed",
      createdAt: new Date("2026-07-23T10:00:00.000Z"),
    },
  ];

  const contentPipeline = CRON_PIPELINE_CHECKS.find(
    (p) => p.id === "generate-content",
  )!;
  const pipelineOk = evaluateCronPipeline(contentPipeline, runs, now);
  assert.equal(pipelineOk.status, "ok");
  assert.ok(pipelineOk.lastSuccessAt);

  const staleRuns = [
    {
      type: "generate_review" as JobType,
      status: "succeeded",
      createdAt: stale,
    },
  ];
  const pipelineStale = evaluateCronPipeline(contentPipeline, staleRuns, now);
  assert.equal(pipelineStale.status, "warn");

  const pipelines = evaluateCronPipelines(undefined, runs, now);
  assert.equal(pipelines.length, CRON_PIPELINE_CHECKS.length);

  assert.equal(statusLabel("ok"), "OK");
  assert.match(statusBadgeClass("error"), /red/);

  console.log("system-health tests passed");
}

run();
