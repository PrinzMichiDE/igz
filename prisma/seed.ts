import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { buildAffiliateUrl } from "../src/lib/amazon/affiliate";
import { resolveDatabaseUrl } from "../src/lib/db/database-url";

const pool = new Pool({
  connectionString: resolveDatabaseUrl(),
  ssl:
    process.env.NODE_ENV === "production"
      ? { rejectUnauthorized: false }
      : undefined,
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

  const demoProducts = [
    {
      asin: "B0DEMO0001",
      slug: "demo-kopfhoerer-pro-b0demo0001",
      title: "Demo Kopfhörer Pro ANC",
      price: 129.99,
      rating: 4.6,
      reviewCount: 1842,
      editorialScore: 8.7,
      features: [
        "Aktive Geräuschunterdrückung",
        "30 Stunden Akku",
        "Multipoint Bluetooth",
      ],
      categoryId: headphones.id,
    },
    {
      asin: "B0DEMO0002",
      slug: "demo-kopfhoerer-lite-b0demo0002",
      title: "Demo Kopfhörer Lite",
      price: 59.99,
      rating: 4.3,
      reviewCount: 920,
      editorialScore: 7.8,
      features: ["Leichtbau", "USB-C Laden", "Gute Alltagsqualität"],
      categoryId: headphones.id,
    },
    {
      asin: "B0DEMO0003",
      slug: "demo-kopfhoerer-sport-b0demo0003",
      title: "Demo Sport Buds IPX7",
      price: 79.99,
      rating: 4.4,
      reviewCount: 640,
      editorialScore: 8.1,
      features: ["IPX7", "Secure Fit", "Transparenzmodus"],
      categoryId: headphones.id,
    },
    {
      asin: "B0DEMO0004",
      slug: "demo-staubsauger-x-b0demo0004",
      title: "Demo Akkusauger X SoftRoll",
      price: 249.0,
      rating: 4.5,
      reviewCount: 2103,
      editorialScore: 8.4,
      features: ["60 Min Laufzeit", "LED-Bodendüse", "Waschbarer Filter"],
      categoryId: vacuums.id,
    },
    {
      asin: "B0DEMO0005",
      slug: "demo-staubsauger-mini-b0demo0005",
      title: "Demo Akkusauger Mini",
      price: 119.0,
      rating: 4.1,
      reviewCount: 455,
      editorialScore: 7.4,
      features: ["Kompakt", "Wandhalterung", "2 Saugstufen"],
      categoryId: vacuums.id,
    },
  ];

  for (const item of demoProducts) {
    await prisma.product.upsert({
      where: {
        asin_country: {
          asin: item.asin,
          country: "DE",
        },
      },
      update: {
        title: item.title,
        slug: item.slug,
        price: item.price,
        rating: item.rating,
        reviewCount: item.reviewCount,
        editorialScore: item.editorialScore,
        features: item.features,
        affiliateUrl: buildAffiliateUrl(item.asin, "DE"),
        productUrl: `https://www.amazon.de/dp/${item.asin}`,
        lastSyncedAt: new Date(),
        categoryId: item.categoryId,
      },
      create: {
        asin: item.asin,
        country: "DE",
        slug: item.slug,
        title: item.title,
        price: item.price,
        currency: "EUR",
        rating: item.rating,
        reviewCount: item.reviewCount,
        editorialScore: item.editorialScore,
        features: item.features,
        affiliateUrl: buildAffiliateUrl(item.asin, "DE"),
        productUrl: `https://www.amazon.de/dp/${item.asin}`,
        lastSyncedAt: new Date(),
        categoryId: item.categoryId,
        imageUrl: null,
      },
    });
  }

  const headphoneProducts = await prisma.product.findMany({
    where: { categoryId: headphones.id },
    orderBy: { editorialScore: "desc" },
  });

  if (headphoneProducts.length >= 3) {
    await prisma.comparison.upsert({
      where: { categoryId: headphones.id },
      update: {
        winnerProductId: headphoneProducts[0].id,
        priceWinnerId: headphoneProducts[1].id,
        budgetWinnerId: headphoneProducts[2].id,
        criteriaJson: {
          intro:
            "Demo-Vergleich für UI-Preview. Ersetze die Daten später durch RapidAPI-Sync und OpenRouter-Content.",
          rankingNotes: [
            "Testsieger mit starker ANC-Leistung.",
            "Preis-Tipp für den Alltag.",
          ],
          faq: [
            {
              question: "Welcher Kopfhörer ist der Testsieger?",
              answer: headphoneProducts[0].title,
            },
          ],
        },
      },
      create: {
        categoryId: headphones.id,
        winnerProductId: headphoneProducts[0].id,
        priceWinnerId: headphoneProducts[1].id,
        budgetWinnerId: headphoneProducts[2].id,
        criteriaJson: {
          intro:
            "Demo-Vergleich für UI-Preview. Ersetze die Daten später durch RapidAPI-Sync und OpenRouter-Content.",
        },
      },
    });

    for (const locale of ["de", "en"] as const) {
      await prisma.article.upsert({
        where: {
          categoryId_type_locale: {
            categoryId: headphones.id,
            type: "comparison",
            locale,
          },
        },
        update: {
          status: "published",
          title:
            locale === "de"
              ? "Bluetooth-Kopfhörer Vergleich (Demo)"
              : "Bluetooth Headphones Comparison (Demo)",
          slug: `bluetooth-kopfhoerer-vergleich-${locale}`,
          excerpt:
            locale === "de"
              ? "Demo-Inhalt für die Vergleichsseite."
              : "Demo content for the comparison page.",
          contentJson: {
            intro:
              locale === "de"
                ? "Dieser Demo-Text zeigt das UI der Vergleichsseite."
                : "This demo text showcases the comparison page UI.",
            faq: [],
          },
          publishedAt: new Date(),
        },
        create: {
          type: "comparison",
          locale,
          status: "published",
          title:
            locale === "de"
              ? "Bluetooth-Kopfhörer Vergleich (Demo)"
              : "Bluetooth Headphones Comparison (Demo)",
          slug: `bluetooth-kopfhoerer-vergleich-${locale}`,
          excerpt:
            locale === "de"
              ? "Demo-Inhalt für die Vergleichsseite."
              : "Demo content for the comparison page.",
          contentJson: {
            intro:
              locale === "de"
                ? "Dieser Demo-Text zeigt das UI der Vergleichsseite."
                : "This demo text showcases the comparison page UI.",
            faq: [],
          },
          publishedAt: new Date(),
          categoryId: headphones.id,
        },
      });
    }

    for (const product of headphoneProducts) {
      for (const locale of ["de", "en"] as const) {
        await prisma.article.upsert({
          where: {
            productId_type_locale: {
              productId: product.id,
              type: "review",
              locale,
            },
          },
          update: {
            status: "published",
            title:
              locale === "de"
                ? `Ausführlicher Testbericht: ${product.title}`
                : `In-depth review: ${product.title}`,
            slug: `${product.slug}-review-${locale}`,
            excerpt:
              locale === "de"
                ? "Ausführlicher Demo-Testbericht für UI und SEO-Preview."
                : "Detailed demo review for UI and SEO preview.",
            contentJson: {
              score: product.editorialScore,
              testingPeriod: locale === "de" ? "3 Wochen Alltag" : "3 weeks daily use",
              directAnswer:
                locale === "de"
                  ? `${product.title} lohnt sich vor allem für Alltag und Pendeln: unkompliziert, komfortabel und preisstark – mit Abstrichen bei audiophilen Ansprüchen.`
                  : `${product.title} is worth it mainly for daily commuting use: simple, comfortable and strong value — with tradeoffs for audiophile expectations.`,
              keyTakeaways:
                locale === "de"
                  ? [
                      "Alltagstauglicher Klang ohne Spektakel",
                      "Starker Komfort für längere Sessions",
                      "Gutes Preis-Leistungs-Verhältnis",
                      "App-Funktionen eher durchschnittlich",
                    ]
                  : [
                      "Practical everyday sound",
                      "Strong comfort for longer sessions",
                      "Good value for money",
                      "App features are average",
                    ],
              scoreBreakdown: {
                overall: product.editorialScore ?? 8,
                value: 8.5,
                quality: 8.0,
                usability: 8.4,
                longevity: 7.8,
              },
              decisionGuide: {
                buyIf:
                  locale === "de"
                    ? ["Du pendelst täglich", "Du willst einfache Bedienung", "Komfort ist dir wichtig"]
                    : ["You commute daily", "You want simple controls", "Comfort matters"],
                skipIf:
                  locale === "de"
                    ? ["Du brauchst Studio-Qualität", "Du erwartest Profi-App-Features"]
                    : ["You need studio quality", "You expect pro app features"],
              },
              pros:
                locale === "de"
                  ? [
                      "Solider Klang für die Preisklasse",
                      "Angenehmer Tragekomfort",
                      "Zuverlässige Verbindung",
                      "Gute Akkulaufzeit im Pendelalltag",
                      "Einfache Bedienung",
                    ]
                  : [
                      "Solid sound for the price",
                      "Comfortable fit",
                      "Reliable connection",
                      "Good battery for commuting",
                      "Simple controls",
                    ],
              cons:
                locale === "de"
                  ? [
                      "Demo-Daten, keine echten Labormessungen",
                      "App-Funktionen nur durchschnittlich",
                      "Bei sehr lauter Umgebung Limit spürbar",
                    ]
                  : [
                      "Demo data, no real lab measurements",
                      "Average app features",
                      "Limits show in very loud environments",
                    ],
              bestFor:
                locale === "de" ? ["Alltag", "Pendeln", "Homeoffice"] : ["Daily use", "Commuting", "Remote work"],
              notFor:
                locale === "de" ? ["Studio-Produktion", "HiFi-Puristen"] : ["Studio production", "HiFi purists"],
              verdict:
                locale === "de"
                  ? `${product.title} wirkt im Demo-Szenario wie ein alltagstauglicher Begleiter: unkompliziert, angenehm zu tragen und mit einem ausgewogenen Klangprofil. Für Pendler und Homeoffice klar empfehlenswert, für Studioarbeit eher nicht die erste Wahl.`
                  : `${product.title} feels like a practical daily companion in this demo scenario: easy to use, comfortable, and balanced in sound. Great for commuting and remote work, less ideal for studio work.`,
              sections: [
                {
                  heading: locale === "de" ? "Erster Eindruck" : "First impressions",
                  body:
                    locale === "de"
                      ? "Direkt nach dem Auspacken wirkt das Setup unkompliziert. Sitz und Passform lassen sich schnell finden, und schon die ersten Minuten im Alltag zeigen, wohin die Reise geht: weniger Spektakel, mehr verlässliche Routine. Genau das braucht man oft im echten Nutzungsalltag."
                      : "Out of the box the setup feels straightforward. Fit is easy to dial in, and the first minutes of daily use already hint at the product's character: less spectacle, more reliable routine. That is often what real-world use needs.",
                },
                {
                  heading: locale === "de" ? "Alltagstest" : "Daily use",
                  body:
                    locale === "de"
                      ? "Im Pendelverkehr, bei Calls und abends auf dem Sofa bleibt der Eindruck konstant. Die Bedienung sitzt nach kurzer Eingewöhnung, und kleine Schwächen fallen erst bei längerer Nutzung auf – genau dort, wo authentische Testberichte ehrlich bleiben sollten."
                      : "Across commuting, calls and evening downtime the impression stays consistent. Controls become second nature quickly, and smaller weaknesses only appear with longer use — exactly where authentic reviews should stay honest.",
                },
              ],
              faq: [
                {
                  question:
                    locale === "de"
                      ? "Für wen lohnt sich der Kauf?"
                      : "Who should buy it?",
                  answer:
                    locale === "de"
                      ? "Vor allem für Alltag und Pendeln mit Fokus auf Komfort und einfache Nutzung."
                      : "Mainly for everyday and commuting use with a focus on comfort and simplicity.",
                },
              ],
            },
            publishedAt: new Date(),
          },
          create: {
            type: "review",
            locale,
            status: "published",
            title:
              locale === "de"
                ? `Ausführlicher Testbericht: ${product.title}`
                : `In-depth review: ${product.title}`,
            slug: `${product.slug}-review-${locale}`,
            excerpt:
              locale === "de"
                ? "Ausführlicher Demo-Testbericht für UI und SEO-Preview."
                : "Detailed demo review for UI and SEO preview.",
            contentJson: {
              score: product.editorialScore,
              testingPeriod: locale === "de" ? "3 Wochen Alltag" : "3 weeks daily use",
              pros:
                locale === "de"
                  ? ["Solider Klang", "Gutes Preis-Leistungs-Verhältnis", "Komfortabel", "Alltagstauglich"]
                  : ["Solid sound", "Good value", "Comfortable", "Practical"],
              cons:
                locale === "de"
                  ? ["Demo-Daten, keine echten Labormessungen", "App nur durchschnittlich"]
                  : ["Demo data, no real lab measurements", "Average app"],
              bestFor:
                locale === "de" ? ["Alltag", "Pendeln"] : ["Daily use", "Commuting"],
              notFor:
                locale === "de" ? ["Studio-Produktion"] : ["Studio production"],
              verdict:
                locale === "de"
                  ? `${product.title} ist ein starker Demo-Kandidat für ausführliche Testberichte.`
                  : `${product.title} is a strong demo candidate for long-form reviews.`,
              sections: [
                {
                  heading: locale === "de" ? "Praxis" : "In practice",
                  body:
                    locale === "de"
                      ? "Dieser Abschnitt wird später durch OpenRouter mit einem ausführlichen Alltagstest ersetzt."
                      : "This section will later be replaced by OpenRouter with a detailed daily-use report.",
                },
              ],
              faq: [],
            },
            publishedAt: new Date(),
            productId: product.id,
          },
        });

        await prisma.productExperienceComment.deleteMany({
          where: { productId: product.id, locale },
        });

        await prisma.productExperienceComment.createMany({
          data:
            locale === "de"
              ? [
                  {
                    productId: product.id,
                    locale,
                    authorName: "Anna K.",
                    authorContext: "Pendlerin, Homeoffice",
                    rating: 5,
                    title: "Endlich entspannt in der Bahn",
                    body: "Nach zwei Wochen Alltagstest bin ich überrascht, wie unkompliziert sich das Teil anfühlt. Morgens in der S-Bahn bleibt der Klang klar genug für Podcasts, und bei Calls wirkt die Bedienung intuitiv. Nicht perfekt bei sehr lautem Umfeld, aber für meinen Alltag genau richtig.",
                    usageWeeks: 2,
                    source: "seed_demo",
                  },
                  {
                    productId: product.id,
                    locale,
                    authorName: "Markus W.",
                    authorContext: "Sport & Abendroutine",
                    rating: 4,
                    title: "Gut, mit kleinen Abstrichen",
                    body: "Sitzt beim Joggen stabil und nervt nicht mit ständigen Verbindungsabbrüchen. Der Klang ist alltagstauglich, nicht audiophil. Nach längeren Sessions wünsche ich mir etwas mehr Feinschliff bei den Höhen – trotzdem würde ich es weiterempfehlen.",
                    usageWeeks: 5,
                    source: "seed_demo",
                  },
                  {
                    productId: product.id,
                    locale,
                    authorName: "Lea S.",
                    authorContext: "Preisbewusst, mobil",
                    rating: 3,
                    title: "Solide, aber nicht spektakulär",
                    body: "Für den Preis okay, ohne Wow-Effekt. Die Akkulaufzeit reicht mir fürs Pendeln, die App wirkt jedoch etwas nüchtern. Wer einfache Nutzung will, kommt klar – wer Features sucht, sollte genauer vergleichen.",
                    usageWeeks: 3,
                    source: "seed_demo",
                  },
                ]
              : [
                  {
                    productId: product.id,
                    locale,
                    authorName: "James R.",
                    authorContext: "Commuter, remote work",
                    rating: 5,
                    title: "Easy daily driver",
                    body: "After two weeks of commuting and calls, this feels refreshingly simple. Podcast clarity is solid on the train and controls are intuitive. Not perfect in very loud spaces, but for my routine it hits the mark.",
                    usageWeeks: 2,
                    source: "seed_demo",
                  },
                  {
                    productId: product.id,
                    locale,
                    authorName: "Maya L.",
                    authorContext: "Workouts and evenings",
                    rating: 4,
                    title: "Reliable with minor tradeoffs",
                    body: "Stays put while running and does not drop connection every few minutes. Sound is practical rather than audiophile. After longer sessions I want a bit more treble polish, but I would still recommend it.",
                    usageWeeks: 5,
                    source: "seed_demo",
                  },
                  {
                    productId: product.id,
                    locale,
                    authorName: "Chris P.",
                    authorContext: "Budget-minded",
                    rating: 3,
                    title: "Fine, not spectacular",
                    body: "Decent for the price without a wow moment. Battery covers my commute, though the app feels basic. Great if you want simplicity; compare more carefully if you need advanced features.",
                    usageWeeks: 3,
                    source: "seed_demo",
                  },
                ],
        });
      }
    }
  }

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

  console.log("Seed completed:", {
    categories: [headphones.slug, vacuums.slug],
    products: demoProducts.length,
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
