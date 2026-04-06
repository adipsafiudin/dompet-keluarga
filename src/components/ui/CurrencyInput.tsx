"use client";

import { useRef } from "react";
import { cn, formatRupiah, parseRupiah } from "@/lib/utils";

interface CurrencyInputProps {
  value: number;
  onChange: (value: number) => void;
  placeholder?: string;
  className?: string;
  large?: boolean;
}

export default function CurrencyInput({
  value,
  onChange,
  placeholder = "0",
  className,
  large = false,
}: CurrencyInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const displayValue =
    value > 0 ? value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".") : "";

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value.replace(/\./g, "");
    const num = parseRupiah(raw);
    onChange(num);
  }

  return (
    <div
      className={cn(
        "flex items-center gap-1",
        large ? "text-3xl font-bold" : "text-base",
        className,
      )}
      onClick={() => inputRef.current?.focus()}
    >
      <span className={cn("text-current/60", large ? "text-xl" : "text-sm")}>
        Rp
      </span>
      <input
        ref={inputRef}
        type="text"
        inputMode="numeric"
        value={displayValue}
        onChange={handleChange}
        placeholder={placeholder}
        className={cn(
          "flex-1 bg-transparent outline-none placeholder:text-current/30 min-w-0",
          large ? "text-3xl font-bold" : "text-base",
        )}
      />
    </div>
  );
}
