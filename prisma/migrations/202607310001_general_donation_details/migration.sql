ALTER TABLE "Donation"
ADD COLUMN "destinationCountryId" TEXT,
ADD COLUMN "destinationRegionId" TEXT,
ADD COLUMN "partnerId" TEXT,
ADD COLUMN "unitType" TEXT,
ADD COLUMN "unitPrice" DECIMAL(18,2),
ADD COLUMN "proxyOwner" TEXT,
ADD COLUMN "address" TEXT,
ADD COLUMN "specialCondition" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "orderStatus" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "smsProvider" TEXT,
ADD COLUMN "currencySms" BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX "Donation_destinationCountryId_partnerId_destinationRegionId_idx"
ON "Donation"("destinationCountryId", "partnerId", "destinationRegionId");
