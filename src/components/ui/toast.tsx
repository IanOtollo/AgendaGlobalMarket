"use client";
import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, CheckCircle2, Info, X } from "lucide-react";
import { cn, ease } from "@/lib/utils";

type Kind = "success" | "error" | "info";
type Toast = { id: number; kind: Kind; title: string; detail?: string };
type Push = (kind: Kind, title: string, detail?: string) => void;

const Ctx = createContext<Push | null>(null);
/** Shows a short message at the bottom of the screen: `toast("success", "Settings saved")`. Errors stay a little longer. */
export const useToast = () => {
  const c = useContext(Ctx);
  if (!c) throw new Error("ToastProvider missing");
  return c;
};

const ICON = { success: CheckCircle2, error: AlertCircle, info: Info } as const;
const TONE = { success: "text-success", error: "text-destructive", info: "text-info" } as const;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<Toast[]>([]);
  const next = useRef(1);
  const dismiss = useCallback((id: number) => setItems((l) => l.filter((t) => t.id !== id)), []);
  const push = useCallback<Push>((kind, title, detail) => {
    const id = next.current++;
    setItems((l) => [...l.slice(-2), { id, kind, title, detail }]);
    setTimeout(() => dismiss(id), kind === "error" ? 8000 : 4500);
  }, [dismiss]);

  return (
    <Ctx.Provider value={push}>
      {children}
      {/* Above the phone bottom bar; centred on larger screens. Errors are announced assertively. */}
      <div className="pointer-events-none fixed inset-x-0 bottom-24 z-[70] flex flex-col items-center gap-2 px-4 lg:bottom-6" role="region" aria-label="Notifications">
        <AnimatePresence initial={false}>
          {items.map((t) => {
            const Icon = ICON[t.kind];
            return (
              <motion.div key={t.id} layout role={t.kind === "error" ? "alert" : "status"}
                initial={{ opacity: 0, y: 16, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 8, scale: 0.97 }} transition={{ duration: 0.3, ease }}
                className="pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl border border-border bg-card p-4 shadow-lg">
                <Icon className={cn("mt-0.5 h-5 w-5 shrink-0", TONE[t.kind])} aria-hidden />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold">{t.title}</p>
                  {t.detail && <p className="mt-0.5 text-sm text-muted-foreground">{t.detail}</p>}
                </div>
                <button type="button" onClick={() => dismiss(t.id)} aria-label="Dismiss" className="-m-1 rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"><X className="h-4 w-4" /></button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </Ctx.Provider>
  );
}
