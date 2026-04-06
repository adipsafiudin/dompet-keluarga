"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Category } from "@/types";

export function useCategories(familyId: string | null) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetch() {
      if (!familyId) return;
      const supabase = createClient();
      const { data } = await supabase
        .from("categories")
        .select("*")
        .eq("family_id", familyId)
        .eq("is_active", true)
        .order("sort_order");

      if (data) setCategories(data);
      setLoading(false);
    }
    fetch();
  }, [familyId]);

  const expenseCategories = categories.filter((c) => c.type === "expense");
  const incomeCategories = categories.filter((c) => c.type === "income");

  return { categories, expenseCategories, incomeCategories, loading };
}
