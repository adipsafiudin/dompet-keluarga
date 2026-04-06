// ============================================================
// Tipe dasar
// ============================================================

export type TransactionType = "income" | "expense" | "transfer";
export type AccountType = "cash" | "bank" | "e_wallet" | "investment" | "other";
export type TransactionMode = "full" | "transfer_only";
export type FamilyRole = "owner" | "member";

// ============================================================
// Entities
// ============================================================

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
}

export interface Family {
  id: string;
  name: string;
  owner_id: string;
  created_at: string;
}

export interface FamilyMember {
  id: string;
  family_id: string;
  user_id: string;
  role: FamilyRole;
  nickname: string | null;
  joined_at: string;
  user?: Profile;
}

export interface FamilyInvitation {
  id: string;
  family_id: string;
  code: string;
  email: string | null;
  expires_at: string;
  used_at: string | null;
  created_by: string;
  created_at: string;
  family?: Family;
}

export interface Account {
  id: string;
  family_id: string;
  name: string;
  type: AccountType;
  bank_name: string | null;
  color: string;
  icon: string;
  initial_balance: number;
  current_balance: number;
  is_active: boolean;
  sort_order: number;
  transaction_mode: TransactionMode;
  created_by: string;
  created_at: string;
}

export interface Category {
  id: string;
  family_id: string;
  name: string;
  type: "income" | "expense";
  icon: string;
  color: string;
  budget_limit: number | null;
  is_active: boolean;
  is_default: boolean;
  sort_order: number;
  created_at: string;
}

export interface IncomeSource {
  id: string;
  family_id: string;
  name: string;
  icon: string;
  color: string;
  is_active: boolean;
  is_default: boolean;
  sort_order: number;
  created_at: string;
}

export interface Transaction {
  id: string;
  family_id: string;
  type: TransactionType;
  amount: number;
  description: string | null;
  date: string;
  category_id: string | null;
  account_id: string;
  to_account_id: string | null;
  income_source_id: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  // Joins
  category?: Category;
  account?: Account;
  to_account?: Account;
  income_source?: IncomeSource;
  created_by_user?: Profile;
}

// ============================================================
// Input forms
// ============================================================

export interface TransactionInput {
  type: TransactionType;
  amount: number;
  description: string;
  date: string;
  category_id: string | null;
  account_id: string;
  to_account_id?: string | null;
  income_source_id?: string | null;
}

// ============================================================
// Dashboard
// ============================================================

export interface DashboardStats {
  total_balance: number;
  month_income: number;
  month_expense: number;
  month_net: number;
  recent_transactions: Transaction[];
  budget_alerts: BudgetAlert[];
}

export interface BudgetAlert {
  category: Category;
  spent: number;
  budget_limit: number;
  percentage: number;
  is_over_budget: boolean;
}

// ============================================================
// Reports
// ============================================================

export interface MonthlyReport {
  year: number;
  month: number;
  total_income: number;
  total_expense: number;
  net: number;
  by_category: CategorySummary[];
  by_income_source: IncomeSourceSummary[];
  daily_data: DailyData[];
}

export interface CategorySummary {
  category: Category;
  total: number;
  count: number;
  percentage: number;
  budget_used_pct: number | null;
}

export interface IncomeSourceSummary {
  income_source: IncomeSource | null;
  total: number;
  count: number;
  percentage: number;
}

export interface DailyData {
  date: string;
  income: number;
  expense: number;
}

// ============================================================
// Filter transaksi
// ============================================================

export interface TransactionFilter {
  type?: TransactionType;
  category_id?: string;
  account_id?: string;
  income_source_id?: string;
  date_from?: string;
  date_to?: string;
  search?: string;
  created_by?: string;
}
