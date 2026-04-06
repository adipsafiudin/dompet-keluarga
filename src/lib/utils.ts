import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, parseISO } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { customAlphabet } from "nanoid";

// ============================================================
// Utility Functions
// ============================================================

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatRupiah(amount: number, compact?: boolean): string {
  if (compact) {
    const abs = Math.abs(amount);
    if (abs >= 1_000_000_000)
      return `Rp ${(amount / 1_000_000_000).toFixed(1).replace(".0", "")}M`;
    if (abs >= 1_000_000)
      return `Rp ${(amount / 1_000_000).toFixed(1).replace(".0", "")}jt`;
    if (abs >= 1_000)
      return `Rp ${(amount / 1_000).toFixed(1).replace(".0", "")}rb`;
  }
  const formatted = Math.abs(amount)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return amount < 0 ? `-Rp ${formatted}` : `Rp ${formatted}`;
}

export function parseRupiah(str: string): number {
  const cleaned = str.replace(/[^\d]/g, "");
  return parseInt(cleaned, 10) || 0;
}

export function formatDate(
  date: string | Date,
  fmt: string = "d MMM yyyy",
): string {
  const d = typeof date === "string" ? parseISO(date) : date;
  return format(d, fmt, { locale: localeId });
}

export function formatMonthYear(date: Date): string {
  return format(date, "MMMM yyyy", { locale: localeId });
}

export function getMonthRange(
  year: number,
  month: number,
): { from: string; to: string } {
  const from = `${year}-${String(month).padStart(2, "0")}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const to = `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
  return { from, to };
}

export function getBudgetColor(percentage: number): string {
  if (percentage >= 100) return "#EF4444";
  if (percentage >= 80) return "#F59E0B";
  return "#10B981";
}

export function getInitials(name: string | null): string {
  if (!name) return "?";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

const nanoid = customAlphabet("ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789", 8);
export function generateInviteCode(): string {
  return nanoid();
}

// ============================================================
// Constants
// ============================================================

export const PRESET_COLORS = [
  "#10B981",
  "#3B82F6",
  "#8B5CF6",
  "#EC4899",
  "#F59E0B",
  "#EF4444",
  "#06B6D4",
  "#84CC16",
  "#F97316",
  "#6366F1",
  "#14B8A6",
  "#A855F7",
];

export const ACCOUNT_TYPE_CONFIG: Record<
  string,
  { label: string; icon: string }
> = {
  cash: { label: "Tunai", icon: "wallet" },
  bank: { label: "Bank", icon: "landmark" },
  e_wallet: { label: "E-Wallet", icon: "smartphone" },
  investment: { label: "Investasi", icon: "trending-up" },
  other: { label: "Lainnya", icon: "circle-dot" },
};

export const BANK_LIST = [
  "BCA",
  "BRI",
  "BNI",
  "Mandiri",
  "CIMB Niaga",
  "Bank Syariah Indonesia",
  "BTN",
  "Permata",
  "Danamon",
  "OCBC NISP",
  "Mega",
  "Jago",
  "Blu by BCA",
  "Sea Bank",
  "Neo Commerce",
  "Allo Bank",
];

export const EWALLET_LIST = [
  "GoPay",
  "OVO",
  "Dana",
  "ShopeePay",
  "LinkAja",
  "Flip",
  "Jenius",
  "PayPal",
];

export const INVESTMENT_PLATFORM_LIST = [
  "Bibit",
  "Pluang",
  "Stockbit",
  "Ajaib",
  "IPOT (Indo Premier)",
  "Mirae Asset",
  "Bareksa",
  "Tanamduit",
  "Tokopedia Emas",
  "Pegadaian Digital",
  "Bions (BNI Sekuritas)",
  "MOST (Mandiri Sekuritas)",
  "Kisi Mobile (Kresna)",
  "Pintu",
  "Indodax",
  "Tokocrypto",
  "Lainnya",
];

export const DEFAULT_EXPENSE_CATEGORIES = [
  { name: "Makan & Minum", icon: "utensils", color: "#F59E0B" },
  { name: "Transportasi", icon: "car", color: "#3B82F6" },
  { name: "Belanja", icon: "shopping-bag", color: "#EC4899" },
  { name: "Tagihan Rumah", icon: "home", color: "#8B5CF6" },
  { name: "Listrik & Air", icon: "zap", color: "#F97316" },
  { name: "Internet & Pulsa", icon: "wifi", color: "#06B6D4" },
  { name: "Kesehatan", icon: "heart-pulse", color: "#EF4444" },
  { name: "Pendidikan", icon: "graduation-cap", color: "#6366F1" },
  { name: "Hiburan", icon: "gamepad-2", color: "#A855F7" },
  { name: "Pakaian", icon: "shirt", color: "#14B8A6" },
  { name: "Anak", icon: "baby", color: "#84CC16" },
  { name: "Lainnya", icon: "more-horizontal", color: "#6B7280" },
];

export const DEFAULT_INCOME_CATEGORIES = [
  { name: "Gaji", icon: "briefcase", color: "#10B981" },
  { name: "Usaha", icon: "store", color: "#3B82F6" },
  { name: "Investasi", icon: "trending-up", color: "#8B5CF6" },
  { name: "Lainnya", icon: "plus-circle", color: "#6B7280" },
];

export const DEFAULT_INCOME_SOURCES = [
  { name: "Gaji Suami", icon: "briefcase", color: "#10B981" },
  { name: "Gaji Istri", icon: "briefcase", color: "#3B82F6" },
  { name: "Usaha", icon: "store", color: "#F59E0B" },
  { name: "Investasi", icon: "trending-up", color: "#8B5CF6" },
  { name: "Lainnya", icon: "plus-circle", color: "#6B7280" },
];
