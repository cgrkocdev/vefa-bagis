import { Prisma } from "@/generated/prisma/client";
import { apiError } from "@/lib/server/api";
import { requirePermission } from "@/lib/server/auth";
import { getPrisma } from "@/lib/server/prisma";

const SOCIAL_TYPE_CODES = ["AYNI", "BURS", "FIDYE_FITRE_YEMIN_KEFARETI", "YETIM", "GIDA_KOLISI", "KURAN_I_KERIM", "SOSYAL_HIZMET", "PROMOSYON"];

export async function GET(request: Request) {
  try {
    await requirePermission("report:view");
    const url = new URL(request.url);
    const year = Number(url.searchParams.get("year") || 0), month = Number(url.searchParams.get("month") || 0);
    const from = url.searchParams.get("from"), to = url.searchParams.get("to");
    const createdAt: Prisma.DateTimeFilter | undefined = from || to
      ? { ...(from ? { gte: new Date(`${from}T00:00:00.000Z`) } : {}), ...(to ? { lte: new Date(`${to}T23:59:59.999Z`) } : {}) }
      : year ? { gte: new Date(Date.UTC(year, month ? month - 1 : 0, 1)), lt: new Date(Date.UTC(year, month || 12, 1)) } : undefined;
    const prisma = getPrisma();
    const definitions = await prisma.definition.findMany({ where: { deletedAt: null }, select: { id: true, type: true, code: true, name: true, parentId: true } });
    const socialTypeIds = definitions.filter((item) => item.type === "DONATION_TYPE" && SOCIAL_TYPE_CODES.includes(item.code)).map((item) => item.id);
    const inKindTypeId = definitions.find((item) => item.type === "DONATION_TYPE" && item.code === "AYNI")?.id;
    const where: Prisma.DonationWhereInput = {
      projectId: null, status: "COMPLETED", ...(createdAt ? { createdAt } : {}),
      ...(url.searchParams.get("inKindOnly") === "true" ? { typeId: inKindTypeId ?? "__missing_ayni_type__" } : {}),
      ...(url.searchParams.get("paymentMethodId") ? { paymentMethodId: url.searchParams.get("paymentMethodId")! } : {}),
      ...(url.searchParams.get("destinationCountryId") ? { destinationCountryId: url.searchParams.get("destinationCountryId")! } : {}),
      ...(url.searchParams.get("originCountry") || url.searchParams.get("originCity") ? { donor: { ...(url.searchParams.get("originCountry") ? { originCountry: url.searchParams.get("originCountry")! } : {}), ...(url.searchParams.get("originCity") ? { originCity: url.searchParams.get("originCity")! } : {}) } } : {}),
    };
    const donations = await prisma.donation.findMany({ where, include: { donor: true, receipt: true }, orderBy: { createdAt: "desc" } });
    const names = new Map(definitions.map((item) => [item.id, item.name]));
    const aggregate = (items: typeof donations, key: (item: typeof donations[number]) => string) => {
      const map = new Map<string, { name: string; count: number; amount: number }>();
      for (const item of items) { const name = key(item) || "Belirtilmemiş"; const row = map.get(name) ?? { name, count: 0, amount: 0 }; row.count += item.quantity; row.amount += Number(item.amount); map.set(name, row); }
      return [...map.values()].sort((left, right) => left.name.localeCompare(right.name, "tr"));
    };
    const details = donations.map((item) => ({ id: item.id, typeId: item.typeId, type: names.get(item.typeId) ?? "Bağış", receiptNo: item.receipt?.number ?? "—", donorName: `${item.donor.firstName} ${item.donor.lastName}`, phone: item.donor.normalizedPhone, country: item.donor.originCountry ?? "Belirtilmemiş", city: item.donor.originCity ?? "Belirtilmemiş", district: item.donor.originDistrict ?? "Belirtilmemiş", destination: names.get(item.destinationCountryId ?? "") ?? "—", payment: names.get(item.paymentMethodId) ?? "—", quantity: item.quantity, amount: Number(item.amount), date: item.createdAt.toISOString(), social: socialTypeIds.includes(item.typeId) }));
    const originCountries = [...new Set(donations.map((item) => item.donor.originCountry).filter((value): value is string => Boolean(value)))].sort((a, b) => a.localeCompare(b, "tr"));
    const originCities = [...new Set(donations.map((item) => item.donor.originCity).filter((value): value is string => Boolean(value)))].sort((a, b) => a.localeCompare(b, "tr"));
    return Response.json({
      country: aggregate(donations, (item) => item.donor.originCountry ?? ""),
      province: aggregate(donations, (item) => `${item.donor.originCountry ?? "Belirtilmemiş"}|||${item.donor.originCity ?? "Belirtilmemiş"}`),
      district: aggregate(donations.filter((item) => Boolean(item.donor.originDistrict)), (item) => `${item.donor.originCountry ?? "Belirtilmemiş"}|||${item.donor.originCity ?? "Belirtilmemiş"}|||${item.donor.originDistrict}`),
      details,
      filters: { definitions, originCountries, originCities },
    });
  } catch (error) { return apiError(error); }
}
