import { Prisma } from "@/generated/prisma/client";
import { apiError } from "@/lib/server/api";
import { ApiError, requestIp, requirePermission } from "@/lib/server/auth";
import { getPrisma } from "@/lib/server/prisma";
import { projectInputSchema } from "@/lib/server/schemas";
import { validateProjectDefinitions } from "@/lib/server/definition-integrity";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requirePermission("sacrifice:manage");
    const { id } = await params;
    const input = projectInputSchema.partial().omit({ shareCapacity: true, animalType: true }).parse(await request.json());
    const prisma = getPrisma();
    const previous = await prisma.project.findUnique({ where: { id } });
    if (!previous || previous.deletedAt) throw new ApiError(404, "Proje bulunamadı.");
    const updated = await prisma.$transaction(async (tx) => {
      const merged = {
        yearId: input.yearId ?? previous.yearId,
        departmentId: input.departmentId ?? previous.departmentId,
        typeId: input.typeId ?? previous.typeId,
        groupId: input.groupId ?? previous.groupId,
        destinationCountryId: input.destinationCountryId ?? previous.destinationCountryId,
        partnerId: input.partnerId === undefined ? previous.partnerId : input.partnerId,
        destinationRegionId: input.destinationRegionId === undefined ? previous.destinationRegionId : input.destinationRegionId,
        currencyId: input.currencyId ?? previous.currencyId,
      };
      await validateProjectDefinitions(tx, merged);
      return tx.project.update({
        where: { id },
        data: { ...input, ...(input.sharePrice ? { sharePrice: new Prisma.Decimal(input.sharePrice) } : {}) },
      });
    });
    await prisma.auditLog.create({ data: { userId: user.id, action: "PROJECT_UPDATED", entityType: "Project", entityId: id, oldValue: { ...previous, sharePrice: previous.sharePrice.toString() }, newValue: { ...updated, sharePrice: updated.sharePrice.toString() }, ipAddress: await requestIp() } });
    return Response.json({ project: { ...updated, sharePrice: updated.sharePrice.toString() } });
  } catch (error) {
    return apiError(error);
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requirePermission("sacrifice:manage");
    const { id } = await params;
    const prisma = getPrisma();
    const project = await prisma.project.findUnique({ where: { id }, include: { shares: true } });
    if (!project || project.deletedAt) throw new ApiError(404, "Proje bulunamadı.");
    if (project.shares.some((share) => share.status !== "EMPTY")) throw new ApiError(409, "Dolu veya rezerve hissesi bulunan proje silinemez; projeyi kapatın.");
    const updated = await prisma.project.update({ where: { id }, data: { deletedAt: new Date(), status: "CLOSED" } });
    await prisma.auditLog.create({ data: { userId: user.id, action: "PROJECT_ARCHIVED", entityType: "Project", entityId: id, oldValue: { status: project.status }, newValue: { status: updated.status, deletedAt: updated.deletedAt }, ipAddress: await requestIp() } });
    return Response.json({ success: true });
  } catch (error) {
    return apiError(error);
  }
}
