"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Bird, LoaderCircle, MapPin, Search, UsersRound } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { SACRIFICE_KINDS, type SacrificeKind } from "@/lib/constants";
import { formatCurrency } from "@/lib/utils";

type Sacrifice = {
  id: string;
  number: number;
  region: string;
  kind: SacrificeKind;
  status: string;
  shares: Array<{
    id: string;
    shareNo: number;
    status: string;
    amount: number;
    donor: { name: string; phone: string } | null;
  }>;
};

type RegistryRow = {
  id: string;
  projectNo: number;
  shareNo: number;
  donorName: string;
  phone: string;
  kind: SacrificeKind;
  region: string;
  amount: number;
  status: string;
};

export function SacrificeRegistry({ mode }: { mode: "query" | "representative" }) {
  const [items, setItems] = useState<Sacrifice[]>([]);
  const [query, setQuery] = useState("");
  const [kind, setKind] = useState("");
  const [region, setRegion] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setError("");
    try {
      const response = await fetch("/api/sacrifices", { cache: "no-store" });
      const data = (await response.json()) as { sacrifices?: Sacrifice[]; message?: string };
      if (!response.ok) throw new Error(data.message);
      setItems(data.sacrifices ?? []);
    } catch {
      setError("Kurban kayıtları yüklenemedi.");
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

  const rows = useMemo<RegistryRow[]>(
    () => items.flatMap((project) => project.shares.filter((share) => share.donor).map((share) => ({
      id: share.id,
      projectNo: project.number,
      shareNo: share.shareNo,
      donorName: share.donor?.name ?? "",
      phone: share.donor?.phone ?? "",
      kind: project.kind,
      region: project.region,
      amount: share.amount,
      status: share.status,
    }))),
    [items],
  );
  const regions = useMemo(() => [...new Set(items.map((item) => item.region))].sort((a, b) => a.localeCompare(b, "tr")), [items]);
  const filtered = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase("tr");
    return rows.filter((row) =>
      (!kind || row.kind === kind) &&
      (!region || row.region === region) &&
      (!needle || `${row.donorName} ${row.phone} ${row.projectNo} ${row.shareNo} ${row.region}`.toLocaleLowerCase("tr").includes(needle)),
    );
  }, [kind, query, region, rows]);
  const summaries = useMemo(
    () => regions.map((name) => ({ name, count: rows.filter((row) => row.region === name).length, total: rows.filter((row) => row.region === name).reduce((sum, row) => sum + row.amount, 0) })),
    [regions, rows],
  );

  return (
    <div className="mx-auto max-w-[1480px]">
      <div className="mb-6">
        <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-emerald-700">
          {mode === "query" ? <Search className="size-4" /> : <UsersRound className="size-4" />}
          Kurban yönetimi
        </div>
        <h2 className="mt-1 text-xl font-bold text-[#0b2b3c]">{mode === "query" ? "Kurban sorgu" : "Temsilci kurban bağış listeleri"}</h2>
        <p className="mt-1 text-sm text-slate-500">{mode === "query" ? "Bağışçı, telefon, proje ve hisse numarasıyla kurban kayıtlarını sorgulayın." : "Giden ülke ve bölge bazında kurban bağışlarını ve toplamlarını izleyin."}</p>
      </div>

      {mode === "representative" && <div className="mb-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {summaries.map((item) => <Card key={item.name} className="flex items-center gap-4 p-5"><span className="grid size-11 place-items-center rounded-xl bg-emerald-50 text-emerald-700"><MapPin className="size-5" /></span><div><p className="font-bold text-[#0b2b3c]">{item.name}</p><p className="mt-1 text-xs text-slate-500">{item.count} bağış · {formatCurrency(item.total)}</p></div></Card>)}
      </div>}

      <Card className="overflow-hidden">
        <div className="grid gap-3 border-b border-slate-100 p-5 sm:grid-cols-3">
          <div className="relative sm:col-span-1"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" /><Input value={query} onChange={(event) => setQuery(event.target.value)} className="pl-9" placeholder="Ad, telefon, proje veya hisse ara" /></div>
          <select value={kind} onChange={(event) => setKind(event.target.value)} className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm"><option value="">Tüm kurban grupları</option>{SACRIFICE_KINDS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select>
          <select value={region} onChange={(event) => setRegion(event.target.value)} className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm"><option value="">Tüm ülke / bölgeler</option>{regions.map((item) => <option key={item}>{item}</option>)}</select>
        </div>
        {loading ? <div className="flex justify-center gap-2 p-12 text-sm text-slate-500"><LoaderCircle className="size-5 animate-spin" /> Kayıtlar yükleniyor</div>
          : error ? <p className="m-5 rounded-xl bg-red-50 p-4 text-sm text-red-700">{error}</p>
          : <div className="overflow-x-auto"><table className="w-full min-w-[900px] text-left text-xs"><thead className="bg-[#0d8f89] text-white"><tr>{["Proje", "Hisse", "Bağışçı", "Telefon", "Grup", "Ülke / Bölge", "Tutar", "Durum"].map((item) => <th key={item} className="px-4 py-3">{item}</th>)}</tr></thead><tbody className="divide-y divide-slate-100">{filtered.map((row) => <tr key={row.id} className="hover:bg-emerald-50/40"><td className="px-4 py-3 font-bold">{row.projectNo}</td><td className="px-4 py-3">{row.shareNo}. hisse</td><td className="px-4 py-3 font-semibold">{row.donorName}</td><td className="px-4 py-3">{row.phone}</td><td className="px-4 py-3">{SACRIFICE_KINDS.find((item) => item.value === row.kind)?.label}</td><td className="px-4 py-3">{row.region}</td><td className="px-4 py-3 font-bold">{formatCurrency(row.amount)}</td><td className="px-4 py-3"><span className="rounded-full bg-emerald-50 px-2 py-1 font-semibold text-emerald-700">{row.status === "FILLED" ? "Tamamlandı" : row.status}</span></td></tr>)}{!filtered.length && <tr><td colSpan={8} className="p-12 text-center text-slate-500"><Bird className="mx-auto mb-2 size-7 text-slate-300" />Aramaya uygun kayıt bulunamadı.</td></tr>}</tbody></table></div>}
        <div className="border-t border-slate-100 px-5 py-3 text-xs text-slate-500">Gösterilen kayıt: {filtered.length} / {rows.length}</div>
      </Card>
    </div>
  );
}
