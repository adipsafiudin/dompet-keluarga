"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";

export const THEME_COLORS = [
  { name: "Hijau", value: "#10b981" },
  { name: "Biru", value: "#3b82f6" },
  { name: "Ungu", value: "#8b5cf6" },
  { name: "Merah", value: "#f43f5e" },
  { name: "Orange", value: "#f97316" },
  { name: "Teal", value: "#14b8a6" },
];

export type ColorScheme = "light" | "dark" | "system";

interface ThemeContextType {
  colorScheme: ColorScheme;
  setColorScheme: (s: ColorScheme) => void;
  primaryColor: string;
  setPrimaryColor: (c: string) => void;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType>({
  colorScheme: "system",
  setColorScheme: () => {},
  primaryColor: THEME_COLORS[0].value,
  setPrimaryColor: () => {},
  isDark: false,
});

function applyColor(color: string) {
  const root = document.documentElement;
  root.style.setProperty("--primary", color);
  root.style.setProperty("--ring", color);
  root.style.setProperty("--sidebar-primary", color);
  root.style.setProperty("--sidebar-ring", color);
  root.style.setProperty("--chart-1", color);
}

function resolveDark(scheme: ColorScheme): boolean {
  if (scheme === "dark") return true;
  if (scheme === "light") return false;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [colorScheme, setColorSchemeState] = useState<ColorScheme>("system");
  const [primaryColor, setPrimaryColorState] = useState(THEME_COLORS[0].value);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const scheme =
      (localStorage.getItem("colorScheme") as ColorScheme) || "system";
    const color = localStorage.getItem("primaryColor") || THEME_COLORS[0].value;

    setColorSchemeState(scheme);
    setPrimaryColorState(color);
    applyColor(color);

    const dark = resolveDark(scheme);
    document.documentElement.classList.toggle("dark", dark);
    setIsDark(dark);

    // Listen to system preference changes
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => {
      if ((localStorage.getItem("colorScheme") || "system") === "system") {
        const d = mq.matches;
        document.documentElement.classList.toggle("dark", d);
        setIsDark(d);
      }
    };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const setColorScheme = useCallback((s: ColorScheme) => {
    localStorage.setItem("colorScheme", s);
    const dark = resolveDark(s);
    document.documentElement.classList.toggle("dark", dark);
    setIsDark(dark);
    setColorSchemeState(s);
  }, []);

  const setPrimaryColor = useCallback((c: string) => {
    localStorage.setItem("primaryColor", c);
    applyColor(c);
    setPrimaryColorState(c);
  }, []);

  return (
    <ThemeContext.Provider
      value={{
        colorScheme,
        setColorScheme,
        primaryColor,
        setPrimaryColor,
        isDark,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
