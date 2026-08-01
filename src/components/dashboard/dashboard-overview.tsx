"use client";

import { useEffect, useState } from "react";
import { Activity, ChartNoAxesCombined, CircleDollarSign, ReceiptText, TrendingUp, UsersRound } from "lucide-react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/states";
import { DONATION_CHANNEL } from "@/lib/realtime";
import { formatCurrency } from "@/lib/utils";

type DistributionItem = { name: string; amount: number; count: number };
type Overview = {
  trend: Array<{ label: string; amount: number; count: number }>;
  types: DistributionItem[];
  payments: DistributionItem[];
  summary: { total: number; count: number; uniqueDonors: number; average: number; peakDay: string; peakAmount: number };
};

const colors = ["#02b3aa", "#02b3aa", "#0284c7", "#f59e0b", "#8b5cf6", "#e11d48"];

export function DashboardOverview() {
  const [overview, setOverview] = useState<Overview | null>(null);

  useEffect(() => {
    const load = () => fetch("/api/dashboard", { cache: "no-store" }).then(async (response) => {
      if (!response.ok) return;
      const data = (await response.json()) as { overview: Overview };
      setOverview(data.overview);
    });
    void load();
    if (!("BroadcastChannel" in window)) return;
    const channel = new BroadcastChannel(DONATION_CHANNEL);
    channel.onmessage = () => void load();
    return () => channel.close();
  }, []);

  if (!overview) {
    return <div className="space-y-5"><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-24 w-full" />)}</div><div className="grid gap-5 xl:grid-cols-[1.45fr_1fr]"><Skeleton className="h-[420px] w-full" /><Skeleton className="h-[420px] w-full" /></div></div>;
  }

  const summaryItems = [
    { label: "7 Günlük Toplam", value: formatCurrency(overview.summary.total), note: `${overview.summary.count.toLocaleString("tr-TR")} bağış kaydı`, icon: ReceiptText },
    { label: "Ulaşılan Bağışçı", value: overview.summary.uniqueDonors.toLocaleString("tr-TR"), note: "Tekil bağışçı sayısı", icon: UsersRound },
    { label: "Ortalama Bağış", value: formatCurrency(overview.summary.average), note: "Kayıt başına ortalama", icon: CircleDollarSign },
    { label: "En Yüksek Gün", value: overview.summary.peakDay, note: formatCurrency(overview.summary.peakAmount), icon: TrendingUp },
  ];

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {summaryItems.map((item) => <Card key={item.label} className="flex items-center gap-4 p-4"><span className="grid size-10 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-700"><item.icon className="size-[18px]" /></span><div className="min-w-0"><p className="text-[11px] font-semibold text-slate-500">{item.label}</p><p className="mt-1 truncate text-lg font-bold text-[#0b2b3c]">{item.value}</p><p className="mt-0.5 truncate text-[10px] text-slate-400">{item.note}</p></div></Card>)}
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.45fr_1fr]">
        <Card className="overflow-hidden p-5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div><p className="flex items-center gap-2 text-sm font-bold text-[#0b2b3c]"><Activity className="size-4 text-emerald-600" /> Son 7 Günlük Bağış Hareketi</p><p className="mt-1 text-xs text-slate-500">Günlük tamamlanan bağış tutarları</p></div>
            <div className="text-right"><p className="text-lg font-bold text-emerald-700">{formatCurrency(overview.summary.total)}</p><p className="text-[10px] text-slate-400">{overview.summary.count.toLocaleString("tr-TR")} bağış kaydı</p></div>
          </div>
          <div className="mt-5 h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={overview.trend} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                <defs><linearGradient id="dashboardDonationGradient" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#02b3aa" stopOpacity={0.3} /><stop offset="95%" stopColor="#02b3aa" stopOpacity={0} /></linearGradient></defs>
                <CartesianGrid stroke="#e8efed" strokeDasharray="4 4" vertical={false} />
                <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 11 }} dy={8} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 10 }} tickFormatter={(value: number) => value >= 1000 ? `${Math.round(value / 1000)}B` : String(value)} />
                <Tooltip contentStyle={{ border: 0, borderRadius: 14, boxShadow: "0 12px 35px #0f172a18", fontSize: 12 }} formatter={(value) => [formatCurrency(Number(value)), "Bağış"]} />
                <Area type="monotone" dataKey="amount" stroke="#02b3aa" strokeWidth={3} fill="url(#dashboardDonationGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="overflow-hidden p-5 sm:p-6">
          <div><p className="flex items-center gap-2 text-sm font-bold text-[#0b2b3c]"><ChartNoAxesCombined className="size-4 text-emerald-600" /> Bağış Türü Dağılımı</p><p className="mt-1 text-xs text-slate-500">Son 7 günlük toplam tutara göre</p></div>
          {overview.types.length ? <div className="mt-3 grid items-center gap-2 sm:grid-cols-[165px_1fr] xl:grid-cols-1 2xl:grid-cols-[165px_1fr]">
            <div className="mx-auto h-[170px] w-[170px]"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={overview.types} dataKey="amount" nameKey="name" innerRadius={46} outerRadius={70} paddingAngle={3}>{overview.types.map((item, index) => <Cell key={item.name} fill={colors[index % colors.length]} />)}</Pie><Tooltip formatter={(value) => formatCurrency(Number(value))} /></PieChart></ResponsiveContainer></div>
            <DistributionList items={overview.types} />
          </div> : <div className="grid h-48 place-items-center text-sm text-slate-500">Son 7 güne ait bağış kaydı bulunmuyor.</div>}
          {!!overview.payments.length && <div className="mt-4 border-t border-slate-100 pt-4"><p className="text-xs font-bold text-[#0b2b3c]">Ödeme Yöntemleri</p><div className="mt-3 space-y-3">{overview.payments.map((item, index) => { const ratio = overview.summary.total ? Math.round(item.amount / overview.summary.total * 100) : 0; return <div key={item.name}><div className="mb-1 flex items-center justify-between gap-3 text-[11px]"><span className="truncate text-slate-600">{item.name} · {item.count} kayıt</span><strong className="text-slate-700">%{ratio}</strong></div><div className="h-1.5 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full" style={{ width: `${ratio}%`, backgroundColor: colors[index % colors.length] }} /></div></div>; })}</div></div>}
        </Card>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <Card className="overflow-hidden p-5 sm:p-6">
          <div><p className="text-sm font-bold text-[#0b2b3c]">Günlük Bağış Adedi</p><p className="mt-1 text-xs text-slate-500">Son 7 günde tamamlanan kayıt sayısı</p></div>
          <div className="mt-5 h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={overview.trend} margin={{ top: 8, right: 8, left: -24, bottom: 0 }}>
                <CartesianGrid stroke="#e8efed" strokeDasharray="4 4" vertical={false} />
                <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 11 }} dy={8} />
                <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 10 }} />
                <Tooltip cursor={{ fill: "#ecfdf5" }} contentStyle={{ border: 0, borderRadius: 14, boxShadow: "0 12px 35px #0f172a18", fontSize: 12 }} formatter={(value) => [`${Number(value).toLocaleString("tr-TR")} kayıt`, "Bağış adedi"]} />
                <Bar dataKey="count" fill="#02b3aa" radius={[8, 8, 2, 2]} maxBarSize={48} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="overflow-hidden p-5 sm:p-6">
          <div><p className="text-sm font-bold text-[#0b2b3c]">Ödeme Yöntemi Dağılım Grafiği</p><p className="mt-1 text-xs text-slate-500">Son 7 günlük tahsilat tutarına göre</p></div>
          {overview.payments.length ? <div className="mt-5 h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={overview.payments} layout="vertical" margin={{ top: 0, right: 22, left: 24, bottom: 0 }}>
                <CartesianGrid stroke="#e8efed" strokeDasharray="4 4" horizontal={false} />
                <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 10 }} tickFormatter={(value: number) => value >= 1000 ? `${Math.round(value / 1000)}B` : String(value)} />
                <YAxis type="category" dataKey="name" width={105} axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 10 }} />
                <Tooltip cursor={{ fill: "#f0fdfa" }} contentStyle={{ border: 0, borderRadius: 14, boxShadow: "0 12px 35px #0f172a18", fontSize: 12 }} formatter={(value) => [formatCurrency(Number(value)), "Tahsilat"]} />
                <Bar dataKey="amount" radius={[0, 8, 8, 0]} maxBarSize={30}>{overview.payments.map((item, index) => <Cell key={item.name} fill={colors[index % colors.length]} />)}</Bar>
              </BarChart>
            </ResponsiveContainer>
          </div> : <div className="grid h-[250px] place-items-center text-sm text-slate-500">Ödeme yöntemi verisi bulunmuyor.</div>}
        </Card>
      </div>
    </div>
  );
}

function DistributionList({ items }: { items: DistributionItem[] }) {
  return <div className="space-y-2.5">{items.map((item, index) => <div key={item.name} className="flex items-center justify-between gap-3 text-xs"><span className="flex min-w-0 items-center gap-2 text-slate-600"><i className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: colors[index % colors.length] }} /><span className="truncate">{item.name} · {item.count}</span></span><span className="shrink-0 font-bold text-[#0b2b3c]">{formatCurrency(item.amount)}</span></div>)}</div>;
}
