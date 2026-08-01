import { Prisma } from "@/generated/prisma/client";
import { apiError } from "@/lib/server/api";
import { requirePermission } from "@/lib/server/auth";
import { getPrisma } from "@/lib/server/prisma";

const allowedSorts = new Set(["createdAt", "amount", "quantity"]);

export async function GET(request: Request) {
  try {
    await requirePermission("report:view");
    const url = new URL(request.url);
    const value = (key: string) => url.searchParams.get(key)?.trim() || undefined;
    const year = Number(value("year") || 0);
    const month = Number(value("month") || 0);
    const from = value("from");
    const to = value("to");
    const page = Math.max(1, Number(value("page") || 1));
    const pageSize = Math.min(500, Math.max(1, Number(value("pageSize") || 50)));
    const sortBy = allowedSorts.has(value("sortBy") || "") ? value("sortBy")! : "createdAt";
    const sortDirection = value("sortDirection") === "asc" ? "asc" : "desc";
    const createdAt: Prisma.DateTimeFilter | undefined = from || to
      ? { ...(from ? { gte: new Date(`${from}T00:00:00.000Z`) } : {}), ...(to ? { lte: new Date(`${to}T23:59:59.999Z`) } : {}) }
      : year
        ? { gte: new Date(Date.UTC(year, month ? month - 1 : 0, 1)), lt: new Date(Date.UTC(year, month || 12, 1)) }
        : undefined;
    const scope = value("scope");
    const reality = value("reality");
    const booleanFilter = (key: string) => value(key) === "true" ? true : value(key) === "false" ? false : undefined;
    const search = value("q");

    const where: Prisma.DonationWhereInput = {
      status: value("status") === "CANCELLED" ? "CANCELLED" : value("status") === "COMPLETED" ? "COMPLETED" : undefined,
      ...(createdAt ? { createdAt } : {}),
      ...(value("typeId") ? { typeId: value("typeId") } : {}),
      ...(value("groupId") ? { groupId: value("groupId") } : {}),
      ...(value("paymentMethodId") ? { paymentMethodId: value("paymentMethodId") } : {}),
      ...(value("currencyId") ? { currencyId: value("currencyId") } : {}),
      ...(value("destinationCountryId") ? { destinationCountryId: value("destinationCountryId") } : {}),
      ...(value("destinationRegionId") ? { destinationRegionId: value("destinationRegionId") } : {}),
      ...(value("partnerId") ? { partnerId: value("partnerId") } : {}),
      ...(scope === "GENERAL" ? { projectId: null } : scope === "SACRIFICE" ? { projectId: { not: null } } : {}),
      ...(booleanFilter("specialCondition") === undefined ? {} : { specialCondition: booleanFilter("specialCondition") }),
      ...(booleanFilter("orderStatus") === undefined ? {} : { orderStatus: booleanFilter("orderStatus") }),
      ...((value("originCountry") || value("originCity") || value("originDistrict")) ? {
        donor: {
          ...(value("originCountry") ? { originCountry: value("originCountry") } : {}),
          ...(value("originCity") ? { originCity: value("originCity") } : {}),
          ...(value("originDistrict") ? { originDistrict: value("originDistrict") } : {}),
        },
      } : {}),
      AND: [
        ...(reality === "REAL" ? [{ OR: [{ projectId: null }, { project: { isVirtual: false } }] }] : reality === "VIRTUAL" ? [{ project: { isVirtual: true } }] : []),
        ...(search ? [{ OR: [
          { donor: { firstName: { contains: search, mode: "insensitive" as const } } },
          { donor: { lastName: { contains: search, mode: "insensitive" as const } } },
          { donor: { normalizedPhone: { contains: search } } },
          { receipt: { number: { contains: search, mode: "insensitive" as const } } },
          { project: { name: { contains: search, mode: "insensitive" as const } } },
        ] }] : []),
      ],
    };
    const prisma = getPrisma();
    const [definitions, originRows, donations, total, totals] = await prisma.$transaction([
      prisma.definition.findMany({ where: { isActive: true, deletedAt: null }, select: { id: true, type: true, code: true, name: true, symbol: true, parentId: true }, orderBy: [{ sortOrder: "asc" }, { name: "asc" }] }),
      prisma.donor.findMany({ where: { deletedAt: null }, select: { originCountry: true, originCity: true, originDistrict: true } }),
      prisma.donation.findMany({
        where,
        include: { donor: true, receipt: true, payment: true, project: { select: { projectNumber: true, name: true, isVirtual: true, departmentId: true } } },
        orderBy: { [sortBy]: sortDirection }, skip: (page - 1) * pageSize, take: pageSize,
      }),
      prisma.donation.count({ where }),
      prisma.donation.groupBy({ by: ["currencyId"], where, orderBy: { currencyId: "asc" }, _sum: { amount: true, quantity: true }, _count: { id: true } }),
    ]);
    const names = new Map(definitions.map((item) => [item.id, item]));
    const rows = donations.map((item) => ({
      id: item.id, receiptNo: item.receipt?.number ?? "—", donorName: `${item.donor.firstName} ${item.donor.lastName}`, phone: item.donor.normalizedPhone,
      type: names.get(item.typeId)?.name ?? "—", group: names.get(item.groupId ?? "")?.name ?? "—",
      originCountry: item.donor.originCountry ?? "—", originCity: item.donor.originCity ?? "—", originDistrict: item.donor.originDistrict ?? "—",
      destinationCountry: names.get(item.destinationCountryId ?? "")?.name ?? "—", destinationRegion: names.get(item.destinationRegionId ?? "")?.name ?? "—", partner: names.get(item.partnerId ?? "")?.name ?? "—",
      payment: names.get(item.paymentMethodId)?.name ?? "—", currency: names.get(item.currencyId)?.name ?? "—", currencyCode: names.get(item.currencyId)?.code ?? "", currencySymbol: names.get(item.currencyId)?.symbol ?? "",
      quantity: item.quantity, unitType: item.unitType ?? "Adet", unitPrice: Number(item.unitPrice ?? item.amount), amount: Number(item.amount), foreignAmount: item.foreignAmount == null ? null : Number(item.foreignAmount),
      scope: item.projectId ? "Kurban" : "Genel Bağış", projectNumber: item.project?.projectNumber ?? null, projectName: item.project?.name ?? null, reality: item.project?.isVirtual ? "Sanal" : "Gerçek",
      specialCondition: item.specialCondition, orderStatus: item.orderStatus, status: item.status, description: item.description ?? "", createdAt: item.createdAt.toISOString(),
    }));
    const unique = (key: "originCountry" | "originCity" | "originDistrict", parent?: { key: "originCountry" | "originCity"; value?: string }) => [...new Set(originRows.filter((item) => !parent?.value || item[parent.key] === parent.value).map((item) => item[key]).filter((item): item is string => Boolean(item)))].sort((a, b) => a.localeCompare(b, "tr"));
    return Response.json({
      rows,
      totals: totals.map((item) => ({ currencyId: item.currencyId, currency: names.get(item.currencyId)?.name ?? "—", code: names.get(item.currencyId)?.code ?? "", symbol: names.get(item.currencyId)?.symbol ?? "", amount: Number(item._sum?.amount ?? 0), quantity: item._sum?.quantity ?? 0, records: item._count && typeof item._count === "object" ? item._count.id ?? 0 : 0 })),
      pagination: { page, pageSize, total, pageCount: Math.max(1, Math.ceil(total / pageSize)) },
      filters: { definitions, origins: { countries: unique("originCountry"), cities: unique("originCity", { key: "originCountry", value: value("originCountry") }), districts: unique("originDistrict", { key: "originCity", value: value("originCity") }) } },
    });
  } catch (error) { return apiError(error); }
}
