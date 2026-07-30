"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Copy, FileText, LoaderCircle, Search, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type SavedPoster = {
  id: string; name: string; orientation: "LANDSCAPE" | "PORTRAIT"; projectIds: string[]; associationIds: string[];
  excludedProjectNumbers: number[]; showEmptyShares: boolean; shareholderNameFormat: string; updatedAt: string;
  createdBy: { name: string }; yearId: string | null; departmentId: string | null; typeId: string | null; groupId: string | null;
  destinationCountryId: string | null; partnerId: string | null; destinationRegionId: string | null;
  firstProjectNumber: number | null; lastProjectNumber: number | null; mainAssociationId: string | null; footerNote: string | null;
};

export function SavedPosters() {
  const [items, setItems] = useState<SavedPoster[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const load = useCallback(async () => {
    const response = await fetch("/api/posters", { cache: "no-store" });
    const data = (await response.json()) as { posters?: SavedPoster[]; message?: string };
    if (!response.ok) { setError(data.message ?? "Afişler yüklenemedi."); setLoading(false); return; }
    setItems(data.posters ?? []); setLoading(false);
  }, []);
  useEffect(() => { const timer = window.setTimeout(() => void load(), 0); return () => window.clearTimeout(timer); }, [load]);
  const filtered = useMemo(() => items.filter((item) => item.name.toLocaleLowerCase("tr").includes(query.toLocaleLowerCase("tr"))), [items, query]);
  async function copy(item: SavedPoster) {
    const payload = {
      name: `${item.name} - Kopya`, orientation: item.orientation, projectIds: item.projectIds, associationIds: item.associationIds,
      excludedProjectNumbers: item.excludedProjectNumbers, showEmptyShares: item.showEmptyShares, shareholderNameFormat: item.shareholderNameFormat,
      yearId: item.yearId, departmentId: item.departmentId, typeId: item.typeId, groupId: item.groupId,
      destinationCountryId: item.destinationCountryId, partnerId: item.partnerId, destinationRegionId: item.destinationRegionId,
      firstProjectNumber: item.firstProjectNumber, lastProjectNumber: item.lastProjectNumber, mainAssociationId: item.mainAssociationId, footerNote: item.footerNote,
    };
    const response = await fetch("/api/posters", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    if (!response.ok) { setError("Afiş kopyalanamadı."); return; }
    setMessage("Afiş kopyalandı."); await load();
  }
  async function remove(id: string) {
    if (!window.confirm("Kaydedilen afiş silinsin mi?")) return;
    const response = await fetch(`/api/posters/${id}`, { method: "DELETE" });
    if (!response.ok) { setError("Afiş silinemedi veya yetkiniz bulunmuyor."); return; }
    setMessage("Afiş silindi."); await load();
  }
  return <div className="mx-auto max-w-[1280px]">
    <div className="mb-6"><h2 className="text-xl font-bold text-[#0b2b3c]">Kaydedilen afişler</h2><p className="mt-1 text-sm text-slate-500">Kayıtlı afiş sorgularını güncel proje verileriyle yeniden açın ve yönetin.</p></div>
    {message && <p className="mb-4 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800">{message}</p>}
    {error && <p className="mb-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
    <Card className="overflow-hidden">
      <div className="border-b p-4"><div className="relative max-w-sm"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" /><Input value={query} onChange={(event) => setQuery(event.target.value)} className="pl-9" placeholder="Afiş adı ara" /></div></div>
      {loading ? <div className="flex justify-center gap-2 p-12 text-sm"><LoaderCircle className="size-5 animate-spin" /> Yükleniyor</div> : <div className="divide-y">
        {filtered.map((item) => <div key={item.id} className="grid gap-3 p-4 md:grid-cols-[1fr_130px_100px_160px_auto] md:items-center">
          <div><p className="font-bold text-[#0b2b3c]">{item.name}</p><p className="mt-1 text-xs text-slate-500">{item.createdBy.name} · {new Date(item.updatedAt).toLocaleString("tr-TR")}</p></div>
          <span className="text-xs">{item.orientation === "LANDSCAPE" ? "Yatay A4" : "Dikey A4"}</span><span className="text-xs">{item.projectIds.length} proje</span>
          <Link href={`${item.orientation === "LANDSCAPE" ? "/afisler/yatay" : "/afisler/dikey"}?poster=${item.id}`} className="inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-emerald-600 px-3 text-xs font-semibold text-white"><FileText className="size-4" /> Afişi aç</Link>
          <div className="flex gap-1"><Button size="sm" variant="ghost" onClick={() => void copy(item)} aria-label="Kopyala"><Copy className="size-4" /></Button><Button size="sm" variant="ghost" onClick={() => void remove(item.id)} aria-label="Sil"><Trash2 className="size-4 text-red-600" /></Button></div>
        </div>)}
        {!filtered.length && <p className="p-12 text-center text-sm text-slate-500">Kaydedilen afiş bulunamadı.</p>}
      </div>}
    </Card>
  </div>;
}
