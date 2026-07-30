import { redirect } from "next/navigation";
import { currentUser } from "@/lib/server/auth";
import { hasPermission } from "@/lib/permissions";

export default async function AssociationLayout({ children }: { children: React.ReactNode }) {
  const user = await currentUser();
  if (!user || !hasPermission(user.role, "association:manage")) redirect("/yetkisiz");
  return children;
}
