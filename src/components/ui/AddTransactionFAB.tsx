"use client";

import Link from "next/link";
import { Plus } from "lucide-react";

export default function AddTransactionFAB() {
  return (
    <Link
      href="/transactions/new"
      className="fixed bottom-[calc(5rem+env(safe-area-inset-bottom))] right-4 z-50 w-14 h-14 bg-emerald-500 hover:bg-emerald-600 text-white rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/30 active:scale-95 transition-transform my-3"
      style={{
        maxWidth: "448px",
        right: "max(1rem, calc((100vw - 448px) / 2 + 1rem))",
      }}
    >
      <Plus className="w-7 h-7" />
    </Link>
  );
}
