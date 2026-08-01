"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Bird, ChevronDown, ChevronUp, MapPin, Search, X } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ErrorState, Skeleton } from "@/components/ui/states";
import { PAYMENT_METHODS, SACRIFICE_KINDS, type SacrificeKind } from "@/lib/constants";
import { formatCurrency, formatDate } from "@/lib/utils";
import { formatPhone } from "@/lib/phone";

type ShareStatus = "EMPTY" | "PENDING" | "FILLED" | "CANCELLED";
type Share = {
  id: string;
  shareNo: number;
  status: ShareStatus;
  paymentStatus: "PENDING" | "PAID" | "CANCELLED";
  paymentMethod: string | null;
  amount: number;
  description: string;
  receiptNo: string;
  createdAt: string | null;
  version: number;
  donor: { firstName: string; lastName: string; phone: string; city: string; district: string } | null;
};
type Sacrifice = {
  id: string;
  number: number;
  region: string;
  kind: SacrificeKind;
  sharePrice: number;
  status: "OPEN" | "COMPLETED" | "CANCELLED";
  shares: Share[];
};

const shareStyles: Record<ShareStatus, string> = {
  EMPTY: "border-slate-200 bg-white text-slate-600 hover:border-emerald-300 hover:bg-emerald-50",
  PENDING: "border-amber-200 bg-amber-50 text-amber-700",
  FILLED: "border-emerald-200 bg-emerald-50 text-emerald-700",
  CANCELLED: "border-red-200 bg-red-50 text-red-700",
};
const statusLabels: Record<ShareStatus, string> = {
  EMPTY: "Boş",
  PENDING: "Bekleyen",
  FILLED: "Dolu",
  CANCELLED: "İptal",
};

export function SacrificeBoard() {
  const [sacrifices, setSacrifices] = useState<Sacrifice[]>([]);
  const [selected, setSelected] = useState<{ sacrifice: Sacrifice; share: Share } | null>(null);
  const [kindFilter, setKindFilter] = useState<"ALL" | SacrificeKind>("ALL");
  const [query, setQuery] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/sacrifices", { cache: "no-store" });
      const data = (await response.json()) as { sacrifices?: Sacrifice[]; message?: string };
      if (!response.ok) throw new Error(data.message);
      setSacrifices(data.sacrifices ?? []);
    } catch {
      setError("Kurban bilgileri yüklenemedi.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    const refresh = () => void load();
    window.addEventListener("sacrifice-donation:created", refresh);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("sacrifice-donation:created", refresh);
    };
  }, [load]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase("tr");
    return sacrifices.filter((item) => {
      if (kindFilter !== "ALL" && item.kind !== kindFilter) return false;
      const kindName = SACRIFICE_KINDS.find((kind) => kind.value === item.kind)?.label ?? item.kind;
      return !needle || `${item.number} ${item.region} ${kindName}`.toLocaleLowerCase("tr").includes(needle);
    });
  }, [kindFilter, query, sacrifices]);

  if (loading) return <Card className="overflow-hidden"><Skeleton className="h-12 w-full rounded-none" />{Array.from({ length: 6 }).map((_, index) => <div key={index} className="flex gap-5 border-t border-slate-100 p-4"><Skeleton className="h-8 w-32" /><Skeleton className="h-8 flex-1" /></div>)}</Card>;
  if (error) return <Card><ErrorState description={error} onRetry={() => void load()} /></Card>;

  return (
    <>
      <div className="mb-4 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setKindFilter("ALL")} className={`rounded-xl px-3 py-2 text-xs font-semibold ${kindFilter === "ALL" ? "bg-[#0b2b3c] text-white" : "bg-slate-50 text-slate-600"}`}>Tümü</button>
          {SACRIFICE_KINDS.map((kind) => <button key={kind.value} onClick={() => setKindFilter(kind.value)} className={`rounded-xl px-3 py-2 text-xs font-semibold ${kindFilter === kind.value ? "bg-[#0b2b3c] text-white" : "bg-slate-50 text-slate-600"}`}>{kind.label}</button>)}
        </div>
        <div className="relative w-full lg:w-72">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <Input value={query} onChange={(event) => setQuery(event.target.value)} className="h-10 pl-9 text-xs" placeholder="Proje veya ülke ara" />
        </div>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[920px] text-left">
            <thead className="bg-[#02b3aa] text-[10px] uppercase tracking-wide text-white">
              <tr>{["Proje", "Kurban grubu", "Ülke / Bölge", "Hisse bedeli", "Dolu", "Boş", "Durum", ""].map((heading) => <th key={heading} className="px-4 py-3 font-semibold">{heading}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((sacrifice) => {
                const filled = sacrifice.shares.filter((share) => share.status === "FILLED").length;
                const empty = sacrifice.shares.filter((share) => share.status === "EMPTY").length;
                const expanded = expandedId === sacrifice.id;
                return [
                  <tr key={sacrifice.id} className="text-xs text-slate-600 hover:bg-emerald-50/30">
                    <td className="px-4 py-3"><span className="flex items-center gap-2 font-bold text-[#0b2b3c]"><span className="grid size-8 place-items-center rounded-lg bg-emerald-50 text-emerald-700"><Bird className="size-4" /></span>{sacrifice.number}. Kurban</span></td>
                    <td className="px-4 py-3 font-semibold">{SACRIFICE_KINDS.find((item) => item.value === sacrifice.kind)?.label}</td>
                    <td className="px-4 py-3"><span className="flex items-center gap-1"><MapPin className="size-3.5 text-slate-400" />{sacrifice.region}</span></td>
                    <td className="px-4 py-3 font-bold text-[#0b2b3c]">{formatCurrency(sacrifice.sharePrice)}</td>
                    <td className="px-4 py-3"><span className="rounded-full bg-emerald-50 px-2.5 py-1 font-bold text-emerald-700">{filled}</span></td>
                    <td className="px-4 py-3"><span className="rounded-full bg-slate-100 px-2.5 py-1 font-bold text-slate-700">{empty}</span></td>
                    <td className="px-4 py-3"><span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${sacrifice.status === "COMPLETED" ? "bg-emerald-50 text-emerald-700" : "bg-sky-50 text-sky-700"}`}>{sacrifice.status === "COMPLETED" ? "Tamamlandı" : "Hisseye açık"}</span></td>
                    <td className="px-4 py-3 text-right"><button type="button" onClick={() => setExpandedId(expanded ? null : sacrifice.id)} className="inline-flex items-center gap-1 rounded-lg px-2.5 py-2 font-semibold text-emerald-700 hover:bg-emerald-50">Hisseler {expanded ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}</button></td>
                  </tr>,
                  expanded ? <tr key={`${sacrifice.id}-shares`}><td colSpan={8} className="bg-slate-50/70 px-5 py-4"><div className="flex flex-wrap gap-2">{sacrifice.shares.map((share) => share.status === "FILLED" && share.donor ? <button type="button" key={share.id} onClick={() => setSelected({ sacrifice, share })} className={`min-w-32 rounded-lg border px-3 py-2 text-xs font-bold transition hover:-translate-y-0.5 hover:shadow-sm ${shareStyles.FILLED}`}>{share.donor.firstName} {share.donor.lastName}</button> : <span key={share.id} className={`min-w-24 rounded-lg border px-3 py-2 text-center text-xs font-bold ${shareStyles[share.status]}`}>{share.shareNo}. Hisse · {statusLabels[share.status]}</span>)}</div></td></tr> : null,
                ];
              })}
              {!filtered.length && <tr><td colSpan={8} className="p-12 text-center text-sm text-slate-500">Aramaya uygun kurban projesi bulunamadı.</td></tr>}
            </tbody>
          </table>
        </div>
        <div className="border-t border-slate-100 px-5 py-3 text-[11px] text-slate-500">Gösterilen proje: {filtered.length} / {sacrifices.length}</div>
      </Card>
      {selected && <FilledShareModal selected={selected} onClose={() => setSelected(null)} />}
    </>
  );
}

function FilledShareModal({ selected, onClose }: { selected: { sacrifice: Sacrifice; share: Share }; onClose: () => void }) {
  const { sacrifice, share } = selected;
  const donor = share.donor;
  const paymentMethod = PAYMENT_METHODS.find((item) => item.value === share.paymentMethod)?.label ?? share.paymentMethod ?? "Belirtilmedi";
  const paymentStatus = share.paymentStatus === "PAID" ? "Ödendi" : share.paymentStatus === "PENDING" ? "Bekliyor" : "İptal";
  const details = [
    ["Bağışçı", donor ? `${donor.firstName} ${donor.lastName}` : "Belirtilmedi"],
    ["Telefon", donor ? formatPhone(donor.phone) : "Belirtilmedi"],
    ["İl / İlçe", donor ? [donor.city, donor.district].filter(Boolean).join(" / ") || "Belirtilmedi" : "Belirtilmedi"],
    ["Hisse tutarı", formatCurrency(share.amount)],
    ["Ödeme yöntemi", paymentMethod],
    ["Ödeme durumu", paymentStatus],
    ["Makbuz no", share.receiptNo || "Belirtilmedi"],
    ["Kayıt tarihi", share.createdAt ? formatDate(share.createdAt) : "Belirtilmedi"],
  ];
  return <div className="fixed inset-0 z-[70] grid place-items-center bg-slate-950/40 p-4 backdrop-blur-sm" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><Card className="w-full max-w-xl overflow-hidden"><div className="flex items-start justify-between bg-[#02b3aa] px-6 py-5 text-white"><div><p className="text-[10px] font-bold uppercase tracking-[0.14em] text-emerald-100">{SACRIFICE_KINDS.find((item) => item.value === sacrifice.kind)?.label}</p><h2 className="mt-1 text-lg font-bold">{sacrifice.number}. Kurban · {share.shareNo}. Hisse</h2><p className="mt-1 text-xs text-emerald-50/80">{sacrifice.region} · Dolu hisse bilgileri</p></div><button type="button" onClick={onClose} className="rounded-lg p-2 text-white/80 hover:bg-white/10 hover:text-white"><X className="size-5" /></button></div><div className="grid gap-3 p-6 sm:grid-cols-2">{details.map(([label, value]) => <div key={label} className="rounded-xl border border-slate-100 bg-slate-50 p-3"><p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">{label}</p><p className="mt-1 text-sm font-semibold text-slate-800">{value}</p></div>)}{share.description && <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 sm:col-span-2"><p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Açıklama</p><p className="mt-1 text-sm leading-6 text-slate-700">{share.description}</p></div>}</div></Card></div>;
}
