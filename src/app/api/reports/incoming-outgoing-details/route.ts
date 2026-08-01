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
    const createdAt = from || to
      ? { ...(from ? { gte: new Date(`${from}T00:00:00.000Z`) } : {}), ...(to ? { lte: new Date(`${to}T23:59:59.999Z`) } : {}) }
      : year ? { gte: new Date(Date.UTC(year, month ? month - 1 : 0, 1)), lt: new Date(Date.UTC(year, month || 12, 1)) } : undefined;
    const where: Prisma.DonationWhereInput = {
      status: "COMPLETED",
      ...(url.searchParams.get("typeId") ? { typeId: url.searchParams.get("typeId")! } : {}),
      ...(url.searchParams.get("countryId") ? { destinationCountryId: url.searchParams.get("countryId")! } : {}),
      ...(url.searchParams.get("regionId") ? { destinationRegionId: url.searchParams.get("regionId")! } : {}),
      ...(url.searchParams.get("groupId") ? { groupId: url.searchParams.get("groupId")! } : {}),
      ...(url.searchParams.get("paymentMethodId") ? { paymentMethodId: url.searchParams.get("paymentMethodId")! } : {}),
      ...(createdAt ? { createdAt } : {}),
    };
    const prisma = getPrisma();
    const [donations, definitions] = await Promise.all([
      prisma.donation.findMany({ where, include: { donor: true, receipt: true }, orderBy: { createdAt: "desc" }, take: 500 }),
      prisma.definition.findMany({ where: { deletedAt: null }, select: { id: true, name: true } }),
    ]);
    const names = new Map(definitions.map((item) => [item.id, item.name]));
    const rows = donations.map((item) => ({
      id: item.id,
      receiptNo: item.receipt?.number ?? "—",
      donorName: `${item.donor.firstName} ${item.donor.lastName}`,
      phone: item.donor.normalizedPhone,
      originCountry: item.donor.originCountry ?? "—",
      originCity: item.donor.originCity ?? "—",
      type: names.get(item.typeId) ?? "Bağış",
      group: item.groupId ? (names.get(item.groupId) ?? "—") : "—",
      country: item.destinationCountryId ? (names.get(item.destinationCountryId) ?? "—") : "—",
      region: item.destinationRegionId ? (names.get(item.destinationRegionId) ?? "—") : "—",
      partner: item.partnerId ? (names.get(item.partnerId) ?? "—") : "—",
      paymentMethod: names.get(item.paymentMethodId) ?? "—",
      currency: names.get(item.currencyId) ?? "TL",
      quantity: item.quantity,
      unitType: item.unitType ?? "Adet",
      unitPrice: Number(item.unitPrice ?? item.amount),
      amount: Number(item.amount),
      description: item.description ?? "—",
      specialCondition: item.specialCondition,
      date: item.createdAt.toISOString(),
      sent: item.orderStatus,
    }));
    return Response.json({ incoming: rows, outgoing: rows.filter((item) => item.sent) });
  } catch (error) {
    return apiError(error);
  }
}
