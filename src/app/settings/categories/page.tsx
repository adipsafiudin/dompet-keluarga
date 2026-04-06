"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { cn, PRESET_COLORS, formatRupiah } from "@/lib/utils";
import PageHeader from "@/components/layout/PageHeader";
import CurrencyInput from "@/components/ui/CurrencyInput";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Plus, Pencil, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import type { Category } from "@/types";

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [familyId, setFamilyId] = useState("");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"expense" | "income">("expense");

  // Form
  const [name, setName] = useState("");
  const [color, setColor] = useState(PRESET_COLORS[0]);
  const [budgetLimit, setBudgetLimit] = useState(0);

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
      await fetchCategories(member.family_id);
    }
    load();
  }, []);

  async function fetchCategories(fid: string) {
    const supabase = createClient();
    const { data } = await supabase
      .from("categories")
      .select("*")
      .eq("family_id", fid)
      .eq("is_active", true)
      .order("sort_order");
    if (data) setCategories(data);
  }

  function openAdd() {
    setEditing(null);
    setName("");
    setColor(PRESET_COLORS[0]);
    setBudgetLimit(0);
    setSheetOpen(true);
  }

  function openEdit(cat: Category) {
    setEditing(cat);
    setName(cat.name);
    setColor(cat.color);
    setBudgetLimit(cat.budget_limit || 0);
    setSheetOpen(true);
  }

  async function handleSave() {
    if (!name.trim()) return toast.error("Masukkan nama kategori");
    setLoading(true);
    try {
      const supabase = createClient();
      if (editing) {
        const { error } = await supabase
          .from("categories")
          .update({
            name: name.trim(),
            color,
            budget_limit:
              activeTab === "expense" && budgetLimit > 0 ? budgetLimit : null,
          })
          .eq("id", editing.id);
        if (error) throw error;
        toast.success("Kategori diperbarui");
      } else {
        const { error } = await supabase.from("categories").insert({
          family_id: familyId,
          name: name.trim(),
          type: activeTab,
          color,
          budget_limit:
            activeTab === "expense" && budgetLimit > 0 ? budgetLimit : null,
          is_active: true,
          is_default: false,
        });
        if (error) throw error;
        toast.success("Kategori ditambahkan");
      }
      setSheetOpen(false);
      await fetchCategories(familyId);
    } catch {
      toast.error("Gagal menyimpan");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(cat: Category) {
    if (cat.is_default)
      return toast.error("Kategori bawaan tidak bisa dihapus");
    const supabase = createClient();
    const { error } = await supabase
      .from("categories")
      .update({ is_active: false })
      .eq("id", cat.id);
    if (error) return toast.error("Gagal menghapus");
    toast.success("Kategori dihapus");
    await fetchCategories(familyId);
  }

  const expenseCategories = categories.filter((c) => c.type === "expense");
  const incomeCategories = categories.filter((c) => c.type === "income");

  return (
    <div className="min-h-screen">
      <PageHeader title="Kategori" />

      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as "expense" | "income")}
        className="px-4 pt-4"
      >
        <TabsList className="w-full">
          <TabsTrigger value="expense" className="flex-1">
            Pengeluaran
          </TabsTrigger>
          <TabsTrigger value="income" className="flex-1">
            Pemasukan
          </TabsTrigger>
        </TabsList>

        <TabsContent value="expense" className="space-y-2 mt-4">
          {expenseCategories.map((cat) => (
            <CategoryItem
              key={cat.id}
              category={cat}
              onEdit={() => openEdit(cat)}
              onDelete={() => handleDelete(cat)}
            />
          ))}
          <Button
            onClick={openAdd}
            variant="outline"
            className="w-full h-10 border-dashed"
          >
            <Plus className="w-4 h-4 mr-2" /> Tambah Kategori
          </Button>
        </TabsContent>

        <TabsContent value="income" className="space-y-2 mt-4">
          {incomeCategories.map((cat) => (
            <CategoryItem
              key={cat.id}
              category={cat}
              onEdit={() => openEdit(cat)}
              onDelete={() => handleDelete(cat)}
            />
          ))}
          <Button
            onClick={openAdd}
            variant="outline"
            className="w-full h-10 border-dashed"
          >
            <Plus className="w-4 h-4 mr-2" /> Tambah Kategori
          </Button>
        </TabsContent>
      </Tabs>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="bottom" className="rounded-t-3xl">
          <SheetHeader>
            <SheetTitle>
              {editing ? "Edit Kategori" : "Tambah Kategori"}
            </SheetTitle>
          </SheetHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nama</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nama kategori"
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

            {activeTab === "expense" && (
              <div className="space-y-2">
                <Label>Anggaran Bulanan (opsional)</Label>
                <div className="border rounded-md px-3 py-2">
                  <CurrencyInput
                    value={budgetLimit}
                    onChange={setBudgetLimit}
                    placeholder="0"
                  />
                </div>
                <p className="text-xs text-gray-400">
                  Jika diisi, akan muncul peringatan saat mendekati batas
                </p>
              </div>
            )}

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

function CategoryItem({
  category,
  onEdit,
  onDelete,
}: {
  category: Category;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-100">
      <div
        className="w-3 h-3 rounded-full shrink-0"
        style={{ backgroundColor: category.color }}
      />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">{category.name}</p>
        {category.budget_limit && (
          <p className="text-xs text-gray-400">
            Anggaran: {formatRupiah(category.budget_limit)}
          </p>
        )}
      </div>
      <button onClick={onEdit} className="p-1.5 rounded-lg hover:bg-gray-100">
        <Pencil className="w-3.5 h-3.5 text-gray-400" />
      </button>
      {!category.is_default && (
        <button onClick={onDelete} className="p-1.5 rounded-lg hover:bg-red-50">
          <Trash2 className="w-3.5 h-3.5 text-red-400" />
        </button>
      )}
    </div>
  );
}
