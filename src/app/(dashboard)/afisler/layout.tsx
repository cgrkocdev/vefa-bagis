import { redirect } from "next/navigation";
import { currentUser } from "@/lib/server/auth";
import { hasPermission } from "@/lib/permissions";

export default async function PostersLayout({ children }: { children: React.ReactNode }) {
  const user = await currentUser();
  if (!user) redirect("/giris");
  if (!hasPermission(user.role, "poster:view")) redirect("/yetkisiz");
  return children;
}
