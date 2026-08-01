import { randomBytes } from "node:crypto";
import { z } from "zod";
import { apiError } from "@/lib/server/api";
import { getPrisma } from "@/lib/server/prisma";
import { normalizePhone } from "@/lib/phone";

const schema = z.object({
  firstName: z.string().trim().min(2).max(80), lastName: z.string().trim().min(1).max(80),
  phone: z.string().trim().min(7).max(30), email: z.email().max(160), amount: z.coerce.number().positive().max(1_000_000),
  campaign: z.string().trim().min(2).max(300), city: z.string().trim().min(2).max(80), district: z.string().trim().max(80).optional(),
  consent: z.literal(true), website: z.string().max(0).optional(),
});
const corsHeaders = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type" };

export function OPTIONS() { return new Response(null, { status: 204, headers: corsHeaders }); }

export async function POST(request: Request) {
  try {
    const input = schema.parse(await request.json());
    const externalReference = `WEB-${Date.now()}-${randomBytes(2).toString("hex").toUpperCase()}`;
    const submission = await getPrisma().onlineDonationSubmission.create({ data: {
      externalReference, firstName: input.firstName, lastName: input.lastName, phone: normalizePhone(input.phone), email: input.email,
      originCity: input.city, originDistrict: input.district || "Merkez", campaign: input.campaign, amount: input.amount,
    } });
    return Response.json({ success: true, referenceNumber: submission.externalReference, receiptNumber: submission.externalReference, message: "Demo ödemeniz alındı ve onaya gönderildi." }, { status: 201, headers: corsHeaders });
  } catch (error) {
    const response = apiError(error); const headers = new Headers(response.headers);
    Object.entries(corsHeaders).forEach(([key, value]) => headers.set(key, value));
    return new Response(response.body, { status: response.status, headers });
  }
}
