"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ChevronLeft,
  Wallet,
  PiggyBank,
  Landmark,
  Smartphone,
  TrendingUp,
  CircleDot,
  ArrowLeftRight,
  ArrowRight,
  Loader2,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { formatRupiah, getMonthRange } from "@/lib/utils";
import { useHiddenBalance } from "@/contexts/HiddenBalanceContext";
import TransactionCard from "@/components/ui/TransactionCard";
import EmptyState from "@/components/ui/EmptyState";
import { TransactionCardSkeleton } from "@/components/ui/LoadingSkeleton";
import type { Account, Transaction } from "@/types";

const PAGE_SIZE = 10;

const typeIconMap: Record<
  string,
  React.ComponentType<{ className?: string; style?: React.CSSProperties }>
> = {
  cash: Wallet,
  bank: Landmark,
  e_wallet: Smartphone,
  investment: TrendingUp,
  other: CircleDot,
};

function AccountRow({ account }: { account: Account }) {
  const { fmt } = useHiddenBalance();
  const Icon = typeIconMap[account.type] || Wallet;
  const isTransferOnly =
    (account.transaction_mode ?? "full") === "transfer_only";
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
        style={{ backgroundColor: `${account.color}18` }}
      >
        <Icon className="w-5 h-5" style={{ color: account.color }} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p className="text-sm font-medium text-gray-800 truncate">
            {account.name}
          </p>
          {isTransferOnly && (
            <span
              className="inline-flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
              style={{
                backgroundColor: `${account.color}18`,
                color: account.color,
              }}
            >
              <ArrowLeftRight className="w-2.5 h-2.5" />
              Transfer
            </span>
          )}
        </div>
        <p className="text-xs text-gray-400">
          {account.bank_name || account.type}
        </p>
      </div>
      <p className="text-sm font-bold text-gray-900">
        {fmt(account.current_balance)}
      </p>
    </div>
  );
}

export default function KantongDetailPage() {
  const params = useParams();
  const router = useRouter();
  const type = params.type as "bayar" | "tabungan";
  const { fmt } = useHiddenBalance();

  const [familyId, setFamilyId] = useState("");
  const [accountIds, setAccountIds] = useState<string[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loadingInit, setLoadingInit] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [txOffset, setTxOffset] = useState(0);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const isBayar = type === "bayar";
  const label = isBayar ? "Kantong Bayar" : "Kantong Tabungan";
  const Icon = isBayar ? Wallet : PiggyBank;
  const primaryColor = isBayar ? "var(--primary)" : "#7c3aed";

  const now = new Date();
  const { from, to } = getMonthRange(now.getFullYear(), now.getMonth() + 1);
  const monthLabel = new Date(from).toLocaleDateString("id-ID", {
    month: "long",
    year: "numeric",
  });

  // Load more transactions
  const loadTransactions = useCallback(
    async (fid: string, ids: string[], offset: number) => {
      if (ids.length === 0) return;
      const supabase = createClient();
      const { data } = await supabase
        .from("transactions")
        .select(
          `*, category:categories(*), account:accounts!transactions_account_id_fkey(*), to_account:accounts!transactions_to_account_id_fkey(*), income_source:income_sources(*), created_by_user:profiles!transactions_created_by_fkey(*)`,
        )
        .eq("family_id", fid)
        .in("account_id", ids)
        .gte("date", from)
        .lte("date", to)
        .order("date", { ascending: false })
        .order("created_at", { ascending: false })
        .range(offset, offset + PAGE_SIZE - 1);

      const rows = data ?? [];
      setTransactions((prev) => (offset === 0 ? rows : [...prev, ...rows]));
      setHasMore(rows.length === PAGE_SIZE);
      setTxOffset(offset + rows.length);
    },
    [from, to],
  );

  // Initial load: accounts + first page of transactions
  const fetchInit = useCallback(
    async (fid: string) => {
      const supabase = createClient();
      const { data: allAccounts } = await supabase
        .from("accounts")
        .select("*")
        .eq("family_id", fid)
        .eq("is_active", true)
        .order("sort_order");

      const filtered = (allAccounts ?? []).filter((a: Account) =>
        isBayar
          ? (a.transaction_mode ?? "full") === "full"
          : (a.transaction_mode ?? "full") === "transfer_only" ||
            a.type === "investment",
      );
      setAccounts(filtered);

      const ids = filtered.map((a: Account) => a.id);
      setAccountIds(ids);
      await loadTransactions(fid, ids, 0);
      setLoadingInit(false);
    },
    [isBayar, loadTransactions],
  );

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
      await fetchInit(member.family_id);
    }
    init();
  }, [fetchInit]);

  // IntersectionObserver — load next page when sentinel is visible
  useEffect(() => {
    if (!hasMore || loadingMore || loadingInit) return;
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setLoadingMore(true);
          loadTransactions(familyId, accountIds, txOffset).finally(() =>
            setLoadingMore(false),
          );
        }
      },
      { threshold: 0.1 },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [
    hasMore,
    loadingMore,
    loadingInit,
    familyId,
    accountIds,
    txOffset,
    loadTransactions,
  ]);

  const total = accounts.reduce((s, a) => s + a.current_balance, 0);
  const monthIncome = transactions
    .filter((t) => t.type === "income")
    .reduce((s, t) => s + t.amount, 0);
  const monthExpense = transactions
    .filter((t) => t.type === "expense")
    .reduce((s, t) => s + t.amount, 0);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div
        className="relative rounded-b-3xl px-5 pt-12 pb-8 overflow-hidden"
        style={{ backgroundColor: primaryColor }}
      >
        <div className="absolute -top-8 -right-8 w-36 h-36 rounded-full bg-white/5" />
        <div className="absolute -bottom-10 -left-6 w-28 h-28 rounded-full bg-white/5" />

        <div className="relative">
          <div className="flex items-center gap-3 mb-6">
            <button
              onClick={() => router.back()}
              className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center"
            >
              <ChevronLeft className="w-5 h-5 text-white" />
            </button>
            <p className="text-white font-semibold">{label}</p>
          </div>

          <div className="flex items-end gap-3 mb-5">
            <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center">
              <Icon className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-white/70 text-xs">Total Saldo</p>
              <p className="text-white text-2xl font-bold">
                {loadingInit ? "—" : fmt(total)}
              </p>
              <p className="text-white/60 text-[11px]">
                {accounts.length} akun · {monthLabel}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div className="bg-white/15 backdrop-blur-sm rounded-2xl p-3">
              <p className="text-white/70 text-[11px] mb-1">
                Pemasukan bln ini
              </p>
              <p className="text-white font-bold text-sm">
                {loadingInit ? "—" : fmt(monthIncome, true)}
              </p>
            </div>
            <div className="bg-white/15 backdrop-blur-sm rounded-2xl p-3">
              <p className="text-white/70 text-[11px] mb-1">
                Pengeluaran bln ini
              </p>
              <p className="text-white font-bold text-sm">
                {loadingInit ? "—" : fmt(monthExpense, true)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Daftar Akun */}
      <div className="px-4 mt-5">
        <div className="flex items-center justify-between mb-2.5">
          <p className="text-sm font-semibold text-gray-700">
            Akun dalam kantong ini
          </p>
          <Link
            href="/settings/accounts"
            className="text-xs font-medium flex items-center gap-0.5 text-gray-400"
          >
            Kelola <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        {loadingInit ? (
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="skeleton rounded-2xl h-16 w-28 shrink-0"
              />
            ))}
          </div>
        ) : accounts.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-4 text-center text-xs text-gray-400">
            Belum ada akun di kantong ini.{" "}
            <Link
              href="/settings/accounts"
              className="underline"
              style={{ color: primaryColor }}
            >
              Tambah akun
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden divide-y divide-gray-50">
            {accounts.map((acc) => (
              <AccountRow key={acc.id} account={acc} />
            ))}
          </div>
        )}
      </div>

      {/* Transaksi Bulan Ini — lazy load */}
      <div className="px-4 mt-5 mb-8">
        <div className="flex items-center justify-between mb-2.5">
          <p className="text-sm font-semibold text-gray-700">
            Transaksi Bulan Ini
          </p>
          <Link
            href="/transactions"
            className="text-xs font-medium flex items-center gap-0.5"
            style={{ color: primaryColor }}
          >
            Lihat semua <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {loadingInit ? (
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <TransactionCardSkeleton />
            <TransactionCardSkeleton />
            <TransactionCardSkeleton />
          </div>
        ) : transactions.length === 0 ? (
          <EmptyState
            emoji="📝"
            title="Belum ada transaksi"
            description="Belum ada transaksi di kantong ini bulan ini"
          />
        ) : (
          <>
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden divide-y divide-gray-50">
              {transactions.map((tx) => (
                <TransactionCard key={tx.id} transaction={tx} />
              ))}
            </div>

            {/* Sentinel untuk trigger load more */}
            {hasMore && (
              <div
                ref={sentinelRef}
                className="py-4 flex items-center justify-center gap-2"
              >
                {loadingMore ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                    <span className="text-xs text-gray-400">Memuat...</span>
                  </>
                ) : (
                  <span className="text-xs text-gray-300">
                    Scroll untuk memuat lebih
                  </span>
                )}
              </div>
            )}

            {!hasMore && transactions.length > 0 && (
              <p className="text-center text-[11px] text-gray-300 mt-3">
                Semua transaksi bulan ini sudah ditampilkan
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
