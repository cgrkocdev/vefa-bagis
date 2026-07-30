CREATE TABLE "Association" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "shortName" TEXT NOT NULL,
    "logoDataUrl" TEXT,
    "logoAlt" TEXT,
    "phone" TEXT,
    "website" TEXT,
    "address" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Association_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Poster" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "orientation" TEXT NOT NULL,
    "yearId" TEXT,
    "departmentId" TEXT,
    "typeId" TEXT,
    "groupId" TEXT,
    "destinationCountryId" TEXT,
    "partnerId" TEXT,
    "destinationRegionId" TEXT,
    "firstProjectNumber" INTEGER,
    "lastProjectNumber" INTEGER,
    "excludedProjectNumbers" INTEGER[] DEFAULT ARRAY[]::INTEGER[],
    "projectIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "associationIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "mainAssociationId" TEXT,
    "showEmptyShares" BOOLEAN NOT NULL DEFAULT true,
    "shareholderNameFormat" TEXT NOT NULL DEFAULT 'FULL',
    "footerNote" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Poster_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Association_isActive_sortOrder_idx" ON "Association"("isActive", "sortOrder");
CREATE INDEX "Poster_createdById_createdAt_idx" ON "Poster"("createdById", "createdAt");
CREATE INDEX "Poster_orientation_idx" ON "Poster"("orientation");
ALTER TABLE "Poster" ADD CONSTRAINT "Poster_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Poster" ADD CONSTRAINT "Poster_mainAssociationId_fkey" FOREIGN KEY ("mainAssociationId") REFERENCES "Association"("id") ON DELETE SET NULL ON UPDATE CASCADE;
