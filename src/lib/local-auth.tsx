"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { UserRole } from "@/lib/constants";

type LocalUser = { id: string; name: string; email: string; role: UserRole };
type AuthContextValue = {
  user: LocalUser | null;
  ready: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);
const SESSION_KEY = "vefa-local-session";

export function LocalAuthProvider({ children }: { children: React.ReactNode }) {
  const localMode = process.env.NEXT_PUBLIC_USE_LOCAL_API === "true";
  const [ready, setReady] = useState(localMode);
  const [user, setUser] = useState<LocalUser | null>(() => {
    if (typeof window === "undefined" || !localMode) return null;
    const saved = sessionStorage.getItem(SESSION_KEY);
    return saved ? JSON.parse(saved) as LocalUser : null;
  });
  useEffect(() => {
    if (localMode) return;
    const controller = new AbortController();
    void fetch("/api/auth/me", { signal: controller.signal })
      .then((response) => response.json())
      .then((data: { user?: LocalUser | null }) => setUser(data.user ?? null))
      .catch((error: unknown) => {
        if (!(error instanceof DOMException && error.name === "AbortError")) setUser(null);
      })
      .finally(() => setReady(true));
    return () => controller.abort();
  }, [localMode]);

  async function login(email: string, password: string) {
    if (localMode) {
      const users = JSON.parse(localStorage.getItem("vefa-browser-data-v2") ?? "{}") as { users?: Array<LocalUser & { password: string; isActive: boolean }> };
      const match = users.users?.find((item) => item.email.toLowerCase() === email.toLowerCase() && item.password === password && item.isActive)
        ?? (email.toLowerCase() === "yasir@gmail" && password === "12345678" ? { id: "admin", name: "Yasir", email, role: "ADMIN" as const } : null);
      if (!match) return false;
      const session = { id: match.id, name: match.name, email: match.email, role: match.role };
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
      setUser(session);
      return true;
    }
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    if (!response.ok) return false;
    const data = (await response.json()) as { user: LocalUser };
    setUser(data.user);
    return true;
  }
  async function logout() {
    if (localMode) sessionStorage.removeItem(SESSION_KEY);
    else await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    window.location.href = "/giris";
  }
  return <AuthContext.Provider value={{ user, ready, login, logout }}>{children}</AuthContext.Provider>;
}

export function useLocalAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("Yerel oturum sağlayıcısı bulunamadı.");
  return value;
}
