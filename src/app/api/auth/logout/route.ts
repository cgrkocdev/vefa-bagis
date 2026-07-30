import { apiError } from "@/lib/server/api";
import { currentUser, destroySession, requestIp } from "@/lib/server/auth";
import { getPrisma } from "@/lib/server/prisma";

export async function POST() {
  try {
    const user = await currentUser();
    await destroySession();
    if (user) {
      await getPrisma().auditLog.create({
        data: { userId: user.id, action: "LOGOUT", entityType: "Session", ipAddress: await requestIp() },
      });
    }
    return Response.json({ success: true });
  } catch (error) {
    return apiError(error);
  }
}
