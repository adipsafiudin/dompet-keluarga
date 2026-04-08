import { cn } from "@/lib/utils";

function SkeletonBox({ className }: { className?: string }) {
  return <div className={cn("skeleton rounded-lg", className)} />;
}

export function TransactionCardSkeleton() {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <SkeletonBox className="w-10 h-10 rounded-xl shrink-0" />
      <div className="flex-1 space-y-2">
        <SkeletonBox className="h-4 w-32" />
        <SkeletonBox className="h-3 w-24" />
      </div>
      <SkeletonBox className="h-4 w-20" />
    </div>
  );
}

export function AccountCardSkeleton() {
  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-100 min-w-[140px]">
      <SkeletonBox className="w-8 h-8 rounded-lg shrink-0" />
      <div className="space-y-1.5">
        <SkeletonBox className="h-3 w-16" />
        <SkeletonBox className="h-3 w-12" />
      </div>
    </div>
  );
}

export function StatsCardSkeleton() {
  return (
    <div className="p-4 rounded-2xl border border-gray-100 space-y-2">
      <SkeletonBox className="h-3 w-20" />
      <SkeletonBox className="h-6 w-32" />
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-4">
      <div className="bg-emerald-500 rounded-b-3xl p-6 pt-12 space-y-4">
        <SkeletonBox className="h-5 w-40 !bg-white/20" />
        <SkeletonBox className="h-9 w-48 !bg-white/20" />
        <div className="grid grid-cols-2 gap-3">
          <SkeletonBox className="h-16 rounded-xl !bg-white/20" />
          <SkeletonBox className="h-16 rounded-xl !bg-white/20" />
        </div>
      </div>
      <div className="px-4 grid grid-cols-2 gap-3">
        <SkeletonBox className="h-24 rounded-2xl" />
        <SkeletonBox className="h-24 rounded-2xl" />
      </div>
      <div className="px-4 space-y-1">
        <SkeletonBox className="h-4 w-32 mb-3" />
        <div className="rounded-2xl overflow-hidden border border-gray-100">
          {[1, 2, 3, 4, 5].map((i) => (
            <TransactionCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}

export function TransactionListSkeleton() {
  return (
    <div className="space-y-4 pb-24">
      {/* Header skeleton */}
      <div
        className="px-5 pt-12 pb-4 space-y-3"
        style={{ backgroundColor: "#10b98122" }}
      >
        <SkeletonBox className="h-6 w-32" />
        <div className="flex gap-2">
          {[1, 2, 3, 4].map((i) => (
            <SkeletonBox key={i} className="h-8 w-20 rounded-full" />
          ))}
        </div>
      </div>
      {/* Summary bar */}
      <div className="mx-4 flex gap-3">
        <SkeletonBox className="h-12 flex-1 rounded-xl" />
        <SkeletonBox className="h-12 flex-1 rounded-xl" />
      </div>
      {/* Transaction rows */}
      <div className="mx-4 bg-white rounded-2xl overflow-hidden border border-gray-100">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <TransactionCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

export function ReportsSkeleton() {
  return (
    <div className="space-y-4 pb-24">
      <div className="bg-emerald-500 rounded-b-3xl p-6 pt-12 space-y-3">
        <SkeletonBox className="h-6 w-36 !bg-white/20" />
        <div className="flex items-center justify-between">
          <SkeletonBox className="h-8 w-8 rounded-xl !bg-white/20" />
          <SkeletonBox className="h-5 w-28 !bg-white/20" />
          <SkeletonBox className="h-8 w-8 rounded-xl !bg-white/20" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <SkeletonBox className="h-16 rounded-xl !bg-white/20" />
          <SkeletonBox className="h-16 rounded-xl !bg-white/20" />
        </div>
      </div>
      <div className="px-4 space-y-3">
        <SkeletonBox className="h-48 rounded-2xl" />
        <SkeletonBox className="h-48 rounded-2xl" />
        {[1, 2, 3, 4].map((i) => (
          <SkeletonBox key={i} className="h-14 rounded-xl" />
        ))}
      </div>
    </div>
  );
}

export function SettingsSkeleton() {
  return (
    <div className="space-y-4 pb-24">
      {/* Profile hero */}
      <div className="bg-emerald-500 rounded-b-3xl p-6 pt-12 flex flex-col items-center gap-3">
        <SkeletonBox className="w-20 h-20 rounded-full !bg-white/20" />
        <SkeletonBox className="h-5 w-32 !bg-white/20" />
        <SkeletonBox className="h-3 w-24 !bg-white/20" />
      </div>
      <div className="px-4 space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <SkeletonBox key={i} className="h-14 rounded-xl" />
        ))}
      </div>
    </div>
  );
}

export function AccountsPageSkeleton() {
  return (
    <div className="space-y-4 pb-24">
      <div className="bg-emerald-500 rounded-b-3xl p-6 pt-12 space-y-3">
        <SkeletonBox className="h-5 w-36 !bg-white/20" />
        <SkeletonBox className="h-16 rounded-2xl !bg-white/20" />
      </div>
      <div className="px-4 space-y-2">
        <SkeletonBox className="h-3 w-24" />
        <div className="bg-white rounded-3xl overflow-hidden">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-3.5">
              <SkeletonBox className="w-11 h-11 rounded-2xl shrink-0" />
              <div className="flex-1 space-y-1.5">
                <SkeletonBox className="h-4 w-28" />
                <SkeletonBox className="h-3 w-16" />
              </div>
              <SkeletonBox className="h-4 w-20" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function ListPageSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-4 pb-24">
      <div className="bg-emerald-500 rounded-b-3xl p-6 pt-12 space-y-2">
        <SkeletonBox className="h-5 w-32 !bg-white/20" />
        <SkeletonBox className="h-3 w-48 !bg-white/20" />
      </div>
      <div className="px-4 space-y-2">
        <div className="bg-white rounded-3xl overflow-hidden border border-gray-50">
          {Array.from({ length: rows }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 px-4 py-3.5">
              <SkeletonBox className="w-10 h-10 rounded-2xl shrink-0" />
              <div className="flex-1 space-y-1.5">
                <SkeletonBox className="h-4 w-28" />
                <SkeletonBox className="h-3 w-20" />
              </div>
              <SkeletonBox className="h-4 w-16" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function KantongPageSkeleton() {
  return (
    <div className="space-y-4 pb-24">
      <div className="bg-emerald-500 rounded-b-3xl p-6 pt-12 space-y-3">
        <SkeletonBox className="h-5 w-36 !bg-white/20" />
        <SkeletonBox className="h-8 w-40 !bg-white/20" />
        <div className="flex gap-2 overflow-hidden">
          {[1, 2, 3].map((i) => (
            <SkeletonBox
              key={i}
              className="h-16 w-28 shrink-0 rounded-xl !bg-white/20"
            />
          ))}
        </div>
      </div>
      <div className="px-4 space-y-1">
        <div className="bg-white rounded-2xl overflow-hidden border border-gray-100">
          {[1, 2, 3, 4, 5].map((i) => (
            <TransactionCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}
