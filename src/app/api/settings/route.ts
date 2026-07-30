import { Prisma } from "@/generated/prisma/client";
import { settingsSchema } from "@/lib/validations";
import { apiError } from "@/lib/server/api";
import { requestIp, requirePermission } from "@/lib/server/auth";
import { getPrisma } from "@/lib/server/prisma";

const defaults = {
  organizationName: "Vefa Bağış Yönetimi",
  organizationPhone: "",
  organizationEmail: "",
  organizationAddress: "",
  receiptPrefix: "BGS",
  whatsappEnabled: false,
};

function parseSettings(value: Prisma.JsonValue | undefined) {
  const input = value && typeof value === "object" && !Array.isArray(value) ? value : {};
  const parsed = settingsSchema.safeParse({ ...defaults, ...input });
  return parsed.success ? parsed.data : defaults;
}

export async function GET() {
  try {
    await requirePermission("settings:manage");
    const stored = await getPrisma().appSetting.findUnique({ where: { key: "organization" } });
    return Response.json({
      settings: parseSettings(stored?.value),
      integrations: {
        whatsappProvider: process.env.WHATSAPP_ACCESS_TOKEN ? "meta" : "yapılandırılmadı",
        whatsappConfigured: Boolean(process.env.WHATSAPP_ACCESS_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID),
      },
    });
  } catch (error) {
    return apiError(error);
  }
}

export async function PUT(request: Request) {
  try {
    const user = await requirePermission("settings:manage");
    const input = settingsSchema.parse(await request.json());
    const prisma = getPrisma();
    const previous = await prisma.appSetting.findUnique({ where: { key: "organization" } });
    const updated = await prisma.appSetting.upsert({
      where: { key: "organization" },
      update: { value: input },
      create: { key: "organization", value: input },
    });
    await prisma.auditLog.create({
      data: { userId: user.id, action: "SETTINGS_UPDATED", entityType: "AppSetting", entityId: updated.key, oldValue: previous?.value === null ? Prisma.JsonNull : previous?.value, newValue: input, ipAddress: await requestIp() },
    });
    return Response.json({ settings: input, message: "Ayarlar kaydedildi." });
  } catch (error) {
    return apiError(error);
  }
}
