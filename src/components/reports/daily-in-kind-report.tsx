"use client";

import { useCallback, useEffect, useState } from "react";
import { Download, LoaderCircle, Printer, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { printReportDocument } from "@/lib/client/print-report";

type Definition = { id: string; type: string; name: string };
type Group = { id: string; name: string };
type Row = {
  date: string;
  year: number;
  values: Record<string, number>;
  total: number;
  records: number;
};
type Filters = {
  originCountry: string;
  originCity: string;
  originDistrict: string;
  destinationCountryId: string;
  reality: string;
  year: string;
  month: string;
  from: string;
  to: string;
};
const initial: Filters = {
  originCountry: "",
  originCity: "",
  originDistrict: "",
  destinationCountryId: "",
  reality: "",
  year: "2026",
  month: "",
  from: "",
  to: "",
};
const control =
  "h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-700 outline-none focus:border-cyan-500";

export function DailyInKindReport() {
  const [filters, setFilters] = useState(initial),
    [rows, setRows] = useState<Row[]>([]),
    [groups, setGroups] = useState<Group[]>([]),
    [columnTotals, setColumnTotals] = useState<Record<string, number>>({}),
    [grandTotal, setGrandTotal] = useState(0),
    [recordCount, setRecordCount] = useState(0),
    [definitions, setDefinitions] = useState<Definition[]>([]),
    [origins, setOrigins] = useState<{
      countries: string[];
      cities: string[];
      districts: string[];
    }>({ countries: [], cities: [], districts: [] }),
    [loading, setLoading] = useState(true),
    [error, setError] = useState("");
  const load = useCallback(async (active: Filters) => {
    setLoading(true);
    setError("");
    const query = new URLSearchParams();
    Object.entries(active).forEach(([k, v]) => {
      if (v) query.set(k, v);
    });
    try {
      const response = await fetch(`/api/reports/daily-in-kind?${query}`, {
        cache: "no-store",
      });
      const data = (await response.json()) as {
        rows?: Row[];
        groups?: Group[];
        columnTotals?: Record<string, number>;
        grandTotal?: number;
        recordCount?: number;
        filters?: {
          definitions: Definition[];
          origins: {
            countries: string[];
            cities: string[];
            districts: string[];
          };
        };
        message?: string;
      };
      if (!response.ok) throw new Error(data.message);
      setRows(data.rows ?? []);
      setGroups(data.groups ?? []);
      setColumnTotals(data.columnTotals ?? {});
      setGrandTotal(data.grandTotal ?? 0);
      setRecordCount(data.recordCount ?? 0);
      setDefinitions(data.filters?.definitions ?? []);
      setOrigins(
        data.filters?.origins ?? { countries: [], cities: [], districts: [] },
      );
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Günlük ayni bağış raporu yüklenemedi.",
      );
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    void load(initial);
  }, [load]);
  const update = (key: keyof Filters, value: string) =>
    setFilters((current) =>
      key === "originCountry"
        ? {
            ...current,
            originCountry: value,
            originCity: "",
            originDistrict: "",
          }
        : key === "originCity"
          ? { ...current, originCity: value, originDistrict: "" }
          : { ...current, [key]: value },
    );
  const countries = definitions.filter(
    (item) => item.type === "DESTINATION_COUNTRY",
  );
  const matrix = () => [
    ["Sıra", "Yıl", "Tarih", ...groups.map((g) => g.name), "Toplam"],
    ...rows.map((row, index) => [
      String(index + 1),
      String(row.year),
      new Date(`${row.date}T12:00:00`).toLocaleDateString("tr-TR"),
      ...groups.map((g) => String(row.values[g.id] ?? 0)),
      String(row.total),
    ]),
    [
      "",
      "",
      "TOPLAM",
      ...groups.map((g) => String(columnTotals[g.id] ?? 0)),
      String(grandTotal),
    ],
  ];
  function excel() {
    const csv = `\uFEFF${matrix()
      .map((r) => r.map((c) => `"${c.replaceAll('"', '""')}"`).join(";"))
      .join("\n")}`;
    const url = URL.createObjectURL(
      new Blob([csv], { type: "text/csv;charset=utf-8" }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = "gunluk-ayni-bagis.csv";
    a.click();
    URL.revokeObjectURL(url);
  }
  function print() {
    const data = matrix();
    printReportDocument({
      title: "Günlük Ayni Bağış Raporu",
      subtitle: `${filters.year || "Tüm yıllar"}${filters.month ? ` · ${filters.month}. ay` : ""} · ${rows.length} gün`,
      orientation: "landscape",
      summaries: [
        { label: "Kayıt Sayısı", value: String(recordCount) },
        { label: "Gün Sayısı", value: String(rows.length) },
        { label: "Genel Toplam", value: tl(grandTotal) },
      ],
      tables: [
        {
          title: "Gün ve Bağış Grubu Dağılımı",
          headers: data[0],
          rows: data.slice(1, -1),
          footer: data.at(-1),
        },
      ],
      note: "Sütunlar aktif ayni bağış gruplarından dinamik olarak oluşturulur.",
    });
  }
  return (
    <div className="mx-auto max-w-[1580px]" id="daily-in-kind-report">
      <div className="mb-4">
        <h2 className="text-xl font-bold text-[#0b2b3c]">
          Günlük Ayni Gelen Bağışlar
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          Gün ve bağış grubu bazında ayni yardım hareketleri
        </p>
      </div>
      <Card className="overflow-hidden">
        <div className="border-b px-5 py-3 font-bold">Sorgulama</div>
        <div className="grid gap-3 p-4 md:grid-cols-2 xl:grid-cols-3">
          <StringSelect
            label="Bağış Gelen Ülke"
            value={filters.originCountry}
            items={origins.countries}
            set={(v) => update("originCountry", v)}
          />
          <StringSelect
            label="Bağış Gelen Şehir"
            value={filters.originCity}
            items={origins.cities}
            set={(v) => update("originCity", v)}
          />
          <StringSelect
            label="Bağış Gelen İlçe"
            value={filters.originDistrict}
            items={origins.districts}
            set={(v) => update("originDistrict", v)}
          />
          <Select
            label="Bağış Giden Ülke"
            value={filters.destinationCountryId}
            items={countries}
            set={(v) => update("destinationCountryId", v)}
          />
          <EnumSelect
            label="Gerçek Durum"
            value={filters.reality}
            options={[
              ["REAL", "Gerçek"],
              ["VIRTUAL", "Sanal"],
            ]}
            set={(v) => update("reality", v)}
          />
          <Field label="Yıl">
            <select
              className={`${control} bg-yellow-200 font-bold`}
              value={filters.year}
              onChange={(e) => update("year", e.target.value)}
            >
              <option value="">Tümü</option>
              {[2024, 2025, 2026, 2027].map((y) => (
                <option key={y}>{y}</option>
              ))}
            </select>
          </Field>
          <Field label="Ay">
            <select
              className={control}
              value={filters.month}
              onChange={(e) => update("month", e.target.value)}
            >
              <option value="">Tümü</option>
              {months.map((m, i) => (
                <option key={m} value={i + 1}>
                  {m}
                </option>
              ))}
            </select>
          </Field>
          <Field label="İlk Tarih">
            <input
              className={control}
              type="date"
              value={filters.from}
              onChange={(e) => update("from", e.target.value)}
            />
          </Field>
          <Field label="Son Tarih">
            <input
              className={control}
              min={filters.from}
              type="date"
              value={filters.to}
              onChange={(e) => update("to", e.target.value)}
            />
          </Field>
          <div className="flex items-end justify-center xl:col-span-3">
            <Button
              className="w-44"
              variant="success"
              onClick={() => void load(filters)}
            >
              <Search className="size-4" /> Sorgula
            </Button>
          </div>
        </div>
      </Card>
      <Card className="mt-5 overflow-hidden">
        <div className="print-hidden flex flex-wrap items-center justify-between gap-3 border-b p-4">
          <div>
            <h3 className="font-bold">Günlük Ayni Bağış Tablosu</h3>
            <p className="text-xs text-slate-500">
              {recordCount} kayıt · {rows.length} gün · Genel toplam{" "}
              {tl(grandTotal)}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={print}>
              <Printer className="size-4" /> Yazıcıya Gönder
            </Button>
            <Button variant="success" onClick={excel}>
              <Download className="size-4" /> Excel Yazdır
            </Button>
          </div>
        </div>
        <div className="hidden border-b-2 p-4 print:block">
          <h1 className="text-xl font-bold">Yedirenk Derneği · Günlük Ayni Bağış Raporu</h1>
          <p className="text-xs">
            {new Date().toLocaleString("tr-TR")} · {recordCount} kayıt
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-[10px]">
            <thead className="bg-[#02b3aa] text-white">
              <tr>
                <th className="p-3">Sıra No</th>
                <th className="p-3">Yıl</th>
                <th className="p-3">Tarih</th>
                {groups.map((g) => (
                  <th key={g.id} className="p-3 text-right uppercase">
                    {g.name}
                  </th>
                ))}
                <th className="p-3 text-right">Toplam</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={groups.length + 4} className="p-16 text-center">
                    <LoaderCircle className="mx-auto size-5 animate-spin" />
                  </td>
                </tr>
              ) : (
                rows.map((row, index) => (
                  <tr key={row.date} className="border-b even:bg-slate-50">
                    <td className="p-3">{index + 1}</td>
                    <td className="p-3">{row.year}</td>
                    <td className="p-3 font-semibold">
                      {new Date(`${row.date}T12:00:00`).toLocaleDateString(
                        "tr-TR",
                      )}
                    </td>
                    {groups.map((g) => (
                      <td key={g.id} className="p-3 text-right">
                        {row.values[g.id] ? tl(row.values[g.id]) : "—"}
                      </td>
                    ))}
                    <td className="p-3 text-right font-bold">
                      {tl(row.total)}
                    </td>
                  </tr>
                ))
              )}
              {!loading && !rows.length ? (
                <tr>
                  <td
                    colSpan={groups.length + 4}
                    className="p-16 text-center text-slate-500"
                  >
                    Seçili filtrelerde ayni bağış kaydı bulunamadı.
                  </td>
                </tr>
              ) : null}
            </tbody>
            <tfoot className="bg-[#376bc1] font-bold text-white">
              <tr>
                <td colSpan={3} className="p-3 text-right">
                  TOPLAM
                </td>
                {groups.map((g) => (
                  <td key={g.id} className="p-3 text-right">
                    {tl(columnTotals[g.id] ?? 0)}
                  </td>
                ))}
                <td className="p-3 text-right">{tl(grandTotal)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </Card>
      {error && (
        <p className="mt-3 rounded bg-red-50 p-3 text-xs text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}
const months = [
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
];
function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block text-[10px] font-bold text-slate-600">
      {label}
      {children}
    </label>
  );
}
function Select({
  label,
  value,
  items,
  set,
}: {
  label: string;
  value: string;
  items: Definition[];
  set: (v: string) => void;
}) {
  return (
    <Field label={label}>
      <select
        className={control}
        value={value}
        onChange={(e) => set(e.target.value)}
      >
        <option value="">Seçiniz</option>
        {items.map((i) => (
          <option key={i.id} value={i.id}>
            {i.name}
          </option>
        ))}
      </select>
    </Field>
  );
}
function StringSelect({
  label,
  value,
  items,
  set,
}: {
  label: string;
  value: string;
  items: string[];
  set: (v: string) => void;
}) {
  return (
    <Field label={label}>
      <select
        className={control}
        value={value}
        onChange={(e) => set(e.target.value)}
      >
        <option value="">Seçiniz</option>
        {items.map((i) => (
          <option key={i}>{i}</option>
        ))}
      </select>
    </Field>
  );
}
function EnumSelect({
  label,
  value,
  options,
  set,
}: {
  label: string;
  value: string;
  options: string[][];
  set: (v: string) => void;
}) {
  return (
    <Field label={label}>
      <select
        className={control}
        value={value}
        onChange={(e) => set(e.target.value)}
      >
        <option value="">Tümü</option>
        {options.map(([v, l]) => (
          <option key={v} value={v}>
            {l}
          </option>
        ))}
      </select>
    </Field>
  );
}
function tl(value: number) {
  return `${value.toLocaleString("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₺`;
}
