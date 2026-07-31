import {
  BarChart3,
  Bird,
  LayoutDashboard,
  MessageSquareText,
  PanelsTopLeft,
  Settings,
  ShieldCheck,
  UserRound,
  WalletCards,
} from "lucide-react";

export const APP_NAME = "Vefa";

export const USER_ROLES = {
  ADMIN: "Yönetici",
  DONATION_STAFF: "Bağış Personeli",
  REPRESENTATIVE: "Temsilci",
  REPORT_VIEWER: "Rapor Kullanıcısı",
  POSTER_USER: "Afiş / Yazdırma Kullanıcısı",
} as const;

export type UserRole = keyof typeof USER_ROLES;

export const NAV_ITEMS = [
  { label: "Ana Sayfa", href: "/", icon: LayoutDashboard, roles: ["ADMIN", "DONATION_STAFF", "REPORT_VIEWER"] },
  { label: "Genel Bağış", href: "/bagislar/yeni", icon: WalletCards, roles: ["ADMIN", "DONATION_STAFF"] },
  { label: "Kurbanlar", href: "/kurbanlar", icon: Bird, roles: ["ADMIN", "DONATION_STAFF"] },
  { label: "Bağışçılar", href: "/bagiscilar", icon: UserRound, roles: ["ADMIN", "DONATION_STAFF"] },
  { label: "WhatsApp", href: "/whatsapp", icon: MessageSquareText, roles: ["ADMIN", "DONATION_STAFF"] },
  { label: "Raporlar", href: "/raporlar", icon: BarChart3, roles: ["ADMIN", "REPORT_VIEWER"] },
  { label: "Afişler", href: "/afisler/yatay", icon: PanelsTopLeft, roles: ["ADMIN", "POSTER_USER"] },
  { label: "Kullanıcılar", href: "/kullanicilar", icon: ShieldCheck, roles: ["ADMIN"] },
  { label: "Ayarlar", href: "/ayarlar", icon: Settings, roles: ["ADMIN"] },
] satisfies ReadonlyArray<{
  label: string;
  href: string;
  icon: typeof LayoutDashboard;
  roles: UserRole[];
}>;

export const DONATION_TYPES = [
  "Kurban",
  "Zekât",
  "Kur’an",
  "Genel Bağış",
] as const;

export const SACRIFICE_KINDS = [
  { value: "VACIP", label: "Vacip Kurban" },
  { value: "ADAK", label: "Adak Kurban" },
  { value: "AKIKA", label: "Akika Kurban" },
] as const;

export type SacrificeKind = (typeof SACRIFICE_KINDS)[number]["value"];

export const PAYMENT_METHODS = [
  { value: "CASH", label: "Nakit" },
  { value: "BANK_TRANSFER", label: "Havale / EFT" },
  { value: "CREDIT_CARD", label: "Kredi Kartı" },
  { value: "OTHER", label: "Diğer" },
] as const;
