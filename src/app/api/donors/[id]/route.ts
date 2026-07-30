import { apiError } from "@/lib/server/api";
import { ApiError, requirePermission } from "@/lib/server/auth";
import { getPrisma } from "@/lib/server/prisma";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requirePermission("donation:view");
    const { id } = await params;
    const donor = await getPrisma().donor.findUnique({
      where: { id },
      include: {
        donations: { include: { receipt: true }, orderBy: { createdAt: "desc" } },
      },
    });
    if (!donor) throw new ApiError(404, "Bağışçı bulunamadı.");
    const projectIds = donor.donations.flatMap((item) => item.projectId ? [item.projectId] : []);
    const projects = await getPrisma().project.findMany({ where: { id: { in: projectIds } }, include: { shares: { where: { donation: { donorId: id } } } } });
    return Response.json({ donor: {
      id: donor.id, name: `${donor.firstName} ${donor.lastName}`, phone: donor.normalizedPhone,
      totalDonation: donor.donations.filter((item) => item.status === "COMPLETED").reduce((sum, item) => sum + Number(item.amount), 0),
      donationCount: donor.donations.length, lastDonationAt: donor.donations[0]?.createdAt.toISOString() ?? null, createdAt: donor.createdAt.toISOString(),
      donations: donor.donations.map((item) => ({ ...item, amount: Number(item.amount), donationType: { name: "Bağış" } })),
      shares: projects.flatMap((project) => project.shares.map((share) => ({ ...share, shareNo: share.shareNumber, sacrifice: { id: project.id, number: project.projectNumber, region: project.name } }))),
      whatsappMessages: [],
    } });
  } catch (error) { return apiError(error); }
}
