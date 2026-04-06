import BottomNav from "./BottomNav";
import AddTransactionFAB from "../ui/AddTransactionFAB";

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <main className="mb-nav">{children}</main>
      <AddTransactionFAB />
      <BottomNav />
    </>
  );
}
