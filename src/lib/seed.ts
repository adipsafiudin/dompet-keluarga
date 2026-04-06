import { SupabaseClient } from "@supabase/supabase-js";
import {
  DEFAULT_EXPENSE_CATEGORIES,
  DEFAULT_INCOME_CATEGORIES,
  DEFAULT_INCOME_SOURCES,
} from "./utils";

export async function seedDefaultData(
  supabase: SupabaseClient,
  familyId: string,
  userId: string,
) {
  // 1. Akun default: Uang Tunai
  await supabase.from("accounts").insert({
    family_id: familyId,
    name: "Uang Tunai",
    type: "cash",
    bank_name: null,
    color: "#10B981",
    icon: "wallet",
    initial_balance: 0,
    current_balance: 0,
    is_active: true,
    sort_order: 0,
    created_by: userId,
  });

  // 2. Kategori expense default
  const expenseCategories = DEFAULT_EXPENSE_CATEGORIES.map((cat, i) => ({
    family_id: familyId,
    name: cat.name,
    type: "expense" as const,
    icon: cat.icon,
    color: cat.color,
    is_active: true,
    is_default: true,
    sort_order: i,
  }));
  await supabase.from("categories").insert(expenseCategories);

  // 3. Kategori income default
  const incomeCategories = DEFAULT_INCOME_CATEGORIES.map((cat, i) => ({
    family_id: familyId,
    name: cat.name,
    type: "income" as const,
    icon: cat.icon,
    color: cat.color,
    is_active: true,
    is_default: true,
    sort_order: i,
  }));
  await supabase.from("categories").insert(incomeCategories);

  // 4. Sumber pendapatan default
  const incomeSources = DEFAULT_INCOME_SOURCES.map((src, i) => ({
    family_id: familyId,
    name: src.name,
    icon: src.icon,
    color: src.color,
    is_active: true,
    is_default: true,
    sort_order: i,
  }));
  await supabase.from("income_sources").insert(incomeSources);
}
