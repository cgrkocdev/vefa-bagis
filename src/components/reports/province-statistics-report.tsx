"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Download, LoaderCircle, Printer, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { printReportDocument } from "@/lib/client/print-report";

type Definition = { id: string; type: string; name: string };
type Row = { name: string; count: number; amount: number };
type Detail = {
  id: string;
  type: string;
  receiptNo: string;
  donorName: string;
  phone: string;
  country: string;
  city: string;
  district: string;
  destination: string;
  payment: string;
  quantity: number;
  amount: number;
  date: string;
};
type Filters = {
  destinationCountryId: string;
  paymentMethodId: string;
  year: string;
  month: string;
  from: string;
  to: string;
};
const initial: Filters = {
  destinationCountryId: "",
  paymentMethodId: "",
  year: "2026",
  month: "",
  from: "",
  to: "",
};
const control =
  "h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-700 outline-none focus:border-cyan-500";

export function ProvinceStatisticsReport({
  mode = "province",
  inKindOnly = false,
}: {
  mode?: "province" | "district";
  inKindOnly?: boolean;
}) {
  const [filters, setFilters] = useState(initial);
  const [definitions, setDefinitions] = useState<Definition[]>([]);
  const [countries, setCountries] = useState<Row[]>([]);
  const [provinces, setProvinces] = useState<Row[]>([]);
  const [districts, setDistricts] = useState<Row[]>([]);
  const [details, setDetails] = useState<Detail[]>([]);
  const [selectedCountry, setSelectedCountry] = useState("");
  const [selectedProvince, setSelectedProvince] = useState("");
  const [detailSelection, setDetailSelection] = useState<{
    country: string;
    city: string;
    district: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(
    async (active: Filters) => {
      setLoading(true);
      setError("");
      const query = new URLSearchParams();
      Object.entries(active).forEach(([key, value]) => {
        if (value) query.set(key, value);
      });
      if (inKindOnly) query.set("inKindOnly", "true");
      try {
        const response = await fetch(
          `/api/reports/province-statistics?${query}`,
          { cache: "no-store" },
        );
        const data = (await response.json()) as {
          country?: Row[];
          province?: Row[];
          district?: Row[];
          details?: Detail[];
          filters?: { definitions: Definition[] };
          message?: string;
        };
        if (!response.ok) throw new Error(data.message);
        setCountries(data.country ?? []);
        setProvinces(data.province ?? []);
        setDistricts(data.district ?? []);
        setDetails(data.details ?? []);
        setDefinitions(data.filters?.definitions ?? []);
        setSelectedCountry("");
        setSelectedProvince("");
      } catch (reason) {
        setError(
          reason instanceof Error
            ? reason.message
            : `${inKindOnly ? "Ayni " : ""}${mode === "district" ? "İlçe" : "İl"} istatistik raporu yüklenemedi.`,
        );
      } finally {
        setLoading(false);
      }
    },
    [inKindOnly, mode],
  );
  useEffect(() => {
    void load(initial);
  }, [load]);

  const destinationCountries = definitions.filter(
    (item) => item.type === "DESTINATION_COUNTRY",
  );
  const payments = definitions.filter((item) => item.type === "PAYMENT_METHOD");
  const visibleProvinces = useMemo(
    () =>
      !selectedCountry
        ? []
        : provinces.filter(
            (row) => row.name.split("|||")[0] === selectedCountry,
          ),
    [provinces, selectedCountry],
  );
  const visibleDistricts = useMemo(
    () =>
      !selectedCountry || !selectedProvince
        ? []
        : districts.filter((row) => {
            const [country, city] = row.name.split("|||");
            return country === selectedCountry && city === selectedProvince;
          }),
    [districts, selectedCountry, selectedProvince],
  );
  const selectedDetails = useMemo(
    () =>
      !detailSelection
        ? []
        : details.filter(
            (item) =>
              item.country === detailSelection.country &&
              item.city === detailSelection.city &&
              item.district === detailSelection.district,
          ),
    [details, detailSelection],
  );

  function selectCountry(row: Row) {
    setSelectedCountry(row.name);
    setSelectedProvince("");
  }
  function selectProvince(row: Row) {
    const [country, city] = row.name.split("|||");
    setSelectedCountry(country ?? "");
    setSelectedProvince(city ?? "Belirtilmemiş");
  }
  function exportRows(
    filename: string,
    rows: Row[],
    level: "country" | "province" | "district",
  ) {
    const data = [
      [
        "Sıra",
        level === "country" ? "Ülke" : level === "province" ? "İl" : "İlçe",
        "Bağış Adedi",
        "Tutar",
      ],
      ...rows.map((row, index) => [
        String(index + 1),
        row.name.split("|||").at(-1) ?? row.name,
        String(row.count),
        String(row.amount),
      ]),
    ];
    const csv = `\uFEFF${data.map((row) => row.map((cell) => `"${cell.replaceAll('"', '""')}"`).join(";")).join("\n")}`;
    const url = URL.createObjectURL(
      new Blob([csv], { type: "text/csv;charset=utf-8" }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = `${filename}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="mx-auto max-w-[1540px]">
      <div className="mb-4">
        <h2 className="text-xl font-bold text-[#0b2b3c]">
          {inKindOnly
            ? `Ayni Bağış (${mode === "district" ? "İlçe" : "İl"})`
            : mode === "district"
              ? "İlçe İstatistik"
              : "İl İstatistik"}
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          {mode === "district"
            ? `${inKindOnly ? "Yalnızca ayni bağışlarda " : ""}şehir seçimine göre ilçe dağılımı, toplamlar ve bağış kayıtları`
            : `${inKindOnly ? "Yalnızca ayni bağışlarda " : ""}ülke → şehir → ilçe hiyerarşisinde dinamik bağış dağılımı ve kayıt detayları`}
        </p>
      </div>
      <Card className="overflow-hidden">
        <div className="border-b px-5 py-3 font-bold">Sorgulama</div>
        <div className="grid gap-3 p-4 md:grid-cols-2 xl:grid-cols-3">
          <Select
            label="Giden Ülke"
            value={filters.destinationCountryId}
            items={destinationCountries}
            onChange={(value) =>
              setFilters((current) => ({
                ...current,
                destinationCountryId: value,
              }))
            }
          />
          <Field label="Yıl">
            <select
              className={`${control} bg-yellow-200 font-bold`}
              value={filters.year}
              onChange={(event) =>
                setFilters((current) => ({
                  ...current,
                  year: event.target.value,
                }))
              }
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
              onChange={(event) =>
                setFilters((current) => ({
                  ...current,
                  month: event.target.value,
                }))
              }
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
          <Select
            label="Ödeme Şekli"
            value={filters.paymentMethodId}
            items={payments}
            onChange={(value) =>
              setFilters((current) => ({ ...current, paymentMethodId: value }))
            }
          />
          <Field label="İlk Tarih">
            <input
              className={control}
              type="date"
              value={filters.from}
              onChange={(event) =>
                setFilters((current) => ({
                  ...current,
                  from: event.target.value,
                }))
              }
            />
          </Field>
          <Field label="Son Tarih">
            <input
              className={control}
              type="date"
              min={filters.from}
              value={filters.to}
              onChange={(event) =>
                setFilters((current) => ({
                  ...current,
                  to: event.target.value,
                }))
              }
            />
          </Field>
          <Button
            className="w-40"
            variant="success"
            onClick={() => void load(filters)}
          >
            <Search className="size-4" /> Sorgula
          </Button>
        </div>
      </Card>
      {mode === "province" ? (
        <div className="mt-5 grid gap-5 xl:grid-cols-3">
          <HierarchyTable
            title={`Gelen Ülke ${inKindOnly ? "Ayni Bağış" : "Bağış"} İstatistik`}
            label="Bağış Gelen Ülke"
            rows={countries}
            loading={loading}
            active={selectedCountry}
            display={(row) => row.name}
            onDetail={selectCountry}
            onExport={() =>
              exportRows("gelen-ulke-istatistik", countries, "country")
            }
          />
          <HierarchyTable
            title={
              selectedCountry
                ? `${selectedCountry} ${inKindOnly ? "Ayni Bağış " : ""}Şehirleri`
                : "Ülke Seçiminden Sonra Şehirler"
            }
            label="Bağış Gelen İl"
            rows={visibleProvinces}
            loading={loading}
            active={selectedProvince}
            display={(row) => row.name.split("|||")[1] ?? "Belirtilmemiş"}
            onDetail={selectProvince}
            onExport={() =>
              exportRows(
                `${selectedCountry}-sehirleri`,
                visibleProvinces,
                "province",
              )
            }
            emptyText="Şehirleri görmek için soldaki ülkelerden Detay'a basın."
          />
          <HierarchyTable
            title={
              selectedProvince
                ? `${selectedProvince} ${inKindOnly ? "Ayni Bağış " : ""}İlçeleri`
                : "Şehir Seçiminden Sonra İlçeler"
            }
            label="Bağış Gelen İlçe"
            rows={visibleDistricts}
            loading={loading}
            display={(row) => row.name.split("|||")[2] ?? "Belirtilmemiş"}
            onDetail={(row) => {
              const [country, city, district] = row.name.split("|||");
              setDetailSelection({ country, city, district });
            }}
            onExport={() =>
              exportRows(
                `${selectedProvince}-ilceleri`,
                visibleDistricts,
                "district",
              )
            }
            emptyText="İlçeleri görmek için orta tablodaki şehirlerden Detay'a basın."
          />
        </div>
      ) : (
        <div className="mt-5 grid gap-5 xl:grid-cols-2">
          <HierarchyTable
            title={`${inKindOnly ? "Ayni Bağış " : ""}Şehir Bazlı Bağış İstatistiği`}
            label="Bağış Gelen Şehir / Ülke"
            rows={provinces}
            loading={loading}
            active={
              selectedCountry && selectedProvince
                ? `${selectedCountry}|||${selectedProvince}`
                : ""
            }
            display={(row) => {
              const [country, city] = row.name.split("|||");
              return `${city} · ${country}`;
            }}
            onDetail={selectProvince}
            onExport={() =>
              exportRows("sehir-bazli-bagis-istatistik", provinces, "province")
            }
            emptyText="Seçili filtrelerde şehir kaydı bulunamadı."
          />
          <HierarchyTable
            title={
              selectedProvince
                ? `${selectedProvince} ${inKindOnly ? "Ayni Bağış " : ""}İlçe İstatistiği`
                : "Şehir Seçiminden Sonra İlçeler"
            }
            label="Bağış Gelen İlçe"
            rows={visibleDistricts}
            loading={loading}
            display={(row) => row.name.split("|||")[2] ?? "Belirtilmemiş"}
            onDetail={(row) => {
              const [country, city, district] = row.name.split("|||");
              setDetailSelection({ country, city, district });
            }}
            onExport={() =>
              exportRows(
                `${selectedProvince || "secilen-sehir"}-ilce-istatistik`,
                visibleDistricts,
                "district",
              )
            }
            emptyText="İlçeleri görmek için soldaki şehirlerden Detay'a basın."
          />
        </div>
      )}
      {error && (
        <p className="mt-4 rounded bg-red-50 p-3 text-xs text-red-700">
          {error}
        </p>
      )}
      {detailSelection && (
        <DetailModal
          title={`${detailSelection.city} / ${detailSelection.district}`}
          rows={selectedDetails}
          close={() => setDetailSelection(null)}
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
function HierarchyTable({
  title,
  label,
  rows,
  loading,
  active = "",
  display,
  onDetail,
  onExport,
  emptyText = "Kayıt bulunamadı.",
}: {
  title: string;
  label: string;
  rows: Row[];
  loading: boolean;
  active?: string;
  display: (row: Row) => string;
  onDetail: (row: Row) => void;
  onExport: () => void;
  emptyText?: string;
}) {
  const total = rows.reduce((sum, row) => sum + row.amount, 0);
  const printTable = () => printReportDocument({
    title,
    subtitle: `${rows.length} kırılım · ${rows.reduce((sum, row) => sum + row.count, 0)} bağış`,
    summaries: [{ label: "Kayıt/Kırılım", value: String(rows.length) }, { label: "Bağış Adedi", value: String(rows.reduce((sum, row) => sum + row.count, 0)) }, { label: "Toplam Tutar", value: formatCurrency(total) }],
    tables: [{ headers: ["Sıra", label, "Bağış Adedi", "Tutar"], rows: rows.map((row, index) => [index + 1, display(row), row.count, formatCurrency(row.amount)]), footer: ["", "TOPLAM", rows.reduce((sum, row) => sum + row.count, 0), formatCurrency(total)] }],
  });
  return (
    <Card className="overflow-hidden">
      <div className="flex justify-center gap-2 py-3">
        <Button variant="success" disabled={!rows.length} onClick={onExport}>
          <Download className="size-4" /> Excel
        </Button>
        <Button variant="outline" disabled={!rows.length} onClick={printTable}>
          <Printer className="size-4" /> Yazıcıya Gönder
        </Button>
      </div>
      <h3 className="min-h-14 bg-[#02b3aa] px-3 py-3 text-center text-[10px] font-bold uppercase text-white">
        {title}
      </h3>
      <div className="max-h-[520px] overflow-auto">
        <table className="w-full text-left text-[10px]">
          <thead className="sticky top-0 bg-[#02b3aa] text-white">
            <tr>
              <th className="p-2">Detay</th>
              <th className="p-2">No</th>
              <th className="p-2">{label}</th>
              <th className="p-2 text-right">Adet</th>
              <th className="p-2 text-right">Tutar</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="p-12 text-center">
                  <LoaderCircle className="mx-auto size-5 animate-spin" />
                </td>
              </tr>
            ) : (
              rows.map((row, index) => {
                const name = display(row);
                const isActive = name === active || row.name === active;
                return (
                  <tr
                    key={row.name}
                    className={`border-b ${isActive ? "bg-emerald-100" : "even:bg-slate-50"}`}
                  >
                    <td className="p-2">
                      <button
                        onClick={() => onDetail(row)}
                        className="rounded bg-[#029d95] px-2 py-1.5 font-semibold text-white"
                      >
                        Detay
                      </button>
                    </td>
                    <td className="p-2">{index + 1}</td>
                    <td className="p-2 font-semibold">{name}</td>
                    <td className="p-2 text-right">{row.count}</td>
                    <td className="p-2 text-right">
                      {formatCurrency(row.amount)}
                    </td>
                  </tr>
                );
              })
            )}
            {!loading && !rows.length ? (
              <tr>
                <td
                  colSpan={5}
                  className="p-12 text-center leading-5 text-slate-500"
                >
                  {emptyText}
                </td>
              </tr>
            ) : null}
          </tbody>
          <tfoot className="sticky bottom-0 bg-[#376bc1] font-bold text-white">
            <tr>
              <td className="p-2" colSpan={3}>
                TOPLAM · {rows.length}
              </td>
              <td className="p-2 text-right">
                {rows.reduce((sum, row) => sum + row.count, 0)}
              </td>
              <td className="p-2 text-right">{formatCurrency(total)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </Card>
  );
}
function DetailModal({
  title,
  rows,
  close,
}: {
  title: string;
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
            <h3 className="font-bold">{title} Bağış Detayı</h3>
            <p className="text-xs text-slate-500">
              {rows.length} kayıt ·{" "}
              {formatCurrency(rows.reduce((sum, row) => sum + row.amount, 0))}
            </p>
          </div>
          <button onClick={close}>
            <X className="size-5" />
          </button>
        </div>
        <div className="max-h-[70vh] overflow-auto">
          <table className="w-full min-w-[850px] text-left text-xs">
            <thead className="sticky top-0 bg-slate-100">
              <tr>
                <th className="p-3">Makbuz</th>
                <th className="p-3">Bağışçı</th>
                <th className="p-3">Telefon</th>
                <th className="p-3">Tür</th>
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
                  <td className="p-3">{row.type}</td>
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
