import { Prisma } from "@/generated/prisma/client";
import { apiError } from "@/lib/server/api";
import { ApiError, currentUser, requestIp, requirePermission } from "@/lib/server/auth";
import { getPrisma } from "@/lib/server/prisma";
import { definitionInputSchema, definitionTypeSchema } from "@/lib/server/schemas";

export async function GET(request: Request) {
  try {
    if (!(await currentUser())) throw new ApiError(401, "Oturum açmanız gerekiyor.");
    const url = new URL(request.url);
    const type = definitionTypeSchema.optional().parse(url.searchParams.get("type") ?? undefined);
    const includeInactive = url.searchParams.get("includeInactive") === "true";
    const items = await getPrisma().definition.findMany({
      where: { deletedAt: null, ...(type ? { type } : {}), ...(!includeInactive ? { isActive: true } : {}) },
      orderBy: [{ type: "asc" }, { sortOrder: "asc" }, { name: "asc" }],
    });
    return Response.json({ definitions: items });
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requirePermission("settings:manage");
    const input = definitionInputSchema.parse(await request.json());
    const prisma = getPrisma();
    const data: Prisma.DefinitionUncheckedCreateInput = {
      type: input.type,
      code: input.code,
      name: input.name,
      symbol: input.symbol,
      parentId: input.parentId,
      sortOrder: input.sortOrder,
      isActive: input.isActive,
      ...(input.metadata == null ? {} : { metadata: input.metadata }),
    };
    const created = await prisma.definition.create({ data });
    await prisma.auditLog.create({
      data: { userId: user.id, action: "DEFINITION_CREATED", entityType: "Definition", entityId: created.id, newValue: JSON.parse(JSON.stringify(input)) as Prisma.InputJsonValue, ipAddress: await requestIp() },
    });
    return Response.json({ definition: created }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
