"use client";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

export function Stars({ value, onChange, size = "h-4 w-4" }: { value: number; onChange?: (n: number) => void; size?: string }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <button key={n} type="button" disabled={!onChange} onClick={() => onChange?.(n)} aria-label={`${n} star${n > 1 ? "s" : ""}`}
          className={cn("transition", onChange && "hover:scale-110 active:scale-95")}>
          <Star className={cn(size, n <= Math.round(value) ? "fill-warning text-warning" : "text-border")} />
        </button>
      ))}
    </div>
  );
}
