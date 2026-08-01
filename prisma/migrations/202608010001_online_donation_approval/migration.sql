CREATE TYPE "OnlineDonationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

CREATE TABLE "OnlineDonationSubmission" (
  "id" TEXT NOT NULL,
  "externalReference" TEXT NOT NULL,
  "firstName" TEXT NOT NULL,
  "lastName" TEXT NOT NULL,
  "phone" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "originCountry" TEXT NOT NULL DEFAULT 'Türkiye',
  "originCity" TEXT NOT NULL,
  "originDistrict" TEXT NOT NULL DEFAULT 'Merkez',
  "campaign" TEXT NOT NULL,
  "amount" DECIMAL(18,2) NOT NULL,
  "currencyCode" TEXT NOT NULL DEFAULT 'TRY',
  "status" "OnlineDonationStatus" NOT NULL DEFAULT 'PENDING',
  "approvedDonationId" TEXT,
  "reviewedById" TEXT,
  "reviewedAt" TIMESTAMP(3),
  "rejectionReason" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "OnlineDonationSubmission_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "OnlineDonationSubmission_externalReference_key" ON "OnlineDonationSubmission"("externalReference");
CREATE UNIQUE INDEX "OnlineDonationSubmission_approvedDonationId_key" ON "OnlineDonationSubmission"("approvedDonationId");
CREATE INDEX "OnlineDonationSubmission_status_createdAt_idx" ON "OnlineDonationSubmission"("status", "createdAt");
CREATE INDEX "OnlineDonationSubmission_phone_idx" ON "OnlineDonationSubmission"("phone");
