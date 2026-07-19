-- AlterEnum
ALTER TYPE "ArticleType" ADD VALUE 'advice_guide';
ALTER TYPE "JobType" ADD VALUE 'generate_advice_guide';

-- AlterTable
ALTER TABLE "Article" ADD COLUMN "topicKey" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Article_topicKey_locale_key" ON "Article"("topicKey", "locale");
CREATE INDEX "Article_type_status_publishedAt_idx" ON "Article"("type", "status", "publishedAt");
