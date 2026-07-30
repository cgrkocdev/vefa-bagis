import { apiError } from "@/lib/server/api";
import { requirePermission } from "@/lib/server/auth";
import { getPrisma } from "@/lib/server/prisma";

export async function GET() {
  try {
    await requirePermission("sacrifice:manage");
    const prisma = getPrisma();
    const projects = await prisma.project.findMany({
      where: { deletedAt: null },
      include: { shares: { include: { donation: { include: { donor: true, payment: true } } } } },
      orderBy: { projectNumber: "asc" },
    });
    const definitionIds = [...new Set(projects.flatMap((item) => [item.groupId, item.destinationCountryId, item.destinationRegionId].filter((value): value is string => Boolean(value))))];
    const definitions = await prisma.definition.findMany({ where: { id: { in: definitionIds } }, select: { id: true, code: true, name: true } });
    const definitionMap = new Map(definitions.map((item) => [item.id, item]));
    return Response.json({
      sacrifices: projects.map((project) => {
        const groupCode = definitionMap.get(project.groupId)?.code ?? "VACIP";
        const kind = groupCode === "ADAK" || groupCode === "AKIKA" ? groupCode : "VACIP";
        return {
          id: project.id,
          number: project.projectNumber,
          region: definitionMap.get(project.destinationRegionId ?? "")?.name ?? definitionMap.get(project.destinationCountryId)?.name ?? "Belirtilmedi",
          kind,
          sharePrice: Number(project.sharePrice),
          status: project.status === "FULL" || project.status === "COMPLETED" ? "COMPLETED" : project.status === "CANCELLED" ? "CANCELLED" : "OPEN",
          shares: project.shares.map((share) => ({
            id: share.id,
            shareNo: share.shareNumber,
            status: share.status === "RESERVED" ? "PENDING" : share.status,
            paymentStatus: share.donation?.payment?.status ?? "PENDING",
            paymentMethod: share.donation?.payment?.methodId ?? null,
            amount: Number(share.donation?.amount ?? 0),
            version: share.version,
            donor: share.donation ? { name: `${share.donation.donor.firstName} ${share.donation.donor.lastName}`, phone: share.donation.donor.normalizedPhone } : null,
          })),
        };
      }),
    });
  } catch (error) {
    return apiError(error);
  }
}
