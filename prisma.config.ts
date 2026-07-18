import "dotenv/config";
import { defineConfig } from "prisma/config";
import { resolveDatabaseUrl } from "./src/lib/db/database-url";

function datasourceUrl() {
  try {
    return resolveDatabaseUrl({ forSchemaPush: true });
  } catch {
    // Allow `prisma generate` without a DB URL; push/migrate will fail later
    // with a clearer error from resolveDatabaseUrl().
    return process.env.DATABASE_URL;
  }
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: datasourceUrl(),
  },
});
