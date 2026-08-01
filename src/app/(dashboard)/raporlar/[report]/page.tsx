import { notFound } from "next/navigation";
import { ReportDashboard } from "@/components/reports/report-dashboard";
import { findReportSection } from "@/lib/report-sections";
import { IncomingOutgoingReport } from "@/components/reports/incoming-outgoing-report";
import { IncomingOutgoingDetailReport } from "@/components/reports/incoming-outgoing-detail-report";
import { GeneralDonationStatisticsReport } from "@/components/reports/general-donation-statistics-report";
import { SentGeneralStatisticsReport } from "@/components/reports/sent-general-statistics-report";
import { ProvinceStatisticsReport } from "@/components/reports/province-statistics-report";
import { AdvancedQueryReport } from "@/components/reports/advanced-query-report";
import { DailyInKindReport } from "@/components/reports/daily-in-kind-report";

export default async function ReportSectionPage({
  params,
}: {
  params: Promise<{ report: string }>;
}) {
  const { report } = await params;
  const section = findReportSection(report);
  if (!section) notFound();
  if (report === "bagis-listesi") return <IncomingOutgoingReport />;
  if (report === "bagis-listesi-detay") return <IncomingOutgoingDetailReport />;
  if (report === "genel-bagis-istatistik") return <GeneralDonationStatisticsReport />;
  if (report === "gonderilen-genel-istatistik") return <SentGeneralStatisticsReport />;
  if (report === "il-istatistik") return <ProvinceStatisticsReport />;
  if (report === "ilce-istatistik") return <ProvinceStatisticsReport mode="district" />;
  if (report === "rapor-sorgu") return <AdvancedQueryReport />;
  if (report === "gunluk-ayni-bagis") return <DailyInKindReport />;
  if (report === "ayni-bagis-il") return <ProvinceStatisticsReport inKindOnly />;
  if (report === "ayni-bagis-ilce") return <ProvinceStatisticsReport mode="district" inKindOnly />;
  return <ReportDashboard title={section.label} />;
}
