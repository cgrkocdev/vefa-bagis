import Link from "next/link";
import { Bird, Globe2, HeartHandshake, Plus } from "lucide-react";
import { DashboardOverview } from "@/components/dashboard/dashboard-overview";
import { DashboardStats } from "@/components/dashboard/dashboard-stats";
import { Card } from "@/components/ui/card";

const actions = [
  { title: "Kurban", description: "Kurban hissesi ve vekâlet kaydı", icon: Bird, href: "/kurbanlar/bagis?yeni=1", action: "Bağış Ekle", tone: "bg-amber-50 text-amber-700" },
  { title: "Genel Bağış", description: "Genel amaçlı destek kaydı", icon: HeartHandshake, href: "/bagislar/yeni?yeni=1&tur=GENEL_BAGIS", action: "Bağış Ekle", tone: "bg-emerald-50 text-emerald-700" },
  { title: "Online Bağış", description: "Web sitesinden tamamlanan ödemeler", icon: Globe2, href: "/online-bagislar", action: "Gelen Bağışlar", tone: "bg-sky-50 text-sky-700" },
];

export default function DashboardPage() {
  return (
    <div className="mx-auto max-w-[1480px]">
      <div className="mb-6">
        <p className="text-sm font-semibold text-emerald-700">Hızlı işlemler</p>
        <h2 className="mt-1 text-2xl font-bold tracking-tight text-[#0b2b3c]">Bağış türünü seçerek başlayın</h2>
        <p className="mt-1 text-sm text-slate-500">Yeni bağış kaydını tek adımda açın.</p>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {actions.map((action) => (
          <Link key={action.title} href={action.href} className="group">
            <Card className="flex h-full min-h-48 flex-col p-5 transition-[transform,box-shadow,border-color] duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-lg hover:shadow-slate-950/5">
              <span className={`grid size-12 place-items-center rounded-2xl ${action.tone}`}><action.icon className="size-[22px]" /></span>
              <h3 className="mt-5 text-base font-bold text-[#0b2b3c]">{action.title}</h3>
              <p className="mt-1 min-h-9 text-xs leading-5 text-slate-500">{action.description}</p>
              <span className="mt-auto inline-flex items-center gap-1.5 pt-4 text-xs font-bold text-emerald-700"><Plus className="size-3.5" /> {action.action}</span>
            </Card>
          </Link>
        ))}
      </section>

      <section className="mt-7">
        <div className="mb-4"><h2 className="text-base font-bold text-[#0b2b3c]">Genel görünüm</h2><p className="mt-1 text-xs text-slate-500">Güncel bağış özetiniz</p></div>
        <DashboardStats />
      </section>

      <section className="mt-7">
        <DashboardOverview />
      </section>
    </div>
  );
}
