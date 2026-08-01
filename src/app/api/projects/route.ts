import { Prisma } from "@/generated/prisma/client";
import { apiError } from "@/lib/server/api";
import { currentUser, ApiError, requestIp, requirePermission } from "@/lib/server/auth";
import { getPrisma } from "@/lib/server/prisma";
import { projectInputSchema } from "@/lib/server/schemas";
import { validateProjectDefinitions } from "@/lib/server/definition-integrity";

const createProjectInputSchema = projectInputSchema.extend({
  projectNumber: projectInputSchema.shape.projectNumber.optional(),
  name: projectInputSchema.shape.name.optional(),
});

export async function GET(request: Request) {
  try {
    if (!(await currentUser())) throw new ApiError(401, "Oturum açmanız gerekiyor.");
    const url = new URL(request.url);
    const page = Math.max(1, Number(url.searchParams.get("page") ?? 1));
    const pageSize = Math.min(100, Math.max(1, Number(url.searchParams.get("pageSize") ?? 20)));
    const query = url.searchParams.get("q")?.trim();
    const nextNumberYearId = url.searchParams.get("nextNumberYearId");
    const nextNumberDepartmentId = url.searchParams.get("nextNumberDepartmentId");
    const nextNumberCountryId = url.searchParams.get("nextNumberCountryId");
    const nextNumberRegionId = url.searchParams.get("nextNumberRegionId");
    const prisma = getPrisma();
    if (nextNumberYearId && nextNumberDepartmentId && nextNumberCountryId && nextNumberRegionId) {
      const result = await prisma.project.aggregate({
        where: { yearId: nextNumberYearId, departmentId: nextNumberDepartmentId, destinationCountryId: nextNumberCountryId, destinationRegionId: nextNumberRegionId },
        _max: { projectNumber: true },
      });
      return Response.json({ nextProjectNumber: (result._max.projectNumber ?? 0) + 1 });
    }
    const where: Prisma.ProjectWhereInput = {
      deletedAt: null,
      ...(url.searchParams.get("status") ? { status: url.searchParams.get("status") as Prisma.EnumProjectStatusFilter } : {}),
      ...(url.searchParams.get("yearId") ? { yearId: url.searchParams.get("yearId")! } : {}),
      ...(url.searchParams.get("departmentId") ? { departmentId: url.searchParams.get("departmentId")! } : {}),
      ...(query ? { OR: [{ name: { contains: query, mode: "insensitive" } }, ...(/^\d+$/.test(query) ? [{ projectNumber: Number(query) }] : [])] } : {}),
    };
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
    const input = createProjectInputSchema.parse(await request.json());
    const expectedCapacity = input.animalType === "CATTLE" ? 7 : 1;
    if (input.shareCapacity !== expectedCapacity) {
      throw new ApiError(422, `Bu hayvan türü için hisse kapasitesi ${expectedCapacity} olmalıdır.`);
    }
    const prisma = getPrisma();
    const project = await prisma.$transaction(async (tx) => {
      await validateProjectDefinitions(tx, input);
      const [lastProject, definitions] = await Promise.all([
        tx.project.aggregate({
          where: { yearId: input.yearId, departmentId: input.departmentId, destinationCountryId: input.destinationCountryId, destinationRegionId: input.destinationRegionId },
          _max: { projectNumber: true },
        }),
        tx.definition.findMany({
          where: { id: { in: [input.destinationCountryId, input.departmentId] } },
          select: { id: true, name: true },
        }),
      ]);
      const projectNumber = (lastProject._max.projectNumber ?? 0) + 1;
      const destinationCountry = definitions.find((item) => item.id === input.destinationCountryId)?.name;
      const department = definitions.find((item) => item.id === input.departmentId)?.name;
      const name = input.name?.trim() || [destinationCountry, department].filter(Boolean).join(" ");
      if (!name) throw new ApiError(422, "Proje adı oluşturulamadı; giden ülke ve bölüm seçimini kontrol edin.");
      const created = await tx.project.create({
        data: {
          ...input,
          projectNumber,
          name,
          sharePrice: new Prisma.Decimal(input.sharePrice),
          createdById: user.id,
          shares: { create: Array.from({ length: input.shareCapacity }, (_, index) => ({ shareNumber: index + 1 })) },
        },
        include: { shares: true },
      });
      await tx.auditLog.create({ data: { userId: user.id, action: "PROJECT_CREATED", entityType: "Project", entityId: created.id, newValue: { ...input, projectNumber, name, sharePrice: input.sharePrice }, ipAddress: await requestIp() } });
      return created;
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    return Response.json({ project: { ...project, sharePrice: project.sharePrice.toString() } }, { status: 201 });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return Response.json({ message: "Aynı yıl, bölüm, ülke, bölge ve proje numarasıyla başka bir proje bulunuyor." }, { status: 409 });
    }
    return apiError(error);
  }
}
