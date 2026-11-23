"use client";
import { useEffect, useId, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

const FOCUSABLE = 'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

/**
 * Accessible dialog. A bottom sheet on phones, a centred panel from `sm` up.
 * Locks page scroll, closes on Escape or backdrop click, traps focus and restores it on close.
 */
export function Sheet({ open, onClose, title, children, footer, className }: {
  open: boolean; onClose: () => void; title: string; children: ReactNode; footer?: ReactNode; className?: string;
}) {
  const panel = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const reduce = useReducedMotion();

  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    const scrollbar = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = "hidden";
    document.body.style.paddingRight = scrollbar ? `${scrollbar}px` : "";
    const t = setTimeout(() => (panel.current?.querySelector<HTMLElement>("[data-autofocus]") ?? panel.current?.querySelector<HTMLElement>(FOCUSABLE))?.focus(), 30);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { e.stopPropagation(); onClose(); }
      if (e.key !== "Tab" || !panel.current) return;
      const els = [...panel.current.querySelectorAll<HTMLElement>(FOCUSABLE)];
      if (!els.length) return;
      const first = els[0], last = els[els.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      clearTimeout(t);
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
      document.body.style.paddingRight = "";
      previous?.focus?.();
    };
  }, [open, onClose]);

  if (typeof document === "undefined") return null;
  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[70] flex items-end justify-center sm:items-center sm:p-6">
          <motion.div className="absolute inset-0 bg-inverse/50" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: reduce ? 0 : 0.2 }} onClick={onClose} aria-hidden />
          <motion.div ref={panel} role="dialog" aria-modal="true" aria-labelledby={titleId}
            className={cn("site relative flex max-h-[90dvh] w-full flex-col overflow-hidden rounded-t-3xl border border-border bg-card text-foreground shadow-hover sm:max-w-lg sm:rounded-card", className)}
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 32 }} animate={{ opacity: 1, y: 0 }} exit={reduce ? { opacity: 0 } : { opacity: 0, y: 32 }} transition={{ duration: reduce ? 0 : 0.24, ease: [0.2, 0.8, 0.2, 1] }}>
            <div className="flex items-center justify-between gap-4 border-b border-border px-5 py-4">
              <h2 id={titleId} className="text-h3 !text-xl">{title}</h2>
              <button onClick={onClose} aria-label="Close" className="flex h-11 w-11 items-center justify-center rounded-lg hover:bg-muted"><X className="h-5 w-5" /></button>
            </div>
            <div className="overflow-y-auto px-5 py-5">{children}</div>
            {footer && <div className="border-t border-border bg-card px-5 py-4">{footer}</div>}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
