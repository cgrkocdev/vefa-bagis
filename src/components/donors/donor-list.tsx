"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ChevronRight, Download, Printer, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { EmptyState, ErrorState, Skeleton } from "@/components/ui/states";
import { formatCurrency, formatDate, initials } from "@/lib/utils";
import { formatPhone } from "@/lib/phone";
import { printReportDocument } from "@/lib/client/print-report";
import { compareTableValues } from "@/lib/table-sort";

type Donor = { id: string; name: string; phone: string; country: string; city: string; district: string; totalDonation: number; donationCount: number; lastDonationAt: string | null; createdAt: string };

export function DonorList() {
  const [donors, setDonors] = useState<Donor[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sort, setSort] = useState<{ key: keyof Donor; direction: "asc" | "desc" }>({ key: "name", direction: "asc" });
  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const response = await fetch("/api/donors");
      const data = (await response.json()) as { donors?: Donor[]; message?: string };
      if (!response.ok) throw new Error(data.message);
      setDonors(data.donors ?? []);
    } catch { setError("Bağışçı bilgileri yüklenemedi."); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);
  const filtered = useMemo(() => donors
    .filter((item) => `${item.name} ${item.phone}`.toLocaleLowerCase("tr-TR").includes(search.toLocaleLowerCase("tr-TR")))
    .sort((left, right) => {
      const result = compareTableValues(String(left[sort.key] ?? ""), String(right[sort.key] ?? ""));
      return sort.direction === "asc" ? result : -result;
    }), [donors, search, sort]);
  const toggleSort = (key: keyof Donor) => setSort((current) => ({ key, direction: current.key === key && current.direction === "asc" ? "desc" : "asc" }));
  const sortMark = (key: keyof Donor) => sort.key === key ? (sort.direction === "asc" ? " \u2191" : " \u2193") : " \u2195";
  const filteredTotal = filtered.reduce((sum, donor) => sum + donor.totalDonation, 0);

  function exportExcel() {
    const rows = [
      ["Ad Soyad", "Telefon", "Ülke", "İl", "İlçe", "Bağış Sayısı", "Toplam Bağış", "Son Bağış", "Kayıt Tarihi"],
      ...filtered.map((donor) => [donor.name, formatPhone(donor.phone), donor.country || "—", donor.city || "—", donor.district || "—", donor.donationCount, donor.totalDonation.toFixed(2), donor.lastDonationAt ? formatDate(donor.lastDonationAt) : "—", formatDate(donor.createdAt)]),
      ["TOPLAM", "", "", "", "", filtered.reduce((sum, donor) => sum + donor.donationCount, 0), filteredTotal.toFixed(2), "", ""],
    ];
    const csv = `\uFEFF${rows.map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(";")).join("\r\n")}`;
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url; anchor.download = `yedirenk-bagiscilar-${new Date().toISOString().slice(0, 10)}.csv`; anchor.click(); URL.revokeObjectURL(url);
  }

  function printDonors() {
    printReportDocument({
      title: "Bağışçı Listesi", subtitle: search ? `Arama filtresi: ${search}` : "Tüm kayıtlı bağışçılar", orientation: "landscape",
      summaries: [{ label: "Bağışçı Sayısı", value: filtered.length.toLocaleString("tr-TR") }, { label: "Bağış İşlemi", value: filtered.reduce((sum, donor) => sum + donor.donationCount, 0).toLocaleString("tr-TR") }, { label: "Toplam Bağış", value: formatCurrency(filteredTotal) }],
      tables: [{ title: "Bağışçı ve Bağış Özeti", headers: ["Ad Soyad", "Telefon", "Ülke", "İl / İlçe", "Bağış Sayısı", "Toplam Bağış", "Son Bağış", "Kayıt Tarihi"], rows: filtered.map((donor) => [donor.name, formatPhone(donor.phone), donor.country || "—", [donor.city, donor.district].filter(Boolean).join(" / ") || "—", donor.donationCount, formatCurrency(donor.totalDonation), donor.lastDonationAt ? formatDate(donor.lastDonationAt) : "—", formatDate(donor.createdAt)]), footer: ["TOPLAM", "", "", "", filtered.reduce((sum, donor) => sum + donor.donationCount, 0), formatCurrency(filteredTotal), "", ""] }],
      note: "Bu rapor ekranda uygulanan arama filtresine göre hazırlanmıştır.",
    });
  }

  return (
    <Card className="overflow-hidden">
      <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div><h2 className="font-bold text-[#0b2b3c]">Bağışçı listesi</h2><p className="mt-1 text-xs text-slate-500">{donors.length} kayıtlı bağışçı</p></div>
        <div className="flex w-full flex-wrap items-center justify-end gap-2 sm:w-auto"><Button variant="outline" size="sm" onClick={exportExcel} disabled={!filtered.length}><Download className="size-4" /> Excel Aktar</Button><Button variant="outline" size="sm" onClick={printDonors} disabled={!filtered.length}><Printer className="size-4" /> Yazdır</Button><div className="relative w-full sm:w-64"><Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" /><Input value={search} onChange={(e) => setSearch(e.target.value)} className="h-10 pl-10" placeholder="Ad veya telefon ara" /></div></div>
      </div>
      {loading ? <div className="space-y-3 border-t border-slate-100 p-5">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}</div>
        : error ? <ErrorState description={error} onRetry={() => void load()} />
        : filtered.length === 0 ? <EmptyState title="Bağışçı bulunamadı" description={search ? "Arama ifadenizi değiştirerek yeniden deneyin." : "İlk bağış kaydıyla bağışçı otomatik oluşturulur."} />
        : <div className="border-t border-slate-100">
          <div className="hidden grid-cols-[1.3fr_1fr_0.8fr_0.6fr_0.8fr_24px] gap-4 bg-slate-50 px-6 py-3 text-[10px] font-semibold uppercase tracking-wider text-slate-400 md:grid">
            <SortButton label="Ad soyad" mark={sortMark("name")} onClick={() => toggleSort("name")} />
            <SortButton label="Telefon" mark={sortMark("phone")} onClick={() => toggleSort("phone")} />
            <SortButton label="Toplam bağış" mark={sortMark("totalDonation")} onClick={() => toggleSort("totalDonation")} />
            <SortButton label="Bağış sayısı" mark={sortMark("donationCount")} onClick={() => toggleSort("donationCount")} />
            <SortButton label="Son bağış" mark={sortMark("lastDonationAt")} onClick={() => toggleSort("lastDonationAt")} />
            <span />
          </div>
          <div className="divide-y divide-slate-100">{filtered.map((donor) => <Link key={donor.id} href={`/bagiscilar/${donor.id}`} className="grid gap-2 px-5 py-4 hover:bg-slate-50 md:grid-cols-[1.3fr_1fr_0.8fr_0.6fr_0.8fr_24px] md:items-center md:gap-4 md:px-6">
            <div className="flex items-center gap-3"><span className="grid size-9 shrink-0 place-items-center rounded-xl bg-slate-100 text-[11px] font-bold text-[#0b2b3c]">{initials(donor.name)}</span><span className="text-sm font-semibold text-slate-800">{donor.name}</span></div>
            <span className="text-xs text-slate-600">{formatPhone(donor.phone)}</span><span className="text-sm font-bold text-[#0b2b3c]">{formatCurrency(donor.totalDonation)}</span><span className="text-xs text-slate-600">{donor.donationCount}</span><span className="text-xs text-slate-500">{donor.lastDonationAt ? formatDate(donor.lastDonationAt) : "—"}</span><ChevronRight className="hidden size-4 text-slate-400 md:block" />
          </Link>)}</div>
        </div>}
    </Card>
  );
}

function SortButton({ label, mark, onClick }: { label: string; mark: string; onClick: () => void }) {
  return <button type="button" onClick={onClick} className="text-left transition hover:text-[#02b3aa]" title={`${label} sütununu sırala`}>{label}<span className="ml-1">{mark}</span></button>;
}
