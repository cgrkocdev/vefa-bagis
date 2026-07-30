import { apiError } from "@/lib/server/api";
import { requirePermission } from "@/lib/server/auth";
import { getPrisma } from "@/lib/server/prisma";
export async function GET() { try { await requirePermission("sms:send"); const messages = await getPrisma().message.findMany({ where: { channel: "WHATSAPP" }, include: { donation: { include: { donor: true } } }, orderBy: { createdAt: "desc" }, take: 200 }); return Response.json({ provider: process.env.WHATSAPP_ACCESS_TOKEN ? "Meta" : "Yapılandırılmadı", messages: messages.map((item) => ({ ...item, phone: item.recipient, message: item.renderedBody, donor: item.donation ? { name: `${item.donation.donor.firstName} ${item.donation.donor.lastName}` } : null })) }); } catch (error) { return apiError(error); } }
