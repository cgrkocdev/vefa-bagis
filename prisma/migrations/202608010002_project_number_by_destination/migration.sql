DROP INDEX IF EXISTS "Project_yearId_departmentId_projectNumber_key";

WITH ranked AS (
  SELECT
    id,
    ROW_NUMBER() OVER (
      PARTITION BY "yearId", "departmentId", "destinationCountryId", "destinationRegionId"
      ORDER BY "projectNumber", "createdAt", id
    ) AS next_number
  FROM "Project"
)
UPDATE "Project" AS project
SET "projectNumber" = ranked.next_number
FROM ranked
WHERE project.id = ranked.id;

-- Eski production kayıtlarında bölge seçilmeden oluşturulmuş projeleri,
-- aynı ülkenin ilk aktif bölgesine bağla. Ülkenin bölgesi hiç yoksa ülke
-- tanımını güvenli yedek olarak kullan; böylece eski kayıt kaybolmaz.
UPDATE "Project" AS project
SET "destinationRegionId" = COALESCE(
  (
    SELECT region.id
    FROM "Definition" AS region
    WHERE region.type = 'DESTINATION_REGION'
      AND region."parentId" = project."destinationCountryId"
      AND region."isActive" = TRUE
      AND region."deletedAt" IS NULL
    ORDER BY region."sortOrder", region.name
    LIMIT 1
  ),
  project."destinationCountryId"
)
WHERE project."destinationRegionId" IS NULL;

ALTER TABLE "Project"
ALTER COLUMN "destinationRegionId" SET NOT NULL;

CREATE UNIQUE INDEX "Project_yearId_departmentId_destinationCountryId_destinationRegionId_projectNumber_key"
ON "Project"("yearId", "departmentId", "destinationCountryId", "destinationRegionId", "projectNumber");
