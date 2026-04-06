"use client";

import Link from "next/link";
import { formatDate, formatRupiah, cn } from "@/lib/utils";
import { useFamilyMembers } from "@/contexts/FamilyMembersContext";
import { useHiddenBalance } from "@/contexts/HiddenBalanceContext";
import type { Transaction } from "@/types";
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
  ArrowLeftRight,
  Tag,
} from "lucide-react";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
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

interface TransactionCardProps {
  transaction: Transaction;
}

export default function TransactionCard({ transaction }: TransactionCardProps) {
  const { memberNickname } = useFamilyMembers();
  const { isHidden } = useHiddenBalance();
  const {
    type,
    amount,
    description,
    date,
    category,
    account,
    to_account,
    created_by_user,
  } = transaction;

  const iconName =
    category?.icon || (type === "transfer" ? "arrow-left-right" : "tag");
  const IconComponent =
    iconMap[iconName] || (type === "transfer" ? ArrowLeftRight : Tag);
  const iconColor =
    category?.color || (type === "transfer" ? "#3B82F6" : "#6B7280");

  const title =
    description ||
    category?.name ||
    (type === "transfer" ? `Transfer` : "Transaksi");
  const subtitle =
    type === "transfer"
      ? `${account?.name || ""} → ${to_account?.name || ""}`
      : category?.name || "";

  const prefix = type === "income" ? "+" : type === "expense" ? "-" : "";
  const amountColor =
    type === "income"
      ? "text-emerald-600"
      : type === "expense"
        ? "text-red-500"
        : "text-blue-500";

  return (
    <Link
      href={`/transactions/${transaction.id}`}
      className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors active:bg-gray-100"
    >
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
        style={{ backgroundColor: `${iconColor}15` }}
      >
        <span style={{ color: iconColor }}>
          <IconComponent className="w-5 h-5" />
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">{title}</p>
        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
          <p className="text-xs text-gray-500 truncate">
            {subtitle && `${subtitle} · `}
            {formatDate(date, "d MMM")}
          </p>
          {transaction.created_by &&
            (() => {
              const nick = memberNickname(transaction.created_by);
              const displayName =
                nick || created_by_user?.full_name?.split(" ")[0] || null;
              if (!displayName) return null;
              return (
                <span className="shrink-0 text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-indigo-100 text-indigo-600">
                  {displayName}
                </span>
              );
            })()}
        </div>
      </div>
      <span className={cn("text-sm font-semibold shrink-0", amountColor)}>
        {isHidden ? (
          "Rp ••••••"
        ) : (
          <>
            {prefix}
            {formatRupiah(amount)}
          </>
        )}
      </span>
    </Link>
  );
}
