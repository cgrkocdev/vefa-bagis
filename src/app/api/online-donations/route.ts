import { apiError } from "@/lib/server/api";
import { requirePermission } from "@/lib/server/auth";
import { getPrisma } from "@/lib/server/prisma";

export async function GET() {
  try {
    await requirePermission("donation:view");
    const submissions = await getPrisma().onlineDonationSubmission.findMany({ orderBy: { createdAt: "desc" }, take: 300 });
    return Response.json({
      donations: submissions.map((item) => ({ ...item, amount: Number(item.amount), createdAt: item.createdAt.toISOString(), reviewedAt: item.reviewedAt?.toISOString() ?? null })),
      summary: {
        pending: submissions.filter((item) => item.status === "PENDING").length,
        approved: submissions.filter((item) => item.status === "APPROVED").length,
        rejected: submissions.filter((item) => item.status === "REJECTED").length,
        approvedTotal: submissions.filter((item) => item.status === "APPROVED").reduce((sum, item) => sum + Number(item.amount), 0),
      },
    });
  } catch (error) { return apiError(error); }
}
