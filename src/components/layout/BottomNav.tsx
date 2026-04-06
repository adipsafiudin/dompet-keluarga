"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Receipt, BarChart2, Settings, LineChart } from "lucide-react";
import { cn } from "@/lib/utils";

const tabs = [
  { href: "/dashboard", label: "Beranda", icon: Home },
  { href: "/transactions", label: "Transaksi", icon: Receipt },
  { href: "/reports", label: "Rekap", icon: BarChart2 },
  { href: "/laporan", label: "Laporan", icon: LineChart },
  { href: "/settings", label: "Pengaturan", icon: Settings },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-background border-t border-border z-50 pb-safe">
      <div className="flex items-center justify-around h-16">
        {tabs.map((tab) => {
          const isActive = pathname.startsWith(tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-colors",
                isActive ? "text-primary" : "text-gray-400",
              )}
            >
              <tab.icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
