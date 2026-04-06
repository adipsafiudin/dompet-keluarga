"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Family } from "@/types";

export function useFamily() {
  const [familyId, setFamilyId] = useState<string | null>(null);
  const [family, setFamily] = useState<Family | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchFamily() {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          setLoading(false);
          return;
        }

        // Check localStorage cache first
        const cached = localStorage.getItem(`family_${user.id}`);
        if (cached) {
          const parsed = JSON.parse(cached) as Family;
          setFamily(parsed);
          setFamilyId(parsed.id);
        }

        const { data: member } = await supabase
          .from("family_members")
          .select("family_id, families(*)")
          .eq("user_id", user.id)
          .single();

        if (member?.families) {
          const fam = member.families as unknown as Family;
          setFamily(fam);
          setFamilyId(fam.id);
          localStorage.setItem(`family_${user.id}`, JSON.stringify(fam));
        }
      } catch (err) {
        setError("Gagal memuat data keluarga");
      } finally {
        setLoading(false);
      }
    }

    fetchFamily();
  }, []);

  return { familyId, family, loading, error };
}
