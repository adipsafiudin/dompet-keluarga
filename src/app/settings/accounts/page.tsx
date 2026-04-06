"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  formatRupiah,
  PRESET_COLORS,
  BANK_LIST,
  EWALLET_LIST,
  INVESTMENT_PLATFORM_LIST,
  cn,
} from "@/lib/utils";
import CurrencyInput from "@/components/ui/CurrencyInput";
import {
  Plus,
  ArrowLeftRight,
  LayoutGrid,
  Wallet,
  Landmark,
  Smartphone,
  TrendingUp,
  CircleDot,
  ChevronLeft,
  ChevronRight,
  Pencil,
  Check,
  X,
} from "lucide-react";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import type { Account, AccountType, TransactionMode } from "@/types";

const ACCOUNT_TYPES: {
  value: AccountType;
  label: string;
  emoji: string;
  Icon: React.ComponentType<{ className?: string }>;
}[] = [
  { value: "cash", label: "Tunai", emoji: "💵", Icon: Wallet },
  { value: "bank", label: "Bank", emoji: "🏦", Icon: Landmark },
  { value: "e_wallet", label: "E-Wallet", emoji: "📱", Icon: Smartphone },
  { value: "investment", label: "Investasi", emoji: "📈", Icon: TrendingUp },
  { value: "other", label: "Lainnya", emoji: "💼", Icon: CircleDot },
];

const TYPE_ICON_MAP: Record<
  string,
  React.ComponentType<{ className?: string }>
> = {
  cash: Wallet,
  bank: Landmark,
  e_wallet: Smartphone,
  investment: TrendingUp,
  other: CircleDot,
};

export default function AccountsPage() {
  const router = useRouter();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [familyId, setFamilyId] = useState("");
  const [userId, setUserId] = useState("");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<Account | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);

  // Form state
  const [name, setName] = useState("");
  const [type, setType] = useState<AccountType>("cash");
  const [bankName, setBankName] = useState("");
  const [color, setColor] = useState(PRESET_COLORS[0]);
  const [initialBalance, setInitialBalance] = useState(0);
  const [transactionMode, setTransactionMode] =
    useState<TransactionMode>("full");

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);
      const { data: member } = await supabase
        .from("family_members")
        .select("family_id")
        .eq("user_id", user.id)
        .single();
      if (!member) return;
      setFamilyId(member.family_id);
      await fetchAccounts(member.family_id);
      setFetchLoading(false);
    }
    load();
  }, []);

  async function fetchAccounts(fid: string) {
    const supabase = createClient();
    const { data } = await supabase
      .from("accounts")
      .select("*")
      .eq("family_id", fid)
      .order("sort_order");
    if (data) setAccounts(data);
  }

  function openAdd() {
    setEditing(null);
    setName("");
    setType("cash");
    setBankName("");
    setColor(PRESET_COLORS[0]);
    setInitialBalance(0);
    setTransactionMode("full");
    setSheetOpen(true);
  }

  function openEdit(acc: Account) {
    setEditing(acc);
    setName(acc.name);
    setType(acc.type);
    setBankName(acc.bank_name || "");
    setColor(acc.color);
    setInitialBalance(acc.initial_balance);
    setTransactionMode(acc.transaction_mode ?? "full");
    setSheetOpen(true);
  }

  async function handleSave() {
    if (!name.trim()) return toast.error("Masukkan nama akun");
    setLoading(true);
    try {
      const supabase = createClient();
      if (editing) {
        const { error } = await supabase
          .from("accounts")
          .update({
            name: name.trim(),
            type,
            bank_name: bankName || null,
            color,
            transaction_mode: transactionMode,
          })
          .eq("id", editing.id);
        if (error) throw error;
        toast.success("Akun berhasil diperbarui");
      } else {
        const { error } = await supabase.from("accounts").insert({
          family_id: familyId,
          name: name.trim(),
          type,
          bank_name: bankName || null,
          color,
          initial_balance: initialBalance,
          current_balance: initialBalance,
          transaction_mode: transactionMode,
          created_by: userId,
        });
        if (error) throw error;
        toast.success("Akun berhasil ditambahkan");
      }
      setSheetOpen(false);
      await fetchAccounts(familyId);
    } catch {
      toast.error("Gagal menyimpan akun");
    } finally {
      setLoading(false);
    }
  }

  const institutionList =
    type === "bank"
      ? BANK_LIST
      : type === "e_wallet"
        ? EWALLET_LIST
        : type === "investment"
          ? INVESTMENT_PLATFORM_LIST
          : [];

  const institutionLabel =
    type === "bank"
      ? "Bank"
      : type === "investment"
        ? "Platform / Broker"
        : "Platform";

  const totalBalance = accounts.reduce((s, a) => s + a.current_balance, 0);
  const kantongBayar = accounts.filter(
    (a) => (a.transaction_mode ?? "full") === "full",
  );
  const kantongTabungan = accounts.filter(
    (a) => (a.transaction_mode ?? "full") === "transfer_only",
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── Header ── */}
      <div
        className="px-4 pt-12 pb-6 rounded-b-4xl relative overflow-hidden"
        style={{ backgroundColor: "var(--primary)" }}
      >
        <div className="absolute -top-6 -right-6 w-32 h-32 rounded-full bg-white/5" />
        <div className="absolute -bottom-8 -left-4 w-28 h-28 rounded-full bg-white/5" />

        <div className="relative">
          <div className="flex items-center gap-3 mb-4">
            <button
              onClick={() => router.back()}
              className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center"
            >
              <ChevronLeft className="w-5 h-5 text-white" />
            </button>
            <h1 className="text-white font-bold text-lg">Akun & Dompet</h1>
          </div>

          {/* Summary */}
          <div className="bg-white/15 backdrop-blur-sm rounded-2xl p-4">
            <p className="text-white/60 text-xs mb-0.5">Total Saldo</p>
            <p className="text-white text-2xl font-bold">
              {formatRupiah(totalBalance)}
            </p>
            <div className="flex gap-3 mt-3">
              <div className="flex-1 bg-white/10 rounded-xl p-2.5">
                <p className="text-white/50 text-[10px]">Kantong Bayar</p>
                <p className="text-white text-sm font-semibold">
                  {kantongBayar.length} akun
                </p>
              </div>
              <div className="flex-1 bg-white/10 rounded-xl p-2.5">
                <p className="text-white/50 text-[10px]">Kantong Tabungan</p>
                <p className="text-white text-sm font-semibold">
                  {kantongTabungan.length} akun
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 py-5 space-y-5 pb-28">
        {/* ── Kantong Bayar ── */}
        {kantongBayar.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide px-1 mb-2">
              Kantong Bayar
            </p>
            <div className="bg-white rounded-3xl shadow-sm overflow-hidden divide-y divide-gray-50">
              {kantongBayar.map((acc) => (
                <AccountRow
                  key={acc.id}
                  account={acc}
                  onEdit={() => openEdit(acc)}
                />
              ))}
            </div>
          </div>
        )}

        {/* ── Kantong Tabungan ── */}
        {kantongTabungan.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide px-1 mb-2">
              Kantong Tabungan
            </p>
            <div className="bg-white rounded-3xl shadow-sm overflow-hidden divide-y divide-gray-50">
              {kantongTabungan.map((acc) => (
                <AccountRow
                  key={acc.id}
                  account={acc}
                  onEdit={() => openEdit(acc)}
                />
              ))}
            </div>
          </div>
        )}

        {!fetchLoading && accounts.length === 0 && (
          <div className="text-center py-12">
            <p className="text-4xl mb-3">💳</p>
            <p className="text-gray-500 text-sm">Belum ada akun</p>
            <p className="text-gray-400 text-xs mt-1">
              Tambahkan akun pertama kamu
            </p>
          </div>
        )}
      </div>

      {/* ── FAB Add ── */}
      <button
        onClick={openAdd}
        className="fixed bottom-6 right-1/2 translate-x-[calc(50%-1rem+min(224px,50vw))] w-14 h-14 rounded-2xl shadow-lg flex items-center justify-center text-white active:scale-95 transition-transform"
        style={{ backgroundColor: "var(--primary)" }}
      >
        <Plus className="w-6 h-6" />
      </button>

      {/* ── Bottom Sheet ── */}
      {sheetOpen && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setSheetOpen(false)}
          />
          <div className="relative bg-white rounded-t-3xl max-h-[92vh] overflow-y-auto z-10">
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 bg-gray-200 rounded-full" />
            </div>

            {/* Sheet header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-50">
              <h2 className="text-base font-bold text-gray-900">
                {editing ? "Edit Akun" : "Tambah Akun"}
              </h2>
              <button
                onClick={() => setSheetOpen(false)}
                className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center"
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>

            <div className="px-5 py-4 space-y-5 pb-8">
              {/* Nama Akun */}
              <div>
                <p className="text-xs font-semibold text-gray-500 mb-2">
                  Nama Akun
                </p>
                <input
                  type="text"
                  placeholder="Contoh: BCA Utama, GoPay, dll"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full h-12 px-4 rounded-2xl border border-gray-200 bg-gray-50 text-sm font-medium text-gray-800 placeholder:text-gray-300 outline-none focus:border-gray-400 transition-colors"
                />
              </div>

              {/* Jenis */}
              <div>
                <p className="text-xs font-semibold text-gray-500 mb-2">
                  Jenis Kantong
                </p>
                <div className="grid grid-cols-5 gap-2">
                  {ACCOUNT_TYPES.map((t) => {
                    const isActive = type === t.value;
                    return (
                      <button
                        key={t.value}
                        onClick={() => {
                          setType(t.value);
                          setBankName("");
                        }}
                        className={cn(
                          "flex flex-col items-center gap-1.5 py-3 rounded-2xl border-2 transition-all",
                          isActive
                            ? "border-current shadow-sm"
                            : "border-gray-100 bg-gray-50",
                        )}
                        style={
                          isActive
                            ? {
                                borderColor: color,
                                backgroundColor: `${color}15`,
                              }
                            : undefined
                        }
                      >
                        <span className="text-xl">{t.emoji}</span>
                        <span
                          className="text-[10px] font-semibold"
                          style={isActive ? { color } : { color: "#9CA3AF" }}
                        >
                          {t.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Platform / Bank dropdown */}
              {institutionList.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 mb-2">
                    {institutionLabel}
                  </p>
                  <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                    {institutionList.map((inst) => {
                      const isSelected = bankName === inst;
                      return (
                        <button
                          key={inst}
                          onClick={() => setBankName(isSelected ? "" : inst)}
                          className={cn(
                            "shrink-0 px-3.5 py-2 rounded-full text-xs font-semibold border-2 transition-all",
                            isSelected
                              ? "text-white border-transparent"
                              : "bg-gray-50 border-gray-100 text-gray-600",
                          )}
                          style={
                            isSelected
                              ? { backgroundColor: color, borderColor: color }
                              : undefined
                          }
                        >
                          {inst}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Mode Transaksi */}
              <div>
                <p className="text-xs font-semibold text-gray-500 mb-2">
                  Mode Penggunaan
                </p>
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    onClick={() => setTransactionMode("full")}
                    className={cn(
                      "flex flex-col items-center gap-2 py-4 px-3 rounded-2xl border-2 transition-all",
                      transactionMode === "full"
                        ? "shadow-sm"
                        : "border-gray-100 bg-gray-50",
                    )}
                    style={
                      transactionMode === "full"
                        ? {
                            borderColor: color,
                            backgroundColor: `${color}10`,
                          }
                        : undefined
                    }
                  >
                    <LayoutGrid
                      className="w-6 h-6"
                      style={
                        transactionMode === "full"
                          ? { color }
                          : { color: "#9CA3AF" }
                      }
                    />
                    <div className="text-center">
                      <p
                        className="text-[11px] font-bold"
                        style={
                          transactionMode === "full"
                            ? { color }
                            : { color: "#6B7280" }
                        }
                      >
                        Kantong Bayar
                      </p>
                      <p className="text-[9px] text-gray-400 mt-0.5 leading-tight">
                        Pemasukan, pengeluaran & transfer
                      </p>
                    </div>
                    {transactionMode === "full" && (
                      <div
                        className="w-5 h-5 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: color }}
                      >
                        <Check className="w-3 h-3 text-white" />
                      </div>
                    )}
                  </button>
                  <button
                    onClick={() => setTransactionMode("transfer_only")}
                    className={cn(
                      "flex flex-col items-center gap-2 py-4 px-3 rounded-2xl border-2 transition-all",
                      transactionMode === "transfer_only"
                        ? "shadow-sm"
                        : "border-gray-100 bg-gray-50",
                    )}
                    style={
                      transactionMode === "transfer_only"
                        ? {
                            borderColor: "#3B82F6",
                            backgroundColor: "#3B82F615",
                          }
                        : undefined
                    }
                  >
                    <ArrowLeftRight
                      className="w-6 h-6"
                      style={
                        transactionMode === "transfer_only"
                          ? { color: "#3B82F6" }
                          : { color: "#9CA3AF" }
                      }
                    />
                    <div className="text-center">
                      <p
                        className="text-[11px] font-bold"
                        style={
                          transactionMode === "transfer_only"
                            ? { color: "#3B82F6" }
                            : { color: "#6B7280" }
                        }
                      >
                        Kantong Tabungan
                      </p>
                      <p className="text-[9px] text-gray-400 mt-0.5 leading-tight">
                        Pindah saldo antar kantong
                      </p>
                    </div>
                    {transactionMode === "transfer_only" && (
                      <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center">
                        <Check className="w-3 h-3 text-white" />
                      </div>
                    )}
                  </button>
                </div>
              </div>

              {/* Warna */}
              <div>
                <p className="text-xs font-semibold text-gray-500 mb-3">
                  Warna Akun
                </p>
                <div className="flex flex-wrap gap-3">
                  {PRESET_COLORS.map((c) => (
                    <button
                      key={c}
                      onClick={() => setColor(c)}
                      className="w-9 h-9 rounded-full transition-all flex items-center justify-center"
                      style={{ backgroundColor: c }}
                    >
                      {color === c && (
                        <Check className="w-4 h-4 text-white drop-shadow" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Saldo Awal (add only) */}
              {!editing && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 mb-2">
                    Saldo Awal
                  </p>
                  <div className="h-12 px-4 rounded-2xl border border-gray-200 bg-gray-50 flex items-center">
                    <CurrencyInput
                      value={initialBalance}
                      onChange={setInitialBalance}
                    />
                  </div>
                </div>
              )}

              {/* Save button */}
              <button
                onClick={handleSave}
                disabled={loading}
                className="w-full h-14 rounded-2xl text-white font-bold text-base transition-all shadow-md active:scale-[0.98] disabled:opacity-50"
                style={{ backgroundColor: color }}
              >
                {loading
                  ? "Menyimpan..."
                  : editing
                    ? "Simpan Perubahan"
                    : "Tambah Akun"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function AccountRow({
  account,
  onEdit,
}: {
  account: Account;
  onEdit: () => void;
}) {
  const Icon = TYPE_ICON_MAP[account.type] || Wallet;
  const isTransferOnly =
    (account.transaction_mode ?? "full") === "transfer_only";

  return (
    <div className="flex items-center gap-3 px-4 py-3.5">
      {/* Icon */}
      <div
        className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0"
        style={{ backgroundColor: `${account.color}18` }}
      >
        <Icon className="w-5 h-5" style={{ color: account.color }} />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p className="text-sm font-semibold text-gray-900 truncate">
            {account.name}
          </p>
          {isTransferOnly && (
            <span className="shrink-0 text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-500 flex items-center gap-0.5">
              <ArrowLeftRight className="w-2.5 h-2.5" />
              Transfer
            </span>
          )}
        </div>
        <p className="text-xs text-gray-400 mt-0.5">
          {account.bank_name || account.type.replace("_", " ")}
        </p>
      </div>

      {/* Balance + edit */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="text-right">
          <p className="text-sm font-bold" style={{ color: account.color }}>
            {formatRupiah(account.current_balance, true)}
          </p>
          {account.initial_balance !== account.current_balance && (
            <p className="text-[10px] text-gray-400">
              awal {formatRupiah(account.initial_balance, true)}
            </p>
          )}
        </div>
        <button
          onClick={onEdit}
          className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center"
        >
          <Pencil className="w-3.5 h-3.5 text-gray-500" />
        </button>
      </div>
    </div>
  );
}
