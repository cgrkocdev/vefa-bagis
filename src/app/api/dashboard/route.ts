import { apiError } from "@/lib/server/api";
import { requirePermission } from "@/lib/server/auth";
import { getPrisma } from "@/lib/server/prisma";

export async function GET() {
  try {
    await requirePermission("donation:view");
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const month = new Date(now.getFullYear(), now.getMonth(), 1);
    const trendStart = new Date(today);
    trendStart.setDate(trendStart.getDate() - 6);
    const prisma = getPrisma();
    const [todayTotal, monthTotal, donors, todayDonors, recentDonations, typeDefinitions] = await prisma.$transaction([
      prisma.donation.aggregate({ where: { status: "COMPLETED", createdAt: { gte: today } }, _sum: { amount: true } }),
      prisma.donation.aggregate({ where: { status: "COMPLETED", createdAt: { gte: month } }, _sum: { amount: true } }),
      prisma.donor.count({ where: { deletedAt: null } }),
      prisma.donor.count({
        where: {
          deletedAt: null,
          donations: { some: { status: "COMPLETED", createdAt: { gte: today } } },
        },
      }),
      prisma.donation.findMany({
        where: { status: "COMPLETED", createdAt: { gte: trendStart } },
        select: { amount: true, createdAt: true, typeId: true, donorId: true, paymentMethodId: true },
      }),
      prisma.definition.findMany({
        where: { type: { in: ["DONATION_TYPE", "PAYMENT_METHOD"] }, deletedAt: null },
        select: { id: true, type: true, code: true, name: true },
      }),
    ]);

    const trend = Array.from({ length: 7 }, (_, index) => {
      const date = new Date(trendStart);
      date.setDate(date.getDate() + index);
      return {
        key: `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`,
        label: new Intl.DateTimeFormat("tr-TR", { weekday: "short" }).format(date),
        amount: 0,
        count: 0,
      };
    });
    const trendByDay = new Map(trend.map((item) => [item.key, item]));
    const typeNames = new Map(typeDefinitions.filter((item) => item.type === "DONATION_TYPE").map((item) => [item.id, item.name]));
    const paymentNames = new Map(typeDefinitions.filter((item) => item.type === "PAYMENT_METHOD").flatMap((item) => [[item.id, item.name], [item.code, item.name]]));
    const typeTotals = new Map<string, { name: string; amount: number; count: number }>();
    const paymentTotals = new Map<string, { name: string; amount: number; count: number }>();

    for (const donation of recentDonations) {
      const date = donation.createdAt;
      const day = trendByDay.get(`${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`);
      if (day) {
        day.amount += Number(donation.amount);
        day.count += 1;
      }
      const current = typeTotals.get(donation.typeId) ?? { name: typeNames.get(donation.typeId) ?? "Diğer", amount: 0, count: 0 };
      current.amount += Number(donation.amount);
      current.count += 1;
      typeTotals.set(donation.typeId, current);
      const payment = paymentTotals.get(donation.paymentMethodId) ?? { name: paymentNames.get(donation.paymentMethodId) ?? "Diğer", amount: 0, count: 0 };
      payment.amount += Number(donation.amount);
      payment.count += 1;
      paymentTotals.set(donation.paymentMethodId, payment);
    }

    const types = [...typeTotals.values()].sort((left, right) => right.amount - left.amount).slice(0, 6);
    const payments = [...paymentTotals.values()].sort((left, right) => right.amount - left.amount).slice(0, 5);
    const sevenDayTotal = trend.reduce((sum, item) => sum + item.amount, 0);
    const sevenDayCount = trend.reduce((sum, item) => sum + item.count, 0);
    const peakDay = trend.reduce((peak, item) => item.amount > peak.amount ? item : peak, trend[0]);
    return Response.json({
      stats: { today: Number(todayTotal._sum.amount ?? 0), month: Number(monthTotal._sum.amount ?? 0), donors, todayDonors },
      overview: {
        trend: trend.map((item) => ({ label: item.label, amount: item.amount, count: item.count })),
        types,
        payments,
        summary: {
          total: sevenDayTotal,
          count: sevenDayCount,
          uniqueDonors: new Set(recentDonations.map((item) => item.donorId)).size,
          average: sevenDayCount ? sevenDayTotal / sevenDayCount : 0,
          peakDay: peakDay?.label ?? "—",
          peakAmount: peakDay?.amount ?? 0,
        },
      },
    });
  } catch (error) {
    return apiError(error);
  }
}
