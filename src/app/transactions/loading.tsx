import AppShell from "@/components/layout/AppShell";
import { TransactionListSkeleton } from "@/components/ui/LoadingSkeleton";

export default function TransactionsLoading() {
  return (
    <AppShell>
      <TransactionListSkeleton />
    </AppShell>
  );
}
