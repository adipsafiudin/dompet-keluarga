"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { getInitials, cn } from "@/lib/utils";
import { useFamilyMembers } from "@/contexts/FamilyMembersContext";
import PageHeader from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  UserPlus,
  Copy,
  Share2,
  Crown,
  Trash2,
  Pencil,
  Check,
  X,
} from "lucide-react";
import toast from "react-hot-toast";
import type { Family, FamilyMember, FamilyInvitation, Profile } from "@/types";

const PRESET_NICKNAMES = [
  "Suami",
  "Istri",
  "Ayah",
  "Ibu",
  "Anak ke-1",
  "Anak ke-2",
  "Anak ke-3",
  "Anak ke-4",
  "Kakek",
  "Nenek",
  "Saudara",
  "Keponakan",
  "Lainnya...",
];

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

export default function FamilyPage() {
  const { members, refreshMembers } = useFamilyMembers();
  const [family, setFamily] = useState<Family | null>(null);
  const [invitations, setInvitations] = useState<FamilyInvitation[]>([]);
  const [userId, setUserId] = useState("");
  const [isOwner, setIsOwner] = useState(false);
  const [inviteSheetOpen, setInviteSheetOpen] = useState(false);
  const [inviteCode, setInviteCode] = useState("");
  const [inviteLoading, setInviteLoading] = useState(false);
  const [familyName, setFamilyName] = useState("");
  const [editingName, setEditingName] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState<string | null>(null);
  const [nicknameSheet, setNicknameSheet] = useState<FamilyMember | null>(null);
  const [customNickname, setCustomNickname] = useState("");
  const [showCustom, setShowCustom] = useState(false);
  const [savingNickname, setSavingNickname] = useState(false);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);
      const { data: member } = await supabase
        .from("family_members")
        .select("family_id, role, families(*)")
        .eq("user_id", user.id)
        .single();
      if (!member) return;
      const fam = member.families as unknown as Family;
      setFamily(fam);
      setFamilyName(fam.name);
      setIsOwner(member.role === "owner");
      const { data: invs } = await supabase
        .from("family_invitations")
        .select("*")
        .eq("family_id", fam.id)
        .order("created_at", { ascending: false })
        .limit(10);
      if (invs) setInvitations(invs);
    }
    load();
  }, []);

  async function handleUpdateFamilyName() {
    if (!family || !familyName.trim()) return;
    const supabase = createClient();
    const { error } = await supabase
      .from("families")
      .update({ name: familyName.trim() })
      .eq("id", family.id);
    if (error) return toast.error("Gagal memperbarui nama");
    toast.success("Nama keluarga diperbarui");
    setEditingName(false);
  }

  async function handleCreateInvite() {
    if (!family) return;
    setInviteLoading(true);
    try {
      const res = await fetch("/api/invitations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ family_id: family.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setInviteCode(data.code);
      setInviteSheetOpen(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal membuat undangan";
      toast.error(msg);
    } finally {
      setInviteLoading(false);
    }
  }

  function copyInviteCode() {
    navigator.clipboard.writeText(inviteCode);
    toast.success("Kode disalin!");
  }

  async function shareInvite() {
    const url = window.location.origin + "/join/" + inviteCode;
    if (navigator.share) {
      await navigator.share({
        title: "Bergabung dengan Dompet Keluarga",
        text:
          "Bergabung dengan keluarga " +
          (family?.name ?? "") +
          "! Kode: " +
          inviteCode,
        url,
      });
    } else {
      navigator.clipboard.writeText(url);
      toast.success("Link disalin!");
    }
  }

  async function handleRemoveMember(memberId: string) {
    const supabase = createClient();
    const { error } = await supabase
      .from("family_members")
      .delete()
      .eq("id", memberId);
    if (error) return toast.error("Gagal menghapus anggota");
    toast.success("Anggota dihapus");
    await refreshMembers();
    setDeleteDialog(null);
  }

  function openNicknameSheet(m: FamilyMember) {
    setNicknameSheet(m);
    setCustomNickname(m.nickname || "");
    setShowCustom(
      !!m.nickname && !PRESET_NICKNAMES.slice(0, -1).includes(m.nickname),
    );
  }

  async function saveNickname(nickname: string | null) {
    if (!nicknameSheet) return;
    setSavingNickname(true);
    const supabase = createClient();
    const { error } = await supabase
      .from("family_members")
      .update({ nickname })
      .eq("id", nicknameSheet.id);
    if (error) {
      toast.error("Gagal menyimpan peran");
    } else {
      toast.success("Peran anggota diperbarui");
      await refreshMembers();
      setNicknameSheet(null);
      setShowCustom(false);
      setCustomNickname("");
    }
    setSavingNickname(false);
  }

  async function handlePresetSelect(preset: string) {
    if (preset === "Lainnya...") {
      setShowCustom(true);
      setCustomNickname("");
      return;
    }
    await saveNickname(preset);
  }

  const canEditMember = (m: FamilyMember) => isOwner || m.user_id === userId;

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader title="Anggota Keluarga" />
      <div className="px-4 py-4 space-y-5">
        {/* Family Name */}
        <div className="bg-white rounded-3xl shadow-sm p-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
            Nama Keluarga
          </p>
          {editingName ? (
            <div className="flex gap-2">
              <Input
                value={familyName}
                onChange={(e) => setFamilyName(e.target.value)}
                className="flex-1"
                autoFocus
              />
              <button
                onClick={handleUpdateFamilyName}
                className="w-9 h-9 rounded-xl bg-emerald-500 flex items-center justify-center shrink-0"
              >
                <Check className="w-4 h-4 text-white" />
              </button>
              <button
                onClick={() => setEditingName(false)}
                className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center shrink-0"
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <p className="text-lg font-bold text-gray-900">{family?.name}</p>
              {isOwner && (
                <button
                  onClick={() => setEditingName(true)}
                  className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center"
                >
                  <Pencil className="w-3.5 h-3.5 text-gray-500" />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Members */}
        <div>
          <p className="text-sm font-bold text-gray-700 mb-3">
            Anggota ({members.length})
          </p>
          <div className="space-y-3">
            {members.map((m, idx) => {
              const profile = m.user as unknown as Profile | undefined;
              const name = profile?.full_name || "Pengguna";
              const color = MEMBER_COLORS[idx % MEMBER_COLORS.length];
              const canEdit = canEditMember(m);
              return (
                <div
                  key={m.id}
                  className="bg-white rounded-3xl shadow-sm overflow-hidden"
                >
                  <div className="flex items-center gap-3 px-4 pt-4 pb-3">
                    <div
                      className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 text-white font-bold text-base"
                      style={{ backgroundColor: color }}
                    >
                      {getInitials(profile?.full_name || null)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-bold text-gray-900 truncate">
                          {name}
                        </p>
                        {m.role === "owner" && (
                          <span className="flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700">
                            <Crown className="w-2.5 h-2.5" /> Owner
                          </span>
                        )}
                        {m.user_id === userId && (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-indigo-100 text-indigo-600">
                            Saya
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5 truncate">
                        {profile?.email}
                      </p>
                    </div>
                    {isOwner && m.user_id !== userId && (
                      <button
                        onClick={() => setDeleteDialog(m.id)}
                        className="w-8 h-8 rounded-xl bg-red-50 flex items-center justify-center shrink-0"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-red-400" />
                      </button>
                    )}
                  </div>
                  <div className="border-t border-gray-50 px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <p className="text-xs text-gray-400">Peran:</p>
                      {m.nickname ? (
                        <span
                          className="text-xs font-semibold px-2.5 py-1 rounded-full"
                          style={{ backgroundColor: `${color}18`, color }}
                        >
                          {m.nickname}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-300 italic">
                          Belum diatur
                        </span>
                      )}
                    </div>
                    {canEdit && (
                      <button
                        onClick={() => openNicknameSheet(m)}
                        className="flex items-center gap-1 text-xs font-semibold text-indigo-500"
                      >
                        <Pencil className="w-3 h-3" />
                        {m.nickname ? "Ubah" : "Atur"}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Invite Button */}
        <Button
          onClick={handleCreateInvite}
          className="w-full h-12 rounded-2xl bg-emerald-500 hover:bg-emerald-600 font-semibold"
          disabled={inviteLoading}
        >
          <UserPlus className="w-4 h-4 mr-2" />
          {inviteLoading ? "Membuat undangan..." : "Undang Anggota Baru"}
        </Button>

        {/* Invitations */}
        {invitations.length > 0 && (
          <div>
            <p className="text-sm font-bold text-gray-700 mb-2">
              Riwayat Undangan
            </p>
            <div className="bg-white rounded-3xl shadow-sm overflow-hidden divide-y divide-gray-50">
              {invitations.map((inv) => {
                const status = inv.used_at
                  ? "Terpakai"
                  : new Date(inv.expires_at) < new Date()
                    ? "Kadaluarsa"
                    : "Aktif";
                return (
                  <div
                    key={inv.id}
                    className="flex items-center gap-3 px-4 py-3"
                  >
                    <code className="font-mono text-sm text-emerald-600 font-bold tracking-wider flex-1">
                      {inv.code}
                    </code>
                    <span
                      className={cn(
                        "text-[10px] font-semibold px-2 py-0.5 rounded-full",
                        status === "Aktif"
                          ? "bg-emerald-100 text-emerald-700"
                          : status === "Terpakai"
                            ? "bg-indigo-100 text-indigo-600"
                            : "bg-gray-100 text-gray-400",
                      )}
                    >
                      {status}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Invite Code Sheet */}
      <Sheet open={inviteSheetOpen} onOpenChange={setInviteSheetOpen}>
        <SheetContent side="bottom" className="rounded-t-3xl">
          <SheetHeader>
            <SheetTitle>Kode Undangan</SheetTitle>
          </SheetHeader>
          <div className="py-6 text-center space-y-4">
            <div className="bg-gray-50 rounded-2xl p-6">
              <p className="text-3xl font-mono font-bold tracking-[0.3em] text-emerald-600">
                {inviteCode}
              </p>
            </div>
            <p className="text-xs text-gray-400">Berlaku 7 hari</p>
            <div className="flex gap-3">
              <Button
                onClick={copyInviteCode}
                variant="outline"
                className="flex-1"
              >
                <Copy className="w-4 h-4 mr-2" /> Salin Kode
              </Button>
              <Button
                onClick={shareInvite}
                className="flex-1 bg-emerald-500 hover:bg-emerald-600"
              >
                <Share2 className="w-4 h-4 mr-2" /> Bagikan
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Nickname Picker Sheet */}
      <Sheet
        open={!!nicknameSheet}
        onOpenChange={(o) => {
          if (!o) {
            setNicknameSheet(null);
            setShowCustom(false);
            setCustomNickname("");
          }
        }}
      >
        <SheetContent side="bottom" className="rounded-t-3xl">
          <SheetHeader>
            <SheetTitle>
              Peran{" "}
              {(nicknameSheet?.user as unknown as Profile | undefined)
                ?.full_name || "Anggota"}{" "}
              dalam Keluarga
            </SheetTitle>
          </SheetHeader>
          <div className="py-4 space-y-4">
            {!showCustom ? (
              <>
                <div className="grid grid-cols-3 gap-2">
                  {PRESET_NICKNAMES.map((p) => {
                    const isActive = nicknameSheet?.nickname === p;
                    return (
                      <button
                        key={p}
                        onClick={() => handlePresetSelect(p)}
                        disabled={savingNickname}
                        className={cn(
                          "py-3 rounded-2xl text-sm font-semibold transition-all",
                          isActive
                            ? "bg-indigo-600 text-white"
                            : p === "Lainnya..."
                              ? "bg-gray-50 text-gray-500 border-2 border-dashed border-gray-300"
                              : "bg-gray-100 text-gray-700 active:bg-gray-200",
                        )}
                      >
                        {p}
                      </button>
                    );
                  })}
                </div>
                {nicknameSheet?.nickname && (
                  <button
                    onClick={() => saveNickname(null)}
                    disabled={savingNickname}
                    className="w-full py-2 text-xs text-red-400 font-semibold"
                  >
                    Hapus peran
                  </button>
                )}
              </>
            ) : (
              <div className="space-y-3">
                <button
                  onClick={() => setShowCustom(false)}
                  className="text-xs text-indigo-500 font-semibold"
                >
                  Pilih dari daftar
                </button>
                <Input
                  value={customNickname}
                  onChange={(e) => setCustomNickname(e.target.value)}
                  placeholder="Contoh: Mertua, Paman, dll."
                  autoFocus
                  maxLength={30}
                />
                <Button
                  onClick={async () => {
                    const v = customNickname.trim();
                    if (v) await saveNickname(v);
                  }}
                  disabled={!customNickname.trim() || savingNickname}
                  className="w-full bg-indigo-600 hover:bg-indigo-700"
                >
                  {savingNickname ? "Menyimpan..." : "Simpan"}
                </Button>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Delete Member Dialog */}
      <Dialog open={!!deleteDialog} onOpenChange={() => setDeleteDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hapus Anggota?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-500">
            Anggota ini akan dikeluarkan dari keluarga dan tidak bisa mengakses
            data keluarga lagi.
          </p>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeleteDialog(null)}>
              Batal
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteDialog && handleRemoveMember(deleteDialog)}
            >
              Hapus
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
