import { Prisma } from "@/generated/prisma/client";
import { apiError } from "@/lib/server/api";
import { requirePermission } from "@/lib/server/auth";
import { getPrisma } from "@/lib/server/prisma";

export async function GET(request: Request) {
  try {
    await requirePermission("report:view");
    const url = new URL(request.url);
    const value = (key: string) => url.searchParams.get(key)?.trim() || undefined;
    const year = Number(value("year") || 0), month = Number(value("month") || 0);
    const from = value("from"), to = value("to");
    const createdAt: Prisma.DateTimeFilter | undefined = from || to
      ? { ...(from ? { gte: new Date(`${from}T00:00:00.000Z`) } : {}), ...(to ? { lte: new Date(`${to}T23:59:59.999Z`) } : {}) }
      : year ? { gte: new Date(Date.UTC(year, month ? month - 1 : 0, 1)), lt: new Date(Date.UTC(year, month || 12, 1)) } : undefined;
    const prisma = getPrisma();
    const definitions = await prisma.definition.findMany({ where: { isActive: true, deletedAt: null }, select: { id: true, type: true, code: true, name: true, parentId: true }, orderBy: [{ sortOrder: "asc" }, { name: "asc" }] });
    const inKindType = definitions.find((item) => item.type === "DONATION_TYPE" && item.code === "AYNI");
    const where: Prisma.DonationWhereInput = {
      status: "COMPLETED", projectId: null, ...(inKindType ? { typeId: inKindType.id } : { id: "__missing_ayni_type__" }), ...(createdAt ? { createdAt } : {}),
      ...(value("destinationCountryId") ? { destinationCountryId: value("destinationCountryId") } : {}),
      ...((value("originCountry") || value("originCity") || value("originDistrict")) ? { donor: {
        ...(value("originCountry") ? { originCountry: value("originCountry") } : {}),
        ...(value("originCity") ? { originCity: value("originCity") } : {}),
        ...(value("originDistrict") ? { originDistrict: value("originDistrict") } : {}),
      } } : {}),
      ...(value("reality") === "VIRTUAL" ? { id: "__general_donations_are_real__" } : {}),
    };
    const [donations, originRows] = await prisma.$transaction([
      prisma.donation.findMany({ where, include: { donor: true, receipt: true }, orderBy: { createdAt: "asc" } }),
      prisma.donor.findMany({ where: { deletedAt: null }, select: { originCountry: true, originCity: true, originDistrict: true } }),
    ]);
    const names = new Map(definitions.map((item) => [item.id, item.name]));
    const groupIds = [...new Set(donations.map((item) => item.groupId).filter((item): item is string => Boolean(item)))];
    const groups = groupIds.map((id) => ({ id, name: names.get(id) ?? "Diğer" })).sort((a, b) => a.name.localeCompare(b.name, "tr"));
    const daily = new Map<string, { date: string; year: number; values: Record<string, number>; total: number; records: number }>();
    for (const donation of donations) {
      const date = donation.createdAt.toISOString().slice(0, 10);
      const row = daily.get(date) ?? { date, year: donation.createdAt.getUTCFullYear(), values: {}, total: 0, records: 0 };
      const groupId = donation.groupId ?? "OTHER"; const amount = Number(donation.amount);
      row.values[groupId] = (row.values[groupId] ?? 0) + amount; row.total += amount; row.records += 1; daily.set(date, row);
    }
    const rows = [...daily.values()].sort((a, b) => a.date.localeCompare(b.date));
    const columnTotals = Object.fromEntries(groups.map((group) => [group.id, rows.reduce((sum, row) => sum + (row.values[group.id] ?? 0), 0)]));
    const unique = (key: "originCountry" | "originCity" | "originDistrict", parent?: { key: "originCountry" | "originCity"; value?: string }) => [...new Set(originRows.filter((item) => !parent?.value || item[parent.key] === parent.value).map((item) => item[key]).filter((item): item is string => Boolean(item)))].sort((a, b) => a.localeCompare(b, "tr"));
    return Response.json({ rows, groups, columnTotals, grandTotal: rows.reduce((sum, row) => sum + row.total, 0), recordCount: donations.length,
      details: donations.map((item) => ({ id: item.id, date: item.createdAt.toISOString(), receiptNo: item.receipt?.number ?? "—", donorName: `${item.donor.firstName} ${item.donor.lastName}`, group: names.get(item.groupId ?? "") ?? "Diğer", amount: Number(item.amount) })),
      filters: { definitions, origins: { countries: unique("originCountry"), cities: unique("originCity", { key: "originCountry", value: value("originCountry") }), districts: unique("originDistrict", { key: "originCity", value: value("originCity") }) } },
    });
  } catch (error) { return apiError(error); }
}
