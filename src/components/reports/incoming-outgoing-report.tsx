"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Download, LoaderCircle, Printer, RotateCcw, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { printReportDocument } from "@/lib/client/print-report";

type Definition = {
  id: string;
  type: string;
  code: string;
  name: string;
  parentId: string | null;
};
type ReportRow = {
  typeId: string;
  type: string;
  amount: number;
  count: number;
};
type Filters = {
  typeId: string;
  countryId: string;
  regionId: string;
  year: string;
  month: string;
  from: string;
  to: string;
};
const initialFilters: Filters = {
  typeId: "",
  countryId: "",
  regionId: "",
  year: "2026",
  month: "",
  from: "",
  to: "",
};
const controlClass =
  "h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-700 outline-none focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100";

export function IncomingOutgoingReport() {
  const [definitions, setDefinitions] = useState<Definition[]>([]);
  const [filters, setFilters] = useState<Filters>(initialFilters);
  const [applied, setApplied] = useState<Filters>(initialFilters);
  const [incoming, setIncoming] = useState<ReportRow[]>([]);
  const [outgoing, setOutgoing] = useState<ReportRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async (active: Filters) => {
    setLoading(true);
    setError("");
    try {
      const query = new URLSearchParams();
      Object.entries(active).forEach(([key, value]) => {
        if (value) query.set(key, value);
      });
      const response = await fetch(`/api/reports/incoming-outgoing?${query}`, {
        cache: "no-store",
      });
      const data = (await response.json()) as {
        incoming?: ReportRow[];
        outgoing?: ReportRow[];
        message?: string;
      };
      if (!response.ok) throw new Error(data.message);
      setIncoming(data.incoming ?? []);
      setOutgoing(data.outgoing ?? []);
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Rapor verileri yüklenemedi.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void Promise.all([
      fetch("/api/definitions").then(async (response) => {
        const data = (await response.json()) as { definitions?: Definition[] };
        if (response.ok) setDefinitions(data.definitions ?? []);
      }),
      load(initialFilters),
    ]);
  }, [load]);

  const countries = definitions.filter(
    (item) => item.type === "DESTINATION_COUNTRY",
  );
  const regions = definitions.filter(
    (item) =>
      item.type === "DESTINATION_REGION" &&
      (!filters.countryId ||
        !item.parentId ||
        item.parentId === filters.countryId),
  );
  const types = definitions.filter((item) => item.type === "DONATION_TYPE");
  const incomingTotal = useMemo(
    () => incoming.reduce((sum, item) => sum + item.amount, 0),
    [incoming],
  );
  const outgoingTotal = useMemo(
    () => outgoing.reduce((sum, item) => sum + item.amount, 0),
    [outgoing],
  );

  function update<K extends keyof Filters>(field: K, value: Filters[K]) {
    setFilters((current) =>
      field === "countryId"
        ? { ...current, countryId: value, regionId: "" }
        : { ...current, [field]: value },
    );
  }

  function queryReport() {
    setApplied(filters);
    void load(filters);
  }

  function reset() {
    setFilters(initialFilters);
    setApplied(initialFilters);
    void load(initialFilters);
  }

  function exportCsv() {
    const rows = [
      ["Tablo", "Bağış Türü", "Kayıt Sayısı", "Tutar"],
      ...incoming.map((item) => [
        "Gelen",
        item.type,
        String(item.count),
        String(item.amount),
      ]),
      ...outgoing.map((item) => [
        "Gönderilen",
        item.type,
        String(item.count),
        String(item.amount),
      ]),
    ];
    const csv = `\uFEFF${rows.map((row) => row.map((cell) => `"${cell.replaceAll('"', '""')}"`).join(";")).join("\n")}`;
    const url = URL.createObjectURL(
      new Blob([csv], { type: "text/csv;charset=utf-8" }),
    );
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "gelen-gonderilen-bagis-listesi.csv";
    anchor.click();
    URL.revokeObjectURL(url);
  }
  function printReport() {
    const table = (title: string, items: ReportRow[], total: number) => ({
      title,
      headers: ["Bağış Türü", "Kayıt Sayısı", "Tutar"],
      rows: items.map((item) => [item.type, item.count, formatCurrency(item.amount)]),
      footer: ["GENEL TOPLAM", items.reduce((sum, item) => sum + item.count, 0), formatCurrency(total)],
    });
    printReportDocument({
      title: "Gelen ve Gönderilen Bağış Listesi",
      subtitle: `${applied.year || "Tüm yıllar"}${applied.month ? ` · ${applied.month}. ay` : ""}`,
      summaries: [{ label: "Gelen Toplam", value: formatCurrency(incomingTotal) }, { label: "Gönderilen Toplam", value: formatCurrency(outgoingTotal) }],
      tables: [table("Gelen Bağış Tablosu", incoming, incomingTotal), table("Gönderilen Bağış Tablosu", outgoing, outgoingTotal)],
      note: "Gönderilen tablo, Sipariş Durumu işaretli genel bağışlardan oluşur.",
    });
  }

  return (
    <div className="mx-auto max-w-[1480px]">
      <div className="mb-5">
        <h2 className="text-xl font-bold text-[#0b2b3c]">
          Gelen ve Gönderilen Bağış Listesi
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Gelen bağışları ve gönderim durumundaki yardımları karşılaştırın.
        </p>
      </div>
      <Card className="overflow-hidden">
        <div className="border-b border-slate-100 px-5 py-4">
          <h3 className="font-bold text-[#0b2b3c]">Sorgulama</h3>
        </div>
        <div className="grid gap-5 p-5 xl:grid-cols-[310px_1fr_1fr]">
          <aside className="rounded-xl bg-[#2499c6] p-4 text-white">
            <ReportSelect
              label="Bağış Türü (Cinsi)"
              value={filters.typeId}
              onChange={(value) => update("typeId", value)}
              items={types}
            />
            <ReportSelect
              label="Gönderilen Ülke"
              value={filters.countryId}
              onChange={(value) => update("countryId", value)}
              items={countries}
            />
            <ReportSelect
              label="Gönderilen İl / Bölge"
              value={filters.regionId}
              onChange={(value) => update("regionId", value)}
              items={regions}
              disabled={!filters.countryId}
            />
            <label className="mt-3 block">
              <span className="mb-1 block text-[10px] font-bold uppercase">
                Yıl
              </span>
              <select
                className={`${controlClass} bg-yellow-200 font-bold`}
                value={filters.year}
                onChange={(event) => update("year", event.target.value)}
              >
                <option value="">Seçiniz</option>
                {[2026, 2025, 2024].map((year) => (
                  <option key={year}>{year}</option>
                ))}
              </select>
            </label>
            <label className="mt-3 block">
              <span className="mb-1 block text-[10px] font-bold uppercase">
                Ay
              </span>
              <select
                className={controlClass}
                value={filters.month}
                onChange={(event) => update("month", event.target.value)}
                disabled={!filters.year}
              >
                <option value="">Seçiniz</option>
                {[
                  "Ocak",
                  "Şubat",
                  "Mart",
                  "Nisan",
                  "Mayıs",
                  "Haziran",
                  "Temmuz",
                  "Ağustos",
                  "Eylül",
                  "Ekim",
                  "Kasım",
                  "Aralık",
                ].map((month, index) => (
                  <option key={month} value={index + 1}>
                    {month}
                  </option>
                ))}
              </select>
            </label>
            <label className="mt-3 block">
              <span className="mb-1 block text-[10px] font-bold uppercase">
                İlk Tarih
              </span>
              <input
                type="date"
                className={controlClass}
                value={filters.from}
                onChange={(event) => update("from", event.target.value)}
              />
            </label>
            <label className="mt-3 block">
              <span className="mb-1 block text-[10px] font-bold uppercase">
                Son Tarih
              </span>
              <input
                type="date"
                className={controlClass}
                value={filters.to}
                min={filters.from}
                onChange={(event) => update("to", event.target.value)}
              />
            </label>
            <div className="mt-4 flex gap-2">
              <Button
                type="button"
                className="flex-1 bg-violet-600 hover:bg-violet-700"
                onClick={queryReport}
              >
                <Search className="size-4" /> Sorgula
              </Button>
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={reset}
              >
                <RotateCcw className="size-4" />
              </Button>
            </div>
            <Button
              type="button"
              variant="success"
              className="mt-2 w-full"
              onClick={exportCsv}
              disabled={!incoming.length && !outgoing.length}
            >
              <Download className="size-4" /> Excel / CSV
            </Button>
            <Button type="button" variant="outline" className="mt-2 w-full bg-white text-slate-700" onClick={printReport} disabled={!incoming.length && !outgoing.length}>
              <Printer className="size-4" /> Yazıcıya Gönder
            </Button>
          </aside>

          <ReportTable
            title="Gelen Bağış Tablosu"
            accent="blue"
            rows={incoming}
            total={incomingTotal}
            loading={loading}
          />
          <ReportTable
            title="Gönderilen Bağış Tablosu"
            accent="orange"
            rows={outgoing}
            total={outgoingTotal}
            loading={loading}
          />
        </div>
        {error && (
          <p className="mx-5 mb-5 rounded-xl bg-red-50 p-3 text-sm text-red-700">
            {error}
          </p>
        )}
        <div className="border-t border-slate-100 px-5 py-3 text-[10px] text-slate-500">
          Aktif filtre: {applied.year || "Tüm yıllar"}
          {applied.month ? ` / ${applied.month}. ay` : ""} · Gönderilen tablo,
          Sipariş Durumu işaretli genel bağışlardan oluşur.
        </div>
      </Card>
    </div>
  );
}

function ReportSelect({
  label,
  value,
  onChange,
  items,
  disabled = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  items: Definition[];
  disabled?: boolean;
}) {
  return (
    <label className="mt-3 block first:mt-0">
      <span className="mb-1 block text-[10px] font-bold uppercase">
        {label}
      </span>
      <select
        className={controlClass}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
      >
        <option value="">Seçiniz</option>
        {items.map((item) => (
          <option key={item.id} value={item.id}>
            {item.name}
          </option>
        ))}
      </select>
    </label>
  );
}

function ReportTable({
  title,
  accent,
  rows,
  total,
  loading,
}: {
  title: string;
  accent: "blue" | "orange";
  rows: ReportRow[];
  total: number;
  loading: boolean;
}) {
  return (
    <section>
      <p className="mb-3 text-[10px] font-semibold text-slate-600">
        {accent === "blue"
          ? "Kasa dışı kayıtlar bu toplamda yer almaz."
          : "Sipariş durumu işaretli yardımlar gösterilir."}
      </p>
      <div className="overflow-hidden rounded-lg border border-slate-200">
        <h3
          className={`px-4 py-2 text-center text-xs font-bold uppercase text-white ${accent === "blue" ? "bg-blue-600" : "bg-orange-500"}`}
        >
          {title}
        </h3>
        <table className="w-full text-left text-[11px]">
          <thead className="bg-[#02b3aa] text-white">
            <tr>
              <th className="px-3 py-2">Bağış Türü</th>
              <th className="px-3 py-2 text-center">Kayıt</th>
              <th className="px-3 py-2 text-right">Tutar</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={3} className="p-10 text-center">
                  <LoaderCircle className="mx-auto size-5 animate-spin text-emerald-600" />
                </td>
              </tr>
            ) : (
              rows.map((row, index) => (
                <tr
                  key={row.typeId}
                  className={index % 2 ? "bg-slate-50" : "bg-white"}
                >
                  <td className="px-3 py-2 font-medium">{row.type}</td>
                  <td className="px-3 py-2 text-center">{row.count}</td>
                  <td className="px-3 py-2 text-right font-semibold">
                    {formatCurrency(row.amount)}
                  </td>
                </tr>
              ))
            )}
            {!loading && !rows.length && (
              <tr>
                <td colSpan={3} className="p-10 text-center text-slate-500">
                  Kayıt bulunamadı.
                </td>
              </tr>
            )}
          </tbody>
          <tfoot>
            <tr className="bg-slate-100 font-bold">
              <td className="px-3 py-2">Toplam</td>
              <td />
              <td className="px-3 py-2 text-right">{formatCurrency(total)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </section>
  );
}
