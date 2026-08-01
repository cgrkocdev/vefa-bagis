import { apiError } from "@/lib/server/api";
import { requirePermission } from "@/lib/server/auth";
import { getPrisma } from "@/lib/server/prisma";

export async function GET() {
  try {
    await requirePermission("sacrifice:manage");
    const prisma = getPrisma();
    const projects = await prisma.project.findMany({
      where: { deletedAt: null },
      include: { shares: { include: { donation: { include: { donor: true, payment: true, receipt: true } } } } },
      orderBy: { projectNumber: "asc" },
    });
    const definitionIds = [...new Set(projects.flatMap((item) => [
      item.yearId,
      item.departmentId,
      item.typeId,
      item.groupId,
      item.destinationCountryId,
      item.destinationRegionId,
      item.partnerId,
      item.currencyId,
      ...item.shares.map((share) => share.donation?.payment?.methodId ?? null),
    ].filter((value): value is string => Boolean(value))))];
    const definitions = await prisma.definition.findMany({ where: { id: { in: definitionIds } }, select: { id: true, code: true, name: true } });
    const destinationCountries = await prisma.definition.findMany({
      where: { type: "DESTINATION_COUNTRY", isActive: true, deletedAt: null },
      select: { id: true, code: true, name: true },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    });
    const definitionMap = new Map(definitions.map((item) => [item.id, item]));
    return Response.json({
      destinationCountries,
      sacrifices: projects.map((project) => {
        const groupCode = definitionMap.get(project.groupId)?.code ?? "VACIP";
        const kind = groupCode === "ADAK" || groupCode === "AKIKA" ? groupCode : "VACIP";
        return {
          id: project.id,
          typeId: project.typeId,
          groupId: project.groupId,
          currencyId: project.currencyId,
          number: project.projectNumber,
          name: project.name,
          year: definitionMap.get(project.yearId)?.name ?? "",
          department: definitionMap.get(project.departmentId)?.name ?? "",
          donationType: definitionMap.get(project.typeId)?.name ?? "",
          group: definitionMap.get(project.groupId)?.name ?? "",
          country: definitionMap.get(project.destinationCountryId)?.name ?? "",
          partner: definitionMap.get(project.partnerId ?? "")?.name ?? "",
          region: definitionMap.get(project.destinationRegionId ?? "")?.name ?? "",
          currency: definitionMap.get(project.currencyId)?.name ?? "",
          kind,
          sharePrice: Number(project.sharePrice),
          status: project.status === "FULL" || project.status === "COMPLETED" ? "COMPLETED" : project.status === "CANCELLED" ? "CANCELLED" : "OPEN",
          shares: project.shares.map((share) => ({
            id: share.id,
            donationId: share.donation?.id ?? null,
            shareNo: share.shareNumber,
            status: share.status === "RESERVED" ? "PENDING" : share.status,
            paymentStatus: share.donation?.payment?.status ?? "PENDING",
            paymentMethod: definitionMap.get(share.donation?.payment?.methodId ?? "")?.code ?? null,
            amount: Number(share.donation?.amount ?? 0),
            description: share.donation?.description ?? "",
            quantity: share.donation?.quantity ?? 1,
            receiptNo: share.donation?.receipt?.number ?? "",
            createdAt: share.donation?.createdAt.toISOString() ?? null,
            version: share.version,
            donor: share.donation ? {
              firstName: share.donation.donor.firstName,
              lastName: share.donation.donor.lastName,
              phone: share.donation.donor.normalizedPhone,
              phoneCountry: share.donation.donor.phoneCountry,
              city: share.donation.donor.originCity ?? "",
              district: share.donation.donor.originDistrict ?? "",
            } : null,
          })),
        };
      }),
    });
  } catch (error) {
    return apiError(error);
  }
}
