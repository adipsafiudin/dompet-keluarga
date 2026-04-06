"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { notifyFamilyRefresh } from "@/lib/realtime";
import { formatRupiah, formatDate, cn } from "@/lib/utils";
import { useHiddenBalance } from "@/contexts/HiddenBalanceContext";
import PageHeader from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Pencil,
  Trash2,
  Calendar,
  Tag as TagIcon,
  Wallet,
  User,
  Clock,
  ArrowRight,
} from "lucide-react";
import toast from "react-hot-toast";
import type { Transaction } from "@/types";

export default function TransactionDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const { fmt, isHidden } = useHiddenBalance();
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  useEffect(() => {
    async function fetch() {
      const supabase = createClient();
      const { data } = await supabase
        .from("transactions")
        .select(
          `
          *,
          category:categories(*),
          account:accounts!transactions_account_id_fkey(*),
          to_account:accounts!transactions_to_account_id_fkey(*),
          income_source:income_sources(*),
          created_by_user:profiles!transactions_created_by_fkey(*)
        `,
        )
        .eq("id", id)
        .single();

      if (data) setTransaction(data);
      setLoading(false);
    }
    fetch();
  }, [id]);

  async function handleDelete() {
    setDeleting(true);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("transactions")
        .delete()
        .eq("id", id);
      if (error) throw error;
      notifyFamilyRefresh(transaction!.family_id);
      toast.success("Transaksi berhasil dihapus");
      router.push("/transactions");
      router.refresh();
    } catch {
      toast.error("Gagal menghapus transaksi");
    } finally {
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-emerald-200 border-t-emerald-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!transaction) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6">
        <span className="text-5xl mb-4">🔍</span>
        <p className="text-gray-500">Transaksi tidak ditemukan</p>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => router.push("/transactions")}
        >
          Kembali
        </Button>
      </div>
    );
  }

  const colorMap = {
    income: { bg: "bg-emerald-500", text: "text-emerald-600", prefix: "+" },
    expense: { bg: "bg-red-500", text: "text-red-500", prefix: "-" },
    transfer: { bg: "bg-blue-500", text: "text-blue-500", prefix: "" },
  };
  const { bg, text, prefix } = colorMap[transaction.type];

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className={cn("px-4 pt-4 pb-8 rounded-b-3xl", bg)}>
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => router.back()}
            className="text-white/80 text-sm font-medium"
          >
            ← Kembali
          </button>
          <button
            onClick={() => router.push(`/transactions/${id}/edit`)}
            className="w-9 h-9 bg-white/15 rounded-lg flex items-center justify-center"
          >
            <Pencil className="w-4 h-4 text-white" />
          </button>
        </div>
        <p className="text-white/70 text-xs uppercase tracking-wider mb-1">
          {transaction.type === "income"
            ? "Pemasukan"
            : transaction.type === "expense"
              ? "Pengeluaran"
              : "Transfer"}
        </p>
        <p className="text-white text-3xl font-bold">
          {isHidden ? (
            "Rp ••••••"
          ) : (
            <>
              {prefix}
              {formatRupiah(transaction.amount)}
            </>
          )}
        </p>
        {transaction.description && (
          <p className="text-white/70 text-sm mt-2">
            {transaction.description}
          </p>
        )}
      </div>

      {/* Details */}
      <div className="px-4 py-4 space-y-0">
        <DetailRow
          icon={Calendar}
          label="Tanggal"
          value={formatDate(transaction.date, "EEEE, d MMMM yyyy")}
        />
        {transaction.category && (
          <DetailRow
            icon={TagIcon}
            label="Kategori"
            value={transaction.category.name}
            color={transaction.category.color}
          />
        )}
        <DetailRow
          icon={Wallet}
          label="Akun"
          value={transaction.account?.name || "-"}
        />
        {transaction.type === "transfer" && transaction.to_account && (
          <DetailRow
            icon={ArrowRight}
            label="Ke Akun"
            value={transaction.to_account.name}
          />
        )}
        {transaction.income_source && (
          <DetailRow
            icon={Wallet}
            label="Sumber"
            value={transaction.income_source.name}
          />
        )}
        {transaction.created_by_user && (
          <DetailRow
            icon={User}
            label="Dicatat oleh"
            value={
              transaction.created_by_user.full_name ||
              transaction.created_by_user.email
            }
          />
        )}
        <DetailRow
          icon={Clock}
          label="Waktu catat"
          value={formatDate(transaction.created_at, "d MMM yyyy HH:mm")}
        />
      </div>

      {/* Delete Button */}
      <div className="px-4 mt-8">
        <Button
          variant="outline"
          className="w-full text-red-500 border-red-200 hover:bg-red-50"
          onClick={() => setShowDeleteDialog(true)}
        >
          <Trash2 className="w-4 h-4 mr-2" /> Hapus Transaksi
        </Button>
      </div>

      {/* Delete Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hapus Transaksi?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-500">
            Tindakan ini tidak dapat dibatalkan. Saldo akun akan disesuaikan
            otomatis.
          </p>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
            >
              Batal
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? "Menghapus..." : "Hapus"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function DetailRow({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ComponentType<{
    className?: string;
    style?: React.CSSProperties;
  }>;
  label: string;
  value: string;
  color?: string;
}) {
  return (
    <div className="flex items-center gap-3 py-3 border-b border-gray-50">
      <Icon className="w-4 h-4 text-gray-400 shrink-0" />
      <span className="text-xs text-gray-400 w-24 shrink-0">{label}</span>
      <span className="text-sm text-gray-900 flex-1 flex items-center gap-2">
        {color && (
          <div
            className="w-2.5 h-2.5 rounded-full shrink-0"
            style={{ backgroundColor: color }}
          />
        )}
        {value}
      </span>
    </div>
  );
}
