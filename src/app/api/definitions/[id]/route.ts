import { apiError } from "@/lib/server/api";
import { Prisma } from "@/generated/prisma/client";
import { ApiError, requestIp, requirePermission } from "@/lib/server/auth";
import { getPrisma } from "@/lib/server/prisma";
import { definitionInputSchema } from "@/lib/server/schemas";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requirePermission("settings:manage");
    const { id } = await params;
    const input = definitionInputSchema.partial().parse(await request.json());
    const prisma = getPrisma();
    const previous = await prisma.definition.findUnique({ where: { id } });
    if (!previous || previous.deletedAt) throw new ApiError(404, "Tanım bulunamadı.");
    const { metadata, ...fields } = input;
    const data: Prisma.DefinitionUncheckedUpdateInput = {
      ...fields,
      ...(metadata === null ? { metadata: Prisma.JsonNull } : metadata === undefined ? {} : { metadata }),
    };
    const updated = await prisma.definition.update({ where: { id }, data });
    await prisma.auditLog.create({
      data: { userId: user.id, action: "DEFINITION_UPDATED", entityType: "Definition", entityId: id, oldValue: previous, newValue: updated, ipAddress: await requestIp() },
    });
    return Response.json({ definition: updated });
  } catch (error) {
    return apiError(error);
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requirePermission("settings:manage");
    const { id } = await params;
    const prisma = getPrisma();
    const item = await prisma.definition.findUnique({ where: { id }, include: { children: true } });
    if (!item || item.deletedAt) throw new ApiError(404, "Tanım bulunamadı.");
    const [projectCount, donationCount] = await Promise.all([
      prisma.project.count({ where: { OR: [{ yearId: id }, { departmentId: id }, { typeId: id }, { groupId: id }, { destinationCountryId: id }, { partnerId: id }, { destinationRegionId: id }, { currencyId: id }] } }),
      prisma.donation.count({ where: { OR: [{ typeId: id }, { groupId: id }, { currencyId: id }, { paymentMethodId: id }] } }),
    ]);
    if (item.children.length || projectCount || donationCount) {
      const updated = await prisma.definition.update({ where: { id }, data: { isActive: false } });
      await prisma.auditLog.create({ data: { userId: user.id, action: "DEFINITION_DEACTIVATED", entityType: "Definition", entityId: id, oldValue: item, newValue: updated, ipAddress: await requestIp() } });
      return Response.json({ definition: updated, message: "Bağlı kayıtları bulunduğu için tanım pasife alındı." });
    }
    await prisma.definition.delete({ where: { id } });
    await prisma.auditLog.create({ data: { userId: user.id, action: "DEFINITION_DELETED", entityType: "Definition", entityId: id, oldValue: item, ipAddress: await requestIp() } });
    return Response.json({ success: true });
  } catch (error) {
    return apiError(error);
  }
}
