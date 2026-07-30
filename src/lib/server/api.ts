import "server-only";
import { ZodError } from "zod";
import { ApiError } from "@/lib/server/auth";

export function apiError(error: unknown) {
  if (error instanceof ApiError) {
    return Response.json({ message: error.message }, { status: error.status });
  }
  if (error instanceof ZodError) {
    return Response.json(
      { message: "Gönderilen bilgiler geçersiz.", errors: error.flatten().fieldErrors },
      { status: 422 },
    );
  }
  console.error(error);
  return Response.json({ message: "İşlem sırasında beklenmeyen bir hata oluştu." }, { status: 500 });
}
