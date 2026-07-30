import { Prisma } from "@/generated/prisma/client";
import { apiError } from "@/lib/server/api";
import { currentUser, ApiError, requestIp, requirePermission } from "@/lib/server/auth";
import { getPrisma } from "@/lib/server/prisma";
import { projectInputSchema } from "@/lib/server/schemas";

export async function GET(request: Request) {
  try {
    if (!(await currentUser())) throw new ApiError(401, "Oturum açmanız gerekiyor.");
    const url = new URL(request.url);
    const page = Math.max(1, Number(url.searchParams.get("page") ?? 1));
    const pageSize = Math.min(100, Math.max(1, Number(url.searchParams.get("pageSize") ?? 20)));
    const query = url.searchParams.get("q")?.trim();
    const where: Prisma.ProjectWhereInput = {
      deletedAt: null,
      ...(url.searchParams.get("status") ? { status: url.searchParams.get("status") as Prisma.EnumProjectStatusFilter } : {}),
      ...(url.searchParams.get("yearId") ? { yearId: url.searchParams.get("yearId")! } : {}),
      ...(url.searchParams.get("departmentId") ? { departmentId: url.searchParams.get("departmentId")! } : {}),
      ...(query ? { OR: [{ name: { contains: query, mode: "insensitive" } }, ...(/^\d+$/.test(query) ? [{ projectNumber: Number(query) }] : [])] } : {}),
    };
    const prisma = getPrisma();
    const [projects, total] = await prisma.$transaction([
      prisma.project.findMany({
        where,
        include: { shares: { select: { id: true, shareNumber: true, status: true } } },
        orderBy: [{ createdAt: "desc" }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.project.count({ where }),
    ]);
    return Response.json({ projects: projects.map((item) => ({ ...item, sharePrice: item.sharePrice.toString() })), pagination: { page, pageSize, total, pageCount: Math.ceil(total / pageSize) } });
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requirePermission("sacrifice:manage");
    const input = projectInputSchema.parse(await request.json());
    const expectedCapacity = input.animalType === "CATTLE" ? 7 : 1;
    if (input.shareCapacity !== expectedCapacity && user.role !== "ADMIN") {
      throw new ApiError(403, `Bu hayvan türü için hisse kapasitesi ${expectedCapacity} olmalıdır.`);
    }
    const prisma = getPrisma();
    const project = await prisma.$transaction(async (tx) => {
      const definitionIds = [input.yearId, input.departmentId, input.typeId, input.groupId, input.destinationCountryId, input.currencyId, input.partnerId, input.destinationRegionId].filter((value): value is string => Boolean(value));
      const activeCount = await tx.definition.count({ where: { id: { in: definitionIds }, isActive: true, deletedAt: null } });
      if (activeCount !== definitionIds.length) throw new ApiError(422, "Seçilen tanımlardan biri pasif veya geçersiz.");
      const created = await tx.project.create({
        data: {
          ...input,
          sharePrice: new Prisma.Decimal(input.sharePrice),
          createdById: user.id,
          shares: { create: Array.from({ length: input.shareCapacity }, (_, index) => ({ shareNumber: index + 1 })) },
        },
        include: { shares: true },
      });
      await tx.auditLog.create({ data: { userId: user.id, action: "PROJECT_CREATED", entityType: "Project", entityId: created.id, newValue: { ...input, sharePrice: input.sharePrice }, ipAddress: await requestIp() } });
      return created;
    });
    return Response.json({ project: { ...project, sharePrice: project.sharePrice.toString() } }, { status: 201 });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return Response.json({ message: "Aynı yıl, bölüm ve proje numarasıyla başka bir proje bulunuyor." }, { status: 409 });
    }
    return apiError(error);
  }
}
