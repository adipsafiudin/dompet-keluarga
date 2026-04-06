"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { subscribeFamilyRefresh } from "@/lib/realtime";
import type { Account } from "@/types";

export function useAccounts(familyId: string | null) {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAccounts = useCallback(async () => {
    if (!familyId) return;
    const supabase = createClient();
    const { data } = await supabase
      .from("accounts")
      .select("*")
      .eq("family_id", familyId)
      .eq("is_active", true)
      .order("sort_order");

    if (data) setAccounts(data);
    setLoading(false);
  }, [familyId]);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  // Realtime subscription
  useEffect(() => {
    if (!familyId) return;
    const supabase = createClient();

    const channel = supabase
      .channel(`accounts:${familyId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "accounts",
          filter: `family_id=eq.${familyId}`,
        },
        () => {
          fetchAccounts();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [familyId, fetchAccounts]);

  // Broadcast: terima sinyal dari member lain yang melakukan perubahan
  useEffect(() => {
    if (!familyId) return;
    return subscribeFamilyRefresh(familyId, fetchAccounts);
  }, [familyId, fetchAccounts]);

  const totalBalance = accounts.reduce((sum, a) => sum + a.current_balance, 0);

  return { accounts, totalBalance, loading, refetch: fetchAccounts };
}
