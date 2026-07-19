-- CreateEnum
CREATE TYPE "PriceAlertStatus" AS ENUM ('active', 'triggered', 'unsubscribed', 'failed');

-- CreateTable
CREATE TABLE "PriceAlert" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "locale" "Locale" NOT NULL,
    "targetPrice" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "status" "PriceAlertStatus" NOT NULL DEFAULT 'active',
    "unsubscribeToken" TEXT NOT NULL,
    "lastNotifiedAt" TIMESTAMP(3),
    "triggeredAt" TIMESTAMP(3),
    "ipHash" TEXT,
    "privacyAccepted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "productId" TEXT NOT NULL,

    CONSTRAINT "PriceAlert_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PriceAlert_unsubscribeToken_key" ON "PriceAlert"("unsubscribeToken");
CREATE INDEX "PriceAlert_status_productId_idx" ON "PriceAlert"("status", "productId");
CREATE INDEX "PriceAlert_email_productId_idx" ON "PriceAlert"("email", "productId");
CREATE INDEX "PriceAlert_ipHash_createdAt_idx" ON "PriceAlert"("ipHash", "createdAt");

-- AddForeignKey
ALTER TABLE "PriceAlert" ADD CONSTRAINT "PriceAlert_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
