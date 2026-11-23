"use client";
import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

/** Splits a list into pages. The page resets to 1 whenever `resetKey` changes (a new filter or search). */
export function usePaged<T>(rows: T[], size = 15, resetKey = "") {
  const [page, setPage] = useState(1);
  useEffect(() => setPage(1), [resetKey]);
  const pages = Math.max(1, Math.ceil(rows.length / size));
  const p = Math.min(page, pages);
  return { items: rows.slice((p - 1) * size, p * size), page: p, pages, total: rows.length, size, setPage };
}

const windowOf = (page: number, pages: number): (number | "…")[] => {
  if (pages <= 7) return Array.from({ length: pages }, (_, i) => i + 1);
  const set = new Set([1, pages, page - 1, page, page + 1].filter((n) => n >= 1 && n <= pages));
  const out: (number | "…")[] = [];
  [...set].sort((a, b) => a - b).forEach((n, i, a) => { if (i && n - a[i - 1] > 1) out.push("…"); out.push(n); });
  return out;
};

export function Pagination({ page, pages, total, size, setPage, className }: ReturnType<typeof usePaged> & { className?: string }) {
  if (total === 0) return null;
  const from = (page - 1) * size + 1, to = Math.min(total, page * size);
  const btn = "inline-flex h-9 min-w-9 items-center justify-center rounded-md border px-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40";
  return (
    <nav aria-label="Pagination" className={cn("flex flex-wrap items-center justify-between gap-3 border-t border-border px-4 py-3", className)}>
      <p className="text-sm text-muted-foreground" aria-live="polite">Showing {from}–{to} of {total}</p>
      {pages > 1 && (
        <div className="flex items-center gap-1">
          <button type="button" className={cn(btn, "border-border hover:bg-muted")} disabled={page === 1} onClick={() => setPage(page - 1)} aria-label="Previous page"><ChevronLeft className="h-4 w-4" /></button>
          {windowOf(page, pages).map((n, i) => n === "…"
            ? <span key={`e${i}`} className="px-1 text-muted-foreground" aria-hidden>…</span>
            : <button key={n} type="button" onClick={() => setPage(n)} aria-label={`Page ${n}`} aria-current={n === page ? "page" : undefined}
                className={cn(btn, n === page ? "border-primary bg-primary text-primary-foreground" : "border-border hover:bg-muted")}>{n}</button>)}
          <button type="button" className={cn(btn, "border-border hover:bg-muted")} disabled={page === pages} onClick={() => setPage(page + 1)} aria-label="Next page"><ChevronRight className="h-4 w-4" /></button>
        </div>
      )}
    </nav>
  );
}
