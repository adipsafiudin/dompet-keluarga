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
        <SkeletonBox className="h-8 w-48 !bg-white/20" />
        <div className="grid grid-cols-2 gap-3">
          <SkeletonBox className="h-16 rounded-xl !bg-white/20" />
          <SkeletonBox className="h-16 rounded-xl !bg-white/20" />
        </div>
      </div>
      <div className="px-4 space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <TransactionCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
