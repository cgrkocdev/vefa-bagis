import { apiError } from "@/lib/server/api";
import { ApiError, requestIp, requirePermission } from "@/lib/server/auth";
import { getPrisma } from "@/lib/server/prisma";
import { associationSchema } from "@/lib/posters/poster-validation";

export async function PATCH(request: Request, context: RouteContext<"/api/associations/[id]">) {
  try {
    const user = await requirePermission("association:manage");
    const { id } = await context.params;
    const input = associationSchema.parse(await request.json());
    const prisma = getPrisma();
    const association = await prisma.$transaction(async (tx) => {
      if (input.isDefault) await tx.association.updateMany({ where: { id: { not: id } }, data: { isDefault: false } });
      const updated = await tx.association.update({ where: { id }, data: input });
      await tx.auditLog.create({ data: { userId: user.id, action: "ASSOCIATION_UPDATED", entityType: "Association", entityId: id, newValue: { name: updated.name }, ipAddress: await requestIp() } });
      return updated;
    });
    return Response.json({ association });
  } catch (error) { return apiError(error); }
}

export async function DELETE(_request: Request, context: RouteContext<"/api/associations/[id]">) {
  try {
    const user = await requirePermission("association:manage");
    const { id } = await context.params;
    const prisma = getPrisma();
    const association = await prisma.association.findUnique({ where: { id }, include: { _count: { select: { postersAsMain: true } } } });
    if (!association) throw new ApiError(404, "Dernek bulunamadı.");
    if (association._count.postersAsMain) {
      await prisma.association.update({ where: { id }, data: { isActive: false } });
    } else {
      await prisma.association.delete({ where: { id } });
    }
    await prisma.auditLog.create({ data: { userId: user.id, action: association._count.postersAsMain ? "ASSOCIATION_DEACTIVATED" : "ASSOCIATION_DELETED", entityType: "Association", entityId: id, ipAddress: await requestIp() } });
    return Response.json({ success: true });
  } catch (error) { return apiError(error); }
}
