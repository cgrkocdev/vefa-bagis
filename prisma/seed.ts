import "dotenv/config";
import { hash } from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { City, State } from "country-state-city";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL tanımlı değil.");

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

const definitions = [
  ["YEAR", "2026", "2026", null],
  ["DEPARTMENT", "BUYUKBAS", "Büyükbaş Kurban", null],
  ["DEPARTMENT", "KUCUKBAS", "Küçükbaş Kurban", null],
  ["DONATION_TYPE", "KURBAN", "Kurban", null],
  ["DONATION_TYPE", "ZEKAT", "Zekât", null],
  ["DONATION_TYPE", "KURAN", "Kur’an", null],
  ["DONATION_TYPE", "GENEL_BAGIS", "Genel Bağış", null],
  ["DONATION_GROUP", "VACIP", "Vacip", null],
  ["DONATION_GROUP", "NAFILE", "Nafile", null],
  ["DONATION_GROUP", "ADAK", "Adak", null],
  ["DONATION_GROUP", "AKIKA", "Akika", null],
  ["DONATION_GROUP", "SUKUR", "Şükür", null],
  ["ORIGIN_COUNTRY", "TR", "Türkiye", null],
  ["DESTINATION_COUNTRY", "TR", "Türkiye", null],
  ["DESTINATION_COUNTRY", "SO", "Somali", null],
  ["DESTINATION_COUNTRY", "AFRICA", "Afrika", null],
  ["PARTNER", "VEFA", "Vefa", null],
  ["PAYMENT_METHOD", "CASH", "Nakit", null],
  ["PAYMENT_METHOD", "BANK_TRANSFER", "Havale / EFT", null],
  ["PAYMENT_METHOD", "CREDIT_CARD", "Kredi Kartı", null],
  ["PAYMENT_METHOD", "OTHER", "Diğer", null],
  ["CURRENCY", "TRY", "Türk Lirası", "₺"],
  ["PROJECT_STATUS", "OPEN", "Açık", null],
  ["SHARE_STATUS", "EMPTY", "Boş", null],
] as const;

async function main() {
  const admin = await prisma.user.upsert({
    where: { email: "yasir@gmail" },
    update: {},
    create: {
      name: "Yasir",
      email: "yasir@gmail",
      passwordHash: await hash("12345678", 12),
      role: "ADMIN",
    },
  });

  for (const [type, code, name, symbol] of definitions) {
    await prisma.definition.upsert({
      where: { type_code: { type, code } },
      update: { name, symbol, isActive: true },
      create: { type, code, name, symbol },
    });
  }

  const originTurkey = await prisma.definition.findUniqueOrThrow({ where: { type_code: { type: "ORIGIN_COUNTRY", code: "TR" } } });
  for (const province of State.getStatesOfCountry("TR")) {
    const originCity = await prisma.definition.upsert({
      where: { type_code: { type: "ORIGIN_CITY", code: `TR-${province.isoCode}` } },
      update: { name: province.name, parentId: originTurkey.id, isActive: true },
      create: { type: "ORIGIN_CITY", code: `TR-${province.isoCode}`, name: province.name, parentId: originTurkey.id, isActive: true },
    });
    for (const district of City.getCitiesOfState("TR", province.isoCode)) {
      const districtCode = `TR-${province.isoCode}-${district.name.toLocaleUpperCase("tr-TR").replace(/[^A-ZÇĞİÖŞÜ0-9]+/g, "_")}`.slice(0, 80);
      await prisma.definition.upsert({
        where: { type_code: { type: "ORIGIN_DISTRICT", code: districtCode } },
        update: { name: district.name, parentId: originCity.id, isActive: true },
        create: { type: "ORIGIN_DISTRICT", code: districtCode, name: district.name, parentId: originCity.id, isActive: true },
      });
    }
  }

  const required = await prisma.definition.findMany({
    where: {
      OR: [
        { type: "YEAR", code: "2026" },
        { type: "DEPARTMENT", code: "BUYUKBAS" },
        { type: "DONATION_TYPE", code: "KURBAN" },
        { type: "DONATION_GROUP", code: { in: ["VACIP", "ADAK", "AKIKA"] } },
        { type: "CURRENCY", code: "TRY" },
        { type: "PARTNER", code: "VEFA" },
        { type: "DESTINATION_COUNTRY", code: { in: ["TR", "SO", "AFRICA"] } },
      ],
    },
  });
  const definitionId = (type: string, code: string) => {
    const item = required.find((definition) => definition.type === type && definition.code === code);
    if (!item) throw new Error(`${type}/${code} tanımı bulunamadı.`);
    return item.id;
  };
  const projectTemplates = [
    { countryCode: "SO", groupCode: "VACIP", number: 1, name: "2026 Somali Vacip Kurban", price: "14500" },
    { countryCode: "AFRICA", groupCode: "VACIP", number: 2, name: "2026 Afrika Vacip Kurban", price: "12500" },
    { countryCode: "TR", groupCode: "VACIP", number: 3, name: "2026 Türkiye Vacip Kurban", price: "18500" },
    { countryCode: "SO", groupCode: "ADAK", number: 4, name: "2026 Somali Adak Kurban", price: "13500" },
    { countryCode: "AFRICA", groupCode: "ADAK", number: 5, name: "2026 Afrika Adak Kurban", price: "11500" },
    { countryCode: "TR", groupCode: "ADAK", number: 6, name: "2026 Türkiye Adak Kurban", price: "17500" },
    { countryCode: "SO", groupCode: "AKIKA", number: 7, name: "2026 Somali Akika Kurban", price: "13500" },
    { countryCode: "AFRICA", groupCode: "AKIKA", number: 8, name: "2026 Afrika Akika Kurban", price: "11500" },
    { countryCode: "TR", groupCode: "AKIKA", number: 9, name: "2026 Türkiye Akika Kurban", price: "17500" },
  ];
  for (const template of projectTemplates) {
    await prisma.project.upsert({
      where: {
        yearId_departmentId_projectNumber: {
          yearId: definitionId("YEAR", "2026"),
          departmentId: definitionId("DEPARTMENT", "BUYUKBAS"),
          projectNumber: template.number,
        },
      },
      update: {
        name: template.name,
        groupId: definitionId("DONATION_GROUP", template.groupCode),
        destinationCountryId: definitionId("DESTINATION_COUNTRY", template.countryCode),
        sharePrice: template.price,
        status: "OPEN",
        deletedAt: null,
      },
      create: {
        yearId: definitionId("YEAR", "2026"),
        departmentId: definitionId("DEPARTMENT", "BUYUKBAS"),
        typeId: definitionId("DONATION_TYPE", "KURBAN"),
        groupId: definitionId("DONATION_GROUP", template.groupCode),
        destinationCountryId: definitionId("DESTINATION_COUNTRY", template.countryCode),
        partnerId: definitionId("PARTNER", "VEFA"),
        projectNumber: template.number,
        name: template.name,
        animalType: "CATTLE",
        shareCapacity: 7,
        sharePrice: template.price,
        currencyId: definitionId("CURRENCY", "TRY"),
        status: "OPEN",
        createdById: admin.id,
        shares: { create: Array.from({ length: 7 }, (_, index) => ({ shareNumber: index + 1 })) },
      },
    });
  }

  await prisma.appSetting.upsert({
    where: { key: "organization" },
    update: {},
    create: {
      key: "organization",
      value: {
        organizationName: "Vefa Bağış Yönetimi",
        receiptPrefix: "BGS",
        defaultCattleShareCapacity: 7,
        defaultSmallAnimalShareCapacity: 1,
      },
    },
  });

  const associationCount = await prisma.association.count();
  if (associationCount === 0) {
    await prisma.association.create({
      data: {
        name: "Vefa Bağış Yönetimi",
        shortName: "Vefa",
        logoAlt: "Vefa kurumsal logosu",
        phone: "+90",
        website: "https://vefa.org",
        isActive: true,
        isDefault: true,
        sortOrder: 0,
      },
    });
  }

  await prisma.auditLog.create({
    data: { userId: admin.id, action: "DATABASE_SEEDED", entityType: "System" },
  });
}

main()
  .finally(async () => prisma.$disconnect());
