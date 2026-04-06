"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { cn, PRESET_COLORS } from "@/lib/utils";
import PageHeader from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Plus, Pencil, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import type { IncomeSource } from "@/types";

export default function IncomeSourcesPage() {
  const [sources, setSources] = useState<IncomeSource[]>([]);
  const [familyId, setFamilyId] = useState("");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<IncomeSource | null>(null);
  const [loading, setLoading] = useState(false);

  const [name, setName] = useState("");
  const [color, setColor] = useState(PRESET_COLORS[0]);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const { data: member } = await supabase
        .from("family_members")
        .select("family_id")
        .eq("user_id", user.id)
        .single();
      if (!member) return;
      setFamilyId(member.family_id);
      await fetchSources(member.family_id);
    }
    load();
  }, []);

  async function fetchSources(fid: string) {
    const supabase = createClient();
    const { data } = await supabase
      .from("income_sources")
      .select("*")
      .eq("family_id", fid)
      .eq("is_active", true)
      .order("sort_order");
    if (data) setSources(data);
  }

  function openAdd() {
    setEditing(null);
    setName("");
    setColor(PRESET_COLORS[0]);
    setSheetOpen(true);
  }

  function openEdit(src: IncomeSource) {
    setEditing(src);
    setName(src.name);
    setColor(src.color);
    setSheetOpen(true);
  }

  async function handleSave() {
    if (!name.trim()) return toast.error("Masukkan nama sumber");
    setLoading(true);
    try {
      const supabase = createClient();
      if (editing) {
        const { error } = await supabase
          .from("income_sources")
          .update({ name: name.trim(), color })
          .eq("id", editing.id);
        if (error) throw error;
        toast.success("Sumber diperbarui");
      } else {
        const { error } = await supabase.from("income_sources").insert({
          family_id: familyId,
          name: name.trim(),
          color,
          is_active: true,
          is_default: false,
        });
        if (error) throw error;
        toast.success("Sumber ditambahkan");
      }
      setSheetOpen(false);
      await fetchSources(familyId);
    } catch {
      toast.error("Gagal menyimpan");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(src: IncomeSource) {
    if (src.is_default) return toast.error("Sumber bawaan tidak bisa dihapus");
    const supabase = createClient();
    const { error } = await supabase
      .from("income_sources")
      .update({ is_active: false })
      .eq("id", src.id);
    if (error) return toast.error("Gagal menghapus");
    toast.success("Sumber dihapus");
    await fetchSources(familyId);
  }

  return (
    <div className="min-h-screen">
      <PageHeader title="Sumber Pendapatan" />
      <div className="px-4 py-4 space-y-2">
        {sources.map((src) => (
          <div
            key={src.id}
            className="flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-100"
          >
            <div
              className="w-3 h-3 rounded-full shrink-0"
              style={{ backgroundColor: src.color }}
            />
            <span className="text-sm font-medium flex-1">{src.name}</span>
            <button
              onClick={() => openEdit(src)}
              className="p-1.5 rounded-lg hover:bg-gray-100"
            >
              <Pencil className="w-3.5 h-3.5 text-gray-400" />
            </button>
            {!src.is_default && (
              <button
                onClick={() => handleDelete(src)}
                className="p-1.5 rounded-lg hover:bg-red-50"
              >
                <Trash2 className="w-3.5 h-3.5 text-red-400" />
              </button>
            )}
          </div>
        ))}
        <Button
          onClick={openAdd}
          variant="outline"
          className="w-full h-10 border-dashed"
        >
          <Plus className="w-4 h-4 mr-2" /> Tambah Sumber
        </Button>
      </div>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="bottom" className="rounded-t-3xl">
          <SheetHeader>
            <SheetTitle>{editing ? "Edit Sumber" : "Tambah Sumber"}</SheetTitle>
          </SheetHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nama</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nama sumber"
              />
            </div>
            <div className="space-y-2">
              <Label>Warna</Label>
              <div className="flex flex-wrap gap-2">
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c}
                    onClick={() => setColor(c)}
                    className={cn(
                      "w-8 h-8 rounded-full transition-all",
                      color === c
                        ? "ring-2 ring-offset-2 ring-gray-400 scale-110"
                        : "",
                    )}
                    style={{ backgroundColor: c }}
                  />
                ))}
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
        </SheetContent>
      </Sheet>
    </div>
  );
}
