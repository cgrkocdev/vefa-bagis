import { apiError } from "@/lib/server/api";
import { requestIp, requirePermission } from "@/lib/server/auth";
import { getPrisma } from "@/lib/server/prisma";
import { posterSchema } from "@/lib/posters/poster-validation";

export async function GET() {
  try {
    await requirePermission("poster:view");
    const posters = await getPrisma().poster.findMany({ include: { createdBy: { select: { name: true } }, mainAssociation: true }, orderBy: { updatedAt: "desc" } });
    return Response.json({ posters });
  } catch (error) { return apiError(error); }
}

export async function POST(request: Request) {
  try {
    const user = await requirePermission("poster:create");
    const input = posterSchema.parse(await request.json());
    const prisma = getPrisma();
    const poster = await prisma.$transaction(async (tx) => {
      const created = await tx.poster.create({ data: { ...input, createdById: user.id } });
      await tx.auditLog.create({ data: { userId: user.id, action: "POSTER_CREATED", entityType: "Poster", entityId: created.id, newValue: { name: created.name, projectIds: created.projectIds }, ipAddress: await requestIp() } });
      return created;
    });
    return Response.json({ poster }, { status: 201 });
  } catch (error) { return apiError(error); }
}
