import { formatRupiah } from "@/lib/utils";
import type { Account } from "@/types";
import {
  Wallet,
  Landmark,
  Smartphone,
  TrendingUp,
  CircleDot,
  ArrowLeftRight,
} from "lucide-react";

const typeIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  cash: Wallet,
  bank: Landmark,
  e_wallet: Smartphone,
  investment: TrendingUp,
  other: CircleDot,
};

interface AccountCardProps {
  account: Account;
  compact?: boolean;
}

export default function AccountCard({ account, compact }: AccountCardProps) {
  const Icon = typeIcons[account.type] || Wallet;
  const isTransferOnly =
    (account.transaction_mode ?? "full") === "transfer_only";

  if (compact) {
    return (
      <div
        className="flex items-center gap-2 px-3 py-2 rounded-xl shrink-0 min-w-[140px]"
        style={{
          backgroundColor: `${account.color}10`,
          borderColor: `${account.color}30`,
          borderWidth: 1,
        }}
      >
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: `${account.color}20` }}
        >
          <span style={{ color: account.color }}>
            <Icon className="w-4 h-4" />
          </span>
        </div>
        <div className="min-w-0">
          <p className="text-xs font-medium text-gray-700 truncate">
            {account.name}
          </p>
          <p className="text-xs font-semibold" style={{ color: account.color }}>
            {formatRupiah(account.current_balance, true)}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 p-4 bg-white rounded-xl border border-gray-100">
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center"
        style={{ backgroundColor: `${account.color}15` }}
      >
        <span style={{ color: account.color }}>
          <Icon className="w-5 h-5" />
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p className="text-sm font-medium text-gray-900 truncate">
            {account.name}
          </p>
          {isTransferOnly && (
            <span className="inline-flex items-center gap-0.5 text-[10px] font-medium text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-full shrink-0">
              <ArrowLeftRight className="w-2.5 h-2.5" />
              Transfer
            </span>
          )}
        </div>
        <p className="text-xs text-gray-500">
          {account.bank_name || account.type}
        </p>
      </div>
      <p className="text-sm font-semibold text-gray-900">
        {formatRupiah(account.current_balance)}
      </p>
    </div>
  );
}
