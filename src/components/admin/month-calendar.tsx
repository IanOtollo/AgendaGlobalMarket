"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { CalendarPlus, ChevronLeft, ChevronRight, MapPin, Phone, User, X } from "lucide-react";
import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";
import { STATUS_LABEL } from "@/lib/config";
import { slot } from "@/lib/schedule";
import { isWorking } from "@/lib/team";
import { cn, ease, money } from "@/lib/utils";
import type { WorkOrder } from "@/lib/types";

const isoOf = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const parse = (s: string) => { const [y, m, d] = s.split("-").map(Number); return new Date(y, m - 1, d); };
const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const dot: Record<WorkOrder["status"], string> = { new: "bg-info", scheduled: "bg-warning", in_progress: "bg-warning", completed: "bg-success", cancelled: "bg-muted-foreground/50" };
const byTime = (a: WorkOrder, b: WorkOrder) => (a.time ?? "99").localeCompare(b.time ?? "99");
const longDate = (s: string) => parse(s).toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long", year: "numeric" });

/** Month grid. Hover (or keyboard focus) on a day previews its appointments; click opens the full day in a side panel. */
export function MonthCalendar() {
  const { workOrders, providers } = useStore();
  const [month, setMonth] = useState(() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1); });
  const [selected, setSelected] = useState<string | null>(null);
  const [who, setWho] = useState("");
  const todayIso = isoOf(new Date());

  const byDate = useMemo(() => {
    const m = new Map<string, WorkOrder[]>();
    for (const w of workOrders) {
      if (!w.date || (who && w.providerId !== who)) continue;
      m.set(w.date, [...(m.get(w.date) ?? []), w]);
    }
    m.forEach((v) => v.sort(byTime));
    return m;
  }, [workOrders, who]);

  // Weeks start on Monday. Only as many rows as the month needs.
  const first = new Date(month.getFullYear(), month.getMonth(), 1);
  const lead = (first.getDay() + 6) % 7;
  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const rows = Math.ceil((lead + daysInMonth) / 7);
  const cells = Array.from({ length: rows * 7 }, (_, i) => new Date(month.getFullYear(), month.getMonth(), 1 - lead + i));
  const shift = (n: number) => setMonth(new Date(month.getFullYear(), month.getMonth() + n, 1));
  const live = (list: WorkOrder[]) => list.filter((w) => w.status !== "cancelled");

  const monthJobs = [...byDate.entries()].filter(([k]) => k.startsWith(`${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, "0")}`)).reduce((n, [, v]) => n + live(v).length, 0);

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={() => shift(-1)} aria-label="Previous month"><ChevronLeft className="h-4 w-4" /></Button>
          <Button variant="secondary" size="sm" onClick={() => { const d = new Date(); setMonth(new Date(d.getFullYear(), d.getMonth(), 1)); }}>Today</Button>
          <Button variant="secondary" size="sm" onClick={() => shift(1)} aria-label="Next month"><ChevronRight className="h-4 w-4" /></Button>
          <h2 className="ml-2 text-lg font-semibold tracking-tight" aria-live="polite">{month.toLocaleDateString(undefined, { month: "long", year: "numeric" })}</h2>
          <span className="hidden text-sm text-muted-foreground sm:inline">· {monthJobs} {monthJobs === 1 ? "appointment" : "appointments"}</span>
        </div>
        <div className="w-full sm:w-56">
          <Select value={who} onChange={(e) => setWho(e.target.value)} aria-label="Filter by team member">
            <option value="">Everyone</option>
            {providers.filter(isWorking).map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </Select>
        </div>
      </div>

      <div className="mt-4 rounded-xl border border-border/60 bg-card p-2 sm:p-3">
        <div className="grid grid-cols-7 gap-1 pb-1 text-center text-xs font-medium text-muted-foreground sm:gap-1.5">
          {WEEKDAYS.map((d) => <div key={d} className="py-1">{d}</div>)}
        </div>
        <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
          {cells.map((d, idx) => {
            const key = isoOf(d);
            const inMonth = d.getMonth() === month.getMonth();
            const list = live(byDate.get(key) ?? []);
            const col = idx % 7, row = Math.floor(idx / 7);
            const label = `${d.toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" })}: ${list.length ? `${list.length} ${list.length === 1 ? "appointment" : "appointments"}` : "no appointments"}`;
            return (
              <div key={key} className="group relative">
                <button type="button" onClick={() => setSelected(key)} aria-label={label}
                  className={cn("flex min-h-[3.75rem] w-full flex-col rounded-lg border p-1.5 text-left transition-colors sm:min-h-[6rem] sm:p-2",
                    "border-border/50 hover:border-foreground/30 hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    inMonth ? "bg-background" : "bg-muted/30 text-muted-foreground", key === selected && "border-foreground/50 bg-muted")}>
                  <span className={cn("inline-flex h-6 min-w-6 items-center justify-center rounded-full px-1 text-xs font-semibold", key === todayIso && "bg-primary text-primary-foreground")}>{d.getDate()}</span>
                  {/* Phones: dots and a count. Larger screens: the first two appointments. */}
                  {list.length > 0 && (
                    <>
                      <span className="mt-1 flex flex-wrap items-center gap-1 sm:hidden">
                        {list.slice(0, 3).map((w) => <span key={w.id} className={cn("h-1.5 w-1.5 rounded-full", dot[w.status])} />)}
                        {list.length > 3 && <span className="text-[10px] font-medium">+{list.length - 3}</span>}
                      </span>
                      <span className="mt-1 hidden min-w-0 space-y-0.5 sm:block">
                        {list.slice(0, 2).map((w) => (
                          <span key={w.id} className="flex items-center gap-1.5 truncate text-xs">
                            <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", dot[w.status])} />
                            <span className="truncate"><span className="font-medium">{w.time ?? "Anytime"}</span> {w.title}</span>
                          </span>
                        ))}
                        {list.length > 2 && <span className="block text-xs font-medium text-muted-foreground">+{list.length - 2} more</span>}
                      </span>
                    </>
                  )}
                </button>

                {list.length > 0 && (
                  <div aria-hidden role="presentation"
                    className={cn("pointer-events-none absolute z-30 hidden w-64 rounded-xl border border-border bg-card p-3 shadow-lg",
                      "[@media(hover:hover)]:group-hover:block group-focus-within:block max-sm:!hidden",
                      col >= 4 ? "right-0" : "left-0", row >= 3 ? "bottom-full mb-1.5" : "top-full mt-1.5")}>
                    <p className="text-xs font-semibold">{d.toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "short" })}</p>
                    <p className="text-xs text-muted-foreground">{list.length} {list.length === 1 ? "appointment" : "appointments"}</p>
                    <ul className="mt-2 space-y-2">
                      {list.slice(0, 5).map((w) => (
                        <li key={w.id} className="flex gap-2 text-xs">
                          <span className={cn("mt-1 h-2 w-2 shrink-0 rounded-full", dot[w.status])} />
                          <span className="min-w-0">
                            <span className="block font-semibold">{slot(w) || "Anytime"}</span>
                            <span className="block truncate">{w.title}</span>
                            <span className="block truncate text-muted-foreground">{providers.find((p) => p.id === w.providerId)?.name ?? "Unassigned"}</span>
                          </span>
                        </li>
                      ))}
                    </ul>
                    {list.length > 5 && <p className="mt-2 text-xs text-muted-foreground">+{list.length - 5} more. Click for the full day.</p>}
                    <p className="mt-2 border-t border-border/60 pt-2 text-[11px] text-muted-foreground">Click for details</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground" aria-label="Legend">
        {(["new", "scheduled", "completed"] as const).map((s) => <li key={s} className="flex items-center gap-1.5"><span className={cn("h-2 w-2 rounded-full", dot[s])} />{s === "scheduled" ? "Scheduled / in progress" : STATUS_LABEL[s]}</li>)}
      </ul>

      <DayDrawer date={selected} jobs={selected ? byDate.get(selected) ?? [] : []} onClose={() => setSelected(null)} />
    </>
  );
}

function DayDrawer({ date, jobs, onClose }: { date: string | null; jobs: WorkOrder[]; onClose: () => void }) {
  const { providers, customers } = useStore();
  const closeBtn = useRef<HTMLButtonElement>(null);
  const opener = useRef<Element | null>(null);

  useEffect(() => {
    if (!date) return;
    opener.current = document.activeElement;
    closeBtn.current?.focus();
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => { window.removeEventListener("keydown", onKey); (opener.current as HTMLElement | null)?.focus?.(); };
  }, [date, onClose]);

  const live = jobs.filter((j) => j.status !== "cancelled");
  const workers = new Set(live.map((j) => j.providerId).filter(Boolean)).size;

  return (
    <AnimatePresence>
      {date && (
        <>
          <motion.div key="scrim" className="fixed inset-0 z-40 bg-foreground/20 backdrop-blur-[2px]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} />
          <motion.aside key="panel" role="dialog" aria-modal="true" aria-label={`Appointments on ${longDate(date)}`}
            className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l border-border bg-card shadow-lg"
            initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ duration: 0.35, ease }}>
            <header className="flex items-start justify-between gap-4 border-b border-border/60 p-6">
              <div>
                <h2 className="text-xl font-semibold tracking-tight">{longDate(date)}</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {live.length ? `${live.length} ${live.length === 1 ? "appointment" : "appointments"} · ${workers} ${workers === 1 ? "team member" : "team members"} booked` : "Nothing booked"}
                </p>
              </div>
              <button ref={closeBtn} onClick={onClose} aria-label="Close" className="rounded-md p-2 hover:bg-muted"><X className="h-4 w-4" /></button>
            </header>

            <div className="flex-1 space-y-3 overflow-y-auto p-6">
              {jobs.length === 0 && <p className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">No appointments on this day. Everyone is free.</p>}
              {jobs.map((w) => {
                const c = customers.find((x) => x.id === w.customerId);
                const p = providers.find((x) => x.id === w.providerId);
                return (
                  <article key={w.id} className={cn("rounded-xl border border-border/60 p-4", w.status === "cancelled" && "opacity-60")}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold">{slot(w) || "Anytime"}</p>
                        <h3 className="mt-0.5 font-medium">{w.title}</h3>
                        <p className="text-xs text-muted-foreground">{w.no} · {w.category}{w.type ? ` · ${w.type}` : ""}</p>
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-1">
                        <Badge kind={w.status}>{STATUS_LABEL[w.status]}</Badge>
                        {w.priority === "urgent" && <Badge kind="urgent">Urgent</Badge>}
                      </div>
                    </div>
                    <dl className="mt-3 space-y-1.5 text-sm">
                      <div className="flex items-center gap-2"><User className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden /><dt className="sr-only">Assigned to</dt><dd>{p ? `${p.name} · ${p.category}` : "Unassigned"}</dd></div>
                      {c && <div className="flex items-center gap-2"><Phone className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden /><dt className="sr-only">Customer</dt><dd>{c.name} · <a href={`tel:${c.phone}`} className="underline-offset-2 hover:underline">{c.phone}</a></dd></div>}
                      {(w.area || c?.address) && <div className="flex items-center gap-2"><MapPin className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden /><dt className="sr-only">Location</dt><dd>{[w.area, c?.address].filter(Boolean).join(" · ")}</dd></div>}
                    </dl>
                    {w.description && <p className="mt-3 line-clamp-3 text-sm text-muted-foreground">{w.description}</p>}
                    <div className="mt-3 flex items-center justify-between gap-3 border-t border-border/60 pt-3 text-sm">
                      <span className="text-muted-foreground">{typeof w.price === "number" ? money(w.price) : "No price set"}</span>
                      <Link href={`/admin/work-orders/${w.id}`} className="font-medium underline-offset-4 hover:underline">Open work order</Link>
                    </div>
                  </article>
                );
              })}
            </div>

            <footer className="border-t border-border/60 p-4">
              <Link href={`/admin/work-orders/new?date=${date}`} className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground hover:opacity-90">
                <CalendarPlus className="h-4 w-4" aria-hidden /> New work order on this day
              </Link>
            </footer>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
