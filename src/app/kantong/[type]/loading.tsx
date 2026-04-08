import AppShell from "@/components/layout/AppShell";
import { KantongPageSkeleton } from "@/components/ui/LoadingSkeleton";

export default function KantongLoading() {
  return (
    <AppShell>
      <KantongPageSkeleton />
    </AppShell>
  );
}
