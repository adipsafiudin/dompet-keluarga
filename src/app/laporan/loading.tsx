import AppShell from "@/components/layout/AppShell";
import { ReportsSkeleton } from "@/components/ui/LoadingSkeleton";

export default function LaporanLoading() {
  return (
    <AppShell>
      <ReportsSkeleton />
    </AppShell>
  );
}
