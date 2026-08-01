import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL tanımlı değil.");
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

const issues: string[] = [];
const check = (condition: boolean, message: string) => { if (!condition) issues.push(message); };

async function main() {
try {
  const [definitions, projects, donations, donors] = await Promise.all([
    prisma.definition.findMany({ where: { deletedAt: null } }),
    prisma.project.findMany({ where: { deletedAt: null }, include: { shares: true } }),
    prisma.donation.findMany({ where: { status: "COMPLETED" }, include: { payment: true, receipt: true, share: true, donor: true } }),
    prisma.donor.findMany({ where: { deletedAt: null } }),
  ]);
  const definitionById = new Map(definitions.map((item) => [item.id, item]));
  const expectType = (id: string | null | undefined, type: string, owner: string, optional = false) => {
    if (!id) { check(optional, `${owner}: ${type} kimliği eksik.`); return; }
    check(definitionById.get(id)?.type === type && definitionById.get(id)?.isActive === true, `${owner}: ${id} aktif ${type} tanımı değil.`);
  };

  for (const project of projects) {
    const owner = `Proje #${project.projectNumber}`;
    expectType(project.yearId, "YEAR", owner);
    expectType(project.departmentId, "DEPARTMENT", owner);
    expectType(project.typeId, "DONATION_TYPE", owner);
    expectType(project.groupId, "DONATION_GROUP", owner);
    expectType(project.destinationCountryId, "DESTINATION_COUNTRY", owner);
    expectType(project.partnerId, "PARTNER", owner, true);
    expectType(project.destinationRegionId, "DESTINATION_REGION", owner, true);
    expectType(project.currencyId, "CURRENCY", owner);
    check(project.shares.length === project.shareCapacity, `${owner}: kapasite ${project.shareCapacity}, hisse kaydı ${project.shares.length}.`);
    check(new Set(project.shares.map((share) => share.shareNumber)).size === project.shares.length, `${owner}: yinelenen hisse numarası var.`);
    const partner = project.partnerId ? definitionById.get(project.partnerId) : null;
    check(!partner?.parentId || partner.parentId === project.destinationCountryId, `${owner}: partner farklı ülkeye bağlı.`);
    const region = project.destinationRegionId ? definitionById.get(project.destinationRegionId) : null;
    check(!region?.parentId || [project.destinationCountryId, project.partnerId].includes(region.parentId), `${owner}: bölge farklı ülke/partnere bağlı.`);
  }

  for (const donation of donations) {
    const owner = `Bağış ${donation.id} (${donation.donor.firstName} ${donation.donor.lastName})`;
    expectType(donation.typeId, "DONATION_TYPE", owner);
    expectType(donation.currencyId, "CURRENCY", owner);
    expectType(donation.paymentMethodId, "PAYMENT_METHOD", owner);
    expectType(donation.groupId, donation.projectId ? "DONATION_GROUP" : "GENERAL_DONATION_GROUP", owner, true);
    check(Boolean(donation.payment), `${owner}: ödeme kaydı yok.`);
    check(Boolean(donation.receipt), `${owner}: makbuz kaydı yok.`);
    check(!donation.projectId || Boolean(donation.share), `${owner}: kurban projesine bağlı ama hissesi yok.`);
    check(!donation.share || donation.share.donationId === donation.id, `${owner}: hisse bağlantısı çift yönlü değil.`);
  }

  const unspecified = donors.filter((donor) => !donor.originCountry || !donor.originCity || !donor.originDistrict);
  if (unspecified.length) issues.push(`${unspecified.length} bağışçıda ülke/şehir/ilçe bilgisi eksik: ${unspecified.map((item) => `${item.firstName} ${item.lastName} (${item.normalizedPhone})`).join(", ")}.`);

  console.log(JSON.stringify({
    counts: { definitions: definitions.length, projects: projects.length, shares: projects.reduce((sum, item) => sum + item.shares.length, 0), donations: donations.length, donors: donors.length },
    issues,
  }, null, 2));
  if (issues.length) process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
