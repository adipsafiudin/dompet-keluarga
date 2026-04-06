"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Settings,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  ChevronRight,
  Wallet,
  PiggyBank,
  Eye,
  EyeOff,
} from "lucide-react";
import { formatRupiah, getMonthRange } from "@/lib/utils";
import { useHiddenBalance } from "@/contexts/HiddenBalanceContext";
import { createClient } from "@/lib/supabase/client";
import { subscribeFamilyRefresh } from "@/lib/realtime";
import AppShell from "@/components/layout/AppShell";
import TransactionCard from "@/components/ui/TransactionCard";
import BudgetProgress from "@/components/ui/BudgetProgress";
import EmptyState from "@/components/ui/EmptyState";
import { DashboardSkeleton } from "@/components/ui/LoadingSkeleton";
import type { Account, Transaction, BudgetAlert } from "@/types";

interface DashboardClientProps {
  userName: string;
  familyName: string;
  familyId: string;
}

export default function DashboardClient({
  userName,
  familyName,
  familyId,
}: DashboardClientProps) {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>(
    [],
  );
  const [budgetAlerts, setBudgetAlerts] = useState<BudgetAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const { isHidden, toggle, fmt } = useHiddenBalance();

  const fetchData = useCallback(async () => {
    if (!familyId) return;
    const supabase = createClient();
    const now = new Date();
    const { from, to } = getMonthRange(now.getFullYear(), now.getMonth() + 1);

    const [accountsRes, txRes, categoriesRes] = await Promise.all([
      supabase
        .from("accounts")
        .select("*")
        .eq("family_id", familyId)
        .eq("is_active", true)
        .order("sort_order"),
      supabase
        .from("transactions")
        .select(
          `*, category:categories(*), account:accounts!transactions_account_id_fkey(*), to_account:accounts!transactions_to_account_id_fkey(*), income_source:income_sources(*), created_by_user:profiles!transactions_created_by_fkey(*)`,
        )
        .eq("family_id", familyId)
        .gte("date", from)
        .lte("date", to)
        .order("date", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(10),
      supabase
        .from("categories")
        .select("*")
        .eq("family_id", familyId)
        .eq("type", "expense")
        .eq("is_active", true)
        .not("budget_limit", "is", null),
    ]);

    if (accountsRes.data) setAccounts(accountsRes.data);
    if (txRes.data) setRecentTransactions(txRes.data);

    if (categoriesRes.data && txRes.data) {
      const alerts: BudgetAlert[] = [];
      for (const cat of categoriesRes.data) {
        if (!cat.budget_limit) continue;
        const spent = txRes.data
          .filter((t) => t.type === "expense" && t.category_id === cat.id)
          .reduce((s, t) => s + t.amount, 0);
        const pct = (spent / cat.budget_limit) * 100;
        if (pct >= 70) alerts.push({ category: cat, spent, percentage: pct });
      }
      setBudgetAlerts(alerts);
    }

    setLoading(false);
  }, [familyId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (!familyId) return;
    return subscribeFamilyRefresh(familyId, fetchData);
  }, [familyId, fetchData]);

  useEffect(() => {
    if (!familyId) return;
    const supabase = createClient();
    const channel = supabase
      .channel(`dashboard:${familyId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "transactions",
          filter: `family_id=eq.${familyId}`,
        },
        () => fetchData(),
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "accounts",
          filter: `family_id=eq.${familyId}`,
        },
        () => fetchData(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [familyId, fetchData]);

  if (loading)
    return (
      <AppShell>
        <DashboardSkeleton />
      </AppShell>
    );

  // Group accounts: bayar = full mode, tabungan = transfer_only / investment
  const kantongBayar = accounts.filter(
    (a) => (a.transaction_mode ?? "full") === "full",
  );
  const kantongTabungan = accounts.filter(
    (a) =>
      (a.transaction_mode ?? "full") === "transfer_only" ||
      a.type === "investment",
  );

  const totalBalance = accounts.reduce((s, a) => s + a.current_balance, 0);
  const totalBayar = kantongBayar.reduce((s, a) => s + a.current_balance, 0);
  const totalTabungan = kantongTabungan.reduce(
    (s, a) => s + a.current_balance,
    0,
  );

  const now = new Date();
  const { from } = getMonthRange(now.getFullYear(), now.getMonth() + 1);
  const monthTx = recentTransactions;
  const monthIncome = monthTx
    .filter((t) => t.type === "income")
    .reduce((s, t) => s + t.amount, 0);
  const monthExpense = monthTx
    .filter((t) => t.type === "expense")
    .reduce((s, t) => s + t.amount, 0);
  const monthLabel = new Date(from).toLocaleDateString("id-ID", {
    month: "long",
    year: "numeric",
  });

  return (
    <AppShell>
      {/* ── Header ── */}
      <div
        className="relative rounded-b-[2rem] px-5 pt-12 pb-8 overflow-hidden"
        style={{ backgroundColor: "var(--primary)" }}
      >
        {/* Decorative circles */}
        <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full bg-white/5" />
        <div className="absolute -bottom-10 -left-6 w-32 h-32 rounded-full bg-white/5" />

        <div className="relative">
          {/* Top bar */}
          <div className="flex items-center justify-between mb-5">
            <div>
              <p className="text-white/90 text-sm font-medium">
                Halo, {userName.split(" ")[0]}! 👋
              </p>
              <p className="text-white/60 text-xs">{familyName}</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={toggle}
                className="w-10 h-10 bg-white/15 rounded-2xl flex items-center justify-center backdrop-blur-sm"
                aria-label={isHidden ? "Tampilkan saldo" : "Sembunyikan saldo"}
              >
                {isHidden ? (
                  <EyeOff className="w-5 h-5 text-white" />
                ) : (
                  <Eye className="w-5 h-5 text-white" />
                )}
              </button>
              <Link
                href="/settings"
                className="w-10 h-10 bg-white/15 rounded-2xl flex items-center justify-center backdrop-blur-sm"
              >
                <Settings className="w-5 h-5 text-white" />
              </Link>
            </div>
          </div>

          {/* Total Saldo */}
          <div className="mb-5">
            <p className="text-white/70 text-xs mb-0.5">Total Kekayaan</p>
            <p className="text-white text-[2rem] font-bold leading-tight tracking-tight">
              {fmt(totalBalance)}
            </p>
            <p className="text-white/60 text-xs mt-0.5">{monthLabel}</p>
          </div>

          {/* Income / Expense */}
          <div className="grid grid-cols-2 gap-2.5">
            <div className="bg-white/15 backdrop-blur-sm rounded-2xl p-3">
              <div className="flex items-center gap-1.5 mb-1.5">
                <div className="w-6 h-6 bg-emerald-400/30 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-200" />
                </div>
                <span className="text-white/70 text-[11px]">Pemasukan</span>
              </div>
              <p className="text-white font-bold text-sm">
                {fmt(monthIncome, true)}
              </p>
            </div>
            <div className="bg-white/15 backdrop-blur-sm rounded-2xl p-3">
              <div className="flex items-center gap-1.5 mb-1.5">
                <div className="w-6 h-6 bg-red-400/30 rounded-lg flex items-center justify-center">
                  <TrendingDown className="w-3.5 h-3.5 text-red-200" />
                </div>
                <span className="text-white/70 text-[11px]">Pengeluaran</span>
              </div>
              <p className="text-white font-bold text-sm">
                {fmt(monthExpense, true)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Dua Kantong Utama ── */}
      {accounts.length > 0 && (
        <div className="mx-4 mt-4 grid grid-cols-2 gap-3">
          {/* Kantong Bayar */}
          <Link
            href="/kantong/bayar"
            className="relative rounded-2xl p-4 flex flex-col gap-3 overflow-hidden"
            style={{
              backgroundColor: "color-mix(in srgb, var(--primary) 10%, #fff)",
            }}
          >
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center"
              style={{
                backgroundColor:
                  "color-mix(in srgb, var(--primary) 18%, transparent)",
              }}
            >
              <Wallet className="w-5 h-5" style={{ color: "var(--primary)" }} />
            </div>
            <div>
              <p className="text-[11px] text-gray-500 mb-0.5">Kantong Bayar</p>
              <p className="text-base font-bold text-gray-900 leading-tight">
                {fmt(totalBayar, true)}
              </p>
              <p className="text-[10px] text-gray-400 mt-0.5">
                {kantongBayar.length} akun
              </p>
            </div>
          </Link>

          {/* Kantong Tabungan */}
          <Link
            href="/kantong/tabungan"
            className="relative rounded-2xl p-4 flex flex-col gap-3 overflow-hidden bg-violet-50"
          >
            <div className="w-10 h-10 rounded-2xl bg-violet-100 flex items-center justify-center">
              <PiggyBank className="w-5 h-5 text-violet-600" />
            </div>
            <div>
              <p className="text-[11px] text-gray-500 mb-0.5">
                Kantong Tabungan
              </p>
              <p className="text-base font-bold text-gray-900 leading-tight">
                {fmt(totalTabungan, true)}
              </p>
              <p className="text-[10px] text-gray-400 mt-0.5">
                {kantongTabungan.length} akun
              </p>
            </div>
          </Link>
        </div>
      )}

      {/* ── Budget Alerts ── */}
      {budgetAlerts.length > 0 && (
        <div className="mx-4 mt-3 bg-amber-50 rounded-2xl border border-amber-100 overflow-hidden">
          <div className="flex items-center gap-2 px-4 pt-3 pb-1">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            <span className="text-xs font-semibold text-amber-700">
              Peringatan Anggaran
            </span>
          </div>
          {budgetAlerts.map((alert) => (
            <BudgetProgress key={alert.category.id} alert={alert} />
          ))}
        </div>
      )}

      {/* ── Recent Transactions ── */}
      <div className="mt-5 mb-2">
        <div className="flex items-center justify-between px-4 mb-3">
          <p className="text-sm font-semibold text-gray-700">
            Transaksi Terbaru
          </p>
          <Link
            href="/transactions"
            className="text-xs font-medium flex items-center gap-0.5"
            style={{ color: "var(--primary)" }}
          >
            Lihat semua <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {recentTransactions.length === 0 ? (
          <EmptyState
            emoji="📝"
            title="Belum ada transaksi"
            description="Mulai catat transaksi pertama Anda"
          />
        ) : (
          <div className="mx-4 bg-white rounded-2xl border border-gray-100 overflow-hidden divide-y divide-gray-50">
            {recentTransactions.map((tx) => (
              <TransactionCard key={tx.id} transaction={tx} />
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
