"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Download, LoaderCircle, Printer, Search, X } from "lucide-react";
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
type Row = {
  id: string;
  receiptNo: string;
  donorName: string;
  phone: string;
  originCountry: string;
  originCity: string;
  type: string;
  group: string;
  country: string;
  region: string;
  partner: string;
  paymentMethod: string;
  currency: string;
  quantity: number;
  unitType: string;
  unitPrice: number;
  amount: number;
  description: string;
  specialCondition: boolean;
  date: string;
  sent: boolean;
};
type Filters = {
  typeId: string;
  groupId: string;
  paymentMethodId: string;
  countryId: string;
  regionId: string;
  year: string;
  month: string;
  from: string;
  to: string;
};
const initial: Filters = {
  typeId: "",
  groupId: "",
  paymentMethodId: "",
  countryId: "",
  regionId: "",
  year: "2026",
  month: "",
  from: "",
  to: "",
};
const inputClass =
  "h-9 w-full rounded-md border border-slate-200 bg-white px-3 text-xs text-slate-700 outline-none focus:border-cyan-500";

export function IncomingOutgoingDetailReport() {
  const [definitions, setDefinitions] = useState<Definition[]>([]);
  const [filters, setFilters] = useState(initial);
  const [incoming, setIncoming] = useState<Row[]>([]);
  const [outgoing, setOutgoing] = useState<Row[]>([]);
  const [selected, setSelected] = useState<Row | null>(null);
  const [loading, setLoading] = useState(true);
  const load = useCallback(async (active: Filters) => {
    setLoading(true);
    const query = new URLSearchParams();
    Object.entries(active).forEach(([key, value]) => {
      if (value) query.set(key, value);
    });
    try {
      const response = await fetch(
        `/api/reports/incoming-outgoing-details?${query}`,
        { cache: "no-store" },
      );
      const data = (await response.json()) as {
        incoming?: Row[];
        outgoing?: Row[];
      };
      setIncoming(response.ok ? (data.incoming ?? []) : []);
      setOutgoing(response.ok ? (data.outgoing ?? []) : []);
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    void Promise.all([
      fetch("/api/definitions")
        .then((response) => response.json())
        .then((data) => setDefinitions(data.definitions ?? [])),
      load(initial),
    ]);
  }, [load]);
  const types = definitions.filter((item) => item.type === "DONATION_TYPE");
  const groups = definitions.filter(
    (item) => item.type === "GENERAL_DONATION_GROUP",
  );
  const paymentMethods = definitions.filter(
    (item) => item.type === "PAYMENT_METHOD",
  );
  const countries = definitions.filter(
    (item) => item.type === "DESTINATION_COUNTRY",
  );
  const regions = definitions.filter(
    (item) =>
      item.type === "DESTINATION_REGION" &&
      (!filters.countryId || item.parentId === filters.countryId),
  );
  const total = useMemo(
    () => outgoing.reduce((sum, row) => sum + row.amount, 0),
    [outgoing],
  );
  function update(field: keyof Filters, value: string) {
    setFilters((current) =>
      field === "countryId"
        ? { ...current, countryId: value, regionId: "" }
        : { ...current, [field]: value },
    );
  }
  function exportCsv() {
    const rows = [
      [
        "Durum",
        "Makbuz",
        "Bağışçı",
        "Telefon",
        "Tür",
        "Grup",
        "Gelen Ülke",
        "Gelen İl",
        "Gönderilen Ülke",
        "Gönderilen Bölge",
        "Partner",
        "Ödeme",
        "Adet",
        "Birim",
        "Birim Fiyat",
        "Tutar",
        "Tarih",
      ],
      ...incoming.map((row) => [
        row.sent ? "Gönderildi" : "Gelen",
        row.receiptNo,
        row.donorName,
        row.phone,
        row.type,
        row.group,
        row.originCountry,
        row.originCity,
        row.country,
        row.region,
        row.partner,
        row.paymentMethod,
        String(row.quantity),
        row.unitType,
        String(row.unitPrice),
        String(row.amount),
        new Date(row.date).toLocaleDateString("tr-TR"),
      ]),
    ];
    const csv = `\uFEFF${rows.map((row) => row.map((cell) => `"${cell.replaceAll('"', '""')}"`).join(";")).join("\n")}`;
    const url = URL.createObjectURL(
      new Blob([csv], { type: "text/csv;charset=utf-8" }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = "bagis-listesi-detay.csv";
    link.click();
    URL.revokeObjectURL(url);
  }
  function printReport() {
    const table = (title: string, items: Row[]) => ({
      title,
      headers: ["Makbuz", "Bağışçı", "Telefon", "Tür / Grup", "Gelen Yer", "Gönderilen Yer", "Partner", "Ödeme", "Adet", "Tutar", "Tarih"],
      rows: items.map((row) => [row.receiptNo, row.donorName, row.phone, `${row.type} / ${row.group}`, `${row.originCountry} / ${row.originCity}`, `${row.country} / ${row.region}`, row.partner, row.paymentMethod, `${row.quantity} ${row.unitType}`, formatCurrency(row.amount), new Date(row.date).toLocaleDateString("tr-TR")]),
      footer: ["", "TOPLAM", "", "", "", "", "", "", items.reduce((sum, row) => sum + row.quantity, 0), formatCurrency(items.reduce((sum, row) => sum + row.amount, 0)), ""],
    });
    printReportDocument({ title: "Gelen ve Gönderilen Bağış Listesi Detay", subtitle: `${filters.year || "Tüm yıllar"}${filters.month ? ` · ${filters.month}. ay` : ""}`, orientation: "landscape", summaries: [{ label: "Gelen Kayıt", value: String(incoming.length) }, { label: "Gönderilen Kayıt", value: String(outgoing.length) }, { label: "Gönderilen Toplam", value: formatCurrency(total) }], tables: [table("Gelen Bağış Tablosu", incoming), table("Gönderilen Bağış Tablosu", outgoing)] });
  }
  return (
    <div
      className="detail-report-print mx-auto max-w-[1540px]"
      id="printable-report"
    >
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-[#0b2b3c]">
            Gelen ve Gönderilen Bağış Listesi
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            Bağış hareketleri detay ve gönderim raporu
          </p>
        </div>
        <Button
          className="print-hidden"
          variant="primary"
          onClick={printReport}
        >
          <Printer className="size-4" /> A4 Yazdır / PDF
        </Button>
      </div>
      <div className="hidden border-b-2 border-[#0b2b3c] pb-3 print:block">
        <h1 className="text-xl font-bold">Yedirenk Derneği Bağış Yönetimi</h1>
        <p className="mt-1 text-xs">
          Gelen ve Gönderilen Bağış Listesi ·{" "}
          {new Date().toLocaleString("tr-TR")}
        </p>
      </div>
      <Card className="overflow-hidden">
        <div className="print-hidden border-b px-5 py-3">
          <h3 className="font-bold text-[#0b2b3c]">Sorgulama</h3>
        </div>
        <div className="print-hidden m-4 grid gap-3 bg-[#299dcb] p-4 md:grid-cols-2 xl:grid-cols-4">
          <Select
            label="Bağış Grubu"
            value={filters.groupId}
            items={groups}
            onChange={(v) => update("groupId", v)}
          />
          <Select
            label="Ödeme Şekli"
            value={filters.paymentMethodId}
            items={paymentMethods}
            onChange={(v) => update("paymentMethodId", v)}
          />
          <Select
            label="Bağış Türü (Cinsi)"
            value={filters.typeId}
            items={types}
            onChange={(v) => update("typeId", v)}
          />
          <Select
            label="Bağış Gelen Ülke"
            value={filters.countryId}
            items={countries}
            onChange={(v) => update("countryId", v)}
          />
          <Select
            label="Bağış Gelen İl"
            value={filters.regionId}
            items={regions}
            onChange={(v) => update("regionId", v)}
          />
          <Select
            label="Yıl"
            value={filters.year}
            items={[2024, 2025, 2026].map((y) => ({
              id: String(y),
              name: String(y),
              type: "",
              parentId: null,
            }))}
            onChange={(v) => update("year", v)}
            yellow
          />
          <label className="text-[10px] font-bold uppercase text-white">
            Ay
            <select
              className={inputClass}
              value={filters.month}
              onChange={(e) => update("month", e.target.value)}
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
              ].map((m, i) => (
                <option key={m} value={i + 1}>
                  {m}
                </option>
              ))}
            </select>
          </label>
          <label className="text-[10px] font-bold uppercase text-white">
            İlk Tarih
            <input
              className={inputClass}
              type="date"
              value={filters.from}
              onChange={(e) => update("from", e.target.value)}
            />
          </label>
          <label className="text-[10px] font-bold uppercase text-white">
            Son Tarih
            <input
              className={inputClass}
              type="date"
              min={filters.from}
              value={filters.to}
              onChange={(e) => update("to", e.target.value)}
            />
          </label>
          <div className="flex items-end gap-2">
            <Button
              className="flex-1 bg-violet-600 hover:bg-violet-700"
              onClick={() => void load(filters)}
            >
              <Search className="size-4" /> Sorgula
            </Button>
            <Button variant="success" onClick={exportCsv}>
              <Download className="size-4" /> Excel
            </Button>
          </div>
        </div>
        <div className="grid gap-4 p-4">
          <Table
            title="Gelen Bağış Tablosu"
            rows={incoming}
            loading={loading}
            onDetail={setSelected}
          />
          <Table
            title="Gönderilen Bağış Tablosu"
            rows={outgoing}
            loading={loading}
            onDetail={setSelected}
            orange
          />
          <p className="text-[10px] text-slate-500">
            * Gönderilen liste, Sipariş Durumu işaretli bağışlardan oluşur.
            Toplam: <strong>{formatCurrency(total)}</strong>
          </p>
        </div>
      </Card>
      {selected && (
        <div
          className="fixed inset-0 z-[100] grid place-items-center overflow-auto bg-slate-950/45 p-4"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setSelected(null);
          }}
        >
          <div className="w-full max-w-3xl rounded-2xl bg-white p-5 shadow-2xl">
            <div className="flex justify-between">
              <div>
                <h3 className="font-bold">Bağış Kayıt Detayı</h3>
                <p className="mt-1 text-xs text-slate-500">
                  Makbuz: {selected.receiptNo}
                </p>
              </div>
              <button onClick={() => setSelected(null)}>
                <X className="size-5" />
              </button>
            </div>
            <dl className="mt-4 grid gap-3 text-xs sm:grid-cols-2 lg:grid-cols-3">
              {[
                ["Bağışçı", selected.donorName],
                ["Telefon", selected.phone],
                ["Bağış Türü", selected.type],
                ["Bağış Grubu", selected.group],
                ["Gelen Ülke", selected.originCountry],
                ["Gelen İl", selected.originCity],
                ["Gönderilen Ülke", selected.country],
                ["Gönderilen Bölge", selected.region],
                ["Partner", selected.partner],
                ["Ödeme Şekli", selected.paymentMethod],
                ["Adet / Birim", `${selected.quantity} ${selected.unitType}`],
                ["Birim Fiyat", formatCurrency(selected.unitPrice)],
                ["Toplam Tutar", formatCurrency(selected.amount)],
                ["Para Birimi", selected.currency],
                ["Özel Şart", selected.specialCondition ? "Evet" : "Hayır"],
                ["Gönderim Durumu", selected.sent ? "Gönderildi" : "Bekliyor"],
                ["Tarih", new Date(selected.date).toLocaleString("tr-TR")],
                ["Açıklama", selected.description],
              ].map(([k, v]) => (
                <div key={k} className="rounded-lg bg-slate-50 p-3">
                  <dt className="text-slate-400">{k}</dt>
                  <dd className="mt-1 break-words font-semibold">{v}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      )}
    </div>
  );
}

function Select({
  label,
  value,
  items,
  onChange,
  yellow = false,
}: {
  label: string;
  value: string;
  items: Definition[];
  onChange: (v: string) => void;
  yellow?: boolean;
}) {
  return (
    <label className="text-[10px] font-bold uppercase text-white">
      {label}
      <select
        className={`${inputClass} ${yellow ? "bg-yellow-200 font-bold" : ""}`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
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
function Table({
  title,
  rows,
  loading,
  onDetail,
  orange = false,
}: {
  title: string;
  rows: Row[];
  loading: boolean;
  onDetail: (row: Row) => void;
  orange?: boolean;
}) {
  const total = rows.reduce((sum, row) => sum + row.amount, 0);
  return (
    <div className="overflow-hidden rounded-lg border">
      <h3
        className={`${orange ? "bg-orange-500" : "bg-blue-600"} py-2 text-center text-xs font-bold uppercase text-white`}
      >
        {title}
      </h3>
      <div className="max-h-[480px] overflow-y-auto">
        <table className="w-full table-fixed text-left text-[10px] sm:text-[11px]">
          <thead className="sticky top-0 z-10 bg-[#02b3aa] text-white">
            <tr>
              <th className="print-hidden w-[58px] p-2">Detay</th>
              <th className="w-[18%] p-2">Bağış Türü</th>
              <th className="w-[18%] p-2">Bağışçı</th>
              <th className="w-[16%] p-2">Ülke</th>
              <th className="w-[15%] p-2">İl / Bölge</th>
              <th className="w-[13%] p-2">Ödeme</th>
              <th className="w-[12%] p-2 text-right">Tutar</th>
              <th className="w-[10%] p-2">Tarih</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} className="p-10 text-center">
                  <LoaderCircle className="mx-auto size-5 animate-spin" />
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.id} className="border-b even:bg-slate-50">
                  <td className="print-hidden p-2">
                    <button
                      onClick={() => onDetail(row)}
                      className="rounded bg-violet-600 px-2 py-1 font-semibold text-white"
                    >
                      Detay
                    </button>
                  </td>
                  <td className="break-words p-2 font-semibold">
                    {row.type}
                    <span className="mt-0.5 block text-[9px] font-normal text-slate-400">
                      {row.group}
                    </span>
                  </td>
                  <td className="break-words p-2">
                    {row.donorName}
                    <span className="mt-0.5 block text-[9px] text-slate-400">
                      {row.receiptNo}
                    </span>
                  </td>
                  <td className="break-words p-2">
                    {orange ? row.country : row.originCountry}
                  </td>
                  <td className="break-words p-2">
                    {orange ? row.region : row.originCity}
                  </td>
                  <td className="break-words p-2">{row.paymentMethod}</td>
                  <td className="p-2 text-right font-bold">
                    {formatCurrency(row.amount)}
                  </td>
                  <td className="p-2">
                    {new Date(row.date).toLocaleDateString("tr-TR")}
                  </td>
                </tr>
              ))
            )}
            {!loading && !rows.length ? (
              <tr>
                <td colSpan={8} className="p-10 text-center text-slate-500">
                  Kayıt bulunamadı.
                </td>
              </tr>
            ) : null}
          </tbody>
          <tfoot className="sticky bottom-0 bg-[#4f7fd1] font-bold text-white">
            <tr>
              <td className="print-hidden p-2" />
              <td className="p-2" colSpan={3}>
                TOPLAM · {rows.length} kayıt
              </td>
              <td className="p-2" colSpan={2}>
                {rows.reduce((sum, row) => sum + row.quantity, 0)} birim
              </td>
              <td className="p-2 text-right">{formatCurrency(total)}</td>
              <td className="p-2" />
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
