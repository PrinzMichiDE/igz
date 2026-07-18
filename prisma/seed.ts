import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import {
  pgPoolSslOption,
  resolveDatabaseUrl,
} from "../src/lib/db/database-url";
import { NICHE_CATEGORY_KEYWORDS_DE } from "../src/lib/seo/niche/bluetooth-headphones";

const connectionString = resolveDatabaseUrl();
const ssl = pgPoolSslOption(connectionString);
const pool = new Pool({
  connectionString,
  ...(ssl ? { ssl } : {}),
});
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

async function main() {
  const headphones = await prisma.category.upsert({
    where: { slug: "bluetooth-kopfhoerer" },
    update: {
      nameDe: "Bluetooth-Kopfhörer",
      nameEn: "Bluetooth Headphones",
      descriptionDe:
        "Vergleich der besten Bluetooth-Kopfhörer nach Klang, Tragekomfort und Preis-Leistung.",
      descriptionEn:
        "Comparison of the best Bluetooth headphones by sound, comfort and value.",
      searchKeywords: NICHE_CATEGORY_KEYWORDS_DE,
      countryScope: "DE",
    },
    create: {
      slug: "bluetooth-kopfhoerer",
      nameDe: "Bluetooth-Kopfhörer",
      nameEn: "Bluetooth Headphones",
      descriptionDe:
        "Vergleich der besten Bluetooth-Kopfhörer nach Klang, Tragekomfort und Preis-Leistung.",
      descriptionEn:
        "Comparison of the best Bluetooth headphones by sound, comfort and value.",
      searchKeywords: NICHE_CATEGORY_KEYWORDS_DE,
      countryScope: "DE",
    },
  });

  const vacuums = await prisma.category.upsert({
    where: { slug: "akku-staubsauger" },
    update: {
      nameDe: "Akku-Staubsauger",
      nameEn: "Cordless Vacuums",
      descriptionDe:
        "Die besten Akku-Staubsauger im Vergleich – Saugkraft, Laufzeit und Handhabung.",
      descriptionEn:
        "Top cordless vacuums compared – suction, runtime and handling.",
      searchKeywords: ["akku staubsauger", "cordless vacuum"],
      countryScope: "DE",
    },
    create: {
      slug: "akku-staubsauger",
      nameDe: "Akku-Staubsauger",
      nameEn: "Cordless Vacuums",
      descriptionDe:
        "Die besten Akku-Staubsauger im Vergleich – Saugkraft, Laufzeit und Handhabung.",
      descriptionEn:
        "Top cordless vacuums compared – suction, runtime and handling.",
      searchKeywords: ["akku staubsauger", "cordless vacuum"],
      countryScope: "DE",
    },
  });

  // Remove legacy demo products/content if still present.
  const { purgeDemoData } = await import("../src/lib/db/purge-demo-data");
  const purged = await purgeDemoData();

  await prisma.apiQuotaMonth.upsert({
    where: {
      provider_yearMonth: {
        provider: "rapidapi_amazon",
        yearMonth: new Date().toISOString().slice(0, 7),
      },
    },
    update: {},
    create: {
      provider: "rapidapi_amazon",
      yearMonth: new Date().toISOString().slice(0, 7),
      used: 0,
      softLimit: Number(process.env.RAPIDAPI_MONTHLY_LIMIT || 100),
      reserve: Number(process.env.RAPIDAPI_MONTHLY_RESERVE || 6),
    },
  });

  // Curated Top-50 Amazon categories (no RapidAPI quota during seed).
  const { ensureTopAmazonCategories } = await import(
    "../src/lib/amazon/sync-categories"
  );
  const topCategories = await ensureTopAmazonCategories({
    limit: 50,
    fetchFromApi: false,
  });

  console.log("Seed completed:", {
    nicheCategories: [headphones.slug, vacuums.slug],
    topCategories: topCategories.total,
    purgedDemo: purged,
  });
}

export async function runSeed() {
  try {
    await main();
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

// Only auto-run when executed as a script (npm run db:seed), not when imported
// by the Vercel /api/cron/setup route.
const invokedDirectly = process.argv.some(
  (arg) => arg.includes("seed.ts") || arg.includes("seed.js"),
);
if (invokedDirectly) {
  void runSeed().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
