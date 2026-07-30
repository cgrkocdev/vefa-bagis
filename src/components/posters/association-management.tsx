"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { Building2, LoaderCircle, Pencil, Plus, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { AssociationData } from "@/lib/posters/poster-types";

export function AssociationManagement() {
  const [items, setItems] = useState<AssociationData[]>([]);
  const [editing, setEditing] = useState<AssociationData | null | "new">(null);
  const [error, setError] = useState("");
  const load = useCallback(async () => {
    const response = await fetch("/api/associations");
    const data = (await response.json()) as { associations?: AssociationData[]; message?: string };
    if (!response.ok) { setError(data.message ?? "Dernekler yüklenemedi."); return; }
    setItems(data.associations ?? []);
  }, []);
  useEffect(() => { const timer = window.setTimeout(() => void load(), 0); return () => window.clearTimeout(timer); }, [load]);

  async function remove(id: string) {
    if (!window.confirm("Bu dernek kaydını silmek istediğinize emin misiniz? Bağlı afiş varsa pasife alınacaktır.")) return;
    const response = await fetch(`/api/associations/${id}`, { method: "DELETE" });
    if (!response.ok) { setError("Dernek silinemedi."); return; }
    await load();
  }
  return <div className="mx-auto max-w-[1280px]"><div className="mb-6 flex items-end justify-between"><div><h2 className="text-xl font-bold text-[#0b2b3c]">Dernek ve logo ayarları</h2><p className="mt-1 text-sm text-slate-500">Afişlerde gösterilecek ana kurum ve destekçi logolarını yönetin.</p></div><Button variant="success" onClick={() => setEditing("new")}><Plus className="size-4" /> Yeni dernek</Button></div>{error && <p className="mb-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}<div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{items.map((item) => <Card key={item.id} className="p-5"><div className="flex items-start gap-4">{item.logoDataUrl ? <Image unoptimized width={64} height={64} src={item.logoDataUrl} alt={item.logoAlt ?? item.name} className="size-16 rounded-xl object-contain" /> : <span className="grid size-16 place-items-center rounded-xl bg-slate-100 text-slate-400"><Building2 /></span>}<div className="min-w-0 flex-1"><div className="flex gap-2"><h3 className="truncate font-bold text-[#0b2b3c]">{item.name}</h3>{item.isDefault && <span className="rounded-full bg-emerald-50 px-2 py-1 text-[9px] font-bold text-emerald-700">Varsayılan</span>}</div><p className="mt-1 text-xs text-slate-500">{item.shortName} · Sıra {item.sortOrder}</p><p className={`mt-2 text-[10px] font-bold ${item.isActive ? "text-emerald-700" : "text-slate-400"}`}>{item.isActive ? "Aktif" : "Pasif"}</p></div></div><div className="mt-4 flex justify-end gap-2"><Button size="sm" variant="outline" onClick={() => setEditing(item)}><Pencil className="size-4" /> Düzenle</Button><Button size="sm" variant="ghost" onClick={() => void remove(item.id)}><Trash2 className="size-4 text-red-600" /></Button></div></Card>)}</div>{editing && <AssociationModal item={editing === "new" ? null : editing} onClose={() => setEditing(null)} onSaved={async () => { setEditing(null); await load(); }} />}</div>;
}

function AssociationModal({ item, onClose, onSaved }: { item: AssociationData | null; onClose: () => void; onSaved: () => Promise<void> }) {
  const [logo, setLogo] = useState(item?.logoDataUrl ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  function readLogo(file: File | undefined) {
    if (!file) return;
    if (!["image/png", "image/jpeg", "image/webp", "image/svg+xml"].includes(file.type)) { setError("Logo PNG, JPG, WEBP veya SVG olmalıdır."); return; }
    if (file.size > 2 * 1024 * 1024) { setError("Logo en fazla 2 MB olabilir."); return; }
    const reader = new FileReader(); reader.onload = () => setLogo(String(reader.result)); reader.onerror = () => setError("Logo yüklenemedi."); reader.readAsDataURL(file);
  }
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSaving(true); setError("");
    const form = new FormData(event.currentTarget);
    const body = { name: form.get("name"), shortName: form.get("shortName"), logoDataUrl: logo || null, logoAlt: form.get("logoAlt") || null, phone: form.get("phone") || null, website: form.get("website") || null, address: form.get("address") || null, isActive: form.get("isActive") === "on", isDefault: form.get("isDefault") === "on", sortOrder: Number(form.get("sortOrder")) };
    const response = await fetch(item ? `/api/associations/${item.id}` : "/api/associations", { method: item ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const data = (await response.json()) as { message?: string };
    if (!response.ok) { setError(data.message ?? "Dernek kaydedilemedi."); setSaving(false); return; }
    await onSaved();
  }
  return <div className="fixed inset-0 z-[100] grid place-items-center overflow-y-auto bg-slate-950/50 p-4"><Card className="w-full max-w-xl p-6"><div className="flex justify-between"><h3 className="font-bold">{item ? "Derneği düzenle" : "Yeni dernek"}</h3><button onClick={onClose}><X className="size-5" /></button></div><form onSubmit={submit} className="mt-5 grid gap-4 sm:grid-cols-2"><label><span className="mb-1 block text-xs font-semibold">Dernek adı</span><Input name="name" required defaultValue={item?.name} /></label><label><span className="mb-1 block text-xs font-semibold">Kısa adı</span><Input name="shortName" required defaultValue={item?.shortName} /></label><label><span className="mb-1 block text-xs font-semibold">Telefon</span><Input name="phone" defaultValue={item?.phone ?? ""} /></label><label><span className="mb-1 block text-xs font-semibold">İnternet sitesi</span><Input name="website" defaultValue={item?.website ?? ""} /></label><label className="sm:col-span-2"><span className="mb-1 block text-xs font-semibold">Adres</span><Input name="address" defaultValue={item?.address ?? ""} /></label><label><span className="mb-1 block text-xs font-semibold">Logo</span><Input type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" onChange={(event) => readLogo(event.target.files?.[0])} /></label><label><span className="mb-1 block text-xs font-semibold">Logo alternatif metni</span><Input name="logoAlt" defaultValue={item?.logoAlt ?? ""} /></label>{logo && <div className="sm:col-span-2"><Image unoptimized width={120} height={80} src={logo} alt="Logo önizleme" className="h-20 w-32 rounded-xl border object-contain" /></div>}<label><span className="mb-1 block text-xs font-semibold">Görünüm sırası</span><Input name="sortOrder" type="number" min="0" defaultValue={item?.sortOrder ?? 0} /></label><div className="flex items-end gap-4 pb-3 text-xs"><label className="flex gap-2"><input name="isActive" type="checkbox" defaultChecked={item?.isActive ?? true} /> Aktif</label><label className="flex gap-2"><input name="isDefault" type="checkbox" defaultChecked={item?.isDefault} /> Varsayılan</label></div>{error && <p className="rounded-xl bg-red-50 p-3 text-xs text-red-700 sm:col-span-2">{error}</p>}<div className="flex gap-2 sm:col-span-2"><Button type="button" variant="outline" className="flex-1" onClick={onClose}>Vazgeç</Button><Button type="submit" variant="success" className="flex-1" disabled={saving}>{saving ? <LoaderCircle className="size-4 animate-spin" /> : "Kaydet"}</Button></div></form></Card></div>;
}
