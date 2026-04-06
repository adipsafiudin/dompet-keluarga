"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { notifyFamilyRefresh } from "@/lib/realtime";
import { cn, formatRupiah } from "@/lib/utils";
import CurrencyInput from "@/components/ui/CurrencyInput";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";
import type { Account, Category, IncomeSource, TransactionType } from "@/types";
import {
  Utensils,
  Car,
  ShoppingBag,
  Home,
  Zap,
  Wifi,
  HeartPulse,
  GraduationCap,
  Gamepad2,
  Shirt,
  Baby,
  MoreHorizontal,
  Briefcase,
  Store,
  TrendingUp,
  PlusCircle,
  Tag,
  Wallet,
  Landmark,
  Smartphone,
  CircleDot,
  ArrowLeft,
  Calendar,
  FileText,
  ChevronRight,
  Check,
} from "lucide-react";

const iconMap: Record<
  string,
  React.ComponentType<{ className?: string; style?: React.CSSProperties }>
> = {
  utensils: Utensils,
  car: Car,
  "shopping-bag": ShoppingBag,
  home: Home,
  zap: Zap,
  wifi: Wifi,
  "heart-pulse": HeartPulse,
  "graduation-cap": GraduationCap,
  "gamepad-2": Gamepad2,
  shirt: Shirt,
  baby: Baby,
  "more-horizontal": MoreHorizontal,
  briefcase: Briefcase,
  store: Store,
  "trending-up": TrendingUp,
  "plus-circle": PlusCircle,
  tag: Tag,
};

const accountIconMap: Record<
  string,
  React.ComponentType<{ className?: string; style?: React.CSSProperties }>
> = {
  cash: Wallet,
  bank: Landmark,
  e_wallet: Smartphone,
  investment: TrendingUp,
  other: CircleDot,
};

const TYPE_TABS: {
  value: TransactionType;
  label: string;
  activeColor: string;
  btnBg: string;
}[] = [
  {
    value: "expense",
    label: "Keluar",
    activeColor: "text-red-500",
    btnBg: "bg-red-500",
  },
  {
    value: "income",
    label: "Masuk",
    activeColor: "text-emerald-500",
    btnBg: "bg-emerald-500",
  },
  {
    value: "transfer",
    label: "Transfer",
    activeColor: "text-blue-500",
    btnBg: "bg-blue-500",
  },
];

const HEADER_COLORS: Record<TransactionType, string> = {
  expense: "from-red-500 to-rose-600",
  income: "from-emerald-500 to-teal-600",
  transfer: "from-blue-500 to-indigo-600",
};

const BTN_COLORS: Record<TransactionType, string> = {
  expense: "bg-red-500 hover:bg-red-600",
  income: "bg-emerald-500 hover:bg-emerald-600",
  transfer: "bg-blue-500 hover:bg-blue-600",
};

function today() {
  return new Date().toISOString().split("T")[0];
}
function yesterday() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().split("T")[0];
}

// ── Horizontal scrollable account picker ──
function AccountPicker({
  accounts,
  selected,
  onSelect,
}: {
  accounts: Account[];
  selected: string;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="flex gap-2.5 overflow-x-auto no-scrollbar px-4 pb-1">
      {accounts.map((acc) => {
        const Icon = accountIconMap[acc.type] || Wallet;
        const isSelected = acc.id === selected;
        return (
          <button
            key={acc.id}
            onClick={() => onSelect(acc.id)}
            className={cn(
              "shrink-0 flex flex-col items-start gap-1 rounded-2xl px-3.5 py-3 border-2 transition-all w-36",
              isSelected
                ? "border-current shadow-sm"
                : "border-gray-100 bg-white",
            )}
            style={
              isSelected
                ? { borderColor: acc.color, backgroundColor: `${acc.color}12` }
                : undefined
            }
          >
            <div className="flex items-center justify-between w-full">
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: `${acc.color}20` }}
              >
                <Icon className="w-3.5 h-3.5" style={{ color: acc.color }} />
              </div>
              {isSelected && (
                <div
                  className="w-4 h-4 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: acc.color }}
                >
                  <Check className="w-2.5 h-2.5 text-white" />
                </div>
              )}
            </div>
            <p className="text-xs font-semibold text-gray-800 leading-tight line-clamp-1">
              {acc.name}
            </p>
            <p className="text-[10px] text-gray-400 font-medium">
              {formatRupiah(acc.current_balance, true)}
            </p>
          </button>
        );
      })}
    </div>
  );
}

// ── Category chip grid ──
function CategoryGrid({
  categories,
  selected,
  onSelect,
}: {
  categories: Category[];
  selected: string;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="grid grid-cols-4 gap-2 px-4">
      {categories.map((cat) => {
        const Icon = iconMap[cat.icon] || Tag;
        const isSelected = cat.id === selected;
        return (
          <button
            key={cat.id}
            onClick={() => onSelect(isSelected ? "" : cat.id)}
            className={cn(
              "flex flex-col items-center gap-1.5 py-3 rounded-2xl border-2 transition-all",
              isSelected ? "shadow-sm" : "border-gray-100 bg-white",
            )}
            style={
              isSelected
                ? { borderColor: cat.color, backgroundColor: `${cat.color}12` }
                : undefined
            }
          >
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: `${cat.color}20` }}
            >
              <Icon className="w-4.5 h-4.5" style={{ color: cat.color }} />
            </div>
            <span className="text-[10px] font-medium text-gray-600 text-center leading-tight px-1">
              {cat.name}
            </span>
          </button>
        );
      })}
    </div>
  );
}

export default function NewTransactionPage() {
  const router = useRouter();
  const dateInputRef = useRef<HTMLInputElement>(null);
  const descInputRef = useRef<HTMLInputElement>(null);

  const [type, setType] = useState<TransactionType>("expense");
  const [amount, setAmount] = useState(0);
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(today());
  const [accountId, setAccountId] = useState("");
  const [toAccountId, setToAccountId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [incomeSourceId, setIncomeSourceId] = useState("");
  const [loading, setLoading] = useState(false);
  const [showDescInput, setShowDescInput] = useState(false);

  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [incomeSources, setIncomeSources] = useState<IncomeSource[]>([]);
  const [familyId, setFamilyId] = useState("");

  useEffect(() => {
    async function loadData() {
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
      const [accs, cats, srcs] = await Promise.all([
        supabase
          .from("accounts")
          .select("*")
          .eq("family_id", member.family_id)
          .eq("is_active", true)
          .order("sort_order"),
        supabase
          .from("categories")
          .select("*")
          .eq("family_id", member.family_id)
          .eq("is_active", true)
          .order("sort_order"),
        supabase
          .from("income_sources")
          .select("*")
          .eq("family_id", member.family_id)
          .eq("is_active", true)
          .order("sort_order"),
      ]);
      if (accs.data) {
        setAccounts(accs.data);
        const first = accs.data.find(
          (a) => (a.transaction_mode ?? "full") === "full",
        );
        if (first) setAccountId(first.id);
      }
      if (cats.data) setCategories(cats.data);
      if (srcs.data) setIncomeSources(srcs.data);
    }
    loadData();
  }, []);

  const filteredCategories = categories.filter(
    (c) => c.type === (type === "transfer" ? "expense" : type),
  );
  const selectableAccounts =
    type === "transfer"
      ? accounts
      : accounts.filter((a) => (a.transaction_mode ?? "full") === "full");

  // Reset account when type changes to ensure valid selection
  useEffect(() => {
    const valid =
      type === "transfer"
        ? accounts
        : accounts.filter((a) => (a.transaction_mode ?? "full") === "full");
    if (valid.length && !valid.find((a) => a.id === accountId)) {
      setAccountId(valid[0]?.id ?? "");
    }
    setCategoryId("");
  }, [type]);

  const dateLabel =
    date === today()
      ? "Hari ini"
      : date === yesterday()
        ? "Kemarin"
        : new Date(date).toLocaleDateString("id-ID", {
            day: "numeric",
            month: "short",
            year: "numeric",
          });

  async function handleSubmit() {
    if (amount <= 0) return toast.error("Masukkan nominal transaksi");
    if (!accountId) return toast.error("Pilih akun");
    if (type === "transfer" && !toAccountId)
      return toast.error("Pilih akun tujuan");
    if (type === "transfer" && accountId === toAccountId)
      return toast.error("Akun asal dan tujuan harus berbeda");

    setLoading(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Silakan login");

      const { error } = await supabase.from("transactions").insert({
        family_id: familyId,
        type,
        amount,
        description: description || null,
        date,
        category_id: type !== "transfer" ? categoryId || null : null,
        account_id: accountId,
        to_account_id: type === "transfer" ? toAccountId : null,
        income_source_id: type === "income" ? incomeSourceId || null : null,
        created_by: user.id,
      });

      if (error) throw error;
      notifyFamilyRefresh(familyId);
      toast.success("Transaksi berhasil dicatat!");
      router.push("/transactions");
      router.refresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal menyimpan";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* ── Colored Header ── */}
      <div
        className={cn(
          "bg-linear-to-br px-5 pt-12 pb-8 rounded-b-[2.5rem] relative overflow-hidden",
          HEADER_COLORS[type],
        )}
      >
        {/* Decorative circles */}
        <div className="absolute -top-8 -right-8 w-36 h-36 rounded-full bg-white/10" />
        <div className="absolute -bottom-12 -left-6 w-32 h-32 rounded-full bg-white/10" />

        {/* Back button */}
        <button
          onClick={() => router.back()}
          className="relative w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center mb-5"
        >
          <ArrowLeft className="w-5 h-5 text-white" />
        </button>

        {/* Type tabs */}
        <div className="relative flex bg-white/15 rounded-2xl p-1 mb-6 gap-1">
          {TYPE_TABS.map((t) => (
            <button
              key={t.value}
              onClick={() => setType(t.value)}
              className={cn(
                "flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all",
                type === t.value
                  ? "bg-white shadow text-gray-900"
                  : "text-white/80",
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Amount */}
        <div className="relative">
          <p className="text-white/60 text-xs mb-1">Nominal</p>
          <CurrencyInput
            value={amount}
            onChange={setAmount}
            large
            className="text-white [&_input]:text-white [&_input]:placeholder:text-white/30 [&_span]:text-white/60"
          />
        </div>
      </div>

      {/* ── Form Body ── */}
      <div className="flex-1 overflow-y-auto pb-28 space-y-4 pt-5">
        {/* Description row */}
        <div className="mx-4 bg-white rounded-2xl overflow-hidden divide-y divide-gray-50 shadow-sm">
          {/* Description */}
          <button
            className="w-full flex items-center gap-3 px-4 py-3.5 text-left"
            onClick={() => {
              setShowDescInput((v) => !v);
              if (!showDescInput)
                setTimeout(() => descInputRef.current?.focus(), 60);
            }}
          >
            <div className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center shrink-0">
              <FileText className="w-4 h-4 text-gray-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-400">Keterangan</p>
              {description ? (
                <p className="text-sm font-medium text-gray-800 truncate">
                  {description}
                </p>
              ) : (
                <p className="text-sm text-gray-400">Tambahkan keterangan...</p>
              )}
            </div>
            <ChevronRight className="w-4 h-4 text-gray-300 shrink-0" />
          </button>
          {showDescInput && (
            <div className="px-4 py-3">
              <input
                ref={descInputRef}
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Tulis keterangan..."
                className="w-full text-sm outline-none bg-transparent text-gray-800 placeholder:text-gray-300"
              />
            </div>
          )}

          {/* Date */}
          <button
            className="w-full flex items-center gap-3 px-4 py-3.5 text-left"
            onClick={() => dateInputRef.current?.showPicker?.()}
          >
            <div className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center shrink-0">
              <Calendar className="w-4 h-4 text-gray-500" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-gray-400">Tanggal</p>
              <p className="text-sm font-medium text-gray-800">{dateLabel}</p>
            </div>
            <input
              ref={dateInputRef}
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="absolute opacity-0 w-0 h-0"
            />
            <div className="flex gap-1.5">
              {[
                { label: "Hari ini", val: today() },
                { label: "Kemarin", val: yesterday() },
              ].map((opt) => (
                <button
                  key={opt.val}
                  onClick={(e) => {
                    e.stopPropagation();
                    setDate(opt.val);
                  }}
                  className={cn(
                    "text-[10px] font-semibold px-2.5 py-1 rounded-full",
                    date === opt.val
                      ? "bg-gray-800 text-white"
                      : "bg-gray-100 text-gray-500",
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </button>
        </div>

        {/* Account */}
        <div>
          <p className="text-xs font-semibold text-gray-500 px-4 mb-2">
            {type === "transfer" ? "Dari Akun" : "Akun"}
          </p>
          {selectableAccounts.length === 0 ? (
            <p className="text-sm text-gray-400 px-4">
              Tidak ada akun tersedia
            </p>
          ) : (
            <AccountPicker
              accounts={selectableAccounts}
              selected={accountId}
              onSelect={setAccountId}
            />
          )}
        </div>

        {/* To Account (Transfer) */}
        {type === "transfer" && (
          <div>
            <p className="text-xs font-semibold text-gray-500 px-4 mb-2">
              Ke Akun
            </p>
            <AccountPicker
              accounts={accounts.filter((a) => a.id !== accountId)}
              selected={toAccountId}
              onSelect={setToAccountId}
            />
          </div>
        )}

        {/* Category */}
        {type !== "transfer" && filteredCategories.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-gray-500 px-4 mb-2">
              Kategori{" "}
              <span className="font-normal text-gray-400">(opsional)</span>
            </p>
            <CategoryGrid
              categories={filteredCategories}
              selected={categoryId}
              onSelect={setCategoryId}
            />
          </div>
        )}

        {/* Income Source */}
        {type === "income" && incomeSources.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-gray-500 px-4 mb-2">
              Sumber{" "}
              <span className="font-normal text-gray-400">(opsional)</span>
            </p>
            <div className="flex gap-2 overflow-x-auto no-scrollbar px-4 pb-1">
              {incomeSources.map((src) => {
                const isSelected = src.id === incomeSourceId;
                return (
                  <button
                    key={src.id}
                    onClick={() => setIncomeSourceId(isSelected ? "" : src.id)}
                    className={cn(
                      "shrink-0 px-4 py-2 rounded-full text-xs font-semibold border-2 transition-all",
                      isSelected
                        ? "bg-gray-800 border-gray-800 text-white"
                        : "bg-white border-gray-100 text-gray-600",
                    )}
                  >
                    {src.name}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ── Fixed Save Button ── */}
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md px-4 pb-8 pt-3 bg-linear-to-t from-gray-50 via-gray-50">
        <button
          onClick={handleSubmit}
          disabled={loading || amount <= 0}
          className={cn(
            "w-full h-14 rounded-2xl text-white font-bold text-base transition-all shadow-lg active:scale-[0.98]",
            BTN_COLORS[type],
            (loading || amount <= 0) && "opacity-50",
          )}
        >
          {loading
            ? "Menyimpan..."
            : amount > 0
              ? `Simpan ${formatRupiah(amount, true)}`
              : "Masukkan Nominal"}
        </button>
      </div>
    </div>
  );
}
