import { z } from "zod";
import { POST as createDonation } from "@/app/api/donations/route";

const schema = z.object({
  sacrificeId: z.string().min(1), donorName: z.string().min(2), phone: z.string().min(7),
  amount: z.coerce.number().positive(), paymentMethod: z.string().min(1), sendWhatsapp: z.boolean().default(false),
});

export async function POST(request: Request) {
  const input = schema.parse(await request.json());
  return createDonation(new Request(new URL("/api/donations", request.url), {
    method: "POST",
    headers: { "Content-Type": "application/json", cookie: request.headers.get("cookie") ?? "" },
    body: JSON.stringify({ ...input, type: "Kurban", description: "", idempotencyKey: crypto.randomUUID() }),
  }));
}
