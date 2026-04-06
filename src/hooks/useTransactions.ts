"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { subscribeFamilyRefresh } from "@/lib/realtime";
import type { Transaction, TransactionFilter } from "@/types";

const PAGE_SIZE = 50;

export function useTransactions(
  familyId: string | null,
  filter?: TransactionFilter,
) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);

  const fetchTransactions = useCallback(
    async (pageNum = 0, append = false) => {
      if (!familyId) return;
      setLoading(true);
      try {
        const supabase = createClient();
        let query = supabase
          .from("transactions")
          .select(
            `
          *,
          category:categories(*),
          account:accounts!transactions_account_id_fkey(*),
          to_account:accounts!transactions_to_account_id_fkey(*),
          income_source:income_sources(*),
          created_by_user:profiles!transactions_created_by_fkey(*)
        `,
          )
          .eq("family_id", familyId)
          .order("date", { ascending: false })
          .order("created_at", { ascending: false })
          .range(pageNum * PAGE_SIZE, (pageNum + 1) * PAGE_SIZE - 1);

        if (filter?.type) query = query.eq("type", filter.type);
        if (filter?.category_id)
          query = query.eq("category_id", filter.category_id);
        if (filter?.account_id)
          query = query.eq("account_id", filter.account_id);
        if (filter?.income_source_id)
          query = query.eq("income_source_id", filter.income_source_id);
        if (filter?.date_from) query = query.gte("date", filter.date_from);
        if (filter?.date_to) query = query.lte("date", filter.date_to);
        if (filter?.created_by)
          query = query.eq("created_by", filter.created_by);
        if (filter?.search)
          query = query.ilike("description", `%${filter.search}%`);

        const { data, error: err } = await query;

        if (err) throw err;

        if (data) {
          setTransactions(append ? (prev) => [...prev, ...data] : data);
          setHasMore(data.length === PAGE_SIZE);
        }
      } catch {
        setError("Gagal memuat transaksi");
      } finally {
        setLoading(false);
      }
    },
    [familyId, filter],
  );

  useEffect(() => {
    setPage(0);
    fetchTransactions(0);
  }, [fetchTransactions]);

  // Realtime subscription — reset ke halaman 1 saat ada perubahan
  useEffect(() => {
    if (!familyId) return;
    const supabase = createClient();

    const channel = supabase
      .channel(`transactions:${familyId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "transactions",
          filter: `family_id=eq.${familyId}`,
        },
        () => {
          setPage(0);
          fetchTransactions(0);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [familyId, fetchTransactions]);

  // Broadcast: terima sinyal dari member lain
  useEffect(() => {
    if (!familyId) return;
    return subscribeFamilyRefresh(familyId, () => {
      setPage(0);
      fetchTransactions(0);
    });
  }, [familyId, fetchTransactions]);

  const loadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchTransactions(nextPage, true);
  };

  return {
    transactions,
    loading,
    error,
    loadMore,
    hasMore,
    refetch: () => fetchTransactions(0),
  };
}
