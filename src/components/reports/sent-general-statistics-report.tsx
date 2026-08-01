"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CalendarDays, Download, LoaderCircle, Printer, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { printReportDocument } from "@/lib/client/print-report";

type Definition = {
  id: string;
  type: string;
  name: string;
  parentId: string | null;
};
type Stat = {
  typeId: string;
  type: string;
  sentCount: number;
  service: number;
};
type Detail = {
  id: string;
  typeId: string;
  receiptNo: string;
  donorName: string;
  phone: string;
  destination: string;
  payment: string;
  quantity: number;
  amount: number;
  sent: boolean;
  date: string;
};
type Filters = {
  destinationCountryId: string;
  destinationRegionId: string;
  partnerId: string;
  year: string;
  month: string;
  from: string;
  to: string;
  range: string;
};
const initial: Filters = {
  destinationCountryId: "",
  destinationRegionId: "",
  partnerId: "",
  year: "2026",
  month: "",
  from: "",
  to: "",
  range: "",
};
const control =
  "h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-xs text-slate-700 outline-none focus:border-cyan-500";

export function SentGeneralStatisticsReport() {
  const [filters, setFilters] = useState(initial);
  const [definitions, setDefinitions] = useState<Definition[]>([]);
  const [rows, setRows] = useState<Stat[]>([]);
  const [details, setDetails] = useState<Detail[]>([]);
  const [selected, setSelected] = useState<Stat | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async (active: Filters) => {
    setLoading(true);
    setError("");
    const query = new URLSearchParams();
    Object.entries(active).forEach(([key, value]) => {
      if (value) query.set(key, value);
    });
    try {
      const response = await fetch(
        `/api/reports/general-donation-statistics?${query}`,
        { cache: "no-store" },
      );
      const data = (await response.json()) as {
        rows?: Stat[];
        details?: Detail[];
        filters?: { definitions: Definition[] };
        message?: string;
      };
      if (!response.ok) throw new Error(data.message);
      setRows((data.rows ?? []).filter((row) => row.sentCount > 0));
      setDetails((data.details ?? []).filter((row) => row.sent));
      setDefinitions(data.filters?.definitions ?? []);
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Gönderilen istatistik verileri yüklenemedi.",
      );
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    void load(initial);
  }, [load]);

  const countries = definitions.filter(
    (item) => item.type === "DESTINATION_COUNTRY",
  );
  const regions = definitions.filter(
    (item) =>
      item.type === "DESTINATION_REGION" &&
      (!filters.destinationCountryId ||
        item.parentId === filters.destinationCountryId),
  );
  const partners = definitions.filter(
    (item) =>
      item.type === "PARTNER" &&
      (!filters.destinationCountryId ||
        item.parentId === filters.destinationCountryId),
  );
  const totals = useMemo(
    () =>
      rows.reduce(
        (sum, row) => ({
          count: sum.count + row.sentCount,
          amount: sum.amount + row.service,
        }),
        { count: 0, amount: 0 },
      ),
    [rows],
  );

  function update(field: keyof Filters, value: string) {
    setFilters((current) =>
      field === "destinationCountryId"
        ? {
            ...current,
            destinationCountryId: value,
            destinationRegionId: "",
            partnerId: "",
            range: "",
          }
        : { ...current, [field]: value, range: field === "range" ? value : "" },
    );
  }
  function quickRange(range: string) {
    const next = { ...filters, range, year: "", month: "", from: "", to: "" };
    setFilters(next);
    void load(next);
  }
  function exportCsv() {
    const data = [
      ["Ödenen Kasa / Bağış Türü", "Gönderilen Adet", "Gönderilen Toplam"],
      ...rows.map((row) => [
        row.type,
        String(row.sentCount),
        String(row.service),
      ]),
      ["GENEL TOPLAM", String(totals.count), String(totals.amount)],
    ];
    const csv = `\uFEFF${data.map((row) => row.map((cell) => `"${cell.replaceAll('"', '""')}"`).join(";")).join("\n")}`;
    const url = URL.createObjectURL(
      new Blob([csv], { type: "text/csv;charset=utf-8" }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = "gonderilen-genel-istatistik.csv";
    link.click();
    URL.revokeObjectURL(url);
  }
  function printReport() {
    printReportDocument({
      title: "Gönderilen Genel İstatistik Raporu",
      subtitle: `${filters.year || "Tüm yıllar"}${filters.month ? ` · ${filters.month}. ay` : ""}`,
      summaries: [
        { label: "Gönderilen Adet", value: String(totals.count) },
        { label: "Gönderilen Toplam", value: formatCurrency(totals.amount) },
      ],
      tables: [{
        title: "Gönderilen Bağış Tablosu",
        headers: ["Ödenen Kasa / Bağış Türü", "Gönderilen Adet", "Gönderilen Toplam"],
        rows: rows.map((row) => [row.type, row.sentCount, formatCurrency(row.service)]),
        footer: ["GENEL TOPLAM", totals.count, formatCurrency(totals.amount)],
      }],
      note: "Yalnızca gönderim durumu tamamlanmış genel bağış kayıtları hesaplanır.",
    });
  }

  return (
    <div className="mx-auto max-w-[1540px]">
      <div className="mb-4">
        <h2 className="text-xl font-bold text-[#0b2b3c]">
          Gönderilen Genel İstatistik
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          Gönderimi tamamlanan genel bağışların ülke, bölge ve partner bazlı
          ödeme özeti
        </p>
      </div>
      <Card className="overflow-hidden">
        <div className="border-b px-5 py-3">
          <h3 className="font-bold text-[#0b2b3c]">Sorgulama</h3>
        </div>
        <div className="grid gap-4 p-4 xl:grid-cols-[330px_1fr]">
          <aside className="rounded-lg bg-[#2ba8c4] p-5">
            <Select
              label="Gönderilen Ülke"
              value={filters.destinationCountryId}
              items={countries}
              onChange={(value) => update("destinationCountryId", value)}
            />
            <Select
              label="Gönderilen Temsilci / Bölge"
              value={filters.destinationRegionId}
              items={regions}
              onChange={(value) => update("destinationRegionId", value)}
            />
            <Select
              label="Ödeme Yapılan Partner / Firma"
              value={filters.partnerId}
              items={partners}
              onChange={(value) => update("partnerId", value)}
            />
            <Field label="Yıl">
              <select
                className={`${control} bg-yellow-200 font-bold`}
                value={filters.year}
                onChange={(event) => update("year", event.target.value)}
              >
                <option value="">Seçiniz</option>
                {[2024, 2025, 2026].map((year) => (
                  <option key={year}>{year}</option>
                ))}
              </select>
            </Field>
            <Field label="Ay">
              <select
                className={control}
                value={filters.month}
                onChange={(event) => update("month", event.target.value)}
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
            </Field>
            <Field label="İlk Tarih">
              <input
                className={control}
                type="date"
                value={filters.from}
                onChange={(event) => update("from", event.target.value)}
              />
            </Field>
            <Field label="Son Tarih">
              <input
                className={control}
                type="date"
                min={filters.from}
                value={filters.to}
                onChange={(event) => update("to", event.target.value)}
              />
            </Field>
            <Button
              className="mt-4 w-full bg-[#029d95] hover:bg-[#17766c]"
              onClick={() => void load(filters)}
            >
              <Search className="size-4" /> Sorgula
            </Button>
            <Button
              variant="success"
              className="mt-2 w-full"
              onClick={exportCsv}
            >
              <Download className="size-4" /> Excel Yazdır
            </Button>
            <Button variant="outline" className="mt-2 w-full bg-white" onClick={printReport}>
              <Printer className="size-4" /> Yazıcıya Gönder
            </Button>
          </aside>
          <section>
            <div className="mb-4 grid gap-3 sm:grid-cols-3">
              <Button variant="success" onClick={() => quickRange("today")}>
                <CalendarDays className="size-4" /> Bugün
              </Button>
              <Button
                className="bg-red-500 hover:bg-red-600"
                onClick={() => quickRange("month")}
              >
                <CalendarDays className="size-4" /> Bu Ay
              </Button>
              <Button variant="success" onClick={() => quickRange("year")}>
                <CalendarDays className="size-4" /> Bu Yıl
              </Button>
            </div>
            <div className="overflow-hidden rounded-lg border">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#02b3aa] text-white">
                  <tr>
                    <th className="w-[210px] p-3">Detay</th>
                    <th className="p-3">Ödenen Kasa / Bağış Türü</th>
                    <th className="p-3 text-right">Gönderilen Adet</th>
                    <th className="p-3 text-right">Gönderilen Toplam</th>
                  </tr>
                </thead>
                <tbody className="bg-yellow-50">
                  {loading ? (
                    <tr>
                      <td colSpan={4} className="p-16 text-center">
                        <LoaderCircle className="mx-auto size-5 animate-spin" />
                      </td>
                    </tr>
                  ) : (
                    rows.map((row) => (
                      <tr key={row.typeId} className="border-b">
                        <td className="p-2">
                          <button
                            onClick={() => setSelected(row)}
                            className="w-full rounded bg-[#029d95] px-3 py-2 font-semibold text-white"
                          >
                            Detay Göster
                          </button>
                        </td>
                        <td className="p-3 font-semibold">{row.type}</td>
                        <td className="p-3 text-right">{row.sentCount}</td>
                        <td className="p-3 text-right font-bold">
                          {formatCurrency(row.service)}
                        </td>
                      </tr>
                    ))
                  )}
                  {!loading && !rows.length ? (
                    <tr>
                      <td
                        colSpan={4}
                        className="p-16 text-center text-slate-500"
                      >
                        Seçili filtrelerde gönderilmiş kayıt bulunamadı.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
                <tfoot className="bg-slate-100 font-bold">
                  <tr>
                    <td className="p-3" />
                    <td className="p-3">GENEL TOPLAM</td>
                    <td className="p-3 text-right">{totals.count}</td>
                    <td className="p-3 text-right">
                      {formatCurrency(totals.amount)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
            {error && (
              <p className="mt-3 rounded bg-red-50 p-3 text-xs text-red-700">
                {error}
              </p>
            )}
          </section>
        </div>
      </Card>
      {selected && (
        <SentDetailModal
          stat={selected}
          rows={details.filter((row) => row.typeId === selected.typeId)}
          close={() => setSelected(null)}
        />
      )}
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="mt-3 block text-[10px] font-bold text-white">
      {label}
      {children}
    </label>
  );
}
function Select({
  label,
  value,
  items,
  onChange,
}: {
  label: string;
  value: string;
  items: Definition[];
  onChange: (value: string) => void;
}) {
  return (
    <Field label={label}>
      <select
        className={control}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        <option value="">Seçiniz</option>
        {items.map((item) => (
          <option key={item.id} value={item.id}>
            {item.name}
          </option>
        ))}
      </select>
    </Field>
  );
}
function SentDetailModal({
  stat,
  rows,
  close,
}: {
  stat: Stat;
  rows: Detail[];
  close: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-[100] grid place-items-center bg-slate-950/45 p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) close();
      }}
    >
      <div className="max-h-[85vh] w-full max-w-5xl overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b p-4">
          <div>
            <h3 className="font-bold">{stat.type} Gönderim Detayı</h3>
            <p className="text-xs text-slate-500">
              {rows.length} kayıt · {formatCurrency(stat.service)}
            </p>
          </div>
          <button onClick={close}>
            <X className="size-5" />
          </button>
        </div>
        <div className="max-h-[70vh] overflow-auto">
          <table className="w-full min-w-[800px] text-left text-xs">
            <thead className="sticky top-0 bg-slate-100">
              <tr>
                <th className="p-3">Makbuz</th>
                <th className="p-3">Bağışçı</th>
                <th className="p-3">Telefon</th>
                <th className="p-3">Gönderilen Yer</th>
                <th className="p-3">Ödeme</th>
                <th className="p-3">Adet</th>
                <th className="p-3 text-right">Tutar</th>
                <th className="p-3">Tarih</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-t">
                  <td className="p-3">{row.receiptNo}</td>
                  <td className="p-3 font-semibold">{row.donorName}</td>
                  <td className="p-3">{row.phone}</td>
                  <td className="p-3">{row.destination}</td>
                  <td className="p-3">{row.payment}</td>
                  <td className="p-3">{row.quantity}</td>
                  <td className="p-3 text-right font-bold">
                    {formatCurrency(row.amount)}
                  </td>
                  <td className="p-3">
                    {new Date(row.date).toLocaleDateString("tr-TR")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
