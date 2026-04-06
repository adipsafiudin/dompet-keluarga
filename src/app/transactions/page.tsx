"use client";

import {
  useState,
  useEffect,
  useMemo,
  useRef,
  useCallback,
  Suspense,
} from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { cn, formatDate, getMonthRange } from "@/lib/utils";
import { useHiddenBalance } from "@/contexts/HiddenBalanceContext";
import AppShell from "@/components/layout/AppShell";
import TransactionCard from "@/components/ui/TransactionCard";
import EmptyState from "@/components/ui/EmptyState";
import { TransactionCardSkeleton } from "@/components/ui/LoadingSkeleton";
import {
  Search,
  X,
  ChevronLeft,
  ChevronRight,
  Loader2,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import type { Transaction, TransactionType, Category, Account } from "@/types";

const TYPE_FILTERS: {
  value: TransactionType | "";
  label: string;
  color: string;
}[] = [
  { value: "", label: "Semua", color: "bg-gray-800 text-white" },
  { value: "income", label: "Pemasukan", color: "bg-emerald-500 text-white" },
  { value: "expense", label: "Pengeluaran", color: "bg-red-500 text-white" },
  { value: "transfer", label: "Transfer", color: "bg-blue-500 text-white" },
];

export default function TransactionsPage() {
  return (
    <Suspense
      fallback={
        <div className="pt-4 px-4 space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <TransactionCardSkeleton key={i} />
          ))}
        </div>
      }
    >
      <TransactionsContent />
    </Suspense>
  );
}

function TransactionsContent() {
  const router = useRouter();

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [familyId, setFamilyId] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(0);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const { fmt } = useHiddenBalance();

  // Filters
  const [filterType, setFilterType] = useState<TransactionType | "">("");
  const [filterMonth, setFilterMonth] = useState(new Date());
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

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
      const [cats, accs] = await Promise.all([
        supabase
          .from("categories")
          .select("*")
          .eq("family_id", member.family_id)
          .eq("is_active", true),
        supabase
          .from("accounts")
          .select("*")
          .eq("family_id", member.family_id)
          .eq("is_active", true),
      ]);
      if (cats.data) setCategories(cats.data);
      if (accs.data) setAccounts(accs.data);
    }
    init();
  }, []);

  const fetchTransactions = useCallback(
    async (pageNum: number) => {
      if (pageNum === 0) setLoading(true);
      else setLoadingMore(true);

      const supabase = createClient();
      const { from, to } = getMonthRange(
        filterMonth.getFullYear(),
        filterMonth.getMonth() + 1,
      );

      let query = supabase
        .from("transactions")
        .select(
          `*, category:categories(*), account:accounts!transactions_account_id_fkey(*), to_account:accounts!transactions_to_account_id_fkey(*), income_source:income_sources(*), created_by_user:profiles!transactions_created_by_fkey(*)`,
        )
        .eq("family_id", familyId)
        .gte("date", from)
        .lte("date", to)
        .order("date", { ascending: false })
        .order("created_at", { ascending: false })
        .range(pageNum * 50, (pageNum + 1) * 50 - 1);

      if (filterType) query = query.eq("type", filterType);
      if (searchQuery) query = query.ilike("description", `%${searchQuery}%`);

      const { data } = await query;
      if (data) {
        setTransactions((prev) => (pageNum === 0 ? data : [...prev, ...data]));
        setHasMore(data.length === 50);
      }
      setPage(pageNum);
      if (pageNum === 0) setLoading(false);
      else setLoadingMore(false);
    },
    [familyId, filterType, filterMonth, searchQuery],
  );

  useEffect(() => {
    if (!familyId) return;
    fetchTransactions(0);
  }, [familyId, filterType, filterMonth, searchQuery, fetchTransactions]);

  useEffect(() => {
    if (!hasMore || loading || loadingMore) return;
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setPage((prev) => {
            fetchTransactions(prev + 1);
            return prev;
          });
        }
      },
      { threshold: 0.1 },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, loading, loadingMore, fetchTransactions]);

  // Open search and auto-focus
  function toggleSearch() {
    setShowSearch((v) => {
      if (!v) setTimeout(() => searchRef.current?.focus(), 50);
      else setSearchQuery("");
      return !v;
    });
  }

  // Group by date
  const grouped = useMemo(() => {
    const groups: Record<string, Transaction[]> = {};
    transactions.forEach((tx) => {
      if (!groups[tx.date]) groups[tx.date] = [];
      groups[tx.date].push(tx);
    });
    return Object.entries(groups).sort(([a], [b]) => b.localeCompare(a));
  }, [transactions]);

  const monthIncome = useMemo(
    () =>
      transactions
        .filter((t) => t.type === "income")
        .reduce((s, t) => s + t.amount, 0),
    [transactions],
  );
  const monthExpense = useMemo(
    () =>
      transactions
        .filter((t) => t.type === "expense")
        .reduce((s, t) => s + t.amount, 0),
    [transactions],
  );

  const prevMonth = () =>
    setFilterMonth(
      new Date(filterMonth.getFullYear(), filterMonth.getMonth() - 1),
    );
  const nextMonth = () =>
    setFilterMonth(
      new Date(filterMonth.getFullYear(), filterMonth.getMonth() + 1),
    );

  const STICKY_TOP = showSearch ? "top-[9.5rem]" : "top-[7rem]";

  return (
    <AppShell>
      {/* ── Sticky top bar ── */}
      <div className="sticky top-0 z-40 bg-white shadow-sm">
        {/* Title row */}
        <div className="flex items-center gap-2 px-4 h-14">
          <h1 className="text-lg font-bold flex-1 text-gray-900">Transaksi</h1>
          <button
            onClick={toggleSearch}
            className={cn(
              "w-9 h-9 rounded-xl flex items-center justify-center transition-colors",
              showSearch
                ? "bg-gray-900 text-white"
                : "bg-gray-100 text-gray-600",
            )}
          >
            {showSearch ? (
              <X className="w-4 h-4" />
            ) : (
              <Search className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Search bar — slides in */}
        {showSearch && (
          <div className="px-4 pb-3">
            <div className="flex items-center gap-2 bg-gray-100 rounded-xl px-3 h-10">
              <Search className="w-4 h-4 text-gray-400 shrink-0" />
              <input
                ref={searchRef}
                type="text"
                placeholder="Cari transaksi..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 bg-transparent text-sm outline-none placeholder:text-gray-400"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery("")}>
                  <X className="w-3.5 h-3.5 text-gray-400" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Month nav + summary */}
        <div className="px-4 pb-3">
          {/* Month selector — same style as rekap/laporan */}
          <div className="flex items-center justify-between bg-gray-100 rounded-2xl px-2 py-1 mb-3">
            <button
              onClick={prevMonth}
              className="w-9 h-9 rounded-xl flex items-center justify-center active:bg-gray-200"
            >
              <ChevronLeft className="w-4 h-4 text-gray-600" />
            </button>
            <span className="text-sm font-semibold text-gray-800 capitalize">
              {filterMonth.toLocaleDateString("id-ID", {
                month: "long",
                year: "numeric",
              })}
            </span>
            <button
              onClick={nextMonth}
              className="w-9 h-9 rounded-xl flex items-center justify-center active:bg-gray-200"
            >
              <ChevronRight className="w-4 h-4 text-gray-600" />
            </button>
          </div>

          {/* Income / Expense cards */}
          <div className="grid grid-cols-2 gap-2.5">
            <div className="bg-emerald-50 rounded-2xl px-4 py-3 flex items-center gap-2.5">
              <div className="w-8 h-8 bg-emerald-100 rounded-xl flex items-center justify-center shrink-0">
                <TrendingUp className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] text-emerald-600/70 font-medium">
                  Masuk
                </p>
                <p className="text-sm font-bold text-emerald-700 truncate">
                  {loading ? "—" : fmt(monthIncome, true)}
                </p>
              </div>
            </div>
            <div className="bg-red-50 rounded-2xl px-4 py-3 flex items-center gap-2.5">
              <div className="w-8 h-8 bg-red-100 rounded-xl flex items-center justify-center shrink-0">
                <TrendingDown className="w-4 h-4 text-red-500" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] text-red-500/70 font-medium">
                  Keluar
                </p>
                <p className="text-sm font-bold text-red-600 truncate">
                  {loading ? "—" : fmt(monthExpense, true)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Type filter pills */}
        <div className="flex gap-2 px-4 pb-3 overflow-x-auto no-scrollbar">
          {TYPE_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilterType(f.value)}
              className={cn(
                "shrink-0 px-4 py-1.5 rounded-full text-xs font-semibold transition-all",
                filterType === f.value ? f.color : "bg-gray-100 text-gray-500",
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Content ── */}
      <div className="bg-gray-50 min-h-screen">
        {loading && transactions.length === 0 ? (
          <div className="pt-3 px-4 space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="bg-white rounded-2xl overflow-hidden">
                <TransactionCardSkeleton />
              </div>
            ))}
          </div>
        ) : transactions.length === 0 ? (
          <EmptyState
            emoji="📝"
            title="Belum ada transaksi"
            description="Mulai catat pengeluaran & pemasukan bulan ini"
            actionLabel="Tambah Transaksi"
            onAction={() => router.push("/transactions/new")}
          />
        ) : (
          <div className="pt-3 pb-6 space-y-3 px-4">
            {grouped.map(([date, txns]) => {
              const dailyIncome = txns
                .filter((t) => t.type === "income")
                .reduce((s, t) => s + t.amount, 0);
              const dailyExpense = txns
                .filter((t) => t.type === "expense")
                .reduce((s, t) => s + t.amount, 0);
              const dailyNet = dailyIncome - dailyExpense;
              return (
                <div key={date}>
                  {/* Date header */}
                  <div className="flex items-center justify-between mb-1.5 px-1">
                    <span className="text-xs font-semibold text-gray-500 capitalize">
                      {formatDate(date, "EEEE, d MMMM")}
                    </span>
                    {(dailyIncome > 0 || dailyExpense > 0) && (
                      <span
                        className={cn(
                          "text-[11px] font-semibold",
                          dailyNet >= 0 ? "text-emerald-600" : "text-red-500",
                        )}
                      >
                        {dailyNet >= 0 ? "+" : ""}
                        {fmt(dailyNet, true)}
                      </span>
                    )}
                  </div>
                  {/* Cards grouped by date */}
                  <div className="bg-white rounded-2xl overflow-hidden shadow-sm divide-y divide-gray-50">
                    {txns.map((tx) => (
                      <TransactionCard key={tx.id} transaction={tx} />
                    ))}
                  </div>
                </div>
              );
            })}

            {/* Lazy load sentinel */}
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
                    Scroll untuk muat lebih
                  </span>
                )}
              </div>
            )}
            {!hasMore && (
              <p className="text-center text-[11px] text-gray-300 pt-1">
                Semua transaksi sudah ditampilkan
              </p>
            )}
          </div>
        )}
      </div>
    </AppShell>
  );
}
