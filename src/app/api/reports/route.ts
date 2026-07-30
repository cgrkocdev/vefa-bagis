import { apiError } from "@/lib/server/api";
import { requirePermission } from "@/lib/server/auth";
import { getPrisma } from "@/lib/server/prisma";

export async function GET(request: Request) {
  try {
    await requirePermission("donation:view");
    const url = new URL(request.url);
    const days = Math.min(3650, Math.max(1, Number(url.searchParams.get("days") ?? 30)));
    const startDate = new Date(); startDate.setDate(startDate.getDate() - days + 1); startDate.setHours(0, 0, 0, 0);
    const userId = url.searchParams.get("userId");
    const type = url.searchParams.get("type");
    const payment = url.searchParams.get("payment");
    const prisma = getPrisma();
    const definitions = await prisma.definition.findMany({ where: { deletedAt: null } });
    const names = new Map(definitions.map((item) => [item.id, item.name]));
    const selectedType = type ? definitions.find((item) => item.type === "DONATION_TYPE" && (item.id === type || item.name === type)) : null;
    const selectedPayment = payment ? definitions.find((item) => item.type === "PAYMENT_METHOD" && (item.id === payment || item.code === payment)) : null;
    const donations = await prisma.donation.findMany({
      where: { createdAt: { gte: startDate }, status: "COMPLETED", ...(userId ? { createdById: userId } : {}), ...(selectedType ? { typeId: selectedType.id } : {}), ...(selectedPayment ? { paymentMethodId: selectedPayment.id } : {}) },
      include: { donor: true, createdBy: true, receipt: true },
      orderBy: { createdAt: "desc" },
      take: 500,
    });
    const users = await prisma.user.findMany({ where: { isActive: true, deletedAt: null } });
    const activities = await prisma.auditLog.findMany({ where: { createdAt: { gte: startDate } }, include: { user: true }, orderBy: { createdAt: "desc" }, take: 50 });
    const total = donations.reduce((sum, item) => sum + Number(item.amount), 0);
    const dailyMap = new Map<string, { date: string; amount: number; count: number }>();
    const typeMap = new Map<string, { name: string; amount: number; count: number }>();
    const paymentMap = new Map<string, { name: string; amount: number; count: number }>();
    for (const item of donations) {
      const date = item.createdAt.toISOString().slice(0, 10); const daily = dailyMap.get(date) ?? { date, amount: 0, count: 0 }; daily.amount += Number(item.amount); daily.count++; dailyMap.set(date, daily);
      const typeName = names.get(item.typeId) ?? "Bağış"; const typeRow = typeMap.get(typeName) ?? { name: typeName, amount: 0, count: 0 }; typeRow.amount += Number(item.amount); typeRow.count++; typeMap.set(typeName, typeRow);
      const paymentName = names.get(item.paymentMethodId) ?? "Diğer"; const paymentRow = paymentMap.get(paymentName) ?? { name: paymentName, amount: 0, count: 0 }; paymentRow.amount += Number(item.amount); paymentRow.count++; paymentMap.set(paymentName, paymentRow);
    }
    const filledShares = await prisma.share.count({ where: { status: "FILLED" } }); const totalShares = await prisma.share.count();
    return Response.json({
      period: { days, startDate: startDate.toISOString(), endDate: new Date().toISOString() },
      summary: { total, donationCount: donations.length, average: donations.length ? total / donations.length : 0, newDonors: await prisma.donor.count({ where: { createdAt: { gte: startDate } } }), filledShares, totalShares },
      daily: [...dailyMap.values()].sort((a, b) => a.date.localeCompare(b.date)), byType: [...typeMap.values()], byPayment: [...paymentMap.values()],
      filters: { users: users.map((item) => ({ id: item.id, name: item.name, roleCode: item.role })), donationTypes: definitions.filter((item) => item.type === "DONATION_TYPE" && item.isActive).map((item) => ({ id: item.id, name: item.name })), paymentMethods: definitions.filter((item) => item.type === "PAYMENT_METHOD" && item.isActive).map((item) => ({ value: item.id, label: item.name })), selected: { userId, donationType: type, paymentMethod: payment } },
      byUser: users.map((user) => { const rows = donations.filter((item) => item.createdById === user.id); return { userId: user.id, name: user.name, role: user.role, amount: rows.reduce((sum, item) => sum + Number(item.amount), 0), count: rows.length }; }).filter((item) => item.count),
      donations: donations.slice(0, 50).map((item) => ({ id: item.id, receiptNo: item.receipt?.number ?? "—", donorName: `${item.donor.firstName} ${item.donor.lastName}`, type: names.get(item.typeId) ?? "Bağış", paymentMethod: names.get(item.paymentMethodId) ?? "Diğer", amount: Number(item.amount), createdAt: item.createdAt.toISOString(), createdBy: { id: item.createdBy.id, name: item.createdBy.name, roleCode: item.createdBy.role } })),
      activities: activities.map((item) => ({ id: item.id, action: item.action, entity: item.entityType, entityId: item.entityId, createdAt: item.createdAt.toISOString(), user: { name: item.user?.name ?? "Sistem", roleCode: item.user?.role ?? "ADMIN" } })),
    });
  } catch (error) { return apiError(error); }
}
