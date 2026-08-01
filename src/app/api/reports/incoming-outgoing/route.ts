import { Prisma } from "@/generated/prisma/client";
import { apiError } from "@/lib/server/api";
import { requirePermission } from "@/lib/server/auth";
import { getPrisma } from "@/lib/server/prisma";

export async function GET(request: Request) {
  try {
    await requirePermission("report:view");
    const url = new URL(request.url);
    const year = Number(url.searchParams.get("year") ?? 0);
    const month = Number(url.searchParams.get("month") ?? 0);
    const from = url.searchParams.get("from");
    const to = url.searchParams.get("to");
    const createdAt = from || to
      ? {
          ...(from ? { gte: new Date(`${from}T00:00:00.000Z`) } : {}),
          ...(to ? { lte: new Date(`${to}T23:59:59.999Z`) } : {}),
        }
      : year
        ? {
            gte: new Date(Date.UTC(year, month ? month - 1 : 0, 1)),
            lt: new Date(Date.UTC(year, month || 12, 1)),
          }
        : undefined;
    const baseWhere: Prisma.DonationWhereInput = {
      status: "COMPLETED",
      ...(url.searchParams.get("typeId") ? { typeId: url.searchParams.get("typeId")! } : {}),
      ...(url.searchParams.get("countryId") ? { destinationCountryId: url.searchParams.get("countryId")! } : {}),
      ...(url.searchParams.get("regionId") ? { destinationRegionId: url.searchParams.get("regionId")! } : {}),
      ...(createdAt ? { createdAt } : {}),
    };
    const prisma = getPrisma();
    const [incoming, outgoing] = await prisma.$transaction([
      prisma.donation.groupBy({ by: ["typeId"], where: baseWhere, orderBy: { typeId: "asc" }, _sum: { amount: true }, _count: { _all: true } }),
      prisma.donation.groupBy({ by: ["typeId"], where: { ...baseWhere, projectId: null, orderStatus: true }, orderBy: { typeId: "asc" }, _sum: { amount: true }, _count: { _all: true } }),
    ]);
    const typeIds = [...new Set([...incoming, ...outgoing].map((item) => item.typeId))];
    const types = await prisma.definition.findMany({ where: { id: { in: typeIds } }, select: { id: true, name: true } });
    const names = new Map(types.map((item) => [item.id, item.name]));
    const mapRows = (items: Array<{ typeId: string; _sum?: { amount?: unknown }; _count?: true | { _all?: number } }>) => items
      .map((item) => ({
        typeId: item.typeId,
        type: names.get(item.typeId) ?? "Tanımsız",
        amount: Number(item._sum?.amount ?? 0),
        count: typeof item._count === "object" ? (item._count._all ?? 0) : 0,
      }))
      .sort((left, right) => left.type.localeCompare(right.type, "tr"));
    return Response.json({ incoming: mapRows(incoming), outgoing: mapRows(outgoing) });
  } catch (error) {
    return apiError(error);
  }
}
