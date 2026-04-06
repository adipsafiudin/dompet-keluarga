"use client";

import { useRouter } from "next/navigation";
import {
  useTheme,
  THEME_COLORS,
  type ColorScheme,
} from "@/components/providers/ThemeProvider";
import { ChevronLeft, Sun, Moon, Monitor, Check } from "lucide-react";

const schemeOptions: {
  value: ColorScheme;
  label: string;
  desc: string;
  icon: React.ComponentType<{
    className?: string;
    style?: React.CSSProperties;
  }>;
}[] = [
  { value: "light", label: "Terang", desc: "Selalu tampilan cerah", icon: Sun },
  {
    value: "system",
    label: "Ikuti Sistem",
    desc: "Sesuai pengaturan HP",
    icon: Monitor,
  },
  { value: "dark", label: "Gelap", desc: "Selalu tampilan gelap", icon: Moon },
];

export default function AppearancePage() {
  const router = useRouter();
  const { colorScheme, setColorScheme, primaryColor, setPrimaryColor } =
    useTheme();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-12 pb-4 bg-white border-b border-gray-100">
        <button
          onClick={() => router.back()}
          className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-gray-100 transition-colors"
        >
          <ChevronLeft className="w-5 h-5 text-gray-600" />
        </button>
        <h1 className="text-base font-semibold text-gray-900">Tampilan</h1>
      </div>

      <div className="px-4 py-5 space-y-6">
        {/* Mode Warna */}
        <section>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 px-1">
            Mode Warna
          </p>
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden divide-y divide-gray-100">
            {schemeOptions.map((opt) => {
              const Icon = opt.icon;
              const active = colorScheme === opt.value;
              return (
                <button
                  key={opt.value}
                  onClick={() => setColorScheme(opt.value)}
                  className="flex items-center gap-3 w-full px-4 py-3.5 hover:bg-gray-50 transition-colors"
                >
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                    style={{
                      backgroundColor: active
                        ? `color-mix(in srgb, var(--primary) 12%, transparent)`
                        : "#f4f4f5",
                    }}
                  >
                    <Icon
                      className="w-4.5 h-4.5"
                      style={{ color: active ? "var(--primary)" : "#71717a" }}
                    />
                  </div>
                  <div className="flex-1 text-left">
                    <p
                      className="text-sm font-medium text-gray-800"
                      style={{ color: active ? "var(--primary)" : undefined }}
                    >
                      {opt.label}
                    </p>
                    <p className="text-xs text-gray-500">{opt.desc}</p>
                  </div>
                  {active && (
                    <div
                      className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
                      style={{ backgroundColor: "var(--primary)" }}
                    >
                      <Check className="w-3 h-3 text-white" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </section>

        {/* Warna Tema */}
        <section>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 px-1">
            Warna Tema
          </p>
          <div className="bg-white rounded-2xl border border-gray-100 p-4">
            <div className="grid grid-cols-6 gap-3">
              {THEME_COLORS.map((c) => {
                const active = primaryColor === c.value;
                return (
                  <button
                    key={c.value}
                    onClick={() => setPrimaryColor(c.value)}
                    title={c.name}
                    className="aspect-square rounded-full flex items-center justify-center transition-all"
                    style={{
                      backgroundColor: c.value,
                      outline: active ? `3px solid ${c.value}` : undefined,
                      outlineOffset: active ? "3px" : undefined,
                      transform: active ? "scale(1.1)" : undefined,
                    }}
                  >
                    {active && (
                      <Check className="w-4 h-4 text-white drop-shadow" />
                    )}
                  </button>
                );
              })}
            </div>
            <div className="mt-3 pt-3 border-t border-gray-100">
              <p className="text-xs text-gray-500 text-center">
                Warna aktif:{" "}
                <span className="font-semibold" style={{ color: primaryColor }}>
                  {THEME_COLORS.find((c) => c.value === primaryColor)?.name ??
                    "Custom"}
                </span>
              </p>
            </div>
          </div>
        </section>

        {/* Preview box */}
        <section>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 px-1">
            Pratinjau
          </p>
          <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-3">
            <div
              className="h-10 rounded-xl flex items-center justify-center text-white text-sm font-semibold"
              style={{ backgroundColor: "var(--primary)" }}
            >
              Warna Utama
            </div>
            <div className="flex gap-2">
              <div className="flex-1 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
                <span className="text-xs text-gray-500">Latar</span>
              </div>
              <div
                className="flex-1 h-8 rounded-lg flex items-center justify-center text-white text-xs font-medium"
                style={{
                  backgroundColor: `color-mix(in srgb, var(--primary) 20%, transparent)`,
                }}
              >
                <span style={{ color: "var(--primary)" }}>Aksen</span>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
