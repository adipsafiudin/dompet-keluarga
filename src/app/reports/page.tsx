"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import dynamic from "next/dynamic";
import { createClient } from "@/lib/supabase/client";
import { subscribeFamilyRefresh } from "@/lib/realtime";
import { cn, formatRupiah, getMonthRange, getBudgetColor } from "@/lib/utils";
import { useHiddenBalance } from "@/contexts/HiddenBalanceContext";
import AppShell from "@/components/layout/AppShell";
import { ReportsSkeleton } from "@/components/ui/LoadingSkeleton";
import {
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Wallet,
  PiggyBank,
  Landmark,
  Smartphone,
  CircleDot,
  Tag,
  Users,
} from "lucide-react";
import type {
  Transaction,
  Category,
  IncomeSource,
  Account,
  FamilyMember,
  CategorySummary,
  IncomeSourceSummary,
  DailyData,
} from "@/types";

const MonthlyBarChart = dynamic(
  () => import("@/components/charts/MonthlyBarChart"),
  { ssr: false },
);
const ExpensePieChart = dynamic(
  () => import("@/components/charts/ExpensePieChart"),
  { ssr: false },
);

const ACCOUNT_ICON_MAP: Record<
  string,
  React.ComponentType<{ className?: string; style?: React.CSSProperties }>
> = {
  cash: Wallet,
  bank: Landmark,
  e_wallet: Smartphone,
  investment: TrendingUp,
  other: CircleDot,
};

const TABS = [
  { id: "bulanan", label: "Bulanan" },
  { id: "kategori", label: "Kategori" },
  { id: "kantong", label: "Kantong" },
  { id: "dompet", label: "Dompet" },
  { id: "anggota", label: "Anggota" },
];

const MEMBER_COLORS = [
  "#6366f1",
  "#f59e0b",
  "#10b981",
  "#ef4444",
  "#8b5cf6",
  "#06b6d4",
  "#f97316",
  "#ec4899",
];

export default function ReportsPage() {
  const [month, setMonth] = useState(new Date());
  const [activeTab, setActiveTab] = useState("bulanan");
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [incomeSources, setIncomeSources] = useState<IncomeSource[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [familyId, setFamilyId] = useState("");
  const tabsRef = useRef<HTMLDivElement>(null);
  const { fmt } = useHiddenBalance();

  useEffect(() => {
    async function init() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const { data: member } = await supabase
        .from("family_members")
        .select("family_id")
        .eq("user_id", user.id)
        .single();
      if (!member) return;
      setFamilyId(member.family_id);

      const [cats, srcs, accs, mems] = await Promise.all([
        supabase
          .from("categories")
          .select("*")
          .eq("family_id", member.family_id)
          .eq("is_active", true),
        supabase
          .from("income_sources")
          .select("*")
          .eq("family_id", member.family_id)
          .eq("is_active", true),
        supabase
          .from("accounts")
          .select("*")
          .eq("family_id", member.family_id)
          .eq("is_active", true)
          .order("sort_order"),
        supabase
          .from("family_members")
          .select("*, user:profiles(*)")
          .eq("family_id", member.family_id)
          .order("joined_at"),
      ]);
      if (cats.data) setCategories(cats.data);
      if (srcs.data) setIncomeSources(srcs.data);
      if (accs.data) setAccounts(accs.data);
      if (mems.data) setMembers(mems.data as FamilyMember[]);
    }
    init();
  }, []);

  useEffect(() => {
    if (!familyId) return;
    async function fetchData() {
      setLoading(true);
      const supabase = createClient();
      const { from, to } = getMonthRange(
        month.getFullYear(),
        month.getMonth() + 1,
      );
      const { data } = await supabase
        .from("transactions")
        .select("*")
        .eq("family_id", familyId)
        .gte("date", from)
        .lte("date", to)
        .order("date");
      if (data) setTransactions(data);
      setLoading(false);
    }
    fetchData();
    const cleanup = subscribeFamilyRefresh(familyId, fetchData);
    const supabase = createClient();
    const channel = supabase
      .channel(`reports:${familyId}:${month.toISOString().slice(0, 7)}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "transactions",
          filter: `family_id=eq.${familyId}`,
        },
        fetchData,
      )
      .subscribe();
    return () => {
      cleanup();
      supabase.removeChannel(channel);
    };
  }, [familyId, month]);

  // ── Computed values ──
  const totals = useMemo(() => {
    const income = transactions
      .filter((t) => t.type === "income")
      .reduce((s, t) => s + t.amount, 0);
    const expense = transactions
      .filter((t) => t.type === "expense")
      .reduce((s, t) => s + t.amount, 0);
    return { income, expense, net: income - expense };
  }, [transactions]);

  const dailyData: DailyData[] = useMemo(() => {
    const days = new Date(
      month.getFullYear(),
      month.getMonth() + 1,
      0,
    ).getDate();
    return Array.from({ length: days }, (_, i) => {
      const d = i + 1;
      const dateStr = `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      const dayTxns = transactions.filter((t) => t.date === dateStr);
      return {
        date: dateStr,
        income: dayTxns
          .filter((t) => t.type === "income")
          .reduce((s, t) => s + t.amount, 0),
        expense: dayTxns
          .filter((t) => t.type === "expense")
          .reduce((s, t) => s + t.amount, 0),
      };
    });
  }, [transactions, month]);

  const categorySummaries: CategorySummary[] = useMemo(() => {
    const expenseTxns = transactions.filter((t) => t.type === "expense");
    const totalExpense = expenseTxns.reduce((s, t) => s + t.amount, 0);
    if (totalExpense === 0) return [];
    const map = new Map<string, { total: number; count: number }>();
    expenseTxns.forEach((t) => {
      if (!t.category_id) return;
      const curr = map.get(t.category_id) || { total: 0, count: 0 };
      curr.total += t.amount;
      curr.count += 1;
      map.set(t.category_id, curr);
    });
    return Array.from(map.entries())
      .map(([catId, d]) => {
        const category = categories.find((c) => c.id === catId);
        if (!category) return null;
        return {
          category,
          total: d.total,
          count: d.count,
          percentage: (d.total / totalExpense) * 100,
          budget_used_pct: category.budget_limit
            ? (d.total / category.budget_limit) * 100
            : null,
        };
      })
      .filter(Boolean)
      .sort((a, b) => b!.total - a!.total) as CategorySummary[];
  }, [transactions, categories]);

  const incomeSourceSummaries: IncomeSourceSummary[] = useMemo(() => {
    const incomeTxns = transactions.filter((t) => t.type === "income");
    const totalIncome = incomeTxns.reduce((s, t) => s + t.amount, 0);
    if (totalIncome === 0) return [];
    const map = new Map<string, { total: number; count: number }>();
    incomeTxns.forEach((t) => {
      const key = t.income_source_id || "other";
      const curr = map.get(key) || { total: 0, count: 0 };
      curr.total += t.amount;
      curr.count += 1;
      map.set(key, curr);
    });
    return Array.from(map.entries())
      .map(([srcId, d]) => ({
        income_source: incomeSources.find((s) => s.id === srcId) || null,
        total: d.total,
        count: d.count,
        percentage: (d.total / totalIncome) * 100,
      }))
      .sort((a, b) => b.total - a.total);
  }, [transactions, incomeSources]);

  // Per-kantong summary
  const kantongSummary = useMemo(() => {
    const bayarAccounts = accounts.filter(
      (a) => (a.transaction_mode ?? "full") === "full",
    );
    const tabunganAccounts = accounts.filter(
      (a) =>
        (a.transaction_mode ?? "full") === "transfer_only" ||
        a.type === "investment",
    );
    const bayarIds = new Set(bayarAccounts.map((a) => a.id));
    const tabunganIds = new Set(tabunganAccounts.map((a) => a.id));

    const compute = (ids: Set<string>) => {
      const txns = transactions.filter((t) => ids.has(t.account_id));
      return {
        income: txns
          .filter((t) => t.type === "income")
          .reduce((s, t) => s + t.amount, 0),
        expense: txns
          .filter((t) => t.type === "expense")
          .reduce((s, t) => s + t.amount, 0),
        totalBalance: accounts
          .filter((a) => ids.has(a.id))
          .reduce((s, a) => s + a.current_balance, 0),
        count: ids.size,
      };
    };

    return {
      bayar: { accounts: bayarAccounts, ...compute(bayarIds) },
      tabungan: { accounts: tabunganAccounts, ...compute(tabunganIds) },
    };
  }, [transactions, accounts]);

  // Per-account summary
  const accountSummaries = useMemo(() => {
    return accounts
      .map((acc) => {
        const txns = transactions.filter((t) => t.account_id === acc.id);
        return {
          account: acc,
          income: txns
            .filter((t) => t.type === "income")
            .reduce((s, t) => s + t.amount, 0),
          expense: txns
            .filter((t) => t.type === "expense")
            .reduce((s, t) => s + t.amount, 0),
          txCount: txns.length,
        };
      })
      .sort((a, b) => b.account.current_balance - a.account.current_balance);
  }, [transactions, accounts]);

  // Per-member summary
  const memberSummaries = useMemo(() => {
    const totalExpense = transactions
      .filter((t) => t.type === "expense")
      .reduce((s, t) => s + t.amount, 0);

    return members.map((m, idx) => {
      const memberTxns = transactions.filter((t) => t.created_by === m.user_id);
      const income = memberTxns
        .filter((t) => t.type === "income")
        .reduce((s, t) => s + t.amount, 0);
      const expense = memberTxns
        .filter((t) => t.type === "expense")
        .reduce((s, t) => s + t.amount, 0);
      const expensePct = totalExpense > 0 ? (expense / totalExpense) * 100 : 0;
      return {
        member: m,
        income,
        expense,
        txCount: memberTxns.length,
        expensePct,
        color: MEMBER_COLORS[idx % MEMBER_COLORS.length],
      };
    });
  }, [transactions, members]);

  const monthLabel = month.toLocaleDateString("id-ID", {
    month: "long",
    year: "numeric",
  });

  return (
    <AppShell>
      {/* ── Header ── */}
      <div className="sticky top-0 z-40 bg-white shadow-sm">
        {/* Title + Month Nav */}
        <div className="px-4 pt-4 pb-3">
          <h1 className="text-xl font-bold text-gray-900 mb-3">Rekap</h1>
          <div className="flex items-center justify-between bg-gray-100 rounded-2xl px-2 py-1">
            <button
              onClick={() =>
                setMonth(new Date(month.getFullYear(), month.getMonth() - 1))
              }
              className="w-9 h-9 rounded-xl flex items-center justify-center active:bg-gray-200"
            >
              <ChevronLeft className="w-4 h-4 text-gray-600" />
            </button>
            <span className="text-sm font-semibold text-gray-800 capitalize">
              {monthLabel}
            </span>
            <button
              onClick={() =>
                setMonth(new Date(month.getFullYear(), month.getMonth() + 1))
              }
              className="w-9 h-9 rounded-xl flex items-center justify-center active:bg-gray-200"
            >
              <ChevronRight className="w-4 h-4 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div
          ref={tabsRef}
          className="flex gap-1 px-4 pb-3 overflow-x-auto no-scrollbar"
        >
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "shrink-0 px-4 py-2 rounded-xl text-xs font-semibold transition-all",
                activeTab === tab.id
                  ? "bg-gray-900 text-white"
                  : "bg-gray-100 text-gray-500",
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Content ── */}
      {loading ? (
        <ReportsSkeleton />
      ) : (
        <div className="bg-gray-50 min-h-screen pb-8">
          {/* ───────────── TAB: BULANAN ───────────── */}
          {activeTab === "bulanan" && (
            <div className="pt-4 space-y-4 px-4">
              {/* Big summary */}
              <div className="bg-white rounded-3xl shadow-sm overflow-hidden">
                <div className="grid grid-cols-2 divide-x divide-gray-50">
                  <div className="p-4">
                    <div className="flex items-center gap-1.5 mb-1">
                      <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
                      <span className="text-xs text-emerald-600 font-medium">
                        Pemasukan
                      </span>
                    </div>
                    <p className="text-xl font-bold text-emerald-600">
                      {fmt(totals.income, true)}
                    </p>
                  </div>
                  <div className="p-4">
                    <div className="flex items-center gap-1.5 mb-1">
                      <TrendingDown className="w-3.5 h-3.5 text-red-500" />
                      <span className="text-xs text-red-500 font-medium">
                        Pengeluaran
                      </span>
                    </div>
                    <p className="text-xl font-bold text-red-500">
                      {fmt(totals.expense, true)}
                    </p>
                  </div>
                </div>
                <div
                  className={cn(
                    "px-4 py-3 border-t border-gray-50",
                    totals.net >= 0 ? "bg-emerald-50" : "bg-red-50",
                  )}
                >
                  <p className="text-xs text-gray-500 mb-0.5">
                    Selisih bulan ini
                  </p>
                  <p
                    className={cn(
                      "text-2xl font-bold",
                      totals.net >= 0 ? "text-emerald-600" : "text-red-500",
                    )}
                  >
                    {totals.net >= 0 ? "+" : ""}
                    {fmt(totals.net)}
                  </p>
                </div>
              </div>

              {/* Bar chart */}
              <div className="bg-white rounded-3xl shadow-sm p-4">
                <p className="text-sm font-semibold text-gray-700 mb-3">
                  Grafik Harian
                </p>
                <MonthlyBarChart data={dailyData} />
              </div>

              {/* Income sources */}
              {incomeSourceSummaries.length > 0 && (
                <div className="bg-white rounded-3xl shadow-sm p-4">
                  <p className="text-sm font-semibold text-gray-700 mb-3">
                    Sumber Pemasukan
                  </p>
                  <div className="space-y-3">
                    {incomeSourceSummaries.map((is, idx) => (
                      <div key={idx}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm text-gray-700 font-medium">
                            {is.income_source?.name || "Lainnya"}
                          </span>
                          <span className="text-sm font-bold text-emerald-600">
                            {fmt(is.total, true)}
                          </span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full bg-emerald-400"
                            style={{
                              width: `${Math.min(is.percentage, 100)}%`,
                            }}
                          />
                        </div>
                        <p className="text-[10px] text-gray-400 mt-0.5">
                          {Math.round(is.percentage)}% dari total pemasukan
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ───────────── TAB: KATEGORI ───────────── */}
          {activeTab === "kategori" && (
            <div className="pt-4 space-y-4 px-4">
              {categorySummaries.length === 0 ? (
                <div className="bg-white rounded-3xl shadow-sm p-8 text-center">
                  <p className="text-3xl mb-2">📊</p>
                  <p className="text-sm font-medium text-gray-600">
                    Belum ada pengeluaran
                  </p>
                  <p className="text-xs text-gray-400">bulan {monthLabel}</p>
                </div>
              ) : (
                <>
                  {/* Pie chart */}
                  <div className="bg-white rounded-3xl shadow-sm p-4">
                    <p className="text-sm font-semibold text-gray-700 mb-2">
                      Distribusi Pengeluaran
                    </p>
                    <ExpensePieChart data={categorySummaries} />
                  </div>

                  {/* Category list */}
                  <div className="bg-white rounded-3xl shadow-sm overflow-hidden">
                    <div className="px-4 pt-4 pb-2">
                      <p className="text-sm font-semibold text-gray-700">
                        Rincian per Kategori
                      </p>
                    </div>
                    <div className="divide-y divide-gray-50">
                      {categorySummaries.map((cs) => (
                        <div key={cs.category.id} className="px-4 py-3.5">
                          <div className="flex items-center gap-3 mb-2">
                            <div
                              className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                              style={{
                                backgroundColor: `${cs.category.color}18`,
                              }}
                            >
                              <Tag
                                className="w-4 h-4"
                                style={{ color: cs.category.color }}
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-semibold text-gray-800">
                                  {cs.category.name}
                                </span>
                                <span className="text-sm font-bold text-gray-900">
                                  {fmt(cs.total, true)}
                                </span>
                              </div>
                              <div className="flex items-center justify-between mt-0.5">
                                <span className="text-[10px] text-gray-400">
                                  {cs.count} transaksi ·{" "}
                                  {Math.round(cs.percentage)}% dari pengeluaran
                                </span>
                                {cs.budget_used_pct !== null && (
                                  <span
                                    className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
                                    style={{
                                      color: getBudgetColor(cs.budget_used_pct),
                                      backgroundColor: `${getBudgetColor(cs.budget_used_pct)}18`,
                                    }}
                                  >
                                    {Math.round(cs.budget_used_pct)}% anggaran
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all"
                              style={{
                                width: `${Math.min(cs.percentage, 100)}%`,
                                backgroundColor: cs.category.color,
                              }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* ───────────── TAB: KANTONG ───────────── */}
          {activeTab === "kantong" && (
            <div className="pt-4 space-y-4 px-4">
              {/* Kantong Bayar */}
              <div className="bg-white rounded-3xl shadow-sm overflow-hidden">
                <div className="px-4 pt-4 pb-3 flex items-center gap-3 border-b border-gray-50">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-50 flex items-center justify-center">
                    <Wallet className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-800">
                      Kantong Bayar
                    </p>
                    <p className="text-xs text-gray-400">
                      {kantongSummary.bayar.count} akun · Saldo{" "}
                      {fmt(kantongSummary.bayar.totalBalance, true)}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 divide-x divide-gray-50">
                  <div className="p-4">
                    <p className="text-xs text-emerald-600 mb-1">
                      Masuk bulan ini
                    </p>
                    <p className="text-base font-bold text-emerald-600">
                      {fmt(kantongSummary.bayar.income, true)}
                    </p>
                  </div>
                  <div className="p-4">
                    <p className="text-xs text-red-500 mb-1">
                      Keluar bulan ini
                    </p>
                    <p className="text-base font-bold text-red-500">
                      {fmt(kantongSummary.bayar.expense, true)}
                    </p>
                  </div>
                </div>
                {kantongSummary.bayar.accounts.length > 0 && (
                  <div className="border-t border-gray-50 divide-y divide-gray-50">
                    {kantongSummary.bayar.accounts.map((acc) => {
                      const Icon = ACCOUNT_ICON_MAP[acc.type] || Wallet;
                      const summ = accountSummaries.find(
                        (s) => s.account.id === acc.id,
                      );
                      return (
                        <div
                          key={acc.id}
                          className="flex items-center gap-3 px-4 py-3"
                        >
                          <div
                            className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                            style={{ backgroundColor: `${acc.color}18` }}
                          >
                            <Icon
                              className="w-4 h-4"
                              style={{ color: acc.color }}
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-gray-700 truncate">
                              {acc.name}
                            </p>
                            <p className="text-[10px] text-gray-400">
                              {summ
                                ? `${summ.txCount} transaksi`
                                : "0 transaksi"}
                            </p>
                          </div>
                          <p className="text-xs font-bold text-gray-800">
                            {fmt(acc.current_balance, true)}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Kantong Tabungan */}
              <div className="bg-white rounded-3xl shadow-sm overflow-hidden">
                <div className="px-4 pt-4 pb-3 flex items-center gap-3 border-b border-gray-50">
                  <div className="w-10 h-10 rounded-2xl bg-violet-50 flex items-center justify-center">
                    <PiggyBank className="w-5 h-5 text-violet-600" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-800">
                      Kantong Tabungan
                    </p>
                    <p className="text-xs text-gray-400">
                      {kantongSummary.tabungan.count} akun · Saldo{" "}
                      {fmt(kantongSummary.tabungan.totalBalance, true)}
                    </p>
                  </div>
                </div>
                <div className="p-4">
                  <p className="text-xs text-gray-500 mb-1">
                    Total tabungan & investasi
                  </p>
                  <p className="text-2xl font-bold text-violet-600">
                    {fmt(kantongSummary.tabungan.totalBalance)}
                  </p>
                </div>
                {kantongSummary.tabungan.accounts.length > 0 && (
                  <div className="border-t border-gray-50 divide-y divide-gray-50">
                    {kantongSummary.tabungan.accounts.map((acc) => {
                      const Icon = ACCOUNT_ICON_MAP[acc.type] || Wallet;
                      const pct =
                        kantongSummary.tabungan.totalBalance > 0
                          ? (acc.current_balance /
                              kantongSummary.tabungan.totalBalance) *
                            100
                          : 0;
                      return (
                        <div key={acc.id} className="px-4 py-3">
                          <div className="flex items-center gap-3 mb-2">
                            <div
                              className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                              style={{ backgroundColor: `${acc.color}18` }}
                            >
                              <Icon
                                className="w-4 h-4"
                                style={{ color: acc.color }}
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <p className="text-xs font-semibold text-gray-700 truncate">
                                  {acc.name}
                                </p>
                                <p className="text-xs font-bold text-gray-800">
                                  {fmt(acc.current_balance, true)}
                                </p>
                              </div>
                              <p className="text-[10px] text-gray-400">
                                {Math.round(pct)}% dari total tabungan
                              </p>
                            </div>
                          </div>
                          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full"
                              style={{
                                width: `${Math.min(pct, 100)}%`,
                                backgroundColor: acc.color,
                              }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
                {kantongSummary.tabungan.accounts.length === 0 && (
                  <div className="px-4 pb-4 text-center">
                    <p className="text-xs text-gray-400">
                      Belum ada akun tabungan/investasi
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ───────────── TAB: DOMPET ───────────── */}
          {activeTab === "dompet" && (
            <div className="pt-4 px-4">
              {/* Total all accounts */}
              <div className="bg-white rounded-3xl shadow-sm p-4 mb-4">
                <p className="text-xs text-gray-500 mb-1">Total semua dompet</p>
                <p className="text-2xl font-bold text-gray-900">
                  {fmt(
                    accounts.reduce((s, a) => s + a.current_balance, 0),
                  )}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {accounts.length} dompet aktif
                </p>
              </div>

              {/* Per-account cards */}
              <div className="bg-white rounded-3xl shadow-sm overflow-hidden">
                <div className="px-4 pt-4 pb-2">
                  <p className="text-sm font-semibold text-gray-700">
                    Rincian per Dompet
                  </p>
                </div>
                {accountSummaries.length === 0 ? (
                  <div className="px-4 pb-4 text-center">
                    <p className="text-sm text-gray-400">Belum ada dompet</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-50">
                    {accountSummaries.map(
                      ({ account: acc, income, expense, txCount }) => {
                        const Icon = ACCOUNT_ICON_MAP[acc.type] || Wallet;
                        const isTabungan =
                          (acc.transaction_mode ?? "full") ===
                            "transfer_only" || acc.type === "investment";
                        return (
                          <div key={acc.id} className="px-4 py-4">
                            <div className="flex items-center gap-3 mb-3">
                              <div
                                className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0"
                                style={{ backgroundColor: `${acc.color}18` }}
                              >
                                <Icon
                                  className="w-5 h-5"
                                  style={{ color: acc.color }}
                                />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <p className="text-sm font-semibold text-gray-800 truncate">
                                    {acc.name}
                                  </p>
                                  {isTabungan && (
                                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-violet-100 text-violet-600">
                                      Tabungan
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs text-gray-400">
                                  {acc.bank_name || acc.type} · {txCount}{" "}
                                  transaksi bulan ini
                                </p>
                              </div>
                              <div className="text-right shrink-0">
                                <p className="text-sm font-bold text-gray-900">
                                  {fmt(acc.current_balance, true)}
                                </p>
                                <p className="text-[10px] text-gray-400">
                                  saldo
                                </p>
                              </div>
                            </div>
                            {!isTabungan && (income > 0 || expense > 0) && (
                              <div className="grid grid-cols-2 gap-2">
                                <div className="bg-emerald-50 rounded-xl px-3 py-2">
                                  <p className="text-[10px] text-emerald-600">
                                    Masuk
                                  </p>
                                  <p className="text-xs font-bold text-emerald-700">
                                    {fmt(income, true)}
                                  </p>
                                </div>
                                <div className="bg-red-50 rounded-xl px-3 py-2">
                                  <p className="text-[10px] text-red-500">
                                    Keluar
                                  </p>
                                  <p className="text-xs font-bold text-red-600">
                                    {fmt(expense, true)}
                                  </p>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      },
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
          {/* ───────────── TAB: ANGGOTA ───────────── */}
          {activeTab === "anggota" && (
            <div className="pt-4 space-y-4 px-4">
              {/* Family total summary */}
              <div className="bg-white rounded-3xl shadow-sm overflow-hidden">
                <div className="px-4 pt-4 pb-3 flex items-center gap-3 border-b border-gray-50">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-50 flex items-center justify-center">
                    <Users className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-800">
                      Anggota Keluarga
                    </p>
                    <p className="text-xs text-gray-400">
                      {members.length} anggota aktif
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 divide-x divide-gray-50">
                  <div className="p-4">
                    <div className="flex items-center gap-1.5 mb-1">
                      <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
                      <span className="text-xs text-emerald-600 font-medium">
                        Pemasukan
                      </span>
                    </div>
                    <p className="text-lg font-bold text-emerald-600">
                      {fmt(totals.income, true)}
                    </p>
                  </div>
                  <div className="p-4">
                    <div className="flex items-center gap-1.5 mb-1">
                      <TrendingDown className="w-3.5 h-3.5 text-red-500" />
                      <span className="text-xs text-red-500 font-medium">
                        Pengeluaran
                      </span>
                    </div>
                    <p className="text-lg font-bold text-red-500">
                      {fmt(totals.expense, true)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Per-member cards */}
              {memberSummaries.length === 0 ? (
                <div className="bg-white rounded-3xl shadow-sm p-8 text-center">
                  <p className="text-3xl mb-2">👨‍👩‍👧‍👦</p>
                  <p className="text-sm font-medium text-gray-600">
                    Belum ada anggota
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {memberSummaries.map(
                    ({
                      member,
                      income,
                      expense,
                      txCount,
                      expensePct,
                      color,
                    }) => {
                      const name =
                        member.user?.full_name ||
                        member.user?.email ||
                        "Anggota";
                      const initial = name.charAt(0).toUpperCase();
                      const net = income - expense;
                      return (
                        <div
                          key={member.id}
                          className="bg-white rounded-3xl shadow-sm overflow-hidden"
                        >
                          {/* Member header */}
                          <div className="px-4 pt-4 pb-3 flex items-center gap-3">
                            <div
                              className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 text-white font-bold text-base"
                              style={{ backgroundColor: color }}
                            >
                              {initial}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="text-sm font-bold text-gray-800 truncate">
                                  {name}
                                </p>
                                {member.nickname && (
                                  <span
                                    className="shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full"
                                    style={{
                                      backgroundColor: `${color}18`,
                                      color,
                                    }}
                                  >
                                    {member.nickname}
                                  </span>
                                )}
                                {member.role === "owner" && (
                                  <span className="shrink-0 text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700">
                                    Owner
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-gray-400">
                                {txCount} transaksi bulan ini
                              </p>
                            </div>
                            <div className="text-right shrink-0">
                              <p
                                className={cn(
                                  "text-sm font-bold",
                                  net >= 0
                                    ? "text-emerald-600"
                                    : "text-red-500",
                                )}
                              >
                                {net >= 0 ? "+" : ""}
                                {fmt(net, true)}
                              </p>
                              <p className="text-[10px] text-gray-400">
                                selisih
                              </p>
                            </div>
                          </div>

                          {/* Income / expense */}
                          {income > 0 || expense > 0 ? (
                            <>
                              <div className="grid grid-cols-2 gap-2 px-4 pb-3">
                                <div className="bg-emerald-50 rounded-xl px-3 py-2">
                                  <p className="text-[10px] text-emerald-600">
                                    Pemasukan
                                  </p>
                                  <p className="text-xs font-bold text-emerald-700">
                                    {fmt(income, true)}
                                  </p>
                                </div>
                                <div className="bg-red-50 rounded-xl px-3 py-2">
                                  <p className="text-[10px] text-red-500">
                                    Pengeluaran
                                  </p>
                                  <p className="text-xs font-bold text-red-600">
                                    {fmt(expense, true)}
                                  </p>
                                </div>
                              </div>
                              {/* Expense share bar */}
                              {totals.expense > 0 && (
                                <div className="px-4 pb-4">
                                  <div className="flex items-center justify-between mb-1">
                                    <p className="text-[10px] text-gray-400">
                                      Kontribusi pengeluaran keluarga
                                    </p>
                                    <p className="text-[10px] font-semibold text-gray-600">
                                      {Math.round(expensePct)}%
                                    </p>
                                  </div>
                                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                    <div
                                      className="h-full rounded-full"
                                      style={{
                                        width: `${Math.min(expensePct, 100)}%`,
                                        backgroundColor: color,
                                      }}
                                    />
                                  </div>
                                </div>
                              )}
                            </>
                          ) : (
                            <div className="px-4 pb-4">
                              <p className="text-xs text-gray-400 text-center">
                                Tidak ada transaksi bulan ini
                              </p>
                            </div>
                          )}
                        </div>
                      );
                    },
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </AppShell>
  );
}
