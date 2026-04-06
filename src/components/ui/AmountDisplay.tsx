import { cn, formatRupiah } from "@/lib/utils";
import { useHiddenBalance } from "@/contexts/HiddenBalanceContext";

const MASK = "Rp ••••••";

interface AmountDisplayProps {
  amount: number;
  type: "income" | "expense" | "transfer";
  className?: string;
  compact?: boolean;
}

export default function AmountDisplay({
  amount,
  type,
  className,
  compact,
}: AmountDisplayProps) {
  const { isHidden } = useHiddenBalance();
  const prefix = type === "income" ? "+" : type === "expense" ? "-" : "";
  const colorClass =
    type === "income"
      ? "text-emerald-600"
      : type === "expense"
        ? "text-red-500"
        : "text-blue-500";

  return (
    <span className={cn("font-semibold", colorClass, className)}>
      {isHidden ? (
        MASK
      ) : (
        <>
          {prefix}
          {formatRupiah(amount, compact)}
        </>
      )}
    </span>
  );
}
