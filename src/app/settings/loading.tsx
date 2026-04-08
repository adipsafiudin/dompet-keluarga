import AppShell from "@/components/layout/AppShell";
import { SettingsSkeleton } from "@/components/ui/LoadingSkeleton";

export default function SettingsLoading() {
  return (
    <AppShell>
      <SettingsSkeleton />
    </AppShell>
  );
}
