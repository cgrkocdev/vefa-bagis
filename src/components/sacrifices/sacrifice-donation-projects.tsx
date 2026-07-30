"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Bird,
  Download,
  Filter,
  LoaderCircle,
  Plus,
  Printer,
  RotateCcw,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PAYMENT_METHODS, SACRIFICE_KINDS, type SacrificeKind } from "@/lib/constants";
import { formatCurrency } from "@/lib/utils";
import { SacrificeDonationForm } from "@/components/sacrifices/sacrifice-donation-form";

type Share = {
  id: string;
  shareNo: number;
  status: "EMPTY" | "PENDING" | "FILLED" | "CANCELLED";
  paymentStatus: "PENDING" | "PAID" | "CANCELLED";
  paymentMethod: string | null;
  amount: number;
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

type ProjectRow = {
  id: string;
  projectNo: number;
  shareNo: number;
  name: string;
  phone: string;
  kind: SacrificeKind;
  region: string;
  paymentMethod: string;
  amount: number;
  status: Share["status"];
};

const selectClass =
  "h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-700 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-50";

export function SacrificeDonationProjects() {
  const [sacrifices, setSacrifices] = useState<Sacrifice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [kind, setKind] = useState("");
  const [region, setRegion] = useState("");
  const [payment, setPayment] = useState("");
  const [status, setStatus] = useState("");
  const [currency, setCurrency] = useState("TRY");
  const [year, setYear] = useState("");
  const [month, setMonth] = useState("");
  const [query, setQuery] = useState("");
  const [donationFormOpen, setDonationFormOpen] = useState(false);
  const [applied, setApplied] = useState({ kind: "", region: "", payment: "", status: "" });

  useEffect(() => {
    if (!donationFormOpen) return;
    const previousOverflow = document.body.style.overflow;
    const previousOverscroll = document.body.style.overscrollBehavior;
    document.body.style.overflow = "hidden";
    document.body.style.overscrollBehavior = "none";

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setDonationFormOpen(false);
    }
    document.addEventListener("keydown", closeOnEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.body.style.overscrollBehavior = previousOverscroll;
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [donationFormOpen]);

  const loadSacrifices = useCallback(async () => {
    setError("");
    try {
      const response = await fetch("/api/sacrifices", { cache: "no-store" });
      const data = (await response.json()) as { sacrifices?: Sacrifice[]; message?: string };
      if (!response.ok) throw new Error(data.message);
      setSacrifices(data.sacrifices ?? []);
    } catch {
      setError("Kurban proje bilgileri yüklenemedi.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadSacrifices(), 0);
    return () => window.clearTimeout(timer);
  }, [loadSacrifices]);

  const regions = useMemo(
    () => [...new Set(sacrifices.map((item) => item.region))].sort((a, b) => a.localeCompare(b, "tr")),
    [sacrifices],
  );

  const rows = useMemo<ProjectRow[]>(
    () =>
      sacrifices.flatMap((sacrifice) =>
        sacrifice.shares
          .filter((share) => share.donor)
          .map((share) => ({
            id: share.id,
            projectNo: sacrifice.number,
            shareNo: share.shareNo,
            name: share.donor?.name ?? "",
            phone: share.donor?.phone ?? "",
            kind: sacrifice.kind,
            region: sacrifice.region,
            paymentMethod: share.paymentMethod ?? "",
            amount: share.amount,
            status: share.status,
          })),
      ),
    [sacrifices],
  );

  const filteredRows = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("tr");
    return rows.filter((row) => {
      if (applied.kind && row.kind !== applied.kind) return false;
      if (applied.region && row.region !== applied.region) return false;
      if (applied.payment && row.paymentMethod !== applied.payment) return false;
      if (applied.status && row.status !== applied.status) return false;
      if (
        normalizedQuery &&
        !`${row.name} ${row.phone} ${row.projectNo} ${row.region}`
          .toLocaleLowerCase("tr")
          .includes(normalizedQuery)
      ) return false;
      return true;
    });
  }, [applied, query, rows]);

  function applyFilters() {
    setApplied({ kind, region, payment, status });
  }

  function resetFilters() {
    setKind("");
    setRegion("");
    setPayment("");
    setStatus("");
    setCurrency("TRY");
    setYear("");
    setMonth("");
    setQuery("");
    setApplied({ kind: "", region: "", payment: "", status: "" });
  }

  function exportCsv() {
    const records = [
      ["Proje No", "Hisse", "Ad Soyad", "Telefon", "Cinsi", "Ödeme", "Tutar", "Ülke/Bölge"],
      ...filteredRows.map((row) => [
        row.projectNo.toString(),
        row.shareNo.toString(),
        row.name,
        row.phone,
        SACRIFICE_KINDS.find((item) => item.value === row.kind)?.label ?? row.kind,
        PAYMENT_METHODS.find((item) => item.value === row.paymentMethod)?.label ?? row.paymentMethod,
        row.amount.toString(),
        row.region,
      ]),
    ];
    const csv = `\uFEFF${records.map((record) => record.map((cell) => `"${cell.replaceAll("\"", "\"\"")}"`).join(";")).join("\n")}`;
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "kurban-bagislari.csv";
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="mx-auto max-w-[1480px]">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-emerald-700">
            <Bird className="size-4" /> Kurban yönetimi
          </div>
          <h2 className="text-xl font-bold text-[#0b2b3c]">Vacip kurban bağışı</h2>
          <p className="mt-1 text-sm text-slate-500">Projeleri filtreleyin, bağışçı kayıtlarını inceleyin ve yeni kurban bağışı ekleyin.</p>
        </div>
        <button
          type="button"
          onClick={() => setDonationFormOpen(true)}
          className="inline-flex h-11 items-center justify-center gap-2 self-start rounded-xl bg-emerald-600 px-4 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-100 sm:self-auto"
        >
          <Plus className="size-4" /> Bağış Ekle
        </button>
      </div>

      <Card className="mb-5 overflow-hidden">
        <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-4 sm:px-6">
          <span className="grid size-9 place-items-center rounded-xl bg-emerald-50 text-emerald-700"><Filter className="size-4" /></span>
          <div>
            <h3 className="font-bold text-[#0b2b3c]">Proje listesi</h3>
            <p className="mt-0.5 text-xs text-slate-500">Aradığınız kurban projesini filtreleyerek bulun.</p>
          </div>
        </div>
        <div className="grid gap-4 p-5 sm:grid-cols-2 sm:p-6 lg:grid-cols-3 xl:grid-cols-5">
          <FilterSelect label="Bölüm" value={kind} onChange={setKind}>
            <option value="">Tüm bölümler</option>
            {SACRIFICE_KINDS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
          </FilterSelect>
          <FilterSelect label="Yıl" value={year} onChange={setYear}>
            <option value="">Tüm yıllar</option>
            {[2026, 2025, 2024].map((item) => <option key={item}>{item}</option>)}
          </FilterSelect>
          <FilterSelect label="Ay" value={month} onChange={setMonth}>
            <option value="">Tüm aylar</option>
            {["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"].map((item, index) => <option key={item} value={index + 1}>{item}</option>)}
          </FilterSelect>
          <FilterSelect label="Bağış cinsi" value={kind} onChange={setKind}>
            <option value="">Tüm kurban türleri</option>
            {SACRIFICE_KINDS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
          </FilterSelect>
          <FilterSelect label="Bağış grubu" value={status} onChange={setStatus}>
            <option value="">Tüm durumlar</option>
            <option value="FILLED">Tamamlanan</option>
            <option value="PENDING">Bekleyen</option>
          </FilterSelect>
          <FilterSelect label="Gelen il / ilçe" value={region} onChange={setRegion}>
            <option value="">Tüm bölgeler</option>
            {regions.map((item) => <option key={item}>{item}</option>)}
          </FilterSelect>
          <FilterSelect label="Ödeme şekli" value={payment} onChange={setPayment}>
            <option value="">Tüm ödeme şekilleri</option>
            {PAYMENT_METHODS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
          </FilterSelect>
          <FilterSelect label="Para birimi" value={currency} onChange={setCurrency}>
            <option value="TRY">Türk Lirası (₺)</option>
          </FilterSelect>
          <FilterSelect label="Giden ülke" value={region} onChange={setRegion}>
            <option value="">Tüm ülkeler</option>
            {regions.map((item) => <option key={item}>{item}</option>)}
          </FilterSelect>
          <FilterSelect label="Partner" value="" onChange={() => undefined}>
            <option value="">Tüm partnerler</option>
            <option>Vefa</option>
          </FilterSelect>
          <div className="flex gap-2 sm:col-span-2 lg:col-span-3 xl:col-span-5 xl:justify-center">
            <Button type="button" variant="success" className="min-w-36" onClick={applyFilters}><Search className="size-4" /> Sorgula</Button>
            <Button type="button" variant="ghost" onClick={resetFilters}><RotateCcw className="size-4" /> Temizle</Button>
          </div>
        </div>
      </Card>

      <Card className="overflow-hidden">
        <div className="flex flex-col gap-4 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div>
            <h3 className="font-bold text-[#0b2b3c]">Proje listesi</h3>
            <p className="mt-1 text-xs text-slate-500">Kurban projelerine bağlı bağışçı kayıtları</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" onClick={exportCsv} disabled={!filteredRows.length}><Download className="size-4" /> Excel / CSV</Button>
            <Button size="sm" variant="outline" onClick={() => window.print()}><Printer className="size-4" /> Yazdır</Button>
          </div>
        </div>
        <div className="border-b border-slate-100 p-4 sm:px-6">
          <div className="relative ml-auto max-w-xs">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <Input value={query} onChange={(event) => setQuery(event.target.value)} className="h-10 pl-9 text-xs" placeholder="Listede ara..." />
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-2 p-12 text-sm text-slate-500"><LoaderCircle className="size-5 animate-spin" /> Projeler yükleniyor</div>
        ) : error ? (
          <p className="m-5 rounded-xl bg-red-50 p-4 text-sm text-red-700">{error}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1040px] text-left">
              <thead className="bg-[#0d8f89] text-[10px] uppercase tracking-wide text-white">
                <tr>
                  {["Proje No", "Hisse", "Ad Soyad", "Telefon", "Cinsi", "Ödeme", "Tutar", "Ülke / Bölge", "Durum"].map((heading) => (
                    <th key={heading} className="whitespace-nowrap px-4 py-3 font-semibold">{heading}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRows.map((row) => (
                  <tr key={row.id} className="text-xs text-slate-600 transition hover:bg-emerald-50/40">
                    <td className="px-4 py-3 font-bold text-[#0b2b3c]">{row.projectNo}</td>
                    <td className="px-4 py-3">{row.shareNo}. hisse</td>
                    <td className="px-4 py-3 font-semibold text-slate-800">{row.name}</td>
                    <td className="px-4 py-3">{row.phone}</td>
                    <td className="px-4 py-3">{SACRIFICE_KINDS.find((item) => item.value === row.kind)?.label}</td>
                    <td className="px-4 py-3">{PAYMENT_METHODS.find((item) => item.value === row.paymentMethod)?.label ?? "—"}</td>
                    <td className="px-4 py-3 font-bold text-[#0b2b3c]">{formatCurrency(row.amount)}</td>
                    <td className="px-4 py-3">{row.region}</td>
                    <td className="px-4 py-3"><span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold text-emerald-700">{row.status === "FILLED" ? "Tamamlandı" : "Bekliyor"}</span></td>
                  </tr>
                ))}
                {!filteredRows.length && (
                  <tr><td colSpan={9} className="px-6 py-14 text-center"><Bird className="mx-auto size-8 text-slate-300" /><p className="mt-3 text-sm font-semibold text-slate-700">Kayıt bulunamadı</p><p className="mt-1 text-xs text-slate-500">Seçilen filtrelere ait kurban bağışı henüz bulunmuyor.</p></td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
        <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3 text-[11px] text-slate-500 sm:px-6">
          <span>Gösterilen kayıt: {filteredRows.length}</span>
          <span>Toplam {rows.length} kayıt</span>
        </div>
      </Card>
      {donationFormOpen && (
        <SacrificeDonationForm modal onClose={() => setDonationFormOpen(false)} onSaved={loadSacrifices} />
      )}
    </div>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  children,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  children: React.ReactNode;
}) {
  return (
    <label>
      <span className="mb-1.5 block text-[11px] font-semibold text-slate-600">{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)} className={selectClass}>
        {children}
      </select>
    </label>
  );
}
