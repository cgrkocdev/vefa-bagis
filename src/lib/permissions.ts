import type { UserRole } from "@/lib/constants";

export type Permission =
  | "donation:create"
  | "donation:view"
  | "donation:update"
  | "donation:delete"
  | "sacrifice:manage"
  | "report:view"
  | "sms:send"
  | "user:manage"
  | "settings:manage"
  | "poster:view"
  | "poster:create"
  | "poster:update"
  | "poster:delete"
  | "poster:print"
  | "poster:pdf"
  | "association:manage";

const rolePermissions: Record<UserRole, readonly Permission[]> = {
  ADMIN: [
    "donation:create",
    "donation:view",
    "donation:update",
    "donation:delete",
    "sacrifice:manage",
    "report:view",
    "sms:send",
    "user:manage",
    "settings:manage",
    "poster:view",
    "poster:create",
    "poster:update",
    "poster:delete",
    "poster:print",
    "poster:pdf",
    "association:manage",
  ],
  DONATION_STAFF: ["donation:create", "donation:view", "sacrifice:manage", "sms:send"],
  REPRESENTATIVE: ["donation:create", "donation:view"],
  REPORT_VIEWER: ["donation:view", "report:view"],
  POSTER_USER: ["donation:view", "report:view", "poster:view", "poster:create", "poster:update", "poster:print", "poster:pdf"],
};

export function hasPermission(role: UserRole, permission: Permission) {
  return rolePermissions[role].includes(permission);
}

export const routePermissions: Record<string, Permission> = {
  "/bagislar/yeni": "donation:create",
  "/kurbanlar": "sacrifice:manage",
  "/kurbanlar/bagis": "sacrifice:manage",
  "/kurbanlar/bagis/yeni": "sacrifice:manage",
  "/kurbanlar/sorgu": "donation:view",
  "/kurbanlar/proje-planlama": "sacrifice:manage",
  "/kurbanlar/temsilci-listeleri": "donation:view",
  "/kurbanlar/cek-yetkileri": "user:manage",
  "/bagiscilar": "donation:view",
  "/whatsapp": "sms:send",
  "/raporlar": "report:view",
  "/kullanicilar": "user:manage",
  "/ayarlar": "settings:manage",
  "/afisler": "poster:view",
  "/afisler/yatay": "poster:create",
  "/afisler/dikey": "poster:create",
  "/afisler/dernekler": "association:manage",
  "/afisler/kaydedilenler": "poster:view",
};
