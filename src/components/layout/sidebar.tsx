"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { ChevronDown, ChevronLeft, ChevronRight, LogOut, X } from "lucide-react";
import { APP_NAME, NAV_ITEMS, type UserRole } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { useLocalAuth } from "@/lib/local-auth";
import { REPORT_SECTIONS } from "@/lib/report-sections";

type SidebarProps = {
  open: boolean;
  onClose: () => void;
  collapsed: boolean;
  onCollapse: () => void;
  role?: UserRole;
};

export function Sidebar({ open, onClose, collapsed, onCollapse, role = "ADMIN" }: SidebarProps) {
  const { logout } = useLocalAuth();
  const pathname = usePathname();
  const visibleItems = NAV_ITEMS.filter((item) => (item.roles as readonly UserRole[]).includes(role));
  const sacrificeItems = [
    { label: "Kurban Bağış", href: "/kurbanlar/bagis" },
    { label: "Bağış Çek", href: "/kurbanlar" },
    { label: "Kurban Sorgu", href: "/kurbanlar/sorgu" },
    { label: "Kurban Proje Planla", href: "/kurbanlar/proje-planlama" },
    { label: "Bağış Çek İçin Kullanıcı İl-Ekle", href: "/kurbanlar/cek-yetkileri" },
  ];
  const posterItems = [
    { label: "Yatay Afiş", href: "/afisler/yatay" },
    { label: "Dikey Afiş", href: "/afisler/dikey" },
    { label: "Dernek ve Logo Ayarları", href: "/afisler/dernekler", adminOnly: true },
    { label: "Kaydedilen Afişler", href: "/afisler/kaydedilenler" },
  ];
  const reportItems = REPORT_SECTIONS.map((item) => ({
    label: item.label,
    href: `/raporlar/${item.slug}`,
  }));

  return (
    <>
      {open && (
        <button
          aria-label="Menüyü kapat"
          className="fixed inset-0 z-40 bg-slate-950/35 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-[276px] flex-col bg-[#082839] px-3 py-5 text-white shadow-2xl shadow-slate-950/20 transition-[transform,width] duration-200 lg:static lg:z-auto lg:translate-x-0 lg:shadow-none",
          collapsed ? "lg:w-[88px]" : "lg:w-[252px]",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className={cn("mb-8 flex h-14 items-center justify-between px-2", collapsed && "lg:justify-center lg:px-0")}>
          <Link href="/" className={cn("flex h-14 items-center overflow-hidden rounded-xl bg-white shadow-lg shadow-black/20", collapsed ? "w-14" : "w-[205px]")} onClick={onClose} title={APP_NAME}>
            <Image src="/yedirenk-logo.png" alt="Yedirenk Derneği logosu" width={205} height={80} className={cn("h-full w-full", collapsed ? "object-cover object-left" : "object-contain")} priority />
          </Link>
          <button className="rounded-lg p-2 text-slate-300 lg:hidden" onClick={onClose}>
            <X className="size-5" />
          </button>
        </div>

        <nav className="min-h-0 flex-1 space-y-1 overflow-y-auto pr-1 [scrollbar-color:rgba(110,231,183,0.45)_transparent] [scrollbar-width:thin]">
          {visibleItems.map((item) => {
            const active =
              item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);

            if (item.label === "Kurban") {
              const sacrificeActive =
                pathname.startsWith("/kurbanlar");

              return (
                <div
                  key={item.href}
                  className={cn(
                    "overflow-hidden rounded-xl transition-colors",
                    sacrificeActive && "bg-[#02b3aa]",
                  )}
                >
                  <Link
                    href={item.href}
                    onClick={onClose}
                    className={cn(
                      "group relative flex h-11 items-center gap-3 px-3 text-sm font-semibold text-slate-300 transition-colors hover:bg-white/8 hover:text-white",
                      collapsed && "lg:justify-center lg:px-0",
                      sacrificeActive && "text-white",
                    )}
                    title={collapsed ? item.label : undefined}
                  >
                    <item.icon className={cn("size-[19px]", sacrificeActive && "text-emerald-200")} />
                    <span className={cn("whitespace-nowrap", collapsed && "lg:hidden")}>{item.label}</span>
                    <ChevronDown className={cn("ml-auto size-4 text-emerald-100", collapsed && "lg:hidden")} />
                  </Link>

                  <div className={cn("border-t border-white/10 py-1.5", collapsed && "lg:hidden")}>
                    {sacrificeItems.map((child) => {
                      const childActive =
                        child.href === "/kurbanlar"
                          ? pathname === "/kurbanlar"
                          : pathname.startsWith(child.href);

                      return (
                        <Link
                          key={child.label}
                          href={child.href}
                          onClick={onClose}
                          className={cn(
                            "relative flex min-h-9 items-center py-2 pl-10 pr-3 text-[12px] font-medium leading-4 text-emerald-50/85 transition-colors hover:bg-white/10 hover:text-white",
                            childActive && "bg-white/12 text-white",
                          )}
                        >
                          <span className="absolute left-5 text-base leading-none text-emerald-200">›</span>
                          {child.label}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              );
            }

            if (item.href === "/afisler/yatay") {
              const posterActive = pathname.startsWith("/afisler");
              return <div key={item.href} className={cn("overflow-hidden rounded-xl transition-colors", posterActive && "bg-[#02b3aa]")}><Link href={item.href} onClick={onClose} className={cn("flex h-11 items-center gap-3 px-3 text-sm font-semibold text-slate-300 hover:bg-white/8 hover:text-white", collapsed && "lg:justify-center lg:px-0", posterActive && "text-white")}><item.icon className="size-[19px]" /><span className={cn("whitespace-nowrap", collapsed && "lg:hidden")}>{item.label}</span><ChevronDown className={cn("ml-auto size-4", collapsed && "lg:hidden")} /></Link><div className={cn("border-t border-white/10 py-1.5", collapsed && "lg:hidden")}>{posterItems.filter((child) => !child.adminOnly || role === "ADMIN").map((child) => <Link key={child.href} href={child.href} onClick={onClose} className={cn("relative flex min-h-9 items-center py-2 pl-10 pr-3 text-[12px] font-medium text-emerald-50/85 hover:bg-white/10 hover:text-white", pathname === child.href && "bg-white/12 text-white")}><span className="absolute left-5 text-base text-emerald-200">›</span>{child.label}</Link>)}</div></div>;
            }

            if (item.href === "/raporlar") {
              const reportsActive = pathname.startsWith("/raporlar");
              return (
                <div key={item.href} className={cn("overflow-hidden rounded-xl transition-colors", reportsActive && "bg-[#02b3aa]")}>
                  <Link href="/raporlar/bagis-sonuc-raporu" onClick={onClose} className={cn("flex h-11 items-center gap-3 px-3 text-sm font-semibold text-slate-300 hover:bg-white/8 hover:text-white", collapsed && "lg:justify-center lg:px-0", reportsActive && "text-white")}>
                    <item.icon className="size-[19px]" />
                    <span className={cn("whitespace-nowrap", collapsed && "lg:hidden")}>{item.label}</span>
                    <ChevronDown className={cn("ml-auto size-4", collapsed && "lg:hidden")} />
                  </Link>
                  <div className={cn("border-t border-white/10 py-1.5", collapsed && "lg:hidden")}>
                    {reportItems.map((child) => (
                      <Link aria-label={child.label} key={child.href} href={child.href} onClick={onClose} className={cn("relative flex min-h-9 items-center py-2 pl-10 pr-3 text-[12px] font-medium leading-4 text-emerald-50/85 hover:bg-white/10 hover:text-white", pathname === child.href && "bg-white/12 text-white")}>
                        <span className="absolute left-5 text-base text-emerald-200">›</span>
                        {child.label}
                      </Link>
                    ))}
                  </div>
                </div>
              );
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  "group relative flex h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium text-slate-300 transition-colors hover:bg-white/8 hover:text-white",
                  collapsed && "lg:justify-center lg:px-0",
                  active && "bg-white/11 text-white",
                )}
                title={collapsed ? item.label : undefined}
              >
                <item.icon className={cn("size-[19px]", active && "text-emerald-400")} />
                <span className={cn("whitespace-nowrap", collapsed && "lg:hidden")}>{item.label}</span>
                {active && <span className="absolute right-0 h-5 w-0.5 rounded-l-full bg-emerald-400" />}
              </Link>
            );
          })}
        </nav>

        <div className={cn("rounded-2xl bg-white/6 p-3", collapsed && "lg:hidden")}>
          <p className="text-xs font-semibold text-white">Yardım mı gerekiyor?</p>
          <p className="mt-1 text-[11px] leading-4 text-slate-400">
            Destek ekibimiz iş günlerinde yanınızda.
          </p>
          <button onClick={logout} className="mt-3 flex items-center gap-2 text-xs font-semibold text-slate-300 hover:text-white">
            <LogOut className="size-4" /> Güvenli çıkış
          </button>
        </div>
        <button
          onClick={onCollapse}
          className="mt-3 hidden h-10 items-center justify-center gap-2 rounded-xl text-xs font-semibold text-slate-400 hover:bg-white/8 hover:text-white lg:flex"
          aria-label={collapsed ? "Menüyü genişlet" : "Menüyü daralt"}
        >
          {collapsed ? <ChevronRight className="size-4" /> : <><ChevronLeft className="size-4" /><span>Menüyü daralt</span></>}
        </button>
      </aside>
    </>
  );
}
