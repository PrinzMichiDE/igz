-- CreateEnum value for JobType
ALTER TYPE "JobType" ADD VALUE 'generate_game_review';

-- CreateTable
CREATE TABLE "Game" (
    "id" TEXT NOT NULL,
    "igdbId" INTEGER NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "summary" TEXT,
    "storyline" TEXT,
    "coverUrl" TEXT,
    "releaseDate" TIMESTAMP(3),
    "igdbRating" DOUBLE PRECISION,
    "igdbRatingCount" INTEGER,
    "genresJson" JSONB,
    "platformsJson" JSONB,
    "developersJson" JSONB,
    "publishersJson" JSONB,
    "screenshotsJson" JSONB,
    "videosJson" JSONB,
    "websitesJson" JSONB,
    "storeLinksJson" JSONB,
    "rawIgdbJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Game_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GameReview" (
    "id" TEXT NOT NULL,
    "locale" "Locale" NOT NULL,
    "status" "ArticleStatus" NOT NULL DEFAULT 'draft',
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "excerpt" TEXT,
    "seoTitle" TEXT,
    "seoDescription" TEXT,
    "contentJson" JSONB,
    "overallScore" DOUBLE PRECISION,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "gameId" TEXT NOT NULL,

    CONSTRAINT "GameReview_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Game_igdbId_key" ON "Game"("igdbId");
CREATE UNIQUE INDEX "Game_slug_key" ON "Game"("slug");
CREATE INDEX "Game_releaseDate_idx" ON "Game"("releaseDate");
CREATE INDEX "Game_igdbRating_idx" ON "Game"("igdbRating");
CREATE INDEX "Game_name_idx" ON "Game"("name");

CREATE UNIQUE INDEX "GameReview_gameId_locale_key" ON "GameReview"("gameId", "locale");
CREATE UNIQUE INDEX "GameReview_slug_locale_key" ON "GameReview"("slug", "locale");
CREATE INDEX "GameReview_status_publishedAt_idx" ON "GameReview"("status", "publishedAt");
CREATE INDEX "GameReview_locale_status_idx" ON "GameReview"("locale", "status");

-- AddForeignKey
ALTER TABLE "GameReview" ADD CONSTRAINT "GameReview_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE CASCADE ON UPDATE CASCADE;
