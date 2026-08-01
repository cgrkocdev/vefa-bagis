import { Prisma } from "@/generated/prisma/client";
import { apiError } from "@/lib/server/api";
import { requirePermission } from "@/lib/server/auth";
import { getPrisma } from "@/lib/server/prisma";

export async function GET(request: Request) {
  try {
    await requirePermission("report:view");
    const url = new URL(request.url);
    const year = Number(url.searchParams.get("year") || 0);
    const month = Number(url.searchParams.get("month") || 0);
    const from = url.searchParams.get("from");
    const to = url.searchParams.get("to");
    const range = url.searchParams.get("range");
    const now = new Date();
    let createdAt: Prisma.DateTimeFilter | undefined;
    if (range === "today") createdAt = { gte: new Date(now.getFullYear(), now.getMonth(), now.getDate()) };
    else if (range === "month") createdAt = { gte: new Date(now.getFullYear(), now.getMonth(), 1) };
    else if (range === "year") createdAt = { gte: new Date(now.getFullYear(), 0, 1) };
    else if (from || to) createdAt = { ...(from ? { gte: new Date(`${from}T00:00:00.000Z`) } : {}), ...(to ? { lte: new Date(`${to}T23:59:59.999Z`) } : {}) };
    else if (year) createdAt = { gte: new Date(Date.UTC(year, month ? month - 1 : 0, 1)), lt: new Date(Date.UTC(year, month || 12, 1)) };
    const where: Prisma.DonationWhereInput = {
      projectId: null,
      status: "COMPLETED",
      ...(createdAt ? { createdAt } : {}),
      ...(url.searchParams.get("typeId") ? { typeId: url.searchParams.get("typeId")! } : {}),
      ...(url.searchParams.get("paymentMethodId") ? { paymentMethodId: url.searchParams.get("paymentMethodId")! } : {}),
      ...(url.searchParams.get("destinationCountryId") ? { destinationCountryId: url.searchParams.get("destinationCountryId")! } : {}),
      ...(url.searchParams.get("destinationRegionId") ? { destinationRegionId: url.searchParams.get("destinationRegionId")! } : {}),
      ...(url.searchParams.get("partnerId") ? { partnerId: url.searchParams.get("partnerId")! } : {}),
      ...(url.searchParams.get("originCountry") || url.searchParams.get("originCity") ? { donor: { ...(url.searchParams.get("originCountry") ? { originCountry: url.searchParams.get("originCountry")! } : {}), ...(url.searchParams.get("originCity") ? { originCity: url.searchParams.get("originCity")! } : {}) } } : {}),
    };
    const prisma = getPrisma();
    const [donations, definitions, originCountries, originCities] = await Promise.all([
      prisma.donation.findMany({ where, include: { donor: true, receipt: true }, orderBy: { createdAt: "desc" } }),
      prisma.definition.findMany({ where: { deletedAt: null }, select: { id: true, type: true, code: true, name: true, parentId: true } }),
      prisma.donor.findMany({ where: { originCountry: { not: null } }, distinct: ["originCountry"], select: { originCountry: true }, orderBy: { originCountry: "asc" } }),
      prisma.donor.findMany({ where: { originCity: { not: null }, ...(url.searchParams.get("originCountry") ? { originCountry: url.searchParams.get("originCountry")! } : {}) }, distinct: ["originCity"], select: { originCity: true }, orderBy: { originCity: "asc" } }),
    ]);
    const names = new Map(definitions.map((item) => [item.id, item.name]));
    const pendingIds = new Set(definitions.filter((item) => item.type === "PAYMENT_METHOD" && item.code === "PAYMENT_PENDING").map((item) => item.id));
    const groups = new Map<string, { typeId: string; type: string; count: number; sentCount: number; incoming: number; service: number; pending: number; details: typeof donations }>();
    for (const donation of donations) {
      const row = groups.get(donation.typeId) ?? { typeId: donation.typeId, type: names.get(donation.typeId) ?? "Bağış", count: 0, sentCount: 0, incoming: 0, service: 0, pending: 0, details: [] };
      const amount = Number(donation.amount); row.count += donation.quantity; row.incoming += amount; if (donation.orderStatus) { row.service += amount; row.sentCount += donation.quantity; } if (pendingIds.has(donation.paymentMethodId)) row.pending += amount; row.details.push(donation); groups.set(donation.typeId, row);
    }
    const rows = [...groups.values()].map((row) => ({ typeId: row.typeId, type: row.type, count: row.count, sentCount: row.sentCount, incoming: row.incoming, service: row.service, fund: row.incoming - row.service - row.pending, pending: row.pending, records: row.details.length })).sort((a, b) => a.type.localeCompare(b.type, "tr"));
    const details = donations.map((item) => ({ id: item.id, typeId: item.typeId, receiptNo: item.receipt?.number ?? "—", donorName: `${item.donor.firstName} ${item.donor.lastName}`, phone: item.donor.normalizedPhone, origin: [item.donor.originCountry, item.donor.originCity].filter(Boolean).join(" / ") || "—", destination: [names.get(item.destinationCountryId ?? ""), names.get(item.destinationRegionId ?? "")].filter(Boolean).join(" / ") || "—", payment: names.get(item.paymentMethodId) ?? "—", quantity: item.quantity, amount: Number(item.amount), sent: item.orderStatus, date: item.createdAt.toISOString() }));
    return Response.json({ rows, details, filters: { definitions, originCountries: originCountries.flatMap((item) => item.originCountry ? [item.originCountry] : []), originCities: originCities.flatMap((item) => item.originCity ? [item.originCity] : []) } });
  } catch (error) { return apiError(error); }
}
