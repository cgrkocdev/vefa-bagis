"use client";

import { useCallback, useEffect, useState } from "react";
import { LoaderCircle, Plus, RotateCcw, Search, Trash2 } from "lucide-react";
import { DonationForm, type GeneralDonationDefinition } from "@/components/donation-form";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";

type GeneralDonation = {
  id: string;
  date: string;
  firstName: string;
  lastName: string;
  phone: string;
  city: string;
  district: string;
  type: string;
  group: string;
  quantity: number;
  country: string;
  paymentMethod: string;
  amount: number;
  receiptNo: string;
  orderStatus: boolean;
};
type Filters = {
  typeId: string;
  groupId: string;
  city: string;
  status: string;
  year: string;
  month: string;
  paymentMethodId: string;
};

const emptyFilters: Filters = {
  typeId: "",
  groupId: "",
  city: "",
  status: "",
  year: "",
  month: "",
  paymentMethodId: "",
};
const selectClass = "h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-700 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-50";

export function GeneralDonationArea() {
  const [formOpen, setFormOpen] = useState(false);
  const [definitions, setDefinitions] = useState<GeneralDonationDefinition[]>([]);
  const [definitionsError, setDefinitionsError] = useState("");
  const [donations, setDonations] = useState<GeneralDonation[]>([]);
  const [filters, setFilters] = useState<Filters>(emptyFilters);
  const [applied, setApplied] = useState<Filters>(emptyFilters);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState("");
  const [error, setError] = useState("");
  const [quickCreate, setQuickCreate] = useState({ typeCode: "", paymentMethodCode: "" });

  const loadDonations = useCallback(async (activeFilters: Filters) => {
    setLoading(true);
    setError("");
    try {
      const query = new URLSearchParams();
      Object.entries(activeFilters).forEach(([key, value]) => {
        if (value) query.set(key, value);
      });
      const response = await fetch(`/api/general-donations?${query.toString()}`, { cache: "no-store" });
      const data = (await response.json()) as { donations?: GeneralDonation[]; message?: string };
      if (!response.ok) throw new Error(data.message);
      setDonations(data.donations ?? []);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Genel bağış kayıtları yüklenemedi.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void Promise.all([
      fetch("/api/definitions").then(async (response) => {
        const data = (await response.json()) as { definitions?: GeneralDonationDefinition[]; message?: string };
        if (!response.ok) throw new Error(data.message);
        setDefinitions(data.definitions ?? []);
        const query = new URLSearchParams(window.location.search);
        if (query.get("yeni") === "1") {
          setQuickCreate({ typeCode: query.get("tur") ?? "", paymentMethodCode: query.get("odeme") ?? "" });
          setFormOpen(true);
        }
      }),
      loadDonations(emptyFilters),
    ]).catch((reason) => setDefinitionsError(reason instanceof Error ? reason.message : "Form tanımları yüklenemedi."));
  }, [loadDonations]);

  const byType = (type: string) => definitions.filter((item) => item.type === type);

  async function removeDonation(donation: GeneralDonation) {
    if (!window.confirm(`${donation.firstName} ${donation.lastName} genel bağış kaydı silinsin mi? Kayıt denetim geçmişinde iptal edilmiş olarak korunacaktır.`)) return;
    setDeletingId(donation.id);
    setError("");
    try {
      const response = await fetch(`/api/donations/${donation.id}`, { method: "DELETE" });
      const data = (await response.json()) as { message?: string };
      if (!response.ok) throw new Error(data.message ?? "Genel bağış silinemedi.");
      await loadDonations(applied);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Genel bağış silinemedi.");
    } finally {
      setDeletingId("");
    }
  }

  function applyFilters() {
    setApplied(filters);
    void loadDonations(filters);
  }

  function clearFilters() {
    setFilters(emptyFilters);
    setApplied(emptyFilters);
    void loadDonations(emptyFilters);
  }

  return (
    <div className="mx-auto max-w-[1480px]">
      <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-700">Bağış</p>
          <h2 className="mt-1 text-xl font-bold text-[#0b2b3c]">Genel Bağış</h2>
        </div>
        <Button variant="success" onClick={() => setFormOpen(true)} disabled={!definitions.length}>
          {!definitions.length && !definitionsError ? <LoaderCircle className="size-4 animate-spin" /> : <Plus className="size-4" />}
          {definitions.length ? "Bağış Ekle" : "Form hazırlanıyor"}
        </Button>
      </div>

      <Card className="mb-5 overflow-hidden">
        <div className="border-b border-slate-100 px-5 py-4"><h3 className="font-bold text-[#0b2b3c]">Sorgulama</h3></div>
        <div className="grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-4">
          <FilterSelect label="Cinsi (Türü)" value={filters.typeId} onChange={(value) => setFilters((current) => ({ ...current, typeId: value }))} items={byType("DONATION_TYPE").filter((item) => item.code !== "KURBAN")} />
          <FilterSelect label="Grubu" value={filters.groupId} onChange={(value) => setFilters((current) => ({ ...current, groupId: value }))} items={byType("GENERAL_DONATION_GROUP")} />
          <FilterSelect label="Gelen İl" value={filters.city} onChange={(value) => setFilters((current) => ({ ...current, city: value }))} items={byType("ORIGIN_CITY")} valueByName />
          <label><span className="mb-1.5 block text-[11px] font-semibold text-slate-600">Genel Durumu</span><select className={selectClass} value={filters.status} onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))}><option value="">Seçiniz</option><option value="STANDARD">Standart</option><option value="ORDERED">Sipariş</option></select></label>
          <label><span className="mb-1.5 block text-[11px] font-semibold text-slate-600">Yıl</span><select className={selectClass} value={filters.year} onChange={(event) => setFilters((current) => ({ ...current, year: event.target.value }))}><option value="">Seçiniz</option>{[2026, 2025, 2024].map((year) => <option key={year}>{year}</option>)}</select></label>
          <label><span className="mb-1.5 block text-[11px] font-semibold text-slate-600">Ay</span><select className={selectClass} value={filters.month} onChange={(event) => setFilters((current) => ({ ...current, month: event.target.value }))} disabled={!filters.year}><option value="">Seçiniz</option>{["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"].map((month, index) => <option key={month} value={index + 1}>{month}</option>)}</select></label>
          <FilterSelect label="Ödeme Şekli" value={filters.paymentMethodId} onChange={(value) => setFilters((current) => ({ ...current, paymentMethodId: value }))} items={byType("PAYMENT_METHOD")} />
          <div className="flex items-end gap-2">
            <Button type="button" variant="success" className="min-w-32" onClick={applyFilters}><Search className="size-4" /> Sorgula</Button>
            <Button type="button" variant="ghost" onClick={clearFilters}><RotateCcw className="size-4" /> Temizle</Button>
          </div>
        </div>
      </Card>

      {(error || definitionsError) && <p className="mb-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error || definitionsError}</p>}
      <Card className="overflow-hidden">
        <div className="border-b border-slate-100 px-5 py-4">
          <h3 className="font-bold text-[#0b2b3c]">Genel Bağışçı Listesi</h3>
          <p className="mt-1 text-xs text-slate-500">Filtrelere uyan genel bağış kayıtları</p>
        </div>
        {loading ? (
          <div className="flex justify-center gap-2 p-12 text-sm text-slate-500"><LoaderCircle className="size-5 animate-spin" /> Kayıtlar yükleniyor</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1500px] text-left text-xs">
              <thead className="bg-[#02b3aa] text-white">
                <tr>{["Seç", "Sil", "Tarih", "Adı", "Soyadı", "Telefon", "İl Adı", "Cinsi", "Grup", "Gel. Adet", "Ülke Adı", "Öd. Şekli", "Tutar", "Makbuz No"].map((item) => <th key={item} className="whitespace-nowrap px-4 py-3">{item}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {donations.map((donation) => (
                  <tr key={donation.id} className="text-slate-700 hover:bg-emerald-50/40">
                    <td className="px-4 py-3"><input type="checkbox" className="size-4 accent-emerald-600" aria-label={`${donation.firstName} ${donation.lastName} kaydını seç`} /></td>
                    <td className="px-4 py-3"><button type="button" onClick={() => void removeDonation(donation)} disabled={deletingId === donation.id} className="rounded-lg border border-red-100 p-2 text-red-600 hover:bg-red-50 disabled:opacity-50">{deletingId === donation.id ? <LoaderCircle className="size-3.5 animate-spin" /> : <Trash2 className="size-3.5" />}</button></td>
                    <td className="whitespace-nowrap px-4 py-3">{new Intl.DateTimeFormat("tr-TR").format(new Date(donation.date))}</td>
                    <td className="px-4 py-3 font-semibold">{donation.firstName}</td>
                    <td className="px-4 py-3 font-semibold">{donation.lastName}</td>
                    <td className="px-4 py-3">{donation.phone}</td>
                    <td className="px-4 py-3">{[donation.city, donation.district].filter(Boolean).join(" / ") || "—"}</td>
                    <td className="px-4 py-3">{donation.type || "—"}</td>
                    <td className="px-4 py-3">{donation.group || "—"}</td>
                    <td className="px-4 py-3 text-center font-semibold">{donation.quantity}</td>
                    <td className="px-4 py-3">{donation.country || "—"}</td>
                    <td className="px-4 py-3">{donation.paymentMethod || "—"}</td>
                    <td className="px-4 py-3 font-bold text-[#0b2b3c]">{formatCurrency(donation.amount)}</td>
                    <td className="whitespace-nowrap px-4 py-3">{donation.receiptNo || "—"}</td>
                  </tr>
                ))}
                {!donations.length && <tr><td colSpan={14} className="p-14 text-center text-sm text-slate-500">Sorguya uygun genel bağış kaydı bulunamadı.</td></tr>}
              </tbody>
            </table>
          </div>
        )}
        <div className="border-t border-slate-100 px-5 py-3 text-xs text-slate-500">Gösterilen kayıt: {donations.length}</div>
      </Card>

      {formOpen && (
        <DonationForm
          modal
          initialDefinitions={definitions}
          initialTypeCode={quickCreate.typeCode}
          initialPaymentMethodCode={quickCreate.paymentMethodCode}
          onClose={() => setFormOpen(false)}
          onSaved={async () => {
            setFormOpen(false);
            await loadDonations(applied);
          }}
        />
      )}
    </div>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  items,
  valueByName = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  items: GeneralDonationDefinition[];
  valueByName?: boolean;
}) {
  return (
    <label>
      <span className="mb-1.5 block text-[11px] font-semibold text-slate-600">{label}</span>
      <select className={selectClass} value={value} onChange={(event) => onChange(event.target.value)}>
        <option value="">Seçiniz</option>
        {items.map((item) => <option key={item.id} value={valueByName ? item.name : item.id}>{item.name}</option>)}
      </select>
    </label>
  );
}
