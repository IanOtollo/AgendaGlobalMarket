"use client";
import { useState } from "react";
import { Plus, Search } from "lucide-react";
import { useStore } from "@/lib/store";
import { availability, isWorking } from "@/lib/team";
import { ratingOf } from "@/lib/rating";
import { tradesOf } from "@/lib/trades";
import { cn, fmtDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import { PageHeader } from "@/components/layout/admin-shell";
import { WorkerDrawer } from "@/components/admin/worker-drawer";
import { WorkerForm } from "@/components/admin/worker-form";

export default function Team() {
  const { providers, workOrders, ratings, addProvider, settings } = useStore();
  const CATEGORIES = tradesOf(settings).map((t) => t.name);
  const [trade, setTrade] = useState("All");
  const [q, setQ] = useState("");
  const [adding, setAdding] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);

  const t = q.trim().toLowerCase();
  // One list: current staff first, anyone who has left sits at the bottom.
  const rows = providers
    .filter((p) => (trade === "All" || p.category === trade) && (!t || [p.name, p.phone, p.area, p.category].some((s) => s?.toLowerCase().includes(t))))
    .sort((a, b) => Number(!isWorking(a)) - Number(!isWorking(b)) || a.name.localeCompare(b.name));

  const info = (p: (typeof providers)[number]) => {
    const working = isWorking(p);
    const av = working ? availability(p.id, workOrders) : null;
    const r = ratingOf(ratings, p.id);
    return {
      working, av,
      rating: r.count ? `${r.avg.toFixed(1)} (${r.count})` : "—",
      status: av ? av.text : `${p.employment === "terminated" ? "Let go" : "Resigned"} ${fmtDate(p.leftOn)}`,
    };
  };

  return (
    <>
      <PageHeader title="Team" subtitle={`${providers.filter(isWorking).length} workers. Select a person to open their profile.`}
        action={<Button onClick={() => setAdding(true)}><Plus className="h-4 w-4" /> Add worker</Button>} />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, phone or area"
            className="w-full rounded-md border border-border bg-card py-2.5 pl-9 pr-3 text-sm outline-none transition focus:border-foreground/40" />
        </div>
        <Select value={trade} onChange={(e) => setTrade(e.target.value)} aria-label="Filter by trade" className="w-44 bg-card">
          <option>All</option>{CATEGORIES.map((c) => <option key={c}>{c}</option>)}
        </Select>
      </div>

      {/* Desktop: table */}
      <div className="hidden overflow-hidden rounded-lg border border-border bg-card md:block">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
            <tr>{["Name", "Trade", "Phone", "Area", "Experience", "Rating", "Status"].map((h) => <th key={h} className="px-4 py-3 font-medium">{h}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map((p) => {
              const i = info(p);
              return (
                <tr key={p.id} onClick={() => setOpenId(p.id)} className={cn("cursor-pointer transition hover:bg-muted/60", !i.working && "text-muted-foreground")}>
                  <td className="px-4 py-3 font-medium">{p.name}{!p.active && i.working && <span className="ml-2 text-xs font-normal text-muted-foreground">Not listed</span>}</td>
                  <td className="px-4 py-3">{p.category}</td>
                  <td className="px-4 py-3 tabular-nums">{p.phone}</td>
                  <td className="px-4 py-3">{p.area}</td>
                  <td className="px-4 py-3">{p.years} yrs</td>
                  <td className="px-4 py-3">{i.rating}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center gap-2">
                      {i.av && <span className={cn("h-2 w-2 rounded-full", i.av.busy ? "bg-warning" : "bg-success")} aria-hidden />}
                      {i.status}
                    </span>
                  </td>
                </tr>
              );
            })}
            {!rows.length && <tr><td colSpan={7} className="px-4 py-14 text-center text-muted-foreground">No workers match.</td></tr>}
          </tbody>
        </table>
      </div>

      {/* Mobile: stacked rows */}
      <ul className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-card md:hidden">
        {rows.map((p) => {
          const i = info(p);
          return (
            <li key={p.id}>
              <button onClick={() => setOpenId(p.id)} className={cn("flex w-full items-center gap-3 px-4 py-3.5 text-left transition hover:bg-muted/60", !i.working && "text-muted-foreground")}>
                {i.av && <span className={cn("h-2 w-2 shrink-0 rounded-full", i.av.busy ? "bg-warning" : "bg-success")} aria-hidden />}
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">{p.name}</span>
                  <span className="block truncate text-sm text-muted-foreground">{p.category} · {p.area}</span>
                  <span className="block truncate text-xs text-muted-foreground">{i.status}</span>
                </span>
                <span className="shrink-0 text-sm tabular-nums text-muted-foreground">{i.rating}</span>
              </button>
            </li>
          );
        })}
        {!rows.length && <li className="px-4 py-10 text-center text-sm text-muted-foreground">No workers match.</li>}
      </ul>

      <Modal open={adding} onClose={() => setAdding(false)} title="Add worker">
        <WorkerForm submitLabel="Add to team" onSubmit={(d) => { addProvider(d); setAdding(false); }} />
      </Modal>
      <WorkerDrawer id={openId} onClose={() => setOpenId(null)} />
    </>
  );
}
