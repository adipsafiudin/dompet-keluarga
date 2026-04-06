"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { formatRupiah } from "@/lib/utils";

const MASK = "Rp ••••••";

interface HiddenBalanceContextType {
  isHidden: boolean;
  toggle: () => void;
  /** Format amount — returns masked string when hidden mode is on */
  fmt: (amount: number, compact?: boolean) => string;
}

const HiddenBalanceContext = createContext<HiddenBalanceContextType>({
  isHidden: false,
  toggle: () => {},
  fmt: (amount, compact) => formatRupiah(amount, compact),
});

export function HiddenBalanceProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isHidden, setIsHidden] = useState(false);

  useEffect(() => {
    try {
      if (localStorage.getItem("hideBalance") === "true") setIsHidden(true);
    } catch {}
  }, []);

  const toggle = useCallback(() => {
    setIsHidden((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("hideBalance", String(next));
      } catch {}
      return next;
    });
  }, []);

  const fmt = useCallback(
    (amount: number, compact?: boolean) =>
      isHidden ? MASK : formatRupiah(amount, compact),
    [isHidden],
  );

  return (
    <HiddenBalanceContext.Provider value={{ isHidden, toggle, fmt }}>
      {children}
    </HiddenBalanceContext.Provider>
  );
}

export function useHiddenBalance() {
  return useContext(HiddenBalanceContext);
}
