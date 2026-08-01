import { randomBytes } from "node:crypto";
import { z } from "zod";
import { Prisma } from "@/generated/prisma/client";
import { apiError } from "@/lib/server/api";
import { ApiError, requirePermission } from "@/lib/server/auth";
import { getPrisma } from "@/lib/server/prisma";
import { getSmsProvider, renderDonationSms } from "@/lib/sms";
import { formatCurrency } from "@/lib/utils";

const schema = z.object({ action: z.enum(["APPROVE", "REJECT"]), reason: z.string().trim().max(300).optional() });

export async function PATCH(request: Request, context: RouteContext<"/api/online-donations/[id]">) {
  try {
    const user = await requirePermission("donation:create");
    const { id } = await context.params;
    const input = schema.parse(await request.json());
    const prisma = getPrisma();
    const result = await prisma.$transaction(async (tx) => {
      const submission = await tx.onlineDonationSubmission.findUnique({ where: { id } });
      if (!submission) throw new ApiError(404, "Online bağış kaydı bulunamadı.");
      if (submission.status !== "PENDING") throw new ApiError(409, "Bu online bağış daha önce sonuçlandırılmış.");
      if (input.action === "REJECT") {
        const rejected = await tx.onlineDonationSubmission.update({ where: { id }, data: { status: "REJECTED", reviewedById: user.id, reviewedAt: new Date(), rejectionReason: input.reason || "Yönetici tarafından reddedildi." } });
        return { submission: rejected, sms: null };
      }
      const [type, method, currency] = await Promise.all([
        tx.definition.findFirst({ where: { type: "DONATION_TYPE", code: "GENEL_BAGIS", isActive: true, deletedAt: null } }),
        tx.definition.findFirst({ where: { type: "PAYMENT_METHOD", code: "ONLINE_DONATION", isActive: true, deletedAt: null } }),
        tx.definition.findFirst({ where: { type: "CURRENCY", code: "TRY", isActive: true, deletedAt: null } }),
      ]);
      if (!type || !method || !currency) throw new ApiError(503, "Online bağış tanımları eksik.");
      const donor = await tx.donor.upsert({
        where: { normalizedPhone: submission.phone },
        update: { firstName: submission.firstName, lastName: submission.lastName, originCountry: submission.originCountry, originCity: submission.originCity, originDistrict: submission.originDistrict },
        create: { normalizedPhone: submission.phone, firstName: submission.firstName, lastName: submission.lastName, phoneCountry: "TR", originCountry: submission.originCountry, originCity: submission.originCity, originDistrict: submission.originDistrict },
      });
      const receiptNumber = `ONL-${Date.now()}-${randomBytes(2).toString("hex").toUpperCase()}`;
      const donation = await tx.donation.create({ data: {
        donorId: donor.id, createdById: user.id, typeId: type.id, amount: submission.amount, unitPrice: submission.amount, unitType: "Online", quantity: 1,
        currencyId: currency.id, paymentMethodId: method.id, description: `[YEDIRENK_ONLINE] E-posta: ${submission.email} | Kampanya: ${submission.campaign}`,
        idempotencyKey: submission.externalReference,
        payment: { create: { amount: submission.amount, currencyId: currency.id, methodId: method.id, status: "PAID" } },
        receipt: { create: { number: receiptNumber, issuedAt: new Date() } },
      } });
      const donorName = `${submission.firstName} ${submission.lastName}`;
      const amountText = formatCurrency(Number(submission.amount));
      const renderedBody = renderDonationSms({ donorName, amount: amountText, donationType: submission.campaign });
      const message = await tx.message.create({ data: { donationId: donation.id, channel: "SMS", recipient: submission.phone, renderedBody, status: "PENDING", provider: process.env.SMS_PROVIDER === "twilio" ? "Twilio" : "Yedirenk Demo SMS" } });
      await tx.auditLog.create({ data: { userId: user.id, action: "ONLINE_DONATION_APPROVED", entityType: "OnlineDonationSubmission", entityId: submission.id, newValue: { donationId: donation.id, donorId: donor.id, amount: Number(submission.amount) } } });
      const approved = await tx.onlineDonationSubmission.update({ where: { id }, data: { status: "APPROVED", approvedDonationId: donation.id, reviewedById: user.id, reviewedAt: new Date() } });
      return { submission: approved, sms: { id: message.id, phone: submission.phone, message: renderedBody } };
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    if (result.sms) {
      const provider = getSmsProvider();
      const sent = await provider.sendSms({ phone: result.sms.phone, message: result.sms.message });
      await prisma.message.update({ where: { id: result.sms.id }, data: { status: sent.success ? "SENT" : "FAILED", providerKey: sent.providerId, errorMessage: sent.errorMessage, sentAt: sent.success ? new Date() : null } });
      await prisma.auditLog.create({ data: { userId: user.id, action: sent.success ? "SMS_SENT" : "SMS_FAILED", entityType: "Message", entityId: result.sms.id, newValue: { provider: provider.name, recipient: result.sms.phone } } });
    }
    return Response.json({ submission: { ...result.submission, amount: Number(result.submission.amount) } });
  } catch (error) { return apiError(error); }
}
