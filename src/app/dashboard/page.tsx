import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import DashboardClient from "./DashboardClient";
import { getMonthRange } from "@/lib/utils";
import type { Account, Transaction, BudgetAlert } from "@/types";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const now = new Date();
  const { from, to } = getMonthRange(now.getFullYear(), now.getMonth() + 1);

  const [profileRes, memberRes, accountsRes, txRes, categoriesRes] =
    await Promise.all([
      supabase.from("profiles").select("full_name").eq("id", user.id).single(),
      supabase
        .from("family_members")
        .select("family_id, families(name)")
        .eq("user_id", user.id)
        .single(),
      supabase
        .from("accounts")
        .select("*")
        .eq("is_active", true)
        .order("sort_order"),
      supabase
        .from("transactions")
        .select(
          `*, category:categories(*), account:accounts!transactions_account_id_fkey(*), to_account:accounts!transactions_to_account_id_fkey(*), income_source:income_sources(*), created_by_user:profiles!transactions_created_by_fkey(*)`,
        )
        .gte("date", from)
        .lte("date", to)
        .order("date", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(10),
      supabase
        .from("categories")
        .select("*")
        .eq("type", "expense")
        .eq("is_active", true)
        .not("budget_limit", "is", null),
    ]);

  if (!memberRes.data) redirect("/setup");

  const family = memberRes.data.families as unknown as { name: string };
  const familyId = memberRes.data.family_id;

  // Filter accounts & tx to this family only
  const accounts = (accountsRes.data ?? []).filter(
    (a) => a.family_id === familyId,
  ) as Account[];
  const transactions = (txRes.data ?? []).filter(
    (t) => t.family_id === familyId,
  ) as Transaction[];
  const categories = (categoriesRes.data ?? []).filter(
    (c) => c.family_id === familyId,
  );

  // Pre-compute budget alerts on server
  const budgetAlerts: BudgetAlert[] = [];
  for (const cat of categories) {
    if (!cat.budget_limit) continue;
    const spent = transactions
      .filter((t) => t.type === "expense" && t.category_id === cat.id)
      .reduce((s, t) => s + t.amount, 0);
    const pct = (spent / cat.budget_limit) * 100;
    if (pct >= 70)
      budgetAlerts.push({
        category: cat,
        spent,
        percentage: pct,
        budget_limit: cat.budget_limit,
        is_over_budget: pct >= 100,
      });
  }

  return (
    <DashboardClient
      userName={profileRes.data?.full_name || "Pengguna"}
      familyName={family.name}
      familyId={familyId}
      initialAccounts={accounts}
      initialTransactions={transactions}
      initialBudgetAlerts={budgetAlerts}
    />
  );
}
