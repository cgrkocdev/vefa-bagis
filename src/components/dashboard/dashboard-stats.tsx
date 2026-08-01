"use client";

import { useEffect, useState } from "react";
import { HandCoins, UserCheck, UserRound, WalletCards } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/states";
import { DONATION_CHANNEL } from "@/lib/realtime";
import { formatCurrency } from "@/lib/utils";

type Stats = { today: number; month: number; donors: number; todayDonors: number };

export function DashboardStats() {
  const [stats, setStats] = useState<Stats | null>(null);
  useEffect(() => {
    const loadStats = () => fetch("/api/dashboard", { cache: "no-store" }).then(async (response) => {
      if (!response.ok) return;
      const data = (await response.json()) as { stats: Stats };
      setStats(data.stats);
    });
    void loadStats();
    if (!("BroadcastChannel" in window)) return;
    const channel = new BroadcastChannel(DONATION_CHANNEL);
    channel.onmessage = () => {
      void loadStats();
    };
    return () => channel.close();
  }, []);
  if (!stats) return <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{Array.from({ length: 4 }).map((_, i) => <Card key={i} className="flex items-center gap-4 p-5"><Skeleton className="size-11 shrink-0" /><div className="flex-1"><Skeleton className="h-3 w-20" /><Skeleton className="mt-3 h-6 w-28" /></div></Card>)}</div>;
  const items = [
    { label: "Bugünkü Bağış", value: formatCurrency(stats.today), description: "Bugün alınan toplam", icon: WalletCards },
    { label: "Bu Ayki Bağış", value: formatCurrency(stats.month), description: "Bu ay alınan toplam", icon: HandCoins },
    { label: "Toplam Bağışçı", value: stats.donors.toLocaleString("tr-TR"), description: "Kayıtlı bağışçı", icon: UserRound },
    { label: "Bugün Ulaşılan Bağışçı", value: stats.todayDonors.toLocaleString("tr-TR"), description: "Bugün bağış kaydı alınan kişi", icon: UserCheck },
  ];
  return <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{items.map((item) => <Card key={item.label} className="flex items-center gap-4 p-5"><span className="grid size-11 shrink-0 place-items-center rounded-xl bg-slate-50 text-[#0b2b3c]"><item.icon className="size-5" /></span><div className="min-w-0"><p className="text-xs font-medium text-slate-500">{item.label}</p><p className="mt-1 truncate text-xl font-bold tracking-tight text-[#0b2b3c]">{item.value}</p><p className="mt-1 truncate text-[10px] text-slate-400">{item.description}</p></div></Card>)}</div>;
}
