import type { JobType } from "@prisma/client";
import { listDatabaseUrlCandidates } from "@/lib/db/database-url";

export type HealthStatus = "ok" | "warn" | "error";

export type EnvCheckDefinition = {
  id: string;
  label: string;
  category: "core" | "cron" | "integrations" | "optional";
  required: boolean;
  /** Any listed env key being set counts as present. */
  keys: string[];
  /** Custom resolver when presence is more than a single key. */
  resolvePresent?: (env: NodeJS.ProcessEnv) => boolean;
  /** When true, required only on Vercel/production. */
  requiredOnHosted?: boolean;
};

export type EnvCheckResult = {
  id: string;
  label: string;
  category: EnvCheckDefinition["category"];
  required: boolean;
  present: boolean;
  status: HealthStatus;
};

export type CronPipelineCheck = {
  id: string;
  label: string;
  schedule: string;
  jobTypes: JobType[];
  maxAgeHours: number;
};

export type CronPipelineResult = {
  id: string;
  label: string;
  schedule: string;
  status: HealthStatus;
  lastSuccessAt: string | null;
  lastStatus: string | null;
  message: string;
};

export const ENV_HEALTH_CHECKS: EnvCheckDefinition[] = [
  {
    id: "database",
    label: "Postgres (DATABASE_URL / POSTGRES_*)",
    category: "core",
    required: true,
    keys: [],
    resolvePresent: () => listDatabaseUrlCandidates().length > 0,
  },
  {
    id: "auth_secret",
    label: "AUTH_SECRET / NEXTAUTH_SECRET",
    category: "core",
    required: true,
    keys: ["AUTH_SECRET", "NEXTAUTH_SECRET"],
  },
  {
    id: "admin_credentials",
    label: "ADMIN_EMAIL + ADMIN_PASSWORD",
    category: "core",
    required: true,
    keys: ["ADMIN_EMAIL", "ADMIN_PASSWORD"],
    resolvePresent: (env) =>
      Boolean(env.ADMIN_EMAIL?.trim()) && Boolean(env.ADMIN_PASSWORD?.trim()),
  },
  {
    id: "cron_secret",
    label: "CRON_SECRET",
    category: "cron",
    required: false,
    requiredOnHosted: true,
    keys: ["CRON_SECRET"],
  },
  {
    id: "qstash",
    label: "QSTASH_TOKEN + Signing Keys",
    category: "cron",
    required: false,
    requiredOnHosted: true,
    keys: ["QSTASH_TOKEN", "QSTASH_CURRENT_SIGNING_KEY", "QSTASH_NEXT_SIGNING_KEY"],
    resolvePresent: (env) =>
      Boolean(env.QSTASH_TOKEN?.trim()) &&
      Boolean(env.QSTASH_CURRENT_SIGNING_KEY?.trim()) &&
      Boolean(env.QSTASH_NEXT_SIGNING_KEY?.trim()),
  },
  {
    id: "workflow_url",
    label: "UPSTASH_WORKFLOW_URL",
    category: "cron",
    required: false,
    requiredOnHosted: true,
    keys: ["UPSTASH_WORKFLOW_URL"],
  },
  {
    id: "redis",
    label: "Upstash Redis (KV_REST_API_*)",
    category: "integrations",
    required: false,
    keys: ["KV_REST_API_URL", "KV_REST_API_TOKEN"],
    resolvePresent: (env) =>
      Boolean(env.KV_REST_API_URL?.trim()) &&
      Boolean(env.KV_REST_API_TOKEN?.trim()),
  },
  {
    id: "openrouter",
    label: "OPENROUTER_API_KEY",
    category: "integrations",
    required: true,
    keys: ["OPENROUTER_API_KEY"],
  },
  {
    id: "rapidapi",
    label: "RAPIDAPI_KEY",
    category: "integrations",
    required: true,
    keys: ["RAPIDAPI_KEY"],
  },
  {
    id: "resend",
    label: "RESEND_API_KEY (Preisalarme)",
    category: "optional",
    required: false,
    keys: ["RESEND_API_KEY"],
  },
  {
    id: "igdb",
    label: "IGDB_CLIENT_ID + IGDB_CLIENT_SECRET",
    category: "optional",
    required: false,
    keys: ["IGDB_CLIENT_ID", "IGDB_CLIENT_SECRET"],
    resolvePresent: (env) =>
      Boolean(env.IGDB_CLIENT_ID?.trim()) &&
      Boolean(env.IGDB_CLIENT_SECRET?.trim()),
  },
  {
    id: "ip_hash",
    label: "IP_HASH_SECRET",
    category: "optional",
    required: false,
    keys: ["IP_HASH_SECRET"],
  },
];

export const CRON_PIPELINE_CHECKS: CronPipelineCheck[] = [
  {
    id: "sync-products",
    label: "Produkt-Sync",
    schedule: "0 6 * * * UTC",
    jobTypes: ["sync_search", "sync_details"],
    maxAgeHours: 30,
  },
  {
    id: "generate-content",
    label: "Content-Generierung",
    schedule: "0 7 * * * UTC",
    jobTypes: ["generate_review", "generate_comments"],
    maxAgeHours: 30,
  },
  {
    id: "ratgeber",
    label: "Ratgeber",
    schedule: "0 9 * * * UTC",
    jobTypes: ["generate_advice_guide"],
    maxAgeHours: 30,
  },
  {
    id: "game-reviews",
    label: "Spiele-Reviews (IGDB)",
    schedule: "0 10 * * * UTC",
    jobTypes: ["generate_game_review"],
    maxAgeHours: 30,
  },
];

export function isHostedRuntime(env: NodeJS.ProcessEnv = process.env): boolean {
  return env.VERCEL === "1" || env.NODE_ENV === "production";
}

export function envVarPresent(
  keys: string[],
  env: NodeJS.ProcessEnv = process.env,
): boolean {
  return keys.some((key) => Boolean(env[key]?.trim()));
}

export function evaluateEnvCheck(
  check: EnvCheckDefinition,
  env: NodeJS.ProcessEnv = process.env,
): EnvCheckResult {
  const present = check.resolvePresent
    ? check.resolvePresent(env)
    : envVarPresent(check.keys, env);

  const hosted = isHostedRuntime(env);
  const effectivelyRequired =
    check.required || (check.requiredOnHosted === true && hosted);

  let status: HealthStatus = "ok";
  if (!present && effectivelyRequired) {
    status = "error";
  } else if (!present && !effectivelyRequired) {
    status = "warn";
  }

  return {
    id: check.id,
    label: check.label,
    category: check.category,
    required: effectivelyRequired,
    present,
    status,
  };
}

export function evaluateEnvChecks(
  checks: EnvCheckDefinition[] = ENV_HEALTH_CHECKS,
  env: NodeJS.ProcessEnv = process.env,
): EnvCheckResult[] {
  return checks.map((check) => evaluateEnvCheck(check, env));
}

export function aggregateHealthStatus(
  statuses: HealthStatus[],
): HealthStatus {
  if (statuses.includes("error")) return "error";
  if (statuses.includes("warn")) return "warn";
  return "ok";
}

export function formatMinutesAgo(
  date: Date,
  now: Date = new Date(),
): string {
  const diffMs = now.getTime() - date.getTime();
  if (diffMs < 0) return "gerade eben";
  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 1) return "gerade eben";
  if (minutes < 60) return `vor ${minutes} Min.`;
  const hours = Math.floor(minutes / 60);
  if (hours < 48) return `vor ${hours} Std.`;
  const days = Math.floor(hours / 24);
  return `vor ${days} Tag${days === 1 ? "" : "en"}`;
}

export function isJobRecent(
  date: Date,
  maxAgeHours: number,
  now: Date = new Date(),
): boolean {
  return now.getTime() - date.getTime() <= maxAgeHours * 60 * 60 * 1000;
}

export type JobRunSnapshot = {
  type: JobType;
  status: string;
  createdAt: Date;
};

export function evaluateCronPipeline(
  pipeline: CronPipelineCheck,
  runs: JobRunSnapshot[],
  now: Date = new Date(),
): CronPipelineResult {
  const relevant = runs.filter((run) => pipeline.jobTypes.includes(run.type));
  const lastSuccess = relevant.find((run) => run.status === "succeeded");
  const lastRun = relevant[0];

  if (!lastSuccess) {
    return {
      id: pipeline.id,
      label: pipeline.label,
      schedule: pipeline.schedule,
      status: relevant.length === 0 ? "warn" : "error",
      lastSuccessAt: null,
      lastStatus: lastRun?.status ?? null,
      message:
        relevant.length === 0
          ? "Kein passender JobRun gefunden"
          : "Noch kein erfolgreicher Lauf",
    };
  }

  const recent = isJobRecent(
    lastSuccess.createdAt,
    pipeline.maxAgeHours,
    now,
  );

  return {
    id: pipeline.id,
    label: pipeline.label,
    schedule: pipeline.schedule,
    status: recent ? "ok" : "warn",
    lastSuccessAt: lastSuccess.createdAt.toISOString(),
    lastStatus: lastSuccess.status,
    message: recent
      ? `Letzter Erfolg ${formatMinutesAgo(lastSuccess.createdAt, now)}`
      : `Letzter Erfolg ${formatMinutesAgo(lastSuccess.createdAt, now)} (älter als ${pipeline.maxAgeHours}h)`,
  };
}

export function evaluateCronPipelines(
  pipelines: CronPipelineCheck[] = CRON_PIPELINE_CHECKS,
  runs: JobRunSnapshot[],
  now: Date = new Date(),
): CronPipelineResult[] {
  const sorted = [...runs].sort(
    (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
  );
  return pipelines.map((pipeline) =>
    evaluateCronPipeline(pipeline, sorted, now),
  );
}

export function statusBadgeClass(status: HealthStatus): string {
  switch (status) {
    case "ok":
      return "bg-emerald-100 text-emerald-800";
    case "warn":
      return "bg-amber-100 text-amber-800";
    case "error":
      return "bg-red-100 text-red-800";
    default: {
      const _exhaustive: never = status;
      throw new Error(`Unknown health status: ${_exhaustive}`);
    }
  }
}

export function statusLabel(status: HealthStatus): string {
  switch (status) {
    case "ok":
      return "OK";
    case "warn":
      return "Warnung";
    case "error":
      return "Fehler";
    default: {
      const _exhaustive: never = status;
      throw new Error(`Unknown health status: ${_exhaustive}`);
    }
  }
}
