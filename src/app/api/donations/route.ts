import { apiError } from "@/lib/server/api";
import { ApiError, requestIp, requirePermission } from "@/lib/server/auth";
import { getPrisma } from "@/lib/server/prisma";
import { normalizePhone } from "@/lib/phone";
import { Prisma } from "@/generated/prisma/client";
import { z } from "zod";
import { randomBytes } from "node:crypto";

export async function GET() {
  try {
    await requirePermission("donation:view");
    const prisma = getPrisma();
    const donations = await prisma.donation.findMany({
      where: { status: "COMPLETED" },
      include: { donor: true },
      orderBy: { createdAt: "desc" },
      take: 8,
    });
    const typeIds = [...new Set(donations.map((item) => item.typeId))];
    const types = await prisma.definition.findMany({ where: { id: { in: typeIds } }, select: { id: true, name: true } });
    const typeNames = new Map(types.map((item) => [item.id, item.name]));
    return Response.json({
      donations: donations.map((item) => ({
        id: item.id,
        donorName: `${item.donor.firstName} ${item.donor.lastName}`,
        type: typeNames.get(item.typeId) ?? "Bağış",
        amount: Number(item.amount),
        createdAt: item.createdAt.toISOString(),
        status: item.status,
      })),
    });
  } catch (error) {
    return apiError(error);
  }
}

const createSchema = z.object({
  donorName: z.string().trim().min(2), phone: z.string().min(7), type: z.string().min(1),
  amount: z.coerce.number().positive(), paymentMethod: z.string().min(1), description: z.string().optional(),
  sacrificeId: z.string().optional(), sendWhatsapp: z.boolean().default(false), idempotencyKey: z.uuid(),
});

export async function POST(request: Request) {
  try {
    const user = await requirePermission("donation:create");
    const input = createSchema.parse(await request.json());
    const prisma = getPrisma();
    const result = await prisma.$transaction(async (tx) => {
      const duplicate = await tx.donation.findUnique({ where: { idempotencyKey: input.idempotencyKey } });
      if (duplicate) return { donation: duplicate, duplicate: true };
      const [type, method, currency] = await Promise.all([
        tx.definition.findFirst({ where: { type: "DONATION_TYPE", isActive: true, OR: [{ name: input.type }, { code: input.type.toLocaleUpperCase("tr-TR").replace(/\s+/g, "_") }] } }),
        tx.definition.findFirst({ where: { type: "PAYMENT_METHOD", isActive: true, OR: [{ code: input.paymentMethod }, { name: input.paymentMethod }] } }),
        tx.definition.findFirst({ where: { type: "CURRENCY", code: "TRY", isActive: true } }),
      ]);
      if (!type || !method || !currency) throw new ApiError(422, "Bağış türü, ödeme yöntemi veya para birimi tanımı eksik.");
      const normalizedPhone = normalizePhone(input.phone);
      const parts = input.donorName.trim().split(/\s+/); const firstName = parts.shift() ?? input.donorName; const lastName = parts.join(" ") || "-";
      const donor = await tx.donor.upsert({ where: { normalizedPhone }, update: { firstName, lastName }, create: { normalizedPhone, firstName, lastName, phoneCountry: normalizedPhone.startsWith("+90") ? "TR" : "XX" } });
      let share: { id: string; version: number; shareNumber: number } | null = null;
      if (input.type === "Kurban") {
        if (!input.sacrificeId) throw new ApiError(422, "Kurban projesi seçilmedi.");
        share = await tx.share.findFirst({ where: { projectId: input.sacrificeId, status: "EMPTY" }, orderBy: { shareNumber: "asc" } });
        if (!share) throw new ApiError(409, "Seçilen projede boş hisse bulunmuyor.");
      }
      const receipt = `BGS-${Date.now()}-${randomBytes(2).toString("hex").toUpperCase()}`;
      const donation = await tx.donation.create({ data: { donorId: donor.id, projectId: input.sacrificeId, createdById: user.id, typeId: type.id, amount: new Prisma.Decimal(input.amount), currencyId: currency.id, paymentMethodId: method.id, description: input.description, idempotencyKey: input.idempotencyKey, payment: { create: { amount: new Prisma.Decimal(input.amount), currencyId: currency.id, methodId: method.id, status: "PAID" } }, receipt: { create: { number: receipt, issuedAt: new Date() } } } });
      if (share) {
        const claimed = await tx.share.updateMany({ where: { id: share.id, status: "EMPTY", version: share.version }, data: { status: "FILLED", donationId: donation.id, version: { increment: 1 } } });
        if (claimed.count !== 1) throw new ApiError(409, "Hisse başka bir işlem tarafından dolduruldu.");
        if (await tx.share.count({ where: { projectId: input.sacrificeId, status: "EMPTY" } }) === 0) await tx.project.update({ where: { id: input.sacrificeId! }, data: { status: "FULL" } });
      }
      if (input.sendWhatsapp) await tx.message.create({ data: { donationId: donation.id, channel: "WHATSAPP", recipient: normalizedPhone, renderedBody: `Sayın ${input.donorName}, ${input.amount.toLocaleString("tr-TR")} ₺ bağışınız alınmıştır. Makbuz: ${receipt}`, status: process.env.WHATSAPP_ACCESS_TOKEN ? "PENDING" : "FAILED", errorMessage: process.env.WHATSAPP_ACCESS_TOKEN ? null : "WhatsApp sağlayıcısı yapılandırılmadı." } });
      await tx.auditLog.create({ data: { userId: user.id, action: "DONATION_CREATED", entityType: "Donation", entityId: donation.id, newValue: { amount: input.amount, type: input.type, receipt }, ipAddress: await requestIp() } });
      return { donation, duplicate: false };
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    return Response.json({ donation: { ...result.donation, donorName: input.donorName, type: input.type, amount: Number(result.donation.amount) }, duplicate: result.duplicate }, { status: result.duplicate ? 200 : 201 });
  } catch (error) { return apiError(error); }
}
