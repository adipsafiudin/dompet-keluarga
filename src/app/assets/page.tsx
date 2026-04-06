"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { subscribeFamilyRefresh, notifyFamilyRefresh } from "@/lib/realtime";
import { formatRupiah, formatDate, PRESET_COLORS, cn } from "@/lib/utils";
import { useHiddenBalance } from "@/contexts/HiddenBalanceContext";
import AppShell from "@/components/layout/AppShell";
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
import CurrencyInput from "@/components/ui/CurrencyInput";
import {
  Plus,
  TrendingUp,
  TrendingDown,
  Minus,
  Pencil,
  Trash2,
  ChevronDown,
} from "lucide-react";
import toast from "react-hot-toast";
import type { Asset, AssetType } from "@/types";

// ——————————————————————————————————————————
// Konfigurasi jenis aset
// ——————————————————————————————————————————
const ASSET_TYPE_CONFIG: Record<
  AssetType,
  { label: string; emoji: string; color: string; unit?: string; hint?: string }
> = {
  saham: {
    label: "Saham",
    emoji: "📈",
    color: "#3B82F6",
    unit: "lembar",
    hint: "Contoh: BBCA, TLKM",
  },
  reksadana: {
    label: "Reksa Dana",
    emoji: "📊",
    color: "#8B5CF6",
    unit: "unit",
    hint: "Contoh: Bibit, Bareksa",
  },
  emas: {
    label: "Emas",
    emoji: "🥇",
    color: "#F59E0B",
    unit: "gram",
    hint: "Contoh: Antam, Pegadaian",
  },
  deposito: {
    label: "Deposito",
    emoji: "🏦",
    color: "#10B981",
    hint: "Masukkan tanggal jatuh tempo",
  },
  obligasi: {
    label: "Obligasi",
    emoji: "📜",
    color: "#06B6D4",
    hint: "SBR, ORI, Sukuk, dll.",
  },
  kripto: {
    label: "Kripto",
    emoji: "💎",
    color: "#F97316",
    unit: "koin",
    hint: "Contoh: BTC, ETH",
  },
  properti: {
    label: "Properti",
    emoji: "🏠",
    color: "#EC4899",
    hint: "Tanah, rumah, apartemen",
  },
  lainnya: {
    label: "Lainnya",
    emoji: "💰",
    color: "#6B7280",
  },
};

const ASSET_TYPES = Object.entries(ASSET_TYPE_CONFIG) as [
  AssetType,
  (typeof ASSET_TYPE_CONFIG)[AssetType],
][];

// ——————————————————————————————————————————
// Helpers
// ——————————————————————————————————————————
function gainAmount(a: Asset) {
  return a.current_value - a.buy_price;
}
function gainPct(a: Asset) {
  if (a.buy_price === 0) return 0;
  return ((a.current_value - a.buy_price) / a.buy_price) * 100;
}

// ——————————————————————————————————————————
// Main page
// ——————————————————————————————————————————
export default function AssetsPage() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [familyId, setFamilyId] = useState("");
  const [userId, setUserId] = useState("");
  const [loading, setLoading] = useState(true);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<Asset | null>(null);
  const [saving, setSaving] = useState(false);
  const { fmt } = useHiddenBalance();

  // Form state
  const [name, setName] = useState("");
  const [assetType, setAssetType] = useState<AssetType>("saham");
  const [buyPrice, setBuyPrice] = useState(0);
  const [currentValue, setCurrentValue] = useState(0);
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState("");
  const [ticker, setTicker] = useState("");
  const [institution, setInstitution] = useState("");
  const [buyDate, setBuyDate] = useState("");
  const [maturityDate, setMaturityDate] = useState("");
  const [notes, setNotes] = useState("");

  const fetchAssets = useCallback(async (fid: string) => {
    const supabase = createClient();
    const { data } = await supabase
      .from("assets")
      .select("*")
      .eq("family_id", fid)
      .eq("is_active", true)
      .order("sort_order")
      .order("created_at");
    if (data) setAssets(data as Asset[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    async function init() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);
      const { data: member } = await supabase
        .from("family_members")
        .select("family_id")
        .eq("user_id", user.id)
        .single();
      if (!member) return;
      setFamilyId(member.family_id);
      await fetchAssets(member.family_id);
    }
    init();
  }, [fetchAssets]);

  // Realtime broadcast
  useEffect(() => {
    if (!familyId) return;
    return subscribeFamilyRefresh(familyId, () => fetchAssets(familyId));
  }, [familyId, fetchAssets]);

  function openAdd() {
    setEditing(null);
    setName("");
    setAssetType("saham");
    setBuyPrice(0);
    setCurrentValue(0);
    setQuantity("");
    setUnit(ASSET_TYPE_CONFIG["saham"].unit || "");
    setTicker("");
    setInstitution("");
    setBuyDate(new Date().toISOString().split("T")[0]);
    setMaturityDate("");
    setNotes("");
    setSheetOpen(true);
  }

  function openEdit(asset: Asset) {
    setEditing(asset);
    setName(asset.name);
    setAssetType(asset.asset_type);
    setBuyPrice(asset.buy_price);
    setCurrentValue(asset.current_value);
    setQuantity(asset.quantity?.toString() || "");
    setUnit(asset.unit || ASSET_TYPE_CONFIG[asset.asset_type].unit || "");
    setTicker(asset.ticker_symbol || "");
    setInstitution(asset.institution || "");
    setBuyDate(asset.buy_date || "");
    setMaturityDate(asset.maturity_date || "");
    setNotes(asset.notes || "");
    setSheetOpen(true);
  }

  async function handleSave() {
    if (!name.trim()) return toast.error("Masukkan nama aset");
    if (buyPrice <= 0 && currentValue <= 0)
      return toast.error("Masukkan modal atau nilai aset");
    setSaving(true);
    try {
      const supabase = createClient();
      const payload = {
        name: name.trim(),
        asset_type: assetType,
        buy_price: buyPrice,
        current_value: currentValue || buyPrice,
        quantity: quantity ? parseFloat(quantity) : null,
        unit: unit || null,
        ticker_symbol: ticker.trim().toUpperCase() || null,
        institution: institution.trim() || null,
        buy_date: buyDate || null,
        maturity_date: maturityDate || null,
        notes: notes.trim() || null,
        is_active: true,
      };

      if (editing) {
        const { error } = await supabase
          .from("assets")
          .update({ ...payload, updated_at: new Date().toISOString() })
          .eq("id", editing.id);
        if (error) throw error;
        toast.success("Aset berhasil diperbarui ✓");
      } else {
        const { error } = await supabase.from("assets").insert({
          ...payload,
          family_id: familyId,
          created_by: userId,
          sort_order: assets.length,
        });
        if (error) throw error;
        toast.success("Aset berhasil ditambahkan ✓");
      }

      notifyFamilyRefresh(familyId);
      setSheetOpen(false);
      await fetchAssets(familyId);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Gagal menyimpan");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(asset: Asset) {
    if (!confirm(`Hapus aset "${asset.name}"?`)) return;
    const supabase = createClient();
    const { error } = await supabase
      .from("assets")
      .update({ is_active: false })
      .eq("id", asset.id);
    if (error) {
      toast.error("Gagal menghapus");
      return;
    }
    toast.success("Aset dihapus");
    notifyFamilyRefresh(familyId);
    await fetchAssets(familyId);
  }

  // ——————————————————————————————————————————
  // Ringkasan
  // ——————————————————————————————————————————
  const totalBuy = assets.reduce((s, a) => s + a.buy_price, 0);
  const totalNow = assets.reduce((s, a) => s + a.current_value, 0);
  const totalGain = totalNow - totalBuy;
  const totalGainPct = totalBuy > 0 ? (totalGain / totalBuy) * 100 : 0;

  // Group by type
  const grouped = ASSET_TYPES.reduce<Record<AssetType, Asset[]>>(
    (acc, [t]) => {
      acc[t] = assets.filter((a) => a.asset_type === t);
      return acc;
    },
    {} as Record<AssetType, Asset[]>,
  );

  const cfg = ASSET_TYPE_CONFIG[assetType];

  // ——————————————————————————————————————————
  // Render
  // ——————————————————————————————————————————
  return (
    <AppShell>
      <PageHeader title="Portofolio Aset" />

      {/* Summary card */}
      <div className="mx-4 mt-2 mb-4 rounded-2xl bg-linear-to-br from-blue-600 to-indigo-600 p-4 text-white">
        <p className="text-blue-100 text-xs mb-1">Total Nilai Aset</p>
        <p className="text-2xl font-bold mb-3">{fmt(totalNow)}</p>
        <div className="flex gap-4 text-sm">
          <div>
            <p className="text-blue-200 text-xs">Modal</p>
            <p className="font-medium">{fmt(totalBuy, true)}</p>
          </div>
          <div>
            <p className="text-blue-200 text-xs">Keuntungan / Rugi</p>
            <p
              className={cn(
                "font-medium flex items-center gap-1",
                totalGain >= 0 ? "text-emerald-300" : "text-red-300",
              )}
            >
              {totalGain >= 0 ? (
                <TrendingUp className="w-3.5 h-3.5" />
              ) : (
                <TrendingDown className="w-3.5 h-3.5" />
              )}
              {fmt(Math.abs(totalGain), true)} (
              {totalGainPct.toFixed(1)}%)
            </p>
          </div>
        </div>
      </div>

      {/* List per tipe */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-blue-100 border-t-blue-500 rounded-full animate-spin" />
        </div>
      ) : assets.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 px-8 text-center">
          <span className="text-5xl mb-3">📊</span>
          <p className="font-semibold text-gray-700 mb-1">
            Belum ada aset tercatat
          </p>
          <p className="text-sm text-gray-400 mb-4">
            Catat saham, emas, deposito, dan investasi lainnya
          </p>
          <Button size="sm" onClick={openAdd}>
            + Tambah Aset
          </Button>
        </div>
      ) : (
        <div className="pb-4">
          {ASSET_TYPES.map(([type, config]) => {
            const items = grouped[type];
            if (items.length === 0) return null;
            const typeTotal = items.reduce((s, a) => s + a.current_value, 0);
            return (
              <div key={type} className="mb-4">
                <div className="flex items-center justify-between px-4 py-2">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{config.emoji}</span>
                    <span className="text-sm font-semibold text-gray-700">
                      {config.label}
                    </span>
                    <span className="text-xs text-gray-400">
                      ({items.length})
                    </span>
                  </div>
                  <span className="text-sm font-medium text-gray-600">
                    {fmt(typeTotal, true)}
                  </span>
                </div>
                <div className="divide-y divide-gray-50">
                  {items.map((asset) => {
                    const gain = gainAmount(asset);
                    const pct = gainPct(asset);
                    return (
                      <div
                        key={asset.id}
                        className="flex items-center gap-3 px-4 py-3 bg-white"
                      >
                        {/* Ikon tipe */}
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0"
                          style={{ backgroundColor: `${config.color}15` }}
                        >
                          {config.emoji}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <p className="font-medium text-gray-800 text-sm truncate">
                              {asset.name}
                            </p>
                            {asset.ticker_symbol && (
                              <span
                                className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                                style={{
                                  backgroundColor: `${config.color}15`,
                                  color: config.color,
                                }}
                              >
                                {asset.ticker_symbol}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            {asset.quantity && asset.unit && (
                              <span className="text-xs text-gray-400">
                                {asset.quantity} {asset.unit}
                              </span>
                            )}
                            {asset.institution && (
                              <span className="text-xs text-gray-400">
                                · {asset.institution}
                              </span>
                            )}
                            {asset.maturity_date && (
                              <span className="text-xs text-gray-400">
                                · Jatuh tempo {formatDate(asset.maturity_date)}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-sm font-semibold text-gray-800">
                              {fmt(asset.current_value, true)}
                            </span>
                            {gain !== 0 && (
                              <span
                                className={cn(
                                  "text-xs flex items-center gap-0.5",
                                  gain > 0
                                    ? "text-emerald-600"
                                    : "text-red-500",
                                )}
                              >
                                {gain > 0 ? (
                                  <TrendingUp className="w-3 h-3" />
                                ) : (
                                  <TrendingDown className="w-3 h-3" />
                                )}
                                {pct.toFixed(1)}%
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-400">
                            Modal {fmt(asset.buy_price, true)}
                          </p>
                        </div>

                        {/* Aksi */}
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => openEdit(asset)}
                            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-blue-500 hover:bg-blue-50 transition-colors"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(asset)}
                            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* FAB tambah */}
      {assets.length > 0 && (
        <button
          onClick={openAdd}
          className="fixed bottom-[calc(4rem+env(safe-area-inset-bottom)+1rem)] right-4 w-12 h-12 bg-blue-600 text-white rounded-full shadow-lg flex items-center justify-center z-40"
        >
          <Plus className="w-6 h-6" />
        </button>
      )}

      {/* Sheet tambah/edit */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent
          side="bottom"
          className="max-h-[92vh] overflow-y-auto rounded-t-2xl"
        >
          <SheetHeader className="mb-4">
            <SheetTitle>{editing ? "Edit Aset" : "Tambah Aset"}</SheetTitle>
          </SheetHeader>

          <div className="space-y-4 pb-6">
            {/* Jenis aset */}
            <div>
              <Label className="text-xs text-gray-500 mb-1.5 block">
                Jenis Aset
              </Label>
              <div className="grid grid-cols-4 gap-2">
                {ASSET_TYPES.map(([t, c]) => (
                  <button
                    key={t}
                    onClick={() => {
                      setAssetType(t);
                      if (c.unit) setUnit(c.unit);
                    }}
                    className={cn(
                      "flex flex-col items-center gap-1 py-2 rounded-xl border text-xs font-medium transition-all",
                      assetType === t
                        ? "border-2 bg-blue-50 text-blue-700"
                        : "border-gray-100 text-gray-500",
                    )}
                    style={
                      assetType === t
                        ? { borderColor: c.color, color: c.color }
                        : {}
                    }
                  >
                    <span className="text-xl">{c.emoji}</span>
                    {c.label}
                  </button>
                ))}
              </div>
              {cfg.hint && (
                <p className="text-xs text-gray-400 mt-1.5">{cfg.hint}</p>
              )}
            </div>

            {/* Nama */}
            <div>
              <Label className="text-xs text-gray-500 mb-1.5 block">
                Nama Aset *
              </Label>
              <Input
                placeholder={
                  assetType === "saham"
                    ? "Misal: Saham Bank BCA"
                    : assetType === "emas"
                      ? "Misal: Emas Antam 24K"
                      : assetType === "deposito"
                        ? "Misal: Deposito BCA"
                        : "Nama aset..."
                }
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            {/* Ticker / kode (saham, kripto, reksadana) */}
            {["saham", "kripto", "reksadana", "obligasi"].includes(
              assetType,
            ) && (
              <div>
                <Label className="text-xs text-gray-500 mb-1.5 block">
                  {assetType === "saham"
                    ? "Kode Saham"
                    : assetType === "kripto"
                      ? "Symbol Kripto"
                      : assetType === "obligasi"
                        ? "Kode Obligasi"
                        : "Kode Produk"}
                </Label>
                <Input
                  placeholder={
                    assetType === "saham"
                      ? "BBCA, TLKM, GOTO..."
                      : assetType === "kripto"
                        ? "BTC, ETH, BNB..."
                        : "SBR012, ORI022..."
                  }
                  value={ticker}
                  onChange={(e) => setTicker(e.target.value.toUpperCase())}
                  className="uppercase"
                />
              </div>
            )}

            {/* Jumlah & satuan (opsional) */}
            {cfg.unit && (
              <div className="flex gap-2">
                <div className="flex-1">
                  <Label className="text-xs text-gray-500 mb-1.5 block">
                    Jumlah ({cfg.unit})
                  </Label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                  />
                </div>
                <div className="w-24">
                  <Label className="text-xs text-gray-500 mb-1.5 block">
                    Satuan
                  </Label>
                  <Input
                    placeholder={cfg.unit}
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                  />
                </div>
              </div>
            )}

            {/* Modal / harga beli */}
            <div>
              <Label className="text-xs text-gray-500 mb-1.5 block">
                Modal / Harga Beli *
              </Label>
              <CurrencyInput value={buyPrice} onChange={setBuyPrice} />
            </div>

            {/* Nilai saat ini */}
            <div>
              <Label className="text-xs text-gray-500 mb-1.5 block">
                Nilai Sekarang
              </Label>
              <CurrencyInput value={currentValue} onChange={setCurrentValue} />
              {currentValue > 0 && buyPrice > 0 && (
                <p
                  className={cn(
                    "text-xs mt-1",
                    currentValue >= buyPrice
                      ? "text-emerald-600"
                      : "text-red-500",
                  )}
                >
                  {currentValue >= buyPrice ? "▲" : "▼"} Untung/rugi:{" "}
                  {fmt(currentValue - buyPrice, true)} (
                  {(((currentValue - buyPrice) / buyPrice) * 100).toFixed(1)}%)
                </p>
              )}
            </div>

            {/* Institusi / platform */}
            <div>
              <Label className="text-xs text-gray-500 mb-1.5 block">
                {assetType === "deposito" || assetType === "obligasi"
                  ? "Bank / Penerbit"
                  : assetType === "saham" ||
                      assetType === "reksadana" ||
                      assetType === "kripto"
                    ? "Broker / Platform"
                    : "Institusi / Platform"}
              </Label>
              <Input
                placeholder={
                  assetType === "deposito"
                    ? "BCA, Mandiri..."
                    : assetType === "saham"
                      ? "Stockbit, IPOT, Mirae..."
                      : assetType === "emas"
                        ? "Pegadaian, Antam, Tokopedia..."
                        : assetType === "reksadana"
                          ? "Bibit, Bareksa..."
                          : assetType === "kripto"
                            ? "Indodax, Pintu, Tokocrypto..."
                            : ""
                }
                value={institution}
                onChange={(e) => setInstitution(e.target.value)}
              />
            </div>

            {/* Tanggal beli */}
            <div className="flex gap-2">
              <div className="flex-1">
                <Label className="text-xs text-gray-500 mb-1.5 block">
                  Tanggal Beli
                </Label>
                <Input
                  type="date"
                  value={buyDate}
                  onChange={(e) => setBuyDate(e.target.value)}
                />
              </div>
              {/* Jatuh tempo (deposito/obligasi) */}
              {["deposito", "obligasi"].includes(assetType) && (
                <div className="flex-1">
                  <Label className="text-xs text-gray-500 mb-1.5 block">
                    Jatuh Tempo
                  </Label>
                  <Input
                    type="date"
                    value={maturityDate}
                    onChange={(e) => setMaturityDate(e.target.value)}
                  />
                </div>
              )}
            </div>

            {/* Catatan */}
            <div>
              <Label className="text-xs text-gray-500 mb-1.5 block">
                Catatan
              </Label>
              <Input
                placeholder="Catatan opsional..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            <Button className="w-full" onClick={handleSave} disabled={saving}>
              {saving
                ? "Menyimpan..."
                : editing
                  ? "Simpan Perubahan"
                  : "Tambah Aset"}
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </AppShell>
  );
}
