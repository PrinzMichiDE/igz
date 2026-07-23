import { listDatabaseUrlCandidates } from "@/lib/db/database-url";
import { prisma } from "@/lib/db/prisma";
import {
  aggregateHealthStatus,
  CRON_PIPELINE_CHECKS,
  ENV_HEALTH_CHECKS,
  evaluateCronPipelines,
  evaluateEnvChecks,
  isHostedRuntime,
  type CronPipelineResult,
  type EnvCheckResult,
  type HealthStatus,
} from "@/lib/admin/system-health";
import { getRedis } from "@/lib/upstash/redis";

export type SystemHealthReport = {
  overall: HealthStatus;
  checkedAt: string;
  runtime: {
    nodeEnv: string;
    vercel: boolean;
    region: string | null;
  };
  database: {
    status: HealthStatus;
    latencyMs: number | null;
    candidateCount: number;
    error: string | null;
  };
  redis: {
    status: HealthStatus;
    configured: boolean;
    latencyMs: number | null;
    error: string | null;
  };
  cronAuth: {
    status: HealthStatus;
    configured: boolean;
    message: string;
  };
  envChecks: EnvCheckResult[];
  cronPipelines: CronPipelineResult[];
};

export async function collectSystemHealthReport(): Promise<SystemHealthReport> {
  const checkedAt = new Date().toISOString();
  const envChecks = evaluateEnvChecks(ENV_HEALTH_CHECKS);

  const database = await probeDatabase();
  const redis = await probeRedis();
  const cronAuth = evaluateCronAuth();
  const cronPipelines = await loadCronPipelineHealth();

  const overall = aggregateHealthStatus([
    database.status,
    redis.status,
    cronAuth.status,
    ...envChecks.map((row) => row.status),
    ...cronPipelines.map((row) => row.status),
  ]);

  return {
    overall,
    checkedAt,
    runtime: {
      nodeEnv: process.env.NODE_ENV ?? "development",
      vercel: process.env.VERCEL === "1",
      region: process.env.VERCEL_REGION ?? null,
    },
    database,
    redis,
    cronAuth,
    envChecks,
    cronPipelines,
  };
}

async function probeDatabase(): Promise<SystemHealthReport["database"]> {
  const candidateCount = listDatabaseUrlCandidates().length;
  if (candidateCount === 0) {
    return {
      status: "error",
      latencyMs: null,
      candidateCount: 0,
      error: "Keine verwendbare Postgres-URL konfiguriert",
    };
  }

  const started = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    return {
      status: "ok",
      latencyMs: Date.now() - started,
      candidateCount,
      error: null,
    };
  } catch (error) {
    return {
      status: "error",
      latencyMs: Date.now() - started,
      candidateCount,
      error: error instanceof Error ? error.message : "Datenbank nicht erreichbar",
    };
  }
}

async function probeRedis(): Promise<SystemHealthReport["redis"]> {
  const client = getRedis();
  if (!client) {
    return {
      status: "warn",
      configured: false,
      latencyMs: null,
      error: null,
    };
  }

  const started = Date.now();
  try {
    await client.ping();
    return {
      status: "ok",
      configured: true,
      latencyMs: Date.now() - started,
      error: null,
    };
  } catch (error) {
    return {
      status: "error",
      configured: true,
      latencyMs: Date.now() - started,
      error: error instanceof Error ? error.message : "Redis nicht erreichbar",
    };
  }
}

function evaluateCronAuth(): SystemHealthReport["cronAuth"] {
  const configured = Boolean(process.env.CRON_SECRET?.trim());
  const hosted = isHostedRuntime();

  if (hosted && !configured) {
    return {
      status: "error",
      configured: false,
      message: "CRON_SECRET fehlt – geplante Cron-Jobs liefern 503",
    };
  }

  if (!configured) {
    return {
      status: "warn",
      configured: false,
      message: "CRON_SECRET nicht gesetzt (nur lokal/dev erlaubt)",
    };
  }

  return {
    status: "ok",
    configured: true,
    message: "Cron-Authentifizierung konfiguriert",
  };
}

async function loadCronPipelineHealth() {
  const runs = await prisma.jobRun.findMany({
    orderBy: { createdAt: "desc" },
    take: 500,
    select: {
      type: true,
      status: true,
      createdAt: true,
    },
  });

  return evaluateCronPipelines(CRON_PIPELINE_CHECKS, runs);
}
