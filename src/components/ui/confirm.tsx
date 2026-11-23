"use client";
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { cn, ease } from "@/lib/utils";

type Options = { title: string; body?: string; confirmLabel?: string; cancelLabel?: string; danger?: boolean };
type Ask = (o: Options) => Promise<boolean>;

const Ctx = createContext<Ask | null>(null);
/** Asks "are you sure?" before something that overwrites or removes data: `if (await confirm({ title: "Remove Jane?" })) ...` */
export const useConfirm = () => {
  const c = useContext(Ctx);
  if (!c) throw new Error("ConfirmProvider missing");
  return c;
};

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<(Options & { resolve: (v: boolean) => void }) | null>(null);
  const cancelBtn = useRef<HTMLButtonElement>(null);
  const opener = useRef<Element | null>(null);

  const ask = useCallback<Ask>((o) => new Promise<boolean>((resolve) => {
    opener.current = document.activeElement;
    setState({ ...o, resolve });
  }), []);
  const close = useCallback((v: boolean) => {
    setState((s) => { s?.resolve(v); return null; });
    setTimeout(() => (opener.current as HTMLElement | null)?.focus?.(), 0);
  }, []);

  // Escape cancels. Focus starts on Cancel, so a stray Enter never confirms a removal.
  useEffect(() => {
    if (!state) return;
    cancelBtn.current?.focus();
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") close(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [state, close]);

  return (
    <Ctx.Provider value={ask}>
      {children}
      <AnimatePresence>
        {state && (
          <motion.div key="confirm" className="fixed inset-0 z-[80] flex items-end justify-center bg-foreground/30 p-4 backdrop-blur-sm sm:items-center"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => close(false)}>
            <motion.div role="alertdialog" aria-modal="true" aria-labelledby="confirm-t" aria-describedby={state.body ? "confirm-b" : undefined} onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm rounded-xl border border-border bg-card p-6 shadow-lg"
              initial={{ opacity: 0, y: 16, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 8, scale: 0.97 }} transition={{ duration: 0.25, ease }}>
              <h2 id="confirm-t" className="text-lg font-semibold tracking-tight">{state.title}</h2>
              {state.body && <p id="confirm-b" className="mt-2 text-sm leading-relaxed text-muted-foreground">{state.body}</p>}
              <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <button ref={cancelBtn} type="button" onClick={() => close(false)}
                  className="inline-flex min-h-11 items-center justify-center rounded-lg border border-border bg-background px-5 text-sm font-medium hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">{state.cancelLabel ?? "Cancel"}</button>
                <Button variant={state.danger ? "danger" : "primary"} className={cn("min-h-11")} onClick={() => close(true)}>{state.confirmLabel ?? "Confirm"}</Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </Ctx.Provider>
  );
}
