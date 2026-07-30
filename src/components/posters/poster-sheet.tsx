import { Bird, Building2, Globe2, MapPin, Phone } from "lucide-react";
import Image from "next/image";
import type { AssociationData, PosterOrientation, PosterProject } from "@/lib/posters/poster-types";
import { visiblePosterShares } from "@/lib/posters/poster-utils";

export function PosterSheet({ project, orientation, mainAssociation, supporters, showEmpty, nameFormat }: {
  project: PosterProject; orientation: PosterOrientation; mainAssociation: AssociationData | null; supporters: AssociationData[];
  showEmpty: boolean; nameFormat: "FULL" | "INITIALS";
}) {
  const shares = visiblePosterShares(project.shares, showEmpty);
  const displayName = (name: string | null) => {
    if (!name) return "BOŞ";
    if (nameFormat === "FULL") return name;
    const parts = name.split(/\s+/); return `${parts[0]} ${parts.slice(1).map((part) => `${part[0]}.`).join(" ")}`;
  };
  return <article className={`poster-sheet ${orientation === "LANDSCAPE" ? "poster-landscape" : "poster-portrait"}`}>
    <header className="poster-header">
      <div className="poster-country"><span className="text-3xl">🇹🇷</span><strong>Türkiye</strong></div>
      <div className="poster-brand">{mainAssociation?.logoDataUrl ? <Image unoptimized width={96} height={64} src={mainAssociation.logoDataUrl} alt={mainAssociation.logoAlt ?? mainAssociation.name} /> : <span className="poster-logo-placeholder"><Building2 /></span>}<div><h1>{mainAssociation?.name ?? "Vefa Bağış Yönetimi"}</h1><p>Kurban Organizasyonu</p></div></div>
      <div className="poster-country"><Globe2 className="size-8 text-emerald-700" /><strong>{project.country || "Ülke belirtilmedi"}</strong></div>
    </header>
    <section className="poster-title"><div><span>{project.group} · {project.type}</span><h2>{project.projectNumber}. KURBAN PROJESİ</h2></div><div className="poster-meta"><span><MapPin /> {project.country} / {project.region}</span><span><Bird /> {project.year}</span><span><Building2 /> {project.partner || "Partner belirtilmedi"}</span></div></section>
    {(!project.country || !project.region) && <p className="poster-warning">Bu projede ülke veya bölge bilgisi eksik.</p>}
    <section className="poster-shares">
      {shares.length ? shares.map((share) => <div key={share.id} className={`poster-share ${share.status === "EMPTY" ? "poster-share-empty" : ""}`}><strong>{share.shareNumber}</strong><span title={share.donorName ?? "Boş hisse"}>{displayName(share.donorName)}</span><small>{project.group}</small><em>{share.status === "FILLED" ? "DOLU" : share.status === "EMPTY" ? "BOŞ" : share.status}</em></div>) : <p className="poster-warning">Projede gösterilecek hissedar bulunmuyor.</p>}
    </section>
    <footer className="poster-footer"><div className="poster-supporters">{supporters.slice(0, 6).map((item) => item.logoDataUrl ? <Image unoptimized width={72} height={42} key={item.id} src={item.logoDataUrl} alt={item.logoAlt ?? item.name} /> : <span key={item.id}>{item.shortName}</span>)}</div><div className="poster-contact">{mainAssociation?.phone && <span><Phone /> {mainAssociation.phone}</span>}{mainAssociation?.website && <span>{mainAssociation.website}</span>}{mainAssociation?.address && <span>{mainAssociation.address}</span>}</div><strong>{project.year} · {project.country} · {project.region} · Proje {project.projectNumber}</strong></footer>
  </article>;
}
