"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

interface PageHeaderProps {
  title: string;
  showBack?: boolean;
  rightAction?: React.ReactNode;
}

export default function PageHeader({
  title,
  showBack = true,
  rightAction,
}: PageHeaderProps) {
  const router = useRouter();

  return (
    <div className="sticky top-0 z-40 bg-white border-b border-gray-100 px-4 h-14 flex items-center gap-3">
      {showBack && (
        <button
          onClick={() => router.back()}
          className="p-1 -ml-1 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
      )}
      <h1 className="text-lg font-semibold flex-1 truncate">{title}</h1>
      {rightAction}
    </div>
  );
}
