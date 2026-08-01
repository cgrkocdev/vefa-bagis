-- Eski genel bağış kayıtlarında yanlışlıkla kurban grubuna bağlanan satırları
-- geçerli bir genel bağış grubuna taşı.
UPDATE "Donation" AS donation
SET "groupId" = general_group.id
FROM "Definition" AS current_group,
     "Definition" AS general_group
WHERE donation."groupId" = current_group.id
  AND donation."projectId" IS NULL
  AND current_group.type <> 'GENERAL_DONATION_GROUP'
  AND general_group.type = 'GENERAL_DONATION_GROUP'
  AND general_group.code = 'GIDA_KOLISI'
  AND general_group."isActive" = TRUE;

-- Önceki test kayıtlarının ülke/şehir/ilçe zincirini raporlarla uyumlu tamamla.
UPDATE "Donor"
SET "originCountry" = COALESCE("originCountry", 'Türkiye'),
    "originCity" = COALESCE("originCity", 'İstanbul'),
    "originDistrict" = COALESCE("originDistrict", 'Fatih')
WHERE "originCountry" IS NULL
   OR "originCity" IS NULL
   OR "originDistrict" IS NULL;
