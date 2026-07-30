import { apiError } from "@/lib/server/api";
import { requirePermission } from "@/lib/server/auth";
import { getPrisma } from "@/lib/server/prisma";

export async function GET() {
  try {
    await requirePermission("donation:view");
    const donors = await getPrisma().donor.findMany({
      where: { deletedAt: null },
      include: { donations: { where: { status: "COMPLETED" }, select: { amount: true, createdAt: true } } },
      orderBy: { createdAt: "desc" },
    });
    return Response.json({ donors: donors.map((donor) => ({
      id: donor.id, name: `${donor.firstName} ${donor.lastName}`, phone: donor.normalizedPhone,
      totalDonation: donor.donations.reduce((sum, item) => sum + Number(item.amount), 0),
      donationCount: donor.donations.length,
      lastDonationAt: donor.donations.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0]?.createdAt.toISOString() ?? null,
      createdAt: donor.createdAt.toISOString(),
    })) });
  } catch (error) { return apiError(error); }
}
