import "dotenv/config";
import { defineConfig } from "prisma/config";

function resolveDatabaseUrl() {
  return (
    process.env["DATABASE_URL"] ??
    process.env["POSTGRES_PRISMA_URL"] ??
    process.env["POSTGRES_URL"] ??
    process.env["POSTGRES_URL_NON_POOLING"]
  );
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: resolveDatabaseUrl(),
  },
});
