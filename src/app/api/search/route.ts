import { apiError } from "@/lib/server/api";
import { requirePermission } from "@/lib/server/auth";
import { getPrisma } from "@/lib/server/prisma";

export async function GET(request: Request) {
  try {
    await requirePermission("donation:view");
    const q = new URL(request.url).searchParams.get("q")?.trim() ?? "";
    if (q.length < 2) return Response.json({ results: [] });
    const prisma = getPrisma();
    const [donors, receipts] = await Promise.all([
      prisma.donor.findMany({ where: { OR: [{ firstName: { contains: q, mode: "insensitive" } }, { lastName: { contains: q, mode: "insensitive" } }, { normalizedPhone: { contains: q } }] }, take: 6 }),
      prisma.receipt.findMany({ where: { number: { contains: q, mode: "insensitive" } }, include: { donation: { include: { donor: true } } }, take: 4 }),
    ]);
    return Response.json({ results: [...donors.map((item) => ({ id: item.id, kind: "DONOR", title: `${item.firstName} ${item.lastName}`, description: item.normalizedPhone, href: `/bagiscilar/${item.id}` })), ...receipts.map((item) => ({ id: item.id, kind: "DONATION", title: item.number, description: `${item.donation.donor.firstName} ${item.donation.donor.lastName}`, href: "/raporlar" }))] });
  } catch (error) { return apiError(error); }
}
