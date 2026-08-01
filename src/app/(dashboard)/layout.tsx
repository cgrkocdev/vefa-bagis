import { AppShell } from "@/components/layout/app-shell";
import { ReportTableSorting } from "@/components/layout/report-table-sorting";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <AppShell><ReportTableSorting />{children}</AppShell>;
}
