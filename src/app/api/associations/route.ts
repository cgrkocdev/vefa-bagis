import { apiError } from "@/lib/server/api";
import { requestIp, requirePermission } from "@/lib/server/auth";
import { getPrisma } from "@/lib/server/prisma";
import { associationSchema } from "@/lib/posters/poster-validation";

export async function GET() {
  try {
    await requirePermission("poster:view");
    return Response.json({ associations: await getPrisma().association.findMany({ orderBy: [{ sortOrder: "asc" }, { name: "asc" }] }) });
  } catch (error) { return apiError(error); }
}

export async function POST(request: Request) {
  try {
    const user = await requirePermission("association:manage");
    const input = associationSchema.parse(await request.json());
    const prisma = getPrisma();
    const association = await prisma.$transaction(async (tx) => {
      if (input.isDefault) await tx.association.updateMany({ data: { isDefault: false } });
      const created = await tx.association.create({ data: input });
      await tx.auditLog.create({ data: { userId: user.id, action: "ASSOCIATION_CREATED", entityType: "Association", entityId: created.id, newValue: { name: created.name }, ipAddress: await requestIp() } });
      return created;
    });
    return Response.json({ association }, { status: 201 });
  } catch (error) { return apiError(error); }
}
