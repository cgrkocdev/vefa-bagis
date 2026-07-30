import { hash } from "bcryptjs";
import { z } from "zod";
import { apiError } from "@/lib/server/api";
import { requestIp, requirePermission } from "@/lib/server/auth";
import { getPrisma } from "@/lib/server/prisma";

const inputSchema = z.object({ name: z.string().trim().min(2), email: z.email().trim().toLowerCase(), password: z.string().min(8), role: z.enum(["ADMIN", "DONATION_STAFF", "REPRESENTATIVE", "REPORT_VIEWER", "POSTER_USER"]) });
export async function GET() { try { await requirePermission("user:manage"); const users = await getPrisma().user.findMany({ where: { deletedAt: null }, orderBy: { createdAt: "desc" } }); return Response.json({ users: users.map((user) => ({ id: user.id, name: user.name, email: user.email, role: user.role, roleCode: user.role, isActive: user.isActive, createdAt: user.createdAt })) }); } catch (error) { return apiError(error); } }
export async function POST(request: Request) { try { const actor = await requirePermission("user:manage"); const input = inputSchema.parse(await request.json()); const prisma = getPrisma(); const user = await prisma.user.create({ data: { name: input.name, email: input.email, passwordHash: await hash(input.password, 12), role: input.role } }); await prisma.auditLog.create({ data: { userId: actor.id, action: "USER_CREATED", entityType: "User", entityId: user.id, newValue: { name: user.name, email: user.email, role: user.role }, ipAddress: await requestIp() } }); return Response.json({ user: { ...user, passwordHash: undefined, roleCode: user.role } }, { status: 201 }); } catch (error) { return apiError(error); } }
