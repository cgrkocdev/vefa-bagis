import { apiError } from "@/lib/server/api";
import { requirePermission } from "@/lib/server/auth";
import { getPrisma } from "@/lib/server/prisma";
import { normalizePhone } from "@/lib/phone";

export async function GET(request: Request) {
  try {
    await requirePermission("donation:create");
    const phone = normalizePhone(new URL(request.url).searchParams.get("phone") ?? "");
    const donor = await getPrisma().donor.findUnique({ where: { normalizedPhone: phone } });
    return Response.json({ donor: donor ? { id: donor.id, name: `${donor.firstName} ${donor.lastName}`, phone: donor.normalizedPhone } : null });
  } catch (error) { return apiError(error); }
}
