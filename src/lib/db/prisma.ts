import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import {
  describeDatabaseUrl,
  pgPoolSslOption,
  resolveDatabaseUrl,
} from "@/lib/db/database-url";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  pgPool: Pool | undefined;
  dbHostLogged?: boolean;
};

function createPrismaClient() {
  const connectionString = resolveDatabaseUrl();
  const ssl = pgPoolSslOption(connectionString);

  if (!globalForPrisma.dbHostLogged) {
    const sslMode = /[?&]sslmode=([^&]+)/i.exec(connectionString)?.[1] ?? "default";
    console.info(
      `[db] prisma pool → ${describeDatabaseUrl(connectionString)} (sslmode=${sslMode})`,
    );
    globalForPrisma.dbHostLogged = true;
  }

  const pool =
    globalForPrisma.pgPool ??
    new Pool({
      connectionString,
      max: Number(process.env.DATABASE_POOL_MAX ?? 1),
      idleTimeoutMillis: 20_000,
      connectionTimeoutMillis: 30_000,
      // Important: do not pass `ssl: {...}` when sslmode=disable — that forces TLS
      // and causes P1011 "server does not support TLS".
      ...(ssl ? { ssl } : {}),
    });

  globalForPrisma.pgPool = pool;

  const adapter = new PrismaPg(pool);
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
}

function getPrismaClient() {
  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = createPrismaClient();
  }
  return globalForPrisma.prisma;
}

/**
 * Lazy proxy so importing this module does not crash at build time when
 * DATABASE_URL is missing; first real query resolves/validates the URL.
 */
export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop, receiver) {
    const client = getPrismaClient();
    const value = Reflect.get(client, prop, receiver);
    return typeof value === "function" ? value.bind(client) : value;
  },
});
