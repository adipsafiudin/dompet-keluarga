"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import toast from "react-hot-toast";

export default function LoginPage() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const supabase = createClient();

      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        toast.success("Berhasil masuk!");
        router.push("/dashboard");
        router.refresh();
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: fullName } },
        });
        if (error) {
          if (
            error.message.toLowerCase().includes("rate limit") ||
            error.message.toLowerCase().includes("email rate")
          ) {
            throw new Error(
              'Terlalu banyak percobaan. Nonaktifkan "Confirm email" di Supabase Dashboard → Authentication → Providers → Email, lalu coba lagi.',
            );
          }
          throw error;
        }
        // If email confirmation is disabled, user is immediately confirmed
        if (data.session) {
          toast.success("Akun berhasil dibuat!");
          router.push("/setup");
          router.refresh();
        } else {
          toast.success(
            "Akun dibuat! Cek email untuk verifikasi, atau nonaktifkan konfirmasi email di Supabase.",
          );
        }
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Terjadi kesalahan";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-12">
      {/* Logo */}
      <div className="w-20 h-20 bg-emerald-500 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-emerald-500/20">
        <span className="text-4xl">💰</span>
      </div>

      <h1 className="text-2xl font-bold text-gray-900 mb-1">Dompet Keluarga</h1>
      <p className="text-sm text-gray-500 mb-8">
        Catat keuangan bersama keluarga
      </p>

      {/* Tab Toggle */}
      <div className="flex w-full bg-gray-100 rounded-xl p-1 mb-6">
        <button
          type="button"
          className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all ${
            isLogin ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"
          }`}
          onClick={() => setIsLogin(true)}
        >
          Masuk
        </button>
        <button
          type="button"
          className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all ${
            !isLogin ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"
          }`}
          onClick={() => setIsLogin(false)}
        >
          Daftar
        </button>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="w-full space-y-4">
        {!isLogin && (
          <div className="space-y-2">
            <Label htmlFor="fullName">Nama Lengkap</Label>
            <Input
              id="fullName"
              type="text"
              placeholder="Masukkan nama lengkap"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required={!isLogin}
            />
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="nama@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            placeholder="Minimal 6 karakter"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
          />
        </div>

        <Button
          type="submit"
          className="w-full bg-emerald-500 hover:bg-emerald-600 h-12 text-base font-semibold"
          disabled={loading}
        >
          {loading ? "Memproses..." : isLogin ? "Masuk" : "Daftar"}
        </Button>
      </form>

      <p className="text-sm text-gray-500 mt-6">
        {isLogin ? "Belum punya akun?" : "Sudah punya akun?"}{" "}
        <button
          type="button"
          className="text-emerald-600 font-medium"
          onClick={() => setIsLogin(!isLogin)}
        >
          {isLogin ? "Daftar di sini" : "Masuk di sini"}
        </button>
      </p>
    </div>
  );
}
