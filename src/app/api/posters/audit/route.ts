import { z } from "zod";
import { apiError } from "@/lib/server/api";
import { requestIp, requirePermission } from "@/lib/server/auth";
import { getPrisma } from "@/lib/server/prisma";

const schema = z.object({ action: z.enum(["POSTER_PRINTED", "POSTER_PDF_CREATED"]), posterId: z.string().nullable().optional(), projectIds: z.array(z.string()).default([]) });
export async function POST(request: Request) {
  try {
    const input = schema.parse(await request.json());
    const user = await requirePermission(input.action === "POSTER_PRINTED" ? "poster:print" : "poster:pdf");
    await getPrisma().auditLog.create({ data: { userId: user.id, action: input.action, entityType: "Poster", entityId: input.posterId, newValue: { projectIds: input.projectIds }, ipAddress: await requestIp() } });
    return Response.json({ success: true });
  } catch (error) { return apiError(error); }
}
