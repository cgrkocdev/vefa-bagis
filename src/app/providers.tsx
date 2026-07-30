"use client";

import { LocalAuthProvider } from "@/lib/local-auth";
import { installLocalApi } from "@/lib/local-api";

export function Providers({ children }: { children: React.ReactNode }) {
  if (process.env.NEXT_PUBLIC_USE_LOCAL_API === "true") installLocalApi();
  return <LocalAuthProvider>{children}</LocalAuthProvider>;
}
