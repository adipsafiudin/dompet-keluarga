import { cn, formatRupiah, getBudgetColor } from "@/lib/utils";
import { useHiddenBalance } from "@/contexts/HiddenBalanceContext";
import type { BudgetAlert } from "@/types";

interface BudgetProgressProps {
  alert: BudgetAlert;
}

export default function BudgetProgress({ alert }: BudgetProgressProps) {
  const { category, spent, budget_limit, percentage, is_over_budget } = alert;
  const color = getBudgetColor(percentage);
  const { fmt } = useHiddenBalance();

  return (
    <div className="px-4 py-3">
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-2">
          <div
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: category.color }}
          />
          <span className="text-sm font-medium text-gray-700">
            {category.name}
          </span>
        </div>
        <span className="text-xs text-gray-500">
          {fmt(spent)} / {fmt(budget_limit)}
        </span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${Math.min(percentage, 100)}%`,
            backgroundColor: color,
          }}
        />
      </div>
      <div className="flex items-center justify-between mt-1">
        <span className="text-xs text-gray-400">
          {Math.round(percentage)}% terpakai
        </span>
        {is_over_budget && (
          <span className="text-xs font-medium text-red-500">
            Melebihi anggaran!
          </span>
        )}
        {!is_over_budget && percentage >= 80 && (
          <span className="text-xs font-medium text-amber-500">
            Hampir penuh
          </span>
        )}
      </div>
    </div>
  );
}
