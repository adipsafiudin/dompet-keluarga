"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Users, UserPlus } from "lucide-react";
import toast from "react-hot-toast";

export default function SetupPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"choose" | "create" | "join">("choose");
  const [familyName, setFamilyName] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleCreateFamily() {
    if (!familyName.trim()) return toast.error("Masukkan nama keluarga");
    setLoading(true);

    try {
      const res = await fetch("/api/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ family_name: familyName.trim() }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal membuat keluarga");

      toast.success("Keluarga berhasil dibuat!");
      router.push("/dashboard");
      router.refresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal membuat keluarga";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  async function handleJoinFamily() {
    if (!inviteCode.trim()) return toast.error("Masukkan kode undangan");
    setLoading(true);

    try {
      const res = await fetch("/api/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: inviteCode.trim().toUpperCase() }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Kode tidak valid");

      toast.success(`Berhasil bergabung dengan ${data.family_name}!`);
      router.push("/dashboard");
      router.refresh();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal bergabung";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  if (mode === "choose") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12">
        <div className="w-16 h-16 bg-emerald-500 rounded-2xl flex items-center justify-center mb-6">
          <span className="text-3xl">👨‍👩‍👧</span>
        </div>
        <h1 className="text-xl font-bold text-gray-900 mb-2">
          Selamat Datang!
        </h1>
        <p className="text-sm text-gray-500 text-center mb-8">
          Mulai dengan membuat grup keluarga baru atau bergabung dengan keluarga
          yang sudah ada.
        </p>

        <div className="w-full space-y-3">
          <button
            onClick={() => setMode("create")}
            className="w-full flex items-center gap-4 p-4 rounded-2xl border-2 border-gray-100 hover:border-emerald-200 hover:bg-emerald-50/50 transition-all text-left"
          >
            <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center shrink-0">
              <Users className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <p className="font-semibold text-gray-900">Buat Keluarga Baru</p>
              <p className="text-xs text-gray-500">
                Buat grup dan undang anggota keluarga
              </p>
            </div>
          </button>

          <button
            onClick={() => setMode("join")}
            className="w-full flex items-center gap-4 p-4 rounded-2xl border-2 border-gray-100 hover:border-blue-200 hover:bg-blue-50/50 transition-all text-left"
          >
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center shrink-0">
              <UserPlus className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="font-semibold text-gray-900">Gabung dengan Kode</p>
              <p className="text-xs text-gray-500">
                Masukkan kode undangan dari anggota keluarga
              </p>
            </div>
          </button>
        </div>
      </div>
    );
  }

  if (mode === "create") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12">
        <h1 className="text-xl font-bold text-gray-900 mb-2">
          Buat Keluarga Baru
        </h1>
        <p className="text-sm text-gray-500 text-center mb-8">
          Berikan nama untuk grup keluarga Anda
        </p>

        <div className="w-full space-y-4">
          <div className="space-y-2">
            <Label>Nama Keluarga</Label>
            <Input
              placeholder="Contoh: Keluarga Rizki"
              value={familyName}
              onChange={(e) => setFamilyName(e.target.value)}
            />
          </div>
          <Button
            onClick={handleCreateFamily}
            className="w-full bg-emerald-500 hover:bg-emerald-600 h-12"
            disabled={loading}
          >
            {loading ? "Membuat..." : "Buat Keluarga"}
          </Button>
          <Button
            variant="ghost"
            className="w-full"
            onClick={() => setMode("choose")}
          >
            Kembali
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12">
      <h1 className="text-xl font-bold text-gray-900 mb-2">Gabung Keluarga</h1>
      <p className="text-sm text-gray-500 text-center mb-8">
        Masukkan kode undangan 8 karakter
      </p>

      <div className="w-full space-y-4">
        <div className="space-y-2">
          <Label>Kode Undangan</Label>
          <Input
            placeholder="ABCD1234"
            value={inviteCode}
            onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
            maxLength={8}
            className="text-center text-2xl font-mono tracking-widest h-14"
          />
        </div>
        <Button
          onClick={handleJoinFamily}
          className="w-full bg-blue-500 hover:bg-blue-600 h-12"
          disabled={loading}
        >
          {loading ? "Memproses..." : "Bergabung"}
        </Button>
        <Button
          variant="ghost"
          className="w-full"
          onClick={() => setMode("choose")}
        >
          Kembali
        </Button>
      </div>
    </div>
  );
}
