import { apiError } from "@/lib/server/api";
import { requirePermission } from "@/lib/server/auth";
import { getPrisma } from "@/lib/server/prisma";

export async function GET() {
  try {
    await requirePermission("sms:send");
    const messages = await getPrisma().message.findMany({
      where: { channel: "SMS" },
      include: { donation: { include: { donor: true } } },
      orderBy: { createdAt: "desc" },
      take: 200,
    });
    const configured = Boolean(
      process.env.SMS_PROVIDER === "twilio"
      && process.env.TWILIO_ACCOUNT_SID
      && process.env.TWILIO_AUTH_TOKEN
      && process.env.TWILIO_FROM_NUMBER,
    );
    return Response.json({
      provider: configured ? "Twilio" : "Yedirenk Demo SMS",
      configured,
      balance: null,
      messages: messages.map((item) => ({
        ...item,
        phone: item.recipient,
        message: item.renderedBody,
        donor: item.donation ? { name: `${item.donation.donor.firstName} ${item.donation.donor.lastName}` } : null,
      })),
    });
  } catch (error) { return apiError(error); }
}
