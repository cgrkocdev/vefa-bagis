"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Bird, Check, ChevronDown, ChevronUp, LoaderCircle, MapPin, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ErrorState, Skeleton } from "@/components/ui/states";
import { PAYMENT_METHODS, SACRIFICE_KINDS, type SacrificeKind } from "@/lib/constants";
import { formatCurrency } from "@/lib/utils";

type ShareStatus = "EMPTY" | "PENDING" | "FILLED" | "CANCELLED";
type Share = {
  id: string;
  shareNo: number;
  status: ShareStatus;
  paymentStatus: "PENDING" | "PAID" | "CANCELLED";
  paymentMethod: string | null;
  amount: number;
  version: number;
  donor: { name: string; phone: string } | null;
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
            <thead className="bg-[#0d8f89] text-[10px] uppercase tracking-wide text-white">
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
                  expanded ? <tr key={`${sacrifice.id}-shares`}><td colSpan={8} className="bg-slate-50/70 px-5 py-4"><div className="flex flex-wrap gap-2">{sacrifice.shares.map((share) => <button key={share.id} disabled={share.status !== "EMPTY" || sacrifice.status !== "OPEN"} onClick={() => setSelected({ sacrifice, share })} className={`min-w-24 rounded-lg border px-3 py-2 text-xs font-bold disabled:cursor-default ${shareStyles[share.status]}`}>{share.shareNo}. Hisse · {statusLabels[share.status]}</button>)}</div></td></tr> : null,
                ];
              })}
              {!filtered.length && <tr><td colSpan={8} className="p-12 text-center text-sm text-slate-500">Aramaya uygun kurban projesi bulunamadı.</td></tr>}
            </tbody>
          </table>
        </div>
        <div className="border-t border-slate-100 px-5 py-3 text-[11px] text-slate-500">Gösterilen proje: {filtered.length} / {sacrifices.length}</div>
      </Card>
      {selected && <ShareModal selected={selected} onClose={() => setSelected(null)} onSaved={async () => { setSelected(null); await load(); }} />}
    </>
  );
}

function ShareModal({ selected, onClose, onSaved }: { selected: { sacrifice: Sacrifice; share: Share }; onClose: () => void; onSaved: () => Promise<void> }) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    const values = new FormData(event.currentTarget);
    const response = await fetch("/api/sacrifices/shares", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sacrificeId: selected.sacrifice.id,
        shareNo: selected.share.shareNo,
        version: selected.share.version,
        donorName: values.get("donorName"),
        phone: values.get("phone"),
        amount: values.get("amount"),
        paymentMethod: values.get("paymentMethod"),
        paymentStatus: values.get("paymentStatus"),
        sendWhatsapp: values.get("sendWhatsapp") === "on",
      }),
    });
    const data = (await response.json()) as { message?: string };
    if (!response.ok) {
      setError(data.message ?? "Hisse kaydedilemedi.");
      setSaving(false);
      return;
    }
    await onSaved();
  }
  return <div className="fixed inset-0 z-[70] grid place-items-center bg-slate-950/40 p-4 backdrop-blur-sm" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><Card className="max-h-[92vh] w-full max-w-lg overflow-auto p-6"><div className="flex items-start justify-between"><div><p className="text-[10px] font-bold uppercase tracking-wide text-emerald-700">{SACRIFICE_KINDS.find((item) => item.value === selected.sacrifice.kind)?.label}</p><h2 className="text-lg font-bold text-[#0b2b3c]">{selected.sacrifice.number}. Kurban · {selected.share.shareNo}. Hisse</h2><p className="mt-1 text-xs text-slate-500">{selected.sacrifice.region} için hisse kaydı</p></div><button onClick={onClose} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"><X className="size-5" /></button></div><form onSubmit={submit} className="mt-6 grid gap-4 sm:grid-cols-2"><label className="sm:col-span-2"><span className="mb-2 block text-xs font-semibold">Bağışçı</span><Input name="donorName" required placeholder="Ad soyad" /></label><label className="sm:col-span-2"><span className="mb-2 block text-xs font-semibold">Telefon</span><Input name="phone" required inputMode="tel" placeholder="05XX XXX XX XX" /></label><label><span className="mb-2 block text-xs font-semibold">Hisse tutarı</span><Input name="amount" required type="number" min="1" defaultValue={selected.sacrifice.sharePrice} /></label><label><span className="mb-2 block text-xs font-semibold">Ödeme yöntemi</span><select name="paymentMethod" className="h-12 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm">{PAYMENT_METHODS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label><label><span className="mb-2 block text-xs font-semibold">Ödeme durumu</span><select name="paymentStatus" className="h-12 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm"><option value="PAID">Ödendi</option><option value="PENDING">Bekliyor</option><option value="CANCELLED">İptal</option></select></label><label className="flex items-end"><span className="flex h-12 w-full items-center gap-2 rounded-xl bg-slate-50 px-3 text-xs font-medium"><input name="sendWhatsapp" type="checkbox" defaultChecked className="accent-emerald-600" /> WhatsApp gönder</span></label>{error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-xs text-red-700 sm:col-span-2">{error}</p>}<div className="flex gap-3 pt-2 sm:col-span-2"><Button type="button" variant="outline" className="flex-1" onClick={onClose}>Vazgeç</Button><Button type="submit" variant="success" className="flex-1" disabled={saving}>{saving ? <LoaderCircle className="size-4 animate-spin" /> : <><Check className="size-4" /> Kaydet</>}</Button></div></form></Card></div>;
}
