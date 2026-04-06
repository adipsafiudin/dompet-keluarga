"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import PageHeader from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getInitials } from "@/lib/utils";
import toast from "react-hot-toast";
import type { Profile } from "@/types";

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();
      if (data) {
        setProfile(data);
        setFullName(data.full_name || "");
      }
    }
    load();
  }, []);

  async function handleSave() {
    if (!profile) return;
    setLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from("profiles")
        .update({ full_name: fullName.trim() })
        .eq("id", profile.id);
      if (error) throw error;
      toast.success("Profil berhasil diperbarui");
      router.refresh();
    } catch {
      toast.error("Gagal menyimpan profil");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen">
      <PageHeader title="Profil Saya" />
      <div className="px-4 py-6 space-y-6">
        <div className="flex flex-col items-center">
          <div className="w-20 h-20 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-2xl mb-4">
            {getInitials(profile?.full_name || null)}
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Nama Lengkap</Label>
            <Input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input
              value={profile?.email || ""}
              disabled
              className="bg-gray-50"
            />
          </div>
        </div>

        <Button
          onClick={handleSave}
          className="w-full bg-emerald-500 hover:bg-emerald-600 h-12"
          disabled={loading}
        >
          {loading ? "Menyimpan..." : "Simpan"}
        </Button>
      </div>
    </div>
  );
}
