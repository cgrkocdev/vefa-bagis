export const REPORT_SECTIONS = [
  { slug: "bagis-sonuc-raporu", label: "Bağış Sonuç Raporu" },
  { slug: "bagis-listesi", label: "Bağış Listesi" },
  { slug: "bagis-listesi-detay", label: "Bağış Listesi Detay" },
  { slug: "genel-bagis-istatistik", label: "Genel Bağış İstatistik" },
  { slug: "gonderilen-genel-istatistik", label: "Gönderilen Genel İstatistik" },
  { slug: "odeme-istatistik", label: "Ödeme İstatistik" },
  { slug: "il-istatistik", label: "İl İstatistik" },
  { slug: "ilce-istatistik", label: "İlçe İstatistik" },
  { slug: "rapor-sorgu", label: "Rapor Sorgu" },
  { slug: "gunluk-ayni-bagis", label: "Günlük Ayni Bağış" },
  { slug: "ayni-bagis-il", label: "Ayni Bağış (İl)" },
  { slug: "ayni-bagis-ilce", label: "Ayni Bağış (İlçe)" },
] as const;

export type ReportSectionSlug = (typeof REPORT_SECTIONS)[number]["slug"];

export function findReportSection(slug: string) {
  return REPORT_SECTIONS.find((item) => item.slug === slug);
}
