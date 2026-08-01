"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowDownUp, Bird, LoaderCircle, MapPin, RotateCcw, Search, UsersRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { type SacrificeKind } from "@/lib/constants";
import { formatCurrency } from "@/lib/utils";

type Sacrifice = {
  id: string;
  number: number;
  name: string;
  year: string;
  department: string;
  donationType: string;
  group: string;
  country: string;
  partner: string;
  region: string;
  kind: SacrificeKind;
  status: string;
  shares: Array<{
    id: string;
    shareNo: number;
    status: string;
    amount: number;
    receiptNo: string;
    createdAt: string | null;
    donor: {
      firstName: string;
      lastName: string;
      phone: string;
      city: string;
      district: string;
    } | null;
  }>;
};

type RegistryRow = {
  id: string;
  projectNo: number;
  projectName: string;
  shareNo: number;
  donorName: string;
  phone: string;
  city: string;
  district: string;
  year: string;
  department: string;
  donationType: string;
  group: string;
  country: string;
  partner: string;
  region: string;
  amount: number;
  receiptNo: string;
  date: string;
  status: string;
};

type Filters = {
  year: string;
  department: string;
  donationType: string;
  country: string;
  partner: string;
  region: string;
};

const emptyFilters: Filters = {
  year: "",
  department: "",
  donationType: "",
  country: "",
  partner: "",
  region: "",
};

const selectClass = "h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-50";

function unique(values: string[]) {
  return [...new Set(values.filter(Boolean))].sort((left, right) => left.localeCompare(right, "tr", { numeric: true }));
}

export function SacrificeRegistry({ mode }: { mode: "query" | "representative" }) {
  const [items, setItems] = useState<Sacrifice[]>([]);
  const [filters, setFilters] = useState<Filters>(emptyFilters);
  const [applied, setApplied] = useState<Filters>(emptyFilters);
  const [query, setQuery] = useState("");
  const [sortAscending, setSortAscending] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setError("");
    try {
      const response = await fetch("/api/sacrifices", { cache: "no-store" });
      const data = (await response.json()) as { sacrifices?: Sacrifice[]; message?: string };
      if (!response.ok) throw new Error(data.message);
      setItems(data.sacrifices ?? []);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Kurban kayıtları yüklenemedi.");
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
    () => items.flatMap((project) => project.shares
      .filter((share) => share.donor)
      .map((share) => ({
        id: share.id,
        projectNo: project.number,
        projectName: project.name,
        shareNo: share.shareNo,
        donorName: `${share.donor?.firstName ?? ""} ${share.donor?.lastName ?? ""}`.trim(),
        phone: share.donor?.phone ?? "",
        city: share.donor?.city ?? "",
        district: share.donor?.district ?? "",
        year: project.year,
        department: project.department,
        donationType: project.donationType,
        group: project.group,
        country: project.country,
        partner: project.partner,
        region: project.region,
        amount: share.amount,
        receiptNo: share.receiptNo,
        date: share.createdAt ?? "",
        status: share.status,
      }))),
    [items],
  );

  const years = useMemo(() => unique(items.map((item) => item.year)), [items]);
  const departments = useMemo(() => unique(items.map((item) => item.department)), [items]);
  const donationTypes = useMemo(() => unique(items.map((item) => item.donationType)), [items]);
  const countries = useMemo(() => unique(items.map((item) => item.country)), [items]);
  const partners = useMemo(
    () => unique(items.filter((item) => !filters.country || item.country === filters.country).map((item) => item.partner)),
    [filters.country, items],
  );
  const regions = useMemo(
    () => unique(items
      .filter((item) => (!filters.country || item.country === filters.country) && (!filters.partner || item.partner === filters.partner))
      .map((item) => item.region)),
    [filters.country, filters.partner, items],
  );

  const filtered = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase("tr");
    const result = rows.filter((row) =>
      (!applied.year || row.year === applied.year) &&
      (!applied.department || row.department === applied.department) &&
      (!applied.donationType || row.donationType === applied.donationType) &&
      (!applied.country || row.country === applied.country) &&
      (!applied.partner || row.partner === applied.partner) &&
      (!applied.region || row.region === applied.region) &&
      (!needle || `${row.projectNo} ${row.projectName} ${row.shareNo} ${row.donorName} ${row.phone} ${row.receiptNo} ${row.country} ${row.partner} ${row.region}`
        .toLocaleLowerCase("tr")
        .includes(needle)),
    );
    return result.sort((left, right) => (left.projectNo - right.projectNo || left.shareNo - right.shareNo) * (sortAscending ? 1 : -1));
  }, [applied, query, rows, sortAscending]);

  const summaries = useMemo(
    () => unique(rows.map((row) => row.region)).map((name) => ({
      name,
      count: rows.filter((row) => row.region === name).length,
      total: rows.filter((row) => row.region === name).reduce((sum, row) => sum + row.amount, 0),
    })),
    [rows],
  );

  function updateFilter(field: keyof Filters, value: string) {
    setFilters((current) => {
      if (field === "country") return { ...current, country: value, partner: "", region: "" };
      if (field === "partner") return { ...current, partner: value, region: "" };
      return { ...current, [field]: value };
    });
  }

  function clearFilters() {
    setFilters(emptyFilters);
    setApplied(emptyFilters);
    setQuery("");
  }

  return (
    <div className="mx-auto max-w-[1480px]">
      <div className="mb-6">
        <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-emerald-700">
          {mode === "query" ? <Search className="size-4" /> : <UsersRound className="size-4" />}
          Kurban yönetimi
        </div>
        <h2 className="mt-1 text-xl font-bold text-[#0b2b3c]">{mode === "query" ? "Kurban sorgu" : "Temsilci kurban bağış listeleri"}</h2>
        <p className="mt-1 text-sm text-slate-500">{mode === "query" ? "Proje ve bağış kayıtlarını ayrıntılı kriterlerle sorgulayın." : "Giden ülke ve bölge bazında kurban bağışlarını ve toplamlarını izleyin."}</p>
      </div>

      {mode === "representative" && (
        <div className="mb-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {summaries.map((item) => (
            <Card key={item.name} className="flex items-center gap-4 p-5">
              <span className="grid size-11 place-items-center rounded-xl bg-emerald-50 text-emerald-700"><MapPin className="size-5" /></span>
              <div><p className="font-bold text-[#0b2b3c]">{item.name}</p><p className="mt-1 text-xs text-slate-500">{item.count} bağış · {formatCurrency(item.total)}</p></div>
            </Card>
          ))}
        </div>
      )}

      <Card className="mb-5 overflow-hidden border-emerald-100 bg-emerald-50/50">
        <div className="border-b border-emerald-100 px-5 py-4"><h3 className="font-bold text-[#0b2b3c]">Sorgulama</h3></div>
        <div className="grid gap-4 p-5 md:grid-cols-2 xl:grid-cols-6">
          <QuerySelect label="Yıl" value={filters.year} onChange={(value) => updateFilter("year", value)} options={years} />
          <QuerySelect label="Bölüm" value={filters.department} onChange={(value) => updateFilter("department", value)} options={departments} />
          <QuerySelect label="Türü (Cinsi)" value={filters.donationType} onChange={(value) => updateFilter("donationType", value)} options={donationTypes} />
          <QuerySelect label="Giden Ülke" value={filters.country} onChange={(value) => updateFilter("country", value)} options={countries} />
          <QuerySelect label="Partner" value={filters.partner} onChange={(value) => updateFilter("partner", value)} options={partners} disabled={!filters.country} />
          <QuerySelect label="Giden Bölge (İl)" value={filters.region} onChange={(value) => updateFilter("region", value)} options={regions} disabled={!filters.country} />
          <div className="flex justify-center gap-2 md:col-span-2 xl:col-span-6">
            <Button type="button" variant="success" className="min-w-40" onClick={() => setApplied(filters)}><Search className="size-4" /> Sorgula</Button>
            <Button type="button" variant="ghost" onClick={clearFilters}><RotateCcw className="size-4" /> Temizle</Button>
          </div>
        </div>
      </Card>

      <Card className="overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div><h3 className="font-bold text-[#0b2b3c]">Sorgu sonuçları</h3><p className="mt-1 text-xs text-slate-500">Filtrelere uyan proje ve bağış kayıtları</p></div>
          <div className="relative w-full sm:max-w-sm"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" /><Input value={query} onChange={(event) => setQuery(event.target.value)} className="h-10 pl-9 text-xs" placeholder="Bağışçı, telefon, proje, makbuz ara" /></div>
        </div>
        {loading ? (
          <div className="flex justify-center gap-2 p-12 text-sm text-slate-500"><LoaderCircle className="size-5 animate-spin" /> Kayıtlar yükleniyor</div>
        ) : error ? (
          <p className="m-5 rounded-xl bg-red-50 p-4 text-sm text-red-700">{error}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1450px] text-left text-xs">
              <thead className="bg-[#02b3aa] text-white">
                <tr>
                  <th className="px-4 py-3"><button type="button" onClick={() => setSortAscending((value) => !value)} className="flex items-center gap-2">Proje No <ArrowDownUp className="size-3.5" /></button></th>
                  {["Proje Adı", "Hisse", "Bağışçı", "Telefon", "İl / İlçe", "Yıl / Bölüm", "Tür / Grup", "Ülke / Partner / Bölge", "Tutar", "Makbuz", "Tarih", "Durum"].map((item) => <th key={item} className="px-4 py-3">{item}</th>)}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((row) => (
                  <tr key={row.id} className="hover:bg-emerald-50/40">
                    <td className="px-4 py-3 font-bold text-[#0b2b3c]">{row.projectNo}</td>
                    <td className="px-4 py-3 font-semibold">{row.projectName}</td>
                    <td className="px-4 py-3">{row.shareNo}. hisse</td>
                    <td className="px-4 py-3 font-semibold">{row.donorName}</td>
                    <td className="px-4 py-3">{row.phone}</td>
                    <td className="px-4 py-3">{[row.city, row.district].filter(Boolean).join(" / ") || "—"}</td>
                    <td className="px-4 py-3">{row.year}<br />{row.department}</td>
                    <td className="px-4 py-3">{row.donationType}<br />{row.group}</td>
                    <td className="px-4 py-3">{row.country}<br />{[row.partner, row.region].filter(Boolean).join(" / ")}</td>
                    <td className="px-4 py-3 font-bold">{formatCurrency(row.amount)}</td>
                    <td className="px-4 py-3">{row.receiptNo || "—"}</td>
                    <td className="px-4 py-3">{row.date ? new Intl.DateTimeFormat("tr-TR").format(new Date(row.date)) : "—"}</td>
                    <td className="px-4 py-3"><span className="rounded-full bg-emerald-50 px-2 py-1 font-semibold text-emerald-700">{row.status === "FILLED" ? "Tamamlandı" : row.status}</span></td>
                  </tr>
                ))}
                {!filtered.length && <tr><td colSpan={13} className="p-12 text-center text-slate-500"><Bird className="mx-auto mb-2 size-7 text-slate-300" />Sorguya uygun kayıt bulunamadı.</td></tr>}
              </tbody>
            </table>
          </div>
        )}
        <div className="border-t border-slate-100 px-5 py-3 text-xs text-slate-500">Gösterilen kayıt: {filtered.length} / {rows.length}</div>
      </Card>
    </div>
  );
}

function QuerySelect({
  label,
  value,
  onChange,
  options,
  disabled = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
  disabled?: boolean;
}) {
  return (
    <label>
      <span className="mb-1.5 block text-xs font-semibold text-slate-600">{label}</span>
      <select className={selectClass} value={value} onChange={(event) => onChange(event.target.value)} disabled={disabled}>
        <option value="">Seçiniz</option>
        {options.map((option) => <option key={option} value={option}>{option}</option>)}
      </select>
    </label>
  );
}
