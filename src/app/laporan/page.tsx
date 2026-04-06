"use client";

import { useState, useEffect, useMemo } from "react";
import dynamic from "next/dynamic";
import { createClient } from "@/lib/supabase/client";
import { cn, formatRupiah } from "@/lib/utils";
import { useHiddenBalance } from "@/contexts/HiddenBalanceContext";
import AppShell from "@/components/layout/AppShell";
import {
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Tag,
  Loader2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import type { Category, IncomeSource } from "@/types";

const CategoryYearChart = dynamic(
  () => import("@/components/charts/CategoryYearChart"),
  { ssr: false },
);

const MONTH_LABEL = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "Mei",
  "Jun",
  "Jul",
  "Agu",
  "Sep",
  "Okt",
  "Nov",
  "Des",
];

interface MonthlyStat {
  month: number;
  amount: number;
}

interface CategoryAnnual {
  category: Category | null;
  label: string;
  color: string;
  annualTotal: number;
  monthly: MonthlyStat[];
  txCount: number;
}

interface SourceAnnual {
  source: IncomeSource | null;
  label: string;
  color: string;
  annualTotal: number;
  monthly: MonthlyStat[];
  txCount: number;
}

function buildMonthlyMap(
  items: Array<{ month: number; amount: number }>,
): MonthlyStat[] {
  return Array.from({ length: 12 }, (_, i) => ({
    month: i + 1,
    amount: items
      .filter((x) => x.month === i + 1)
      .reduce((s, x) => s + x.amount, 0),
  }));
}

// ── Expandable category row ──
function CategoryRow({
  item,
  totalAnnual,
}: {
  item: CategoryAnnual | SourceAnnual;
  totalAnnual: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const { fmt } = useHiddenBalance();
  const pct = totalAnnual > 0 ? (item.annualTotal / totalAnnual) * 100 : 0;
  const peakMonth = item.monthly.reduce(
    (max, m) => (m.amount > max.amount ? m : max),
    { month: 0, amount: 0 },
  );

  return (
    <div className="border-b border-gray-50 last:border-0">
      <button
        className="w-full flex items-center gap-3 px-4 py-3.5 text-left"
        onClick={() => setExpanded((v) => !v)}
      >
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
          style={{ backgroundColor: `${item.color}18` }}
        >
          <Tag className="w-4 h-4" style={{ color: item.color }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-0.5">
            <p className="text-sm font-semibold text-gray-800 truncate">
              {item.label}
            </p>
            <p className="text-sm font-bold text-gray-900 shrink-0 ml-2">
              {fmt(item.annualTotal, true)}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${Math.min(pct, 100)}%`,
                  backgroundColor: item.color,
                }}
              />
            </div>
            <span className="text-[10px] text-gray-400 shrink-0">
              {Math.round(pct)}%
            </span>
          </div>
          <p className="text-[10px] text-gray-400 mt-0.5">
            {item.txCount} transaksi
            {peakMonth.amount > 0
              ? ` · Puncak: ${MONTH_LABEL[peakMonth.month - 1]} (${fmt(peakMonth.amount, true)})`
              : ""}
          </p>
        </div>
        {expanded ? (
          <ChevronUp className="w-4 h-4 text-gray-300 shrink-0" />
        ) : (
          <ChevronDown className="w-4 h-4 text-gray-300 shrink-0" />
        )}
      </button>

      {expanded && (
        <div className="px-4 pb-4">
          <CategoryYearChart
            data={item.monthly}
            color={item.color}
            height={90}
          />
          {/* Monthly breakdown table */}
          <div className="mt-2 grid grid-cols-4 gap-1.5">
            {item.monthly
              .filter((m) => m.amount > 0)
              .map((m) => (
                <div
                  key={m.month}
                  className="rounded-xl px-2 py-2 text-center"
                  style={{ backgroundColor: `${item.color}10` }}
                >
                  <p className="text-[10px] text-gray-400">
                    {MONTH_LABEL[m.month - 1]}
                  </p>
                  <p
                    className="text-[11px] font-bold"
                    style={{ color: item.color }}
                  >
                    {fmt(m.amount, true)}
                  </p>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function LaporanPage() {
  const [year, setYear] = useState(new Date().getFullYear());
  const [activeTab, setActiveTab] = useState<"expense" | "income">("expense");
  const [loading, setLoading] = useState(true);
  const [familyId, setFamilyId] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [incomeSources, setIncomeSources] = useState<IncomeSource[]>([]);
  const { fmt } = useHiddenBalance();

  // Raw tx: only what we need
  const [rawTx, setRawTx] = useState<
    Array<{
      type: string;
      amount: number;
      date: string;
      category_id: string | null;
      income_source_id: string | null;
    }>
  >([]);

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

      const [cats, srcs] = await Promise.all([
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
      ]);
      if (cats.data) setCategories(cats.data);
      if (srcs.data) setIncomeSources(srcs.data);
    }
    init();
  }, []);

  useEffect(() => {
    if (!familyId) return;
    async function fetchYear() {
      setLoading(true);
      const supabase = createClient();
      const from = `${year}-01-01`;
      const to = `${year}-12-31`;
      const { data } = await supabase
        .from("transactions")
        .select("type, amount, date, category_id, income_source_id")
        .eq("family_id", familyId)
        .gte("date", from)
        .lte("date", to)
        .in("type", ["income", "expense"]);
      if (data) setRawTx(data);
      setLoading(false);
    }
    fetchYear();
  }, [familyId, year]);

  // Compute expense by category
  const expenseSummaries = useMemo((): CategoryAnnual[] => {
    const expTx = rawTx.filter((t) => t.type === "expense");
    const map = new Map<
      string,
      {
        total: number;
        count: number;
        items: Array<{ month: number; amount: number }>;
      }
    >();

    expTx.forEach((t) => {
      const key = t.category_id || "__uncategorized__";
      const month = parseInt(t.date.split("-")[1]);
      const curr = map.get(key) || { total: 0, count: 0, items: [] };
      curr.total += t.amount;
      curr.count += 1;
      curr.items.push({ month, amount: t.amount });
      map.set(key, curr);
    });

    return Array.from(map.entries())
      .map(([catId, d]) => {
        const cat = categories.find((c) => c.id === catId) || null;
        return {
          category: cat,
          label: cat?.name || "Tanpa Kategori",
          color: cat?.color || "#9CA3AF",
          annualTotal: d.total,
          monthly: buildMonthlyMap(d.items),
          txCount: d.count,
        };
      })
      .sort((a, b) => b.annualTotal - a.annualTotal);
  }, [rawTx, categories]);

  // Compute income by source
  const incomeSummaries = useMemo((): SourceAnnual[] => {
    const incTx = rawTx.filter((t) => t.type === "income");
    const map = new Map<
      string,
      {
        total: number;
        count: number;
        items: Array<{ month: number; amount: number }>;
      }
    >();

    incTx.forEach((t) => {
      const key = t.income_source_id || "__other__";
      const month = parseInt(t.date.split("-")[1]);
      const curr = map.get(key) || { total: 0, count: 0, items: [] };
      curr.total += t.amount;
      curr.count += 1;
      curr.items.push({ month, amount: t.amount });
      map.set(key, curr);
    });

    return Array.from(map.entries())
      .map(([srcId, d]) => {
        const src = incomeSources.find((s) => s.id === srcId) || null;
        return {
          source: src,
          label: src?.name || "Lainnya",
          color: src?.color || "#10B981",
          annualTotal: d.total,
          monthly: buildMonthlyMap(d.items),
          txCount: d.count,
        };
      })
      .sort((a, b) => b.annualTotal - a.annualTotal);
  }, [rawTx, incomeSources]);

  const totalExpense = expenseSummaries.reduce((s, c) => s + c.annualTotal, 0);
  const totalIncome = incomeSummaries.reduce((s, c) => s + c.annualTotal, 0);

  // Monthly totals for overview chart
  const monthlyOverview = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => {
      const m = i + 1;
      const mStr = String(m).padStart(2, "0");
      const txMonth = rawTx.filter((t) => t.date.startsWith(`${year}-${mStr}`));
      return {
        month: MONTH_LABEL[i],
        income: txMonth
          .filter((t) => t.type === "income")
          .reduce((s, t) => s + t.amount, 0),
        expense: txMonth
          .filter((t) => t.type === "expense")
          .reduce((s, t) => s + t.amount, 0),
      };
    });
  }, [rawTx, year]);

  const items = activeTab === "expense" ? expenseSummaries : incomeSummaries;
  const total = activeTab === "expense" ? totalExpense : totalIncome;

  return (
    <AppShell>
      {/* ── Header ── */}
      <div className="sticky top-0 z-40 bg-white shadow-sm">
        <div className="px-4 pt-4 pb-3">
          <h1 className="text-xl font-bold text-gray-900 mb-3">
            Laporan Tahunan
          </h1>

          {/* Year selector */}
          <div className="flex items-center justify-between bg-gray-100 rounded-2xl px-2 py-1 mb-3">
            <button
              onClick={() => setYear((y) => y - 1)}
              className="w-9 h-9 rounded-xl flex items-center justify-center active:bg-gray-200"
            >
              <ChevronLeft className="w-4 h-4 text-gray-600" />
            </button>
            <span className="text-sm font-bold text-gray-800">{year}</span>
            <button
              onClick={() => setYear((y) => y + 1)}
              className="w-9 h-9 rounded-xl flex items-center justify-center active:bg-gray-200"
            >
              <ChevronRight className="w-4 h-4 text-gray-600" />
            </button>
          </div>

          {/* Tab */}
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab("expense")}
              className={cn(
                "flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold transition-all",
                activeTab === "expense"
                  ? "bg-red-500 text-white shadow"
                  : "bg-gray-100 text-gray-500",
              )}
            >
              <TrendingDown className="w-3.5 h-3.5" />
              Pengeluaran
            </button>
            <button
              onClick={() => setActiveTab("income")}
              className={cn(
                "flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-semibold transition-all",
                activeTab === "income"
                  ? "bg-emerald-500 text-white shadow"
                  : "bg-gray-100 text-gray-500",
              )}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              Pemasukan
            </button>
          </div>
        </div>
      </div>

      {/* ── Content ── */}
      {loading ? (
        <div className="flex items-center justify-center py-20 gap-2">
          <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
          <span className="text-sm text-gray-400">Memuat data tahunan...</span>
        </div>
      ) : (
        <div className="bg-gray-50 min-h-screen pb-8 pt-4 space-y-4 px-4">
          {/* Annual total card */}
          <div
            className={cn(
              "rounded-3xl p-5 shadow-sm",
              activeTab === "expense" ? "bg-red-50" : "bg-emerald-50",
            )}
          >
            <div className="flex items-center gap-2 mb-1">
              {activeTab === "expense" ? (
                <TrendingDown className="w-4 h-4 text-red-500" />
              ) : (
                <TrendingUp className="w-4 h-4 text-emerald-500" />
              )}
              <span
                className={cn(
                  "text-xs font-semibold",
                  activeTab === "expense" ? "text-red-500" : "text-emerald-600",
                )}
              >
                Total {activeTab === "expense" ? "Pengeluaran" : "Pemasukan"}{" "}
                {year}
              </span>
            </div>
            <p
              className={cn(
                "text-3xl font-bold",
                activeTab === "expense" ? "text-red-600" : "text-emerald-600",
              )}
            >
              {fmt(total)}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              {items.length} kategori · rata-rata{" "}
              {fmt(Math.round(total / 12), true)}/bulan
            </p>
          </div>

          {/* Overview - monthly totals */}
          <div className="bg-white rounded-3xl shadow-sm p-4">
            <p className="text-sm font-semibold text-gray-700 mb-3">
              Grafik Bulanan {year}
            </p>
            <div className="w-full h-25">
              {/* Inline simple bar chart for overview */}
              <div className="flex items-end gap-1 h-full">
                {monthlyOverview.map((m, i) => {
                  const val = activeTab === "expense" ? m.expense : m.income;
                  const maxVal = Math.max(
                    ...monthlyOverview.map((x) =>
                      activeTab === "expense" ? x.expense : x.income,
                    ),
                    1,
                  );
                  const pct = (val / maxVal) * 100;
                  return (
                    <div
                      key={i}
                      className="flex-1 flex flex-col items-center gap-1"
                    >
                      <div
                        className="w-full flex items-end"
                        style={{ height: 76 }}
                      >
                        <div
                          className="w-full rounded-t-md transition-all"
                          style={{
                            height: `${Math.max(pct, val > 0 ? 4 : 0)}%`,
                            backgroundColor:
                              activeTab === "expense"
                                ? val > 0
                                  ? "#EF4444"
                                  : "#F3F4F6"
                                : val > 0
                                  ? "#10B981"
                                  : "#F3F4F6",
                            opacity: pct === 100 ? 1 : 0.5 + (pct / 100) * 0.5,
                          }}
                        />
                      </div>
                      <span className="text-[8px] text-gray-400">
                        {m.month}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Category list */}
          {items.length === 0 ? (
            <div className="bg-white rounded-3xl shadow-sm p-8 text-center">
              <p className="text-3xl mb-2">📊</p>
              <p className="text-sm font-medium text-gray-600">
                Belum ada{" "}
                {activeTab === "expense" ? "pengeluaran" : "pemasukan"}
              </p>
              <p className="text-xs text-gray-400">tahun {year}</p>
            </div>
          ) : (
            <div className="bg-white rounded-3xl shadow-sm overflow-hidden">
              <div className="px-4 pt-4 pb-2 flex items-center justify-between">
                <p className="text-sm font-semibold text-gray-700">
                  Per{" "}
                  {activeTab === "expense"
                    ? "Kategori Pengeluaran"
                    : "Sumber Pemasukan"}
                </p>
                <span className="text-xs text-gray-400">
                  {items.length} item
                </span>
              </div>
              <div>
                {items.map((item, idx) => (
                  <CategoryRow
                    key={idx}
                    item={item as CategoryAnnual}
                    totalAnnual={total}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </AppShell>
  );
}
