"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, ChevronLeft, ChevronRight, Download, Eye, LoaderCircle, Printer, Save, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { AssociationData, PosterOrientation, PosterProject } from "@/lib/posters/poster-types";
import { parseExcludedProjectNumbers } from "@/lib/posters/poster-validation";
import { PosterSheet } from "@/components/posters/poster-sheet";

type ProjectData = PosterProject & {
  yearId: string; departmentId: string; typeId: string; groupId: string; destinationCountryId: string;
  partnerId: string | null; destinationRegionId: string | null;
};
type Filters = { yearId: string; departmentId: string; typeId: string; groupId: string; countryId: string; partnerId: string; regionId: string; first: string; last: string };
const emptyFilters: Filters = { yearId: "", departmentId: "", typeId: "", groupId: "", countryId: "", partnerId: "", regionId: "", first: "", last: "" };

export function PosterStudio({ orientation }: { orientation: PosterOrientation }) {
  const [projects, setProjects] = useState<ProjectData[]>([]);
  const [associations, setAssociations] = useState<AssociationData[]>([]);
  const [filters, setFilters] = useState<Filters>(emptyFilters);
  const [applied, setApplied] = useState<Filters>(emptyFilters);
  const [excludedText, setExcludedText] = useState("");
  const [excluded, setExcluded] = useState<number[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [supporterIds, setSupporterIds] = useState<string[]>([]);
  const [mainAssociationId, setMainAssociationId] = useState("");
  const [showEmpty, setShowEmpty] = useState(true);
  const [includeCompleted, setIncludeCompleted] = useState(false);
  const [nameFormat, setNameFormat] = useState<"FULL" | "INITIALS">("FULL");
  const [search, setSearch] = useState("");
  const [preview, setPreview] = useState(false);
  const [previewIndex, setPreviewIndex] = useState(0);
  const [zoom, setZoom] = useState(0.72);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    void Promise.all([
      fetch("/api/posters/projects").then((response) => response.json()),
      fetch("/api/associations").then((response) => response.json()),
    ]).then(async ([projectData, associationData]: [{ projects?: ProjectData[] }, { associations?: AssociationData[] }]) => {
      setProjects(projectData.projects ?? []);
      const items = associationData.associations ?? [];
      setAssociations(items);
      setMainAssociationId(items.find((item) => item.isDefault)?.id ?? items.find((item) => item.isActive)?.id ?? "");
      const savedId = new URLSearchParams(window.location.search).get("poster");
      if (savedId) {
        const savedResponse = await fetch(`/api/posters/${savedId}`);
        const savedData = (await savedResponse.json()) as { poster?: {
          yearId: string | null; departmentId: string | null; typeId: string | null; groupId: string | null; destinationCountryId: string | null;
          partnerId: string | null; destinationRegionId: string | null; firstProjectNumber: number | null; lastProjectNumber: number | null;
          excludedProjectNumbers: number[]; projectIds: string[]; associationIds: string[]; mainAssociationId: string | null;
          showEmptyShares: boolean; shareholderNameFormat: "FULL" | "INITIALS";
        } };
        if (savedData.poster) {
          const saved = savedData.poster;
          const loadedFilters = { yearId: saved.yearId ?? "", departmentId: saved.departmentId ?? "", typeId: saved.typeId ?? "", groupId: saved.groupId ?? "", countryId: saved.destinationCountryId ?? "", partnerId: saved.partnerId ?? "", regionId: saved.destinationRegionId ?? "", first: saved.firstProjectNumber?.toString() ?? "", last: saved.lastProjectNumber?.toString() ?? "" };
          setFilters(loadedFilters); setApplied(loadedFilters); setExcluded(saved.excludedProjectNumbers); setExcludedText(saved.excludedProjectNumbers.join(", "));
          setSelectedIds(saved.projectIds); setSupporterIds(saved.associationIds); setMainAssociationId(saved.mainAssociationId ?? ""); setShowEmpty(saved.showEmptyShares); setNameFormat(saved.shareholderNameFormat);
        }
      }
    }).catch(() => setError("Afiş verileri yüklenemedi.")).finally(() => setLoading(false));
  }, []);

  const options = (key: keyof Pick<ProjectData, "yearId" | "departmentId" | "typeId" | "groupId" | "destinationCountryId" | "partnerId" | "destinationRegionId">, label: keyof Pick<ProjectData, "year" | "department" | "type" | "group" | "country" | "partner" | "region">) =>
    [...new Map(projects.filter((item) => item[key] && (!["partnerId", "destinationRegionId"].includes(key) || !filters.countryId || item.destinationCountryId === filters.countryId)).map((item) => [String(item[key]), String(item[label])])).entries()];

  const filtered = useMemo(() => {
    const needle = search.trim().toLocaleLowerCase("tr");
    return projects.filter((project) => {
      if (!includeCompleted && project.status === "COMPLETED") return false;
      if (applied.yearId && project.yearId !== applied.yearId) return false;
      if (applied.departmentId && project.departmentId !== applied.departmentId) return false;
      if (applied.typeId && project.typeId !== applied.typeId) return false;
      if (applied.groupId && project.groupId !== applied.groupId) return false;
      if (applied.countryId && project.destinationCountryId !== applied.countryId) return false;
      if (applied.partnerId && project.partnerId !== applied.partnerId) return false;
      if (applied.regionId && project.destinationRegionId !== applied.regionId) return false;
      if (applied.first && project.projectNumber < Number(applied.first)) return false;
      if (applied.last && project.projectNumber > Number(applied.last)) return false;
      if (excluded.includes(project.projectNumber)) return false;
      return !needle || `${project.projectNumber} ${project.name} ${project.country} ${project.region}`.toLocaleLowerCase("tr").includes(needle);
    });
  }, [applied, excluded, includeCompleted, projects, search]);
  const selected = filtered.filter((project) => selectedIds.includes(project.id));
  const mainAssociation = associations.find((item) => item.id === mainAssociationId) ?? null;
  const supporters = associations.filter((item) => supporterIds.includes(item.id));

  function applyFilters() {
    setError("");
    const parsed = parseExcludedProjectNumbers(excludedText);
    if (parsed.invalid.length) { setError(`Geçersiz proje numarası: ${parsed.invalid.join(", ")}`); return; }
    const outside = parsed.values.filter((value) => (filters.first && value < Number(filters.first)) || (filters.last && value > Number(filters.last)));
    if (outside.length) setMessage(`Uyarı: ${outside.join(", ")} seçilen proje aralığının dışında.`);
    setExcluded(parsed.values);
    setApplied(filters);
    setSelectedIds([]);
  }

  async function audit(action: "POSTER_PRINTED" | "POSTER_PDF_CREATED") {
    const response = await fetch("/api/posters/audit", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action, projectIds: selectedIds }) });
    if (!response.ok) throw new Error("İşlem kaydedilemedi.");
  }

  async function print(asPdf: boolean) {
    if (!selected.length) { setError("Çıktı için en az bir proje seçin."); return; }
    try {
      await audit(asPdf ? "POSTER_PDF_CREATED" : "POSTER_PRINTED");
      document.body.dataset.posterOrientation = orientation.toLowerCase();
      window.print();
      setMessage(asPdf ? "Yazdırma penceresinde “PDF olarak kaydet” seçeneğini kullanabilirsiniz." : "Yazdırma penceresi açıldı.");
    } catch { setError("Yazdırma penceresi açılamadı."); }
  }

  async function save() {
    if (!selectedIds.length) { setError("Kaydetmek için en az bir proje seçin."); return; }
    const name = window.prompt("Afiş kayıt adı", `${orientation === "LANDSCAPE" ? "Yatay" : "Dikey"} Kurban Afişi ${new Date().toLocaleDateString("tr-TR")}`);
    if (!name) return;
    const response = await fetch("/api/posters", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({
      name, orientation, yearId: applied.yearId || null, departmentId: applied.departmentId || null, typeId: applied.typeId || null,
      groupId: applied.groupId || null, destinationCountryId: applied.countryId || null, partnerId: applied.partnerId || null,
      destinationRegionId: applied.regionId || null, firstProjectNumber: applied.first ? Number(applied.first) : null,
      lastProjectNumber: applied.last ? Number(applied.last) : null, excludedProjectNumbers: excluded, projectIds: selectedIds,
      associationIds: supporterIds, mainAssociationId: mainAssociationId || null, showEmptyShares: showEmpty, shareholderNameFormat: nameFormat,
    }) });
    const data = (await response.json()) as { message?: string };
    if (!response.ok) { setError(data.message ?? "Afiş kaydedilemedi."); return; }
    setMessage("Afiş ayarları başarıyla kaydedildi.");
  }

  if (loading) return <div className="flex justify-center gap-2 p-12 text-sm text-slate-500"><LoaderCircle className="size-5 animate-spin" /> Afiş verileri yükleniyor</div>;

  return <div className="mx-auto max-w-[1480px]">
    <div className="mb-6"><h2 className="text-xl font-bold text-[#0b2b3c]">{orientation === "LANDSCAPE" ? "Yatay" : "Dikey"} kurban afişi</h2><p className="mt-1 text-sm text-slate-500">Gerçek kurban projelerinden A4 afiş hazırlayın, önizleyin ve yazdırın.</p></div>
    <Card className="print-hidden mb-5 p-5">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Filter label="Yıl" value={filters.yearId} onChange={(value) => setFilters({ ...filters, yearId: value })} options={options("yearId", "year")} />
        <Filter label="Bölüm" value={filters.departmentId} onChange={(value) => setFilters({ ...filters, departmentId: value })} options={options("departmentId", "department")} />
        <Filter label="Bağış türü" value={filters.typeId} onChange={(value) => setFilters({ ...filters, typeId: value })} options={options("typeId", "type")} />
        <Filter label="Bağış grubu" value={filters.groupId} onChange={(value) => setFilters({ ...filters, groupId: value })} options={options("groupId", "group")} />
        <Filter label="Giden ülke" value={filters.countryId} onChange={(value) => setFilters({ ...filters, countryId: value, partnerId: "", regionId: "" })} options={options("destinationCountryId", "country")} />
        <Filter label="Partner" value={filters.partnerId} onChange={(value) => setFilters({ ...filters, partnerId: value })} options={options("partnerId", "partner")} />
        <Filter label="Giden bölge" value={filters.regionId} onChange={(value) => setFilters({ ...filters, regionId: value })} options={options("destinationRegionId", "region")} />
        <Filter label="Ana kurum" value={mainAssociationId} onChange={setMainAssociationId} options={associations.filter((item) => item.isActive).map((item) => [item.id, item.name])} />
        <label><span className="mb-1.5 block text-xs font-semibold">İlk proje no</span><Input type="number" min="1" value={filters.first} onChange={(event) => setFilters({ ...filters, first: event.target.value })} /></label>
        <label><span className="mb-1.5 block text-xs font-semibold">Son proje no</span><Input type="number" min="1" value={filters.last} onChange={(event) => setFilters({ ...filters, last: event.target.value })} /></label>
        <label className="sm:col-span-2"><span className="mb-1.5 block text-xs font-semibold">Yazdırılmayacak proje numaraları</span><Input value={excludedText} onChange={(event) => setExcludedText(event.target.value)} placeholder="8, 9, 125, 320" /></label>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-4 text-xs"><label className="flex gap-2"><input type="checkbox" checked={showEmpty} onChange={(event) => setShowEmpty(event.target.checked)} /> Boş hisseleri göster</label><label className="flex gap-2"><input type="checkbox" checked={includeCompleted} onChange={(event) => setIncludeCompleted(event.target.checked)} /> Tamamlanan projeleri göster</label><select value={nameFormat} onChange={(event) => setNameFormat(event.target.value as "FULL" | "INITIALS")} className="h-9 rounded-lg border px-2"><option value="FULL">Ad soyad tam</option><option value="INITIALS">Soyadı baş harf</option></select><Button variant="success" onClick={applyFilters}><Search className="size-4" /> Projeleri Getir</Button></div>
      {!!associations.length && <div className="mt-4 border-t pt-4"><p className="mb-2 text-xs font-semibold">Destekçi dernek logoları</p><div className="flex flex-wrap gap-3">{associations.filter((item) => item.isActive && item.id !== mainAssociationId).map((item) => <label key={item.id} className="flex gap-2 text-xs"><input type="checkbox" checked={supporterIds.includes(item.id)} onChange={(event) => setSupporterIds(event.target.checked ? [...supporterIds, item.id] : supporterIds.filter((id) => id !== item.id))} />{item.shortName}</label>)}</div></div>}
    </Card>
    {(error || message) && <div className={`print-hidden mb-4 rounded-xl p-3 text-sm ${error ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-800"}`}>{error || message}</div>}
    <Card className="print-hidden overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b p-4"><div className="flex gap-2"><Button size="sm" variant="outline" onClick={() => setSelectedIds(filtered.map((item) => item.id))}>Tümünü seç</Button><Button size="sm" variant="ghost" onClick={() => setSelectedIds([])}>Seçimi kaldır</Button><Button size="sm" variant="ghost" onClick={() => setSelectedIds(filtered.filter((item) => item.shares.some((share) => share.status === "EMPTY")).map((item) => item.id))}>Eksik hisseliler</Button></div><div className="relative"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" /><Input value={search} onChange={(event) => setSearch(event.target.value)} className="h-9 pl-9" placeholder="Projelerde ara" /></div></div>
      <div className="overflow-x-auto"><table className="w-full min-w-[1050px] text-left text-xs"><thead className="bg-[#02b3aa] text-white"><tr>{["", "No", "Proje", "Yıl", "Bölüm", "Grup", "Ülke / Bölge", "Partner", "Hisse", "Durum"].map((item) => <th key={item} className="px-3 py-3">{item}</th>)}</tr></thead><tbody className="divide-y">{filtered.map((project) => { const filled = project.shares.filter((share) => share.status === "FILLED").length; return <tr key={project.id}><td className="px-3 py-3"><input type="checkbox" checked={selectedIds.includes(project.id)} onChange={(event) => setSelectedIds(event.target.checked ? [...selectedIds, project.id] : selectedIds.filter((id) => id !== project.id))} /></td><td className="px-3 font-bold">{project.projectNumber}</td><td className="px-3">{project.name}</td><td className="px-3">{project.year}</td><td className="px-3">{project.department}</td><td className="px-3">{project.group}</td><td className="px-3">{project.country} / {project.region}</td><td className="px-3">{project.partner || "—"}</td><td className="px-3">{filled} dolu · {project.shareCapacity - filled} boş</td><td className="px-3">{project.status}</td></tr>})}</tbody></table></div>
      <div className="flex flex-wrap items-center justify-between gap-3 border-t p-4"><strong className="text-xs">{selectedIds.length} proje seçildi</strong><div className="flex flex-wrap gap-2"><Button variant="outline" onClick={() => { if (!selected.length) setError("Önizleme için proje seçin."); else { setPreviewIndex(0); setPreview(true); } }}><Eye className="size-4" /> Önizleme</Button><Button variant="outline" onClick={save}><Save className="size-4" /> Kaydet</Button><Button variant="outline" onClick={() => void print(false)}><Printer className="size-4" /> Yazdır</Button><Button variant="success" onClick={() => void print(true)}><Download className="size-4" /> PDF</Button></div></div>
    </Card>
    <div className="poster-print-root">{selected.map((project) => <PosterSheet key={project.id} project={project} orientation={orientation} mainAssociation={mainAssociation} supporters={supporters} showEmpty={showEmpty} nameFormat={nameFormat} />)}</div>
    {preview && selected[previewIndex] && <div className="fixed inset-0 z-[100] flex flex-col bg-slate-950/80 p-3 backdrop-blur-sm"><div className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-white p-2"><div className="flex items-center gap-2"><Button size="sm" variant="outline" disabled={previewIndex === 0} onClick={() => setPreviewIndex((value) => value - 1)}><ChevronLeft className="size-4" /></Button><span className="text-xs font-bold">{previewIndex + 1} / {selected.length}</span><Button size="sm" variant="outline" disabled={previewIndex === selected.length - 1} onClick={() => setPreviewIndex((value) => value + 1)}><ChevronRight className="size-4" /></Button></div><div className="flex gap-2"><Button size="sm" variant="outline" onClick={() => setZoom(Math.max(0.4, zoom - 0.1))}>−</Button><span className="px-2 py-2 text-xs">%{Math.round(zoom * 100)}</span><Button size="sm" variant="outline" onClick={() => setZoom(Math.min(1.2, zoom + 0.1))}>+</Button><Button size="sm" variant="success" onClick={() => setPreview(false)}><Check className="size-4" /> Kapat</Button></div></div><div className="flex-1 overflow-auto"><div className="mx-auto origin-top" style={{ transform: `scale(${zoom})`, width: orientation === "LANDSCAPE" ? "1123px" : "794px" }}><PosterSheet project={selected[previewIndex]} orientation={orientation} mainAssociation={mainAssociation} supporters={supporters} showEmpty={showEmpty} nameFormat={nameFormat} /></div></div></div>}
  </div>;
}

function Filter({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: [string, string][] }) {
  return <label><span className="mb-1.5 block text-xs font-semibold">{label}</span><select value={value} onChange={(event) => onChange(event.target.value)} className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm"><option value="">Tümü</option>{options.map(([id, name]) => <option key={id} value={id}>{name}</option>)}</select></label>;
}
