import { compare } from "bcryptjs";
import { z } from "zod";
import { apiError } from "@/lib/server/api";
import { createSession, requestIp } from "@/lib/server/auth";
import { getPrisma } from "@/lib/server/prisma";

const schema = z.object({
  email: z.string().trim().min(3).max(160).transform((value) => value.toLowerCase()),
  password: z.string().min(8).max(200),
});

export async function POST(request: Request) {
  try {
    const input = schema.parse(await request.json());
    const prisma = getPrisma();
    const user = await prisma.user.findUnique({ where: { email: input.email } });
    if (!user || !user.isActive || user.deletedAt || !(await compare(input.password, user.passwordHash))) {
      return Response.json({ message: "E-posta adresi veya şifre hatalı." }, { status: 401 });
    }
    await createSession(user.id);
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: "LOGIN",
        entityType: "Session",
        ipAddress: await requestIp(),
      },
    });
    return Response.json({ user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  } catch (error) {
    return apiError(error);
  }
}
