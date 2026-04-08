import AppShell from "@/components/layout/AppShell";
import { ReportsSkeleton } from "@/components/ui/LoadingSkeleton";

export default function ReportsLoading() {
  return (
    <AppShell>
      <ReportsSkeleton />
    </AppShell>
  );
}
