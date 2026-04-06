"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { getInitials } from "@/lib/utils";
import { useFamilyMembers } from "@/contexts/FamilyMembersContext";
import AppShell from "@/components/layout/AppShell";
import {
  User,
  Wallet,
  Tag,
  Banknote,
  Users,
  LogOut,
  ChevronRight,
  Palette,
  Crown,
} from "lucide-react";
import toast from "react-hot-toast";
import type { Profile, Family, FamilyMember } from "@/types";

const MEMBER_COLORS = [
  "#6366f1",
  "#f59e0b",
  "#10b981",
  "#ef4444",
  "#8b5cf6",
  "#06b6d4",
  "#f97316",
  "#ec4899",
];

const MENU_GROUPS = [
  {
    label: "Keuangan",
    items: [
      {
        href: "/settings/accounts",
        icon: Wallet,
        label: "Akun & Dompet",
        desc: "Kelola dompet dan rekening",
        color: "#10B981",
      },
      {
        href: "/settings/categories",
        icon: Tag,
        label: "Kategori",
        desc: "Atur kategori pengeluaran",
        color: "#8B5CF6",
      },
      {
        href: "/settings/income-sources",
        icon: Banknote,
        label: "Sumber Pendapatan",
        desc: "Kelola sumber pemasukan",
        color: "#F59E0B",
      },
    ],
  },
  {
    label: "Keluarga",
    items: [
      {
        href: "/settings/family",
        icon: Users,
        label: "Anggota Keluarga",
        desc: "Kelola anggota dan undangan",
        color: "#EC4899",
      },
    ],
  },
  {
    label: "Preferensi",
    items: [
      {
        href: "/settings/profile",
        icon: User,
        label: "Profil Saya",
        desc: "Nama dan informasi akun",
        color: "#3B82F6",
      },
      {
        href: "/settings/appearance",
        icon: Palette,
        label: "Tampilan",
        desc: "Tema warna dan mode gelap",
        color: "#06b6d4",
      },
    ],
  },
];

export default function SettingsPage() {
  const router = useRouter();
  const { members } = useFamilyMembers();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [family, setFamily] = useState<Family | null>(null);
  const [myMember, setMyMember] = useState<FamilyMember | null>(null);
  const [logoutLoading, setLogoutLoading] = useState(false);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const [prof, mem] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", user.id).single(),
        supabase
          .from("family_members")
          .select("*, families(*)")
          .eq("user_id", user.id)
          .single(),
      ]);
      if (prof.data) setProfile(prof.data);
      if (mem.data?.families) setFamily(mem.data.families as unknown as Family);
      if (mem.data) setMyMember(mem.data as unknown as FamilyMember);
    }
    load();
  }, []);

  async function handleLogout() {
    setLogoutLoading(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    toast.success("Berhasil keluar");
    router.push("/auth/login");
    router.refresh();
  }

  const myIndex = members.findIndex((m) => m.user_id === myMember?.user_id);
  const myColor =
    myIndex >= 0 ? MEMBER_COLORS[myIndex % MEMBER_COLORS.length] : "#10b981";

  return (
    <AppShell>
      <div className="bg-gray-50 min-h-screen pb-8">
        {/* ── Header ── */}
        <div className="px-4 pt-6 pb-4">
          <h1 className="text-xl font-bold text-gray-900">Pengaturan</h1>
        </div>

        <div className="px-4 space-y-4">
          {/* ── Profile Hero Card ── */}
          <Link href="/settings/profile">
            <div className="bg-white rounded-3xl shadow-sm p-4 flex items-center gap-4 active:bg-gray-50 transition-colors">
              {/* Avatar */}
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center text-white font-bold text-xl shrink-0"
                style={{ backgroundColor: myColor }}
              >
                {profile?.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt=""
                    className="w-full h-full rounded-2xl object-cover"
                  />
                ) : (
                  getInitials(profile?.full_name || null)
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-base font-bold text-gray-900 truncate">
                    {profile?.full_name || "Pengguna"}
                  </p>
                  {myMember?.role === "owner" && (
                    <span className="flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 shrink-0">
                      <Crown className="w-2.5 h-2.5" /> Owner
                    </span>
                  )}
                  {myMember?.nickname && (
                    <span
                      className="text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0"
                      style={{
                        backgroundColor: `${myColor}18`,
                        color: myColor,
                      }}
                    >
                      {myMember.nickname}
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-400 mt-0.5 truncate">
                  {profile?.email}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {family?.name || "—"}
                </p>
              </div>

              <ChevronRight className="w-4 h-4 text-gray-300 shrink-0" />
            </div>
          </Link>

          {/* ── Family Members Strip ── */}
          {members.length > 0 && (
            <Link href="/settings/family">
              <div className="bg-white rounded-3xl shadow-sm px-4 py-3.5 flex items-center gap-3 active:bg-gray-50 transition-colors">
                <div className="flex -space-x-2 shrink-0">
                  {members.slice(0, 5).map((m, idx) => {
                    const color = MEMBER_COLORS[idx % MEMBER_COLORS.length];
                    const p = m.user as unknown as Profile | undefined;
                    return (
                      <div
                        key={m.id}
                        className="w-8 h-8 rounded-full border-2 border-white flex items-center justify-center text-[10px] font-bold text-white"
                        style={{ backgroundColor: color }}
                        title={p?.full_name || m.nickname || ""}
                      >
                        {getInitials(p?.full_name || null) || "?"}
                      </div>
                    );
                  })}
                  {members.length > 5 && (
                    <div className="w-8 h-8 rounded-full border-2 border-white bg-gray-200 flex items-center justify-center text-[9px] font-bold text-gray-500">
                      +{members.length - 5}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800">
                    {members.length} Anggota Keluarga
                  </p>
                  <p className="text-xs text-gray-400">
                    {members
                      .filter((m) => m.nickname)
                      .map((m) => m.nickname)
                      .slice(0, 3)
                      .join(", ") || "Kelola anggota keluarga"}
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-300 shrink-0" />
              </div>
            </Link>
          )}

          {/* ── Menu Groups ── */}
          {MENU_GROUPS.map((group) => (
            <div key={group.label}>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide px-1 mb-2">
                {group.label}
              </p>
              <div className="bg-white rounded-3xl shadow-sm overflow-hidden divide-y divide-gray-50">
                {group.items.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 active:bg-gray-100 transition-colors"
                  >
                    <div
                      className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0"
                      style={{ backgroundColor: `${item.color}15` }}
                    >
                      <item.icon
                        className="w-5 h-5"
                        style={{ color: item.color }}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800">
                        {item.label}
                      </p>
                      <p className="text-xs text-gray-400">{item.desc}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-300 shrink-0" />
                  </Link>
                ))}
              </div>
            </div>
          ))}

          {/* ── Logout ── */}
          <button
            onClick={handleLogout}
            disabled={logoutLoading}
            className="w-full bg-white rounded-3xl shadow-sm px-4 py-4 flex items-center gap-3 hover:bg-red-50 active:bg-red-100 transition-colors"
          >
            <div className="w-10 h-10 rounded-2xl bg-red-50 flex items-center justify-center shrink-0">
              <LogOut className="w-5 h-5 text-red-500" />
            </div>
            <span className="text-sm font-semibold text-red-500 flex-1 text-left">
              {logoutLoading ? "Keluar..." : "Keluar dari Akun"}
            </span>
          </button>

          {/* ── App version ── */}
          <p className="text-center text-[11px] text-gray-300 pb-2">
            Dompet Keluarga v1.0
          </p>
        </div>
      </div>
    </AppShell>
  );
}
