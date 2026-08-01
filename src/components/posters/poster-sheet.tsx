import { Bird, Building2, MapPin, Phone } from "lucide-react";
import Image from "next/image";
import type { AssociationData, PosterOrientation, PosterProject } from "@/lib/posters/poster-types";
import { visiblePosterShares } from "@/lib/posters/poster-utils";

export function PosterSheet({ project, orientation, mainAssociation, supporters, showEmpty, nameFormat }: {
  project: PosterProject; orientation: PosterOrientation; mainAssociation: AssociationData | null; supporters: AssociationData[];
  showEmpty: boolean; nameFormat: "FULL" | "INITIALS";
}) {
  const shares = visiblePosterShares(project.shares, showEmpty);
  const headerAssociations = supporters.filter((item) => item.id !== mainAssociation?.id).slice(0, 2);
  const clean = (value: string) => repairTurkish(value);
  const displayName = (name: string | null) => {
    if (!name) return "BOŞ";
    const cleaned = clean(name);
    if (nameFormat === "FULL") return cleaned;
    const parts = cleaned.split(/\s+/); return `${parts[0]} ${parts.slice(1).map((part) => `${part[0]}.`).join(" ")}`;
  };
  return <article className={`poster-sheet ${orientation === "LANDSCAPE" ? "poster-landscape" : "poster-portrait"}`}>
    <header className="poster-header">
      <CountryFlag code="TR" country="Türkiye" label="Gelen Ülke" />
      <div className="poster-brand">
        <div className="poster-brand-logos">
          <Image unoptimized width={150} height={62} src="/yedirenk-logo.png" alt="Yedirenk Derneği" />
          {headerAssociations.map((item) => item.logoDataUrl
            ? <Image unoptimized width={150} height={62} key={item.id} src={item.logoDataUrl} alt={clean(item.logoAlt ?? item.name)} />
            : <span className="poster-supporter-name" key={item.id}>{clean(item.shortName)}</span>)}
        </div>
        <p>{headerAssociations.length ? "Yedirenk Derneği ve Destekçileri" : "Yedirenk Derneği"}</p>
      </div>
      <CountryFlag code={project.countryCode} country={clean(project.country || "Ülke belirtilmedi")} label="Giden Ülke" />
    </header>
    <section className="poster-title"><div><span>{clean(project.group)} · {clean(project.type)}</span><h2>{project.projectNumber}. KURBAN PROJESİ</h2></div><div className="poster-meta"><span><MapPin /> {clean(project.country)} / {clean(project.region)}</span><span><Bird /> {clean(project.year)}</span><span><Building2 /> {clean(project.partner || "Partner belirtilmedi")}</span></div></section>
    {(!project.country || !project.region) && <p className="poster-warning">Bu projede ülke veya bölge bilgisi eksik.</p>}
    <section className="poster-shares">
      {shares.length ? shares.map((share) => <div key={share.id} className={`poster-share ${share.status === "EMPTY" ? "poster-share-empty" : ""}`}><strong>{share.shareNumber}</strong><span title={share.donorName ?? "Boş hisse"}>{displayName(share.donorName)}</span><small>{clean(project.group)}</small><em>{share.status === "FILLED" ? "DOLU" : share.status === "EMPTY" ? "BOŞ" : clean(share.status)}</em></div>) : <p className="poster-warning">Projede gösterilecek hissedar bulunmuyor.</p>}
    </section>
    <footer className="poster-footer"><div className="poster-supporters" /><div className="poster-contact">{mainAssociation?.phone && <span><Phone /> {clean(mainAssociation.phone)}</span>}{mainAssociation?.website && <span>{clean(mainAssociation.website)}</span>}{mainAssociation?.address && <span>{clean(mainAssociation.address)}</span>}</div><strong>{clean(project.year)} · {clean(project.country)} · {clean(project.region)} · Proje {project.projectNumber}</strong></footer>
  </article>;
}

function CountryFlag({ code, country, label }: { code: string; country: string; label: string }) {
  const flagCode = countryFlagCode(code, country);
  return <div className="poster-country"><Image unoptimized className="poster-flag" width={48} height={32} src={`/flags/${flagCode}.svg`} alt={`${country} bayrağı`} /><span><small>{label}</small><strong>{country}</strong></span></div>;
}

function countryFlagCode(code: string, country: string) {
  const normalized = code.trim().toUpperCase();
  if (/^[A-Z]{2}$/.test(normalized)) return normalized;
  const countryKey = country.toLocaleUpperCase("tr-TR").replaceAll("İ", "I").replaceAll("Ş", "S").replaceAll("Ç", "C").replaceAll("Ğ", "G").replaceAll("Ü", "U").replaceAll("Ö", "O");
  return COUNTRY_CODES[countryKey] ?? "UN";
}

const COUNTRY_CODES: Record<string, string> = {
  TURKIYE: "TR", AFGANISTAN: "AF", BANGLADES: "BD", CAD: "TD", ETIYOPYA: "ET",
  "FILISTIN - GAZZE": "PS", FILISTIN: "PS", KAMERUN: "CM", SOMALI: "SO", SURIYE: "SY",
  TANZANYA: "TZ", YEMEN: "YE", SENEGAL: "SN", AFRIKA: "UN",
};

function repairTurkish(value: string) {
  return value
    .replaceAll("ÄŸ", "ğ").replaceAll("Äž", "Ğ")
    .replaceAll("ÅŸ", "ş").replaceAll("Åž", "Ş")
    .replaceAll("Ä±", "ı").replaceAll("Ä°", "İ")
    .replaceAll("Ã¼", "ü").replaceAll("Ãœ", "Ü")
    .replaceAll("Ã¶", "ö").replaceAll("Ã–", "Ö")
    .replaceAll("Ã§", "ç").replaceAll("Ã‡", "Ç")
    .replace(/Ba\?+/g, "Bağış").replace(/Y\?netimi/g, "Yönetimi").replace(/Derne\?i/g, "Derneği");
}
