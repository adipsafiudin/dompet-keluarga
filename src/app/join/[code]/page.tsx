"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";

export default function JoinPage() {
  const router = useRouter();
  const params = useParams();
  const code = params.code as string;
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [familyName, setFamilyName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function verifyCode() {
      try {
        const supabase = createClient();
        const { data } = await supabase
          .from("family_invitations")
          .select("*, family:families(name)")
          .eq("code", code.toUpperCase())
          .is("used_at", null)
          .gt("expires_at", new Date().toISOString())
          .single();

        if (!data) {
          setError("Kode undangan tidak valid atau sudah kadaluarsa");
        } else {
          setFamilyName((data.family as { name: string })?.name || "Keluarga");
        }
      } catch {
        setError("Kode undangan tidak ditemukan");
      } finally {
        setLoading(false);
      }
    }
    verifyCode();
  }, [code]);

  async function handleJoin() {
    setJoining(true);
    try {
      const res = await fetch("/api/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: code.toUpperCase() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast.success(`Berhasil bergabung dengan ${data.family_name}!`);
      router.push("/dashboard");
      router.refresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal bergabung";
      toast.error(msg);
    } finally {
      setJoining(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12">
      {loading ? (
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-emerald-200 border-t-emerald-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-gray-500">
            Memverifikasi kode undangan...
          </p>
        </div>
      ) : error ? (
        <div className="text-center">
          <span className="text-5xl mb-4 block">😢</span>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Oops!</h2>
          <p className="text-sm text-gray-500 mb-6">{error}</p>
          <Button onClick={() => router.push("/setup")} variant="outline">
            Kembali
          </Button>
        </div>
      ) : (
        <div className="text-center">
          <span className="text-5xl mb-4 block">🎉</span>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            Undangan Ditemukan!
          </h2>
          <p className="text-sm text-gray-500 mb-6">
            Anda diundang untuk bergabung dengan <strong>{familyName}</strong>
          </p>
          <Button
            onClick={handleJoin}
            className="w-full bg-emerald-500 hover:bg-emerald-600 h-12"
            disabled={joining}
          >
            {joining ? "Bergabung..." : "Bergabung Sekarang"}
          </Button>
        </div>
      )}
    </div>
  );
}
