import { apiError } from "@/lib/server/api";
import { ApiError, requestIp, requirePermission } from "@/lib/server/auth";
import { getPrisma } from "@/lib/server/prisma";
import { posterSchema } from "@/lib/posters/poster-validation";

export async function GET(_request: Request, context: RouteContext<"/api/posters/[id]">) {
  try {
    await requirePermission("poster:view");
    const { id } = await context.params;
    const poster = await getPrisma().poster.findUnique({ where: { id } });
    if (!poster) throw new ApiError(404, "Kaydedilen afiş bulunamadı.");
    return Response.json({ poster });
  } catch (error) { return apiError(error); }
}

export async function PATCH(request: Request, context: RouteContext<"/api/posters/[id]">) {
  try {
    const user = await requirePermission("poster:update");
    const { id } = await context.params;
    const input = posterSchema.parse(await request.json());
    const prisma = getPrisma();
    const poster = await prisma.poster.update({ where: { id }, data: input });
    await prisma.auditLog.create({ data: { userId: user.id, action: "POSTER_UPDATED", entityType: "Poster", entityId: id, newValue: { name: poster.name }, ipAddress: await requestIp() } });
    return Response.json({ poster });
  } catch (error) { return apiError(error); }
}

export async function DELETE(_request: Request, context: RouteContext<"/api/posters/[id]">) {
  try {
    const user = await requirePermission("poster:delete");
    const { id } = await context.params;
    await getPrisma().poster.delete({ where: { id } });
    await getPrisma().auditLog.create({ data: { userId: user.id, action: "POSTER_DELETED", entityType: "Poster", entityId: id, ipAddress: await requestIp() } });
    return Response.json({ success: true });
  } catch (error) { return apiError(error); }
}
