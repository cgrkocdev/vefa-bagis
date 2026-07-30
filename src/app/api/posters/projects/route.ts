import { apiError } from "@/lib/server/api";
import { requirePermission } from "@/lib/server/auth";
import { getPrisma } from "@/lib/server/prisma";

export async function GET() {
  try {
    await requirePermission("poster:view");
    const prisma = getPrisma();
    const projects = await prisma.project.findMany({
      where: { deletedAt: null, status: { in: ["OPEN", "FULL", "COMPLETED"] } },
      include: { shares: { include: { donation: { include: { donor: true } } }, orderBy: { shareNumber: "asc" } } },
      orderBy: { projectNumber: "asc" },
    });
    const ids = [...new Set(projects.flatMap((item) => [item.yearId, item.departmentId, item.typeId, item.groupId, item.destinationCountryId, item.partnerId, item.destinationRegionId].filter((value): value is string => Boolean(value))))];
    const definitions = await prisma.definition.findMany({ where: { id: { in: ids } }, select: { id: true, code: true, name: true, type: true } });
    const map = new Map(definitions.map((item) => [item.id, item]));
    return Response.json({
      definitions,
      projects: projects.map((project) => ({
        id: project.id,
        projectNumber: project.projectNumber,
        name: project.name,
        year: map.get(project.yearId)?.name ?? "",
        yearId: project.yearId,
        department: map.get(project.departmentId)?.name ?? "",
        departmentId: project.departmentId,
        type: map.get(project.typeId)?.name ?? "",
        typeId: project.typeId,
        group: map.get(project.groupId)?.name ?? "",
        groupId: project.groupId,
        country: map.get(project.destinationCountryId)?.name ?? "",
        countryCode: map.get(project.destinationCountryId)?.code ?? "",
        destinationCountryId: project.destinationCountryId,
        partner: map.get(project.partnerId ?? "")?.name ?? "",
        partnerId: project.partnerId,
        region: map.get(project.destinationRegionId ?? "")?.name ?? map.get(project.destinationCountryId)?.name ?? "",
        destinationRegionId: project.destinationRegionId,
        status: project.status,
        isVirtual: project.isVirtual,
        shareCapacity: project.shareCapacity,
        shares: project.shares.map((share) => ({
          id: share.id,
          shareNumber: share.shareNumber,
          status: share.status,
          donorName: share.donation ? `${share.donation.donor.firstName} ${share.donation.donor.lastName}` : null,
        })),
      })),
    });
  } catch (error) {
    return apiError(error);
  }
}
