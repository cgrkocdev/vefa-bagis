import { apiError } from "@/lib/server/api";
import { requirePermission } from "@/lib/server/auth";
import { getPrisma } from "@/lib/server/prisma";

export async function GET() {
  try {
    await requirePermission("donation:view");
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const month = new Date(now.getFullYear(), now.getMonth(), 1);
    const prisma = getPrisma();
    const [todayTotal, monthTotal, donors, remainingShares] = await prisma.$transaction([
      prisma.donation.aggregate({ where: { status: "COMPLETED", createdAt: { gte: today } }, _sum: { amount: true } }),
      prisma.donation.aggregate({ where: { status: "COMPLETED", createdAt: { gte: month } }, _sum: { amount: true } }),
      prisma.donor.count({ where: { deletedAt: null } }),
      prisma.share.count({ where: { status: "EMPTY", project: { deletedAt: null, status: "OPEN" } } }),
    ]);
    return Response.json({ stats: { today: Number(todayTotal._sum.amount ?? 0), month: Number(monthTotal._sum.amount ?? 0), donors, remainingShares } });
  } catch (error) {
    return apiError(error);
  }
}
