"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Download, LoaderCircle, Pencil, Plus, Search, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type Definition = { id: string; type: string; name: string; code: string; parentId: string | null; symbol: string | null };
type Share = { id: string; shareNumber: number; status: "EMPTY" | "RESERVED" | "FILLED" | "CANCELLED" };
type Project = {
  id: string; yearId: string; departmentId: string; typeId: string; groupId: string; destinationCountryId: string;
  partnerId: string | null; destinationRegionId: string | null; projectNumber: number; name: string; animalType: string;
  shareCapacity: number; sharePrice: string; currencyId: string; isVirtual: boolean; status: string; description: string | null; shares: Share[];
};
type Pagination = { page: number; pageSize: number; total: number; pageCount: number };

const statusLabels: Record<string, string> = { DRAFT: "Taslak", OPEN: "Açık", FULL: "Dolu", COMPLETED: "Tamamlandı", CLOSED: "Kapalı", CANCELLED: "İptal" };

export function ProjectPlanner() {
  const [definitions, setDefinitions] = useState<Definition[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, pageSize: 20, total: 0, pageCount: 1 });
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modal, setModal] = useState<Project | "create" | null>(null);
  const names = useMemo(() => new Map(definitions.map((item) => [item.id, item])), [definitions]);

  const load = useCallback(async (page = 1) => {
    setLoading(true); setError("");
    try {
      const [definitionsResponse, projectsResponse] = await Promise.all([
        fetch("/api/definitions"),
        fetch(`/api/projects?page=${page}&pageSize=20&q=${encodeURIComponent(query)}`),
      ]);
      const definitionData = (await definitionsResponse.json()) as { definitions?: Definition[]; message?: string };
      const projectData = (await projectsResponse.json()) as { projects?: Project[]; pagination?: Pagination; message?: string };
      if (!definitionsResponse.ok || !projectsResponse.ok) throw new Error(definitionData.message ?? projectData.message);
      setDefinitions(definitionData.definitions ?? []);
      setProjects(projectData.projects ?? []);
      setPagination(projectData.pagination ?? { page, pageSize: 20, total: 0, pageCount: 1 });
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Projeler yüklenemedi.");
    } finally { setLoading(false); }
  }, [query]);

  useEffect(() => { const timer = window.setTimeout(() => void load(), 0); return () => window.clearTimeout(timer); }, [load]);

  async function archive(project: Project) {
    if (!window.confirm(`“${project.name}” projesini kapatmak istediğinize emin misiniz?`)) return;
    const response = await fetch(`/api/projects/${project.id}`, { method: "DELETE" });
    const data = (await response.json()) as { message?: string };
    if (!response.ok) { setError(data.message ?? "Proje kapatılamadı."); return; }
    await load(pagination.page);
  }

  function exportCsv() {
    const rows = [["Yıl", "Bölüm", "Proje No", "Proje", "Ülke", "Partner", "Dolu", "Kapasite", "Fiyat", "Durum"], ...projects.map((item) => [names.get(item.yearId)?.name ?? "", names.get(item.departmentId)?.name ?? "", String(item.projectNumber), item.name, names.get(item.destinationCountryId)?.name ?? "", names.get(item.partnerId ?? "")?.name ?? "", String(item.shares.filter((share) => share.status === "FILLED").length), String(item.shareCapacity), item.sharePrice, statusLabels[item.status] ?? item.status])];
    const blob = new Blob([`\uFEFF${rows.map((row) => row.map((value) => `"${value.replaceAll("\"", "\"\"")}"`).join(";")).join("\n")}`], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob); const anchor = document.createElement("a"); anchor.href = url; anchor.download = "kurban-projeleri.csv"; anchor.click(); URL.revokeObjectURL(url);
  }

  return <div className="mx-auto max-w-[1480px]">
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><h2 className="text-xl font-bold text-[#0b2b3c]">Kurban projesi planlama</h2><p className="mt-1 text-sm text-slate-500">Projeleri, hisse kapasitesini, fiyatı ve çalışma durumunu yönetin.</p></div><div className="flex gap-2"><Button variant="outline" onClick={exportCsv} disabled={!projects.length}><Download className="size-4" /> CSV</Button><Button variant="success" onClick={() => setModal("create")}><Plus className="size-4" /> Proje oluştur</Button></div></div>
    <Card className="mb-5 p-4"><form onSubmit={(event) => { event.preventDefault(); void load(1); }} className="flex gap-2"><div className="relative flex-1"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" /><Input value={query} onChange={(event) => setQuery(event.target.value)} className="h-10 pl-9" placeholder="Proje adı veya numarası ara" /></div><Button size="sm">Ara</Button></form></Card>
    <Card className="overflow-hidden">{loading ? <div className="flex justify-center gap-2 p-12 text-xs text-slate-500"><LoaderCircle className="size-4 animate-spin" /> Yükleniyor</div> : error ? <p className="m-5 rounded-xl bg-red-50 p-4 text-xs text-red-700">{error}</p> : <><div className="overflow-x-auto"><table className="w-full min-w-[1000px] text-left"><thead className="bg-slate-50 text-[10px] uppercase text-slate-500"><tr>{["Proje", "Yıl / Bölüm", "Ülke / Partner", "Doluluk", "Hisse fiyatı", "Tür", "Durum", "İşlem"].map((item) => <th key={item} className="px-4 py-3">{item}</th>)}</tr></thead><tbody className="divide-y divide-slate-100">{projects.map((item) => { const filled = item.shares.filter((share) => share.status === "FILLED").length; const reserved = item.shares.filter((share) => share.status === "RESERVED").length; return <tr key={item.id} className="text-xs text-slate-600"><td className="px-4 py-4"><strong className="text-slate-800">{item.projectNumber}. {item.name}</strong><p className="mt-1 text-[10px] text-slate-400">{names.get(item.typeId)?.name} · {names.get(item.groupId)?.name}</p></td><td className="px-4">{names.get(item.yearId)?.name}<br />{names.get(item.departmentId)?.name}</td><td className="px-4">{names.get(item.destinationCountryId)?.name}<br />{names.get(item.partnerId ?? "")?.name ?? "—"}</td><td className="px-4"><strong>{filled}/{item.shareCapacity}</strong><p className="text-[10px]">{reserved} rezerve · {item.shareCapacity - filled - reserved} boş</p></td><td className="px-4 font-semibold">{Number(item.sharePrice).toLocaleString("tr-TR")} {names.get(item.currencyId)?.symbol}</td><td className="px-4"><span className={`rounded-full px-2 py-1 text-[10px] ${item.isVirtual ? "bg-violet-50 text-violet-700" : "bg-sky-50 text-sky-700"}`}>{item.isVirtual ? "Sanal" : "Gerçek"}</span></td><td className="px-4">{statusLabels[item.status] ?? item.status}</td><td className="px-4"><div className="flex gap-1"><button onClick={() => setModal(item)} className="grid size-8 place-items-center rounded-lg hover:bg-slate-100"><Pencil className="size-4" /></button><button onClick={() => void archive(item)} className="grid size-8 place-items-center rounded-lg text-red-600 hover:bg-red-50"><Trash2 className="size-4" /></button></div></td></tr>})}</tbody></table></div><div className="flex items-center justify-between border-t px-5 py-3 text-xs text-slate-500"><span>{pagination.total} proje</span><div className="flex gap-2"><Button size="sm" variant="outline" disabled={pagination.page <= 1} onClick={() => void load(pagination.page - 1)}>Önceki</Button><span className="px-2 py-2">{pagination.page}/{Math.max(1, pagination.pageCount)}</span><Button size="sm" variant="outline" disabled={pagination.page >= pagination.pageCount} onClick={() => void load(pagination.page + 1)}>Sonraki</Button></div></div></>}</Card>
    {modal && <ProjectModal project={modal === "create" ? null : modal} definitions={definitions} onClose={() => setModal(null)} onSaved={async () => { setModal(null); await load(pagination.page); }} />}
  </div>;
}

function ProjectModal({ project, definitions, onClose, onSaved }: { project: Project | null; definitions: Definition[]; onClose: () => void; onSaved: () => Promise<void> }) {
  const [animalType, setAnimalType] = useState(project?.animalType ?? "CATTLE"); const [saving, setSaving] = useState(false); const [error, setError] = useState("");
  const byType = (type: string) => definitions.filter((item) => item.type === type);
  async function submit(event: React.FormEvent<HTMLFormElement>) { event.preventDefault(); setSaving(true); setError(""); const form = new FormData(event.currentTarget); const payload = { yearId: form.get("yearId"), departmentId: form.get("departmentId"), typeId: form.get("typeId"), groupId: form.get("groupId"), destinationCountryId: form.get("destinationCountryId"), partnerId: form.get("partnerId") || null, destinationRegionId: form.get("destinationRegionId") || null, projectNumber: Number(form.get("projectNumber")), name: form.get("name"), animalType, shareCapacity: animalType === "CATTLE" ? 7 : 1, sharePrice: Number(form.get("sharePrice")), currencyId: form.get("currencyId"), isVirtual: form.get("isVirtual") === "on", status: form.get("status"), description: form.get("description") || null }; const response = await fetch(project ? `/api/projects/${project.id}` : "/api/projects", { method: project ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) }); const data = (await response.json()) as { message?: string }; if (!response.ok) { setError(data.message ?? "Proje kaydedilemedi."); setSaving(false); return; } await onSaved(); }
  const SelectDefinition = ({ name, type, defaultValue, required = true }: { name: string; type: string; defaultValue?: string | null; required?: boolean }) => <select name={name} required={required} defaultValue={defaultValue ?? ""} className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs"><option value="">Seçiniz</option>{byType(type).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select>;
  return <div className="fixed inset-0 z-[90] grid place-items-center bg-slate-950/45 p-4 backdrop-blur-sm"><Card className="max-h-[94vh] w-full max-w-3xl overflow-auto p-5 sm:p-6"><div className="flex justify-between"><div><h3 className="font-bold text-[#0b2b3c]">{project ? "Projeyi düzenle" : "Yeni kurban projesi"}</h3><p className="mt-1 text-xs text-slate-500">Proje alanları aktif tanımlardan gelir.</p></div><button onClick={onClose}><X className="size-5 text-slate-400" /></button></div><form onSubmit={submit} className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{[["Yıl","yearId","YEAR",project?.yearId],["Bölüm","departmentId","DEPARTMENT",project?.departmentId],["Tür","typeId","DONATION_TYPE",project?.typeId],["Bağış grubu","groupId","DONATION_GROUP",project?.groupId],["Giden ülke","destinationCountryId","DESTINATION_COUNTRY",project?.destinationCountryId],["Partner","partnerId","PARTNER",project?.partnerId],["Giden bölge","destinationRegionId","DESTINATION_REGION",project?.destinationRegionId],["Para birimi","currencyId","CURRENCY",project?.currencyId]].map(([label,name,type,value]) => <label key={String(name)}><span className="mb-1.5 block text-xs font-semibold">{label}</span><SelectDefinition name={String(name)} type={String(type)} defaultValue={value} required={!["partnerId","destinationRegionId"].includes(String(name))} /></label>)}<label><span className="mb-1.5 block text-xs font-semibold">Proje numarası</span><Input name="projectNumber" type="number" min="1" required defaultValue={project?.projectNumber} className="h-10" /></label><label className="sm:col-span-2"><span className="mb-1.5 block text-xs font-semibold">Proje adı</span><Input name="name" required defaultValue={project?.name} className="h-10" /></label><label><span className="mb-1.5 block text-xs font-semibold">Hayvan türü</span><select value={animalType} onChange={(event) => setAnimalType(event.target.value)} disabled={Boolean(project)} className="h-10 w-full rounded-xl border px-3 text-xs"><option value="CATTLE">Büyükbaş (7 hisse)</option><option value="SMALL_ANIMAL">Küçükbaş (1 hisse)</option></select></label><label><span className="mb-1.5 block text-xs font-semibold">Hisse fiyatı</span><Input name="sharePrice" type="number" min="0.01" step="0.01" required defaultValue={project?.sharePrice} className="h-10" /></label><label><span className="mb-1.5 block text-xs font-semibold">Durum</span><select name="status" defaultValue={project?.status ?? "DRAFT"} className="h-10 w-full rounded-xl border px-3 text-xs">{Object.entries(statusLabels).map(([value,label]) => <option key={value} value={value}>{label}</option>)}</select></label><label className="flex items-center justify-between rounded-xl bg-slate-50 p-3 text-xs font-semibold">Sanal proje<input name="isVirtual" type="checkbox" defaultChecked={project?.isVirtual} /></label><label className="sm:col-span-2 lg:col-span-3"><span className="mb-1.5 block text-xs font-semibold">Açıklama</span><textarea name="description" defaultValue={project?.description ?? ""} className="min-h-20 w-full rounded-xl border p-3 text-xs" /></label>{error && <p className="rounded-xl bg-red-50 p-3 text-xs text-red-700 sm:col-span-2 lg:col-span-3">{error}</p>}<Button variant="success" disabled={saving} className="sm:col-span-2 lg:col-span-3">{saving ? <LoaderCircle className="size-4 animate-spin" /> : "Projeyi kaydet"}</Button></form></Card></div>;
}
