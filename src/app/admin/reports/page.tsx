"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowDown, ArrowUp, Download, Printer, Search, X } from "lucide-react";
import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Pagination, usePaged } from "@/components/ui/pagination";
import { PageHeader } from "@/components/layout/admin-shell";
import { balanceOf, invoiceNo, paidOf, payStatus, totalOf } from "@/lib/billing";
import { STATUS_LABEL } from "@/lib/config";
import {
  ageing, dateOf, daysBetween, filterOrders, groupBy, NO_FILTERS, paymentsByMethod, presetRange, summarise, toCsv, trend, workerRows,
  type Filters, type WorkerRow,
} from "@/lib/reports";
import { cn, fmtDate, money, today } from "@/lib/utils";

const VIEWS = [["invoices", "Invoices and balances"], ["operations", "Operations"], ["workers", "Worker productivity"]] as const;
type View = (typeof VIEWS)[number][0];
const PAY = { none: "No charge", unpaid: "Unpaid", part: "Part paid", paid: "Paid" } as const;
const PRESETS = [["all", "All time"], ["month", "This month"], ["last-month", "Last month"], ["30", "Last 30 days"], ["year", "This year"]] as const;
const pct = (n: number | null) => (n === null ? "—" : `${Math.round(n * 100)}%`);

const card = "rounded-lg border border-border bg-card";
const th = "whitespace-nowrap px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground";
const td = "px-4 py-3 text-sm";
const input = "w-full rounded-md border border-border bg-background px-3 py-2.5 text-sm outline-none transition focus:border-foreground/40";

function download(name: string, text: string) {
  const url = URL.createObjectURL(new Blob([text], { type: "text/csv;charset=utf-8" }));
  const a = Object.assign(document.createElement("a"), { href: url, download: name });
  document.body.append(a); a.click(); a.remove(); URL.revokeObjectURL(url);
}

export default function Reports() {
  const { workOrders, customers, providers, ratings, settings } = useStore();
  const [f, setF] = useState<Filters>(NO_FILTERS);
  const [preset, setPreset] = useState<string>("all");
  const [view, setView] = useState<View>("invoices");
  const set = (patch: Partial<Filters>) => { setF((x) => ({ ...x, ...patch })); setPreset(""); };
  const pick = (key: (typeof PRESETS)[number][0]) => { setF((x) => ({ ...x, ...presetRange(key) })); setPreset(key); };
  const clear = () => { setF(NO_FILTERS); setPreset("all"); };

  const rows = useMemo(() => filterOrders(workOrders, f, customers, providers), [workOrders, f, customers, providers]);
  const sum = useMemo(() => summarise(rows), [rows]);
  const nameOf = (id: string) => customers.find((c) => c.id === id)?.name || "Unnamed caller";
  const providerName = (id: string | null) => providers.find((p) => p.id === id)?.name ?? "Unassigned";
  const trades = useMemo(() => [...new Set([...workOrders.map((w) => w.category), ...providers.map((p) => p.category)])].sort(), [workOrders, providers]);
  const areas = useMemo(() => [...new Set(workOrders.map((w) => w.area).filter(Boolean) as string[])].sort(), [workOrders]);
  const filtered = JSON.stringify(f) !== JSON.stringify(NO_FILTERS);
  const period = f.from || f.to ? `${f.from ? fmtDate(f.from) : "the start"} to ${f.to ? fmtDate(f.to) : "today"}` : "All time";

  const kpis = [
    { label: "Jobs", value: sum.jobs, note: `${sum.completed} completed` },
    { label: "Invoiced", value: money(sum.invoiced), note: `${sum.invoiceCount} invoice${sum.invoiceCount === 1 ? "" : "s"}` },
    { label: "Collected", value: money(sum.collected), note: `${pct(sum.collectionRate)} of invoiced` },
    { label: "Outstanding", value: money(sum.outstanding), note: `${sum.unpaidCount} unpaid or part paid` },
    { label: "Average job", value: money(Math.round(sum.avgValue)), note: "per invoiced job" },
    { label: "Cancelled", value: sum.cancelled, note: `${pct(sum.cancelRate)} of jobs` },
  ];

  const exportCsv = () => {
    const stamp = today();
    if (view === "invoices") {
      download(`invoices-${stamp}.csv`, toCsv(["Invoice", "Work order", "Date", "Customer", "Job", "Trade", "Provider", "Total (KES)", "Paid (KES)", "Balance (KES)", "Payment status", "Job status"],
        rows.filter((w) => w.status !== "cancelled" && totalOf(w) > 0).map((w) => [invoiceNo(w), w.no, dateOf(w), nameOf(w.customerId), w.title, w.category, providerName(w.providerId), totalOf(w), paidOf(w), balanceOf(w), PAY[payStatus(w)], STATUS_LABEL[w.status]])));
    } else if (view === "operations") {
      download(`operations-${stamp}.csv`, toCsv(["Work order", "Date", "Time", "Customer", "Job", "Trade", "Type", "Area", "Priority", "Provider", "Status"],
        rows.map((w) => [w.no, dateOf(w), w.time ?? "", nameOf(w.customerId), w.title, w.category, w.type ?? "", w.area ?? "", w.priority, providerName(w.providerId), STATUS_LABEL[w.status]])));
    } else {
      download(`worker-productivity-${stamp}.csv`, toCsv(["Worker", "Trade", "Assigned", "Completed", "Active", "Cancelled", "Completion rate", "Hours on completed jobs", "Invoiced (KES)", "Collected (KES)", "Average job (KES)", "Rating", "Ratings"],
        workerRows(rows, providers, ratings).map((r) => [r.name, r.category, r.assigned, r.completed, r.active, r.cancelled, pct(r.completionRate), r.hours, r.invoiced, r.collected, Math.round(r.avgJob), r.rating?.toFixed(1) ?? "", r.ratings])));
    }
  };

  return (
    <>
      <PageHeader title="Reports" subtitle="Invoices, balances, jobs done and how the team is performing, for any period you choose."
        action={
          <div className="flex gap-2 print:hidden">
            <Button variant="secondary" onClick={exportCsv}><Download className="h-4 w-4" /> Export CSV</Button>
            <Button variant="secondary" onClick={() => window.print()}><Printer className="h-4 w-4" /> Print</Button>
          </div>
        } />

      {/* Filters */}
      <section className={cn(card, "mb-6 p-4 print:hidden")} aria-label="Report filters">
        <div className="flex flex-wrap items-center gap-2">
          {PRESETS.map(([k, label]) => (
            <button key={k} onClick={() => pick(k)} aria-pressed={preset === k}
              className={cn("rounded-md border px-3 py-1.5 text-sm font-medium transition", preset === k ? "border-primary bg-primary text-primary-foreground" : "border-border hover:bg-muted")}>
              {label}
            </button>
          ))}
          {filtered && <button onClick={clear} className="ml-auto inline-flex items-center gap-1 text-sm font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"><X className="h-4 w-4" /> Clear filters</button>}
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4 [&>*]:min-w-0">
          <label className="text-sm"><span className="mb-1 block text-xs font-medium text-muted-foreground">From</span><input type="date" className={input} value={f.from} max={f.to || undefined} onChange={(e) => set({ from: e.target.value })} /></label>
          <label className="text-sm"><span className="mb-1 block text-xs font-medium text-muted-foreground">To</span><input type="date" className={input} value={f.to} min={f.from || undefined} onChange={(e) => set({ to: e.target.value })} /></label>
          <div className="text-sm"><span className="mb-1 block text-xs font-medium text-muted-foreground">Worker</span>
            <Select value={f.providerId} onChange={(e) => set({ providerId: e.target.value })} aria-label="Worker">
              <option value="">All workers</option><option value="none">Unassigned</option>
              {providers.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </Select></div>
          <div className="text-sm"><span className="mb-1 block text-xs font-medium text-muted-foreground">Trade</span>
            <Select value={f.category} onChange={(e) => set({ category: e.target.value })} aria-label="Trade">
              <option value="">All trades</option>{trades.map((t) => <option key={t} value={t}>{t}</option>)}
            </Select></div>
          <div className="text-sm"><span className="mb-1 block text-xs font-medium text-muted-foreground">Area</span>
            <Select value={f.area} onChange={(e) => set({ area: e.target.value })} aria-label="Area">
              <option value="">All areas</option>{areas.map((a) => <option key={a} value={a}>{a}</option>)}
            </Select></div>
          <div className="text-sm"><span className="mb-1 block text-xs font-medium text-muted-foreground">Job status</span>
            <Select value={f.status} onChange={(e) => set({ status: e.target.value })} aria-label="Job status">
              <option value="">All statuses</option>{Object.entries(STATUS_LABEL).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
            </Select></div>
          <div className="text-sm"><span className="mb-1 block text-xs font-medium text-muted-foreground">Payment</span>
            <Select value={f.pay} onChange={(e) => set({ pay: e.target.value })} aria-label="Payment status">
              <option value="">Any payment status</option><option value="unpaid">Unpaid</option><option value="part">Part paid</option><option value="paid">Paid</option>
            </Select></div>
          <label className="relative text-sm"><span className="mb-1 block text-xs font-medium text-muted-foreground">Search</span>
            <Search className="pointer-events-none absolute left-3 top-[2.1rem] h-4 w-4 text-muted-foreground" aria-hidden />
            <input className={cn(input, "pl-9")} placeholder="Customer, job or invoice" value={f.q} onChange={(e) => set({ q: e.target.value })} /></label>
        </div>
      </section>

      <p className="mb-3 hidden text-sm print:block">{settings.businessName} · Report for {period} · {rows.length} job{rows.length === 1 ? "" : "s"}</p>

      <dl className={cn(card, "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6")}>
        {kpis.map((k) => (
          <div key={k.label} className="border-b border-r border-border p-4 [&:nth-child(2n)]:border-r-0 sm:[&:nth-child(2n)]:border-r sm:[&:nth-child(3n)]:border-r-0 lg:[&:nth-child(3n)]:border-r lg:[&:nth-child(6n)]:border-r-0 lg:border-b-0">
            <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{k.label}</dt>
            <dd className="mt-1.5 truncate text-xl font-semibold tracking-tight">{k.value}</dd>
            <p className="mt-0.5 truncate text-xs text-muted-foreground">{k.note}</p>
          </div>
        ))}
      </dl>
      <p className="mt-2 text-xs text-muted-foreground">Invoiced and collected count the jobs in this report, not when each payment was received. Cancelled jobs are not invoiced.</p>

      <div role="tablist" className="mt-6 flex flex-wrap gap-x-5 border-b border-border print:hidden">
        {VIEWS.map(([k, label]) => (
          <button key={k} role="tab" aria-selected={view === k} onClick={() => setView(k)}
            className={cn("-mb-px border-b-2 px-1 pb-3 text-sm font-medium transition", view === k ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground")}>
            {label}
          </button>
        ))}
      </div>

      <div className="mt-6 space-y-6 [&>*]:min-w-0">
        {rows.length === 0 ? (
          <div className={cn(card, "px-5 py-14 text-center")}>
            <p className="font-medium">{workOrders.length ? "No jobs match these filters." : "There are no work orders yet."}</p>
            <p className="mt-1 text-sm text-muted-foreground">{workOrders.length ? "Widen the dates or clear a filter." : "The report fills in as work orders are created."}</p>
            {filtered && <Button variant="secondary" className="mt-4" onClick={clear}>Clear filters</Button>}
          </div>
        ) : view === "invoices" ? <Invoices rows={rows} resetKey={JSON.stringify(f)} />
          : view === "operations" ? <Operations rows={rows} />
          : <Workers rows={rows} />}
      </div>
    </>
  );
}

// ---------- Invoices and balances ----------
function Invoices({ rows, resetKey }: { rows: ReturnType<typeof filterOrders>; resetKey: string }) {
  const { customers, providers } = useStore();
  const nameOf = (id: string) => customers.find((c) => c.id === id)?.name || "Unnamed caller";
  const providerName = (id: string | null) => providers.find((p) => p.id === id)?.name ?? "Unassigned";
  {
    const inv = useMemo(() => rows.filter((w) => w.status !== "cancelled" && totalOf(w) > 0).sort((a, b) => dateOf(b).localeCompare(dateOf(a))), [rows]);
    const paged = usePaged(inv, 12, resetKey);
    const old = useMemo(() => ageing(rows, today()), [rows]);
    const methods = useMemo(() => paymentsByMethod(rows), [rows]);
    const owed = old.reduce((s, b) => s + b.amount, 0);
    const [t, p, b] = [inv.reduce((s, w) => s + totalOf(w), 0), inv.reduce((s, w) => s + paidOf(w), 0), inv.reduce((s, w) => s + balanceOf(w), 0)];
    return (
      <>
        <section className={card}>
          <header className="border-b border-border px-5 py-4"><h2 className="font-semibold">Invoices</h2><p className="text-sm text-muted-foreground">Every invoiced job in this report, newest first.</p></header>
          {inv.length === 0 ? <p className="px-5 py-10 text-center text-sm text-muted-foreground">No invoiced jobs in this report. Add prices on a work order to invoice it.</p> : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[56rem]">
                  <thead className="border-b border-border bg-muted/40"><tr>
                    <th className={th}>Invoice</th><th className={th}>Date</th><th className={th}>Customer</th><th className={th}>Job</th>
                    <th className={cn(th, "text-right")}>Total</th><th className={cn(th, "text-right")}>Paid</th><th className={cn(th, "text-right")}>Balance</th><th className={th}>Status</th>
                  </tr></thead>
                  <tbody className="divide-y divide-border">
                    {paged.items.map((w) => (
                      <tr key={w.id} className="hover:bg-muted/40">
                        <td className={td}><Link href={`/admin/invoice/${w.id}`} className="font-medium underline-offset-4 hover:underline">{invoiceNo(w)}</Link></td>
                        <td className={cn(td, "whitespace-nowrap")}>{fmtDate(dateOf(w))}</td>
                        <td className={td}>{nameOf(w.customerId)}</td>
                        <td className={cn(td, "max-w-[16rem] truncate")} title={`${w.title} · ${providerName(w.providerId)}`}>{w.title}<span className="block truncate text-xs text-muted-foreground">{w.category} · {providerName(w.providerId)}</span></td>
                        <td className={cn(td, "whitespace-nowrap text-right")}>{money(totalOf(w))}</td>
                        <td className={cn(td, "whitespace-nowrap text-right")}>{money(paidOf(w))}</td>
                        <td className={cn(td, "whitespace-nowrap text-right font-medium")}>{money(balanceOf(w))}</td>
                        <td className={td}><span className={cn("rounded-md px-2 py-0.5 text-xs font-medium", payStatus(w) === "paid" ? "bg-muted text-muted-foreground" : "bg-brand text-primary")}>{PAY[payStatus(w)]}</span></td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="border-t border-border bg-muted/40"><tr>
                    <td className={cn(td, "font-semibold")} colSpan={4}>Total · {inv.length} invoice{inv.length === 1 ? "" : "s"}</td>
                    <td className={cn(td, "whitespace-nowrap text-right font-semibold")}>{money(t)}</td>
                    <td className={cn(td, "whitespace-nowrap text-right font-semibold")}>{money(p)}</td>
                    <td className={cn(td, "whitespace-nowrap text-right font-semibold")}>{money(b)}</td><td />
                  </tr></tfoot>
                </table>
              </div>
              <Pagination {...paged} />
            </>
          )}
        </section>

        <div className="grid gap-6 lg:grid-cols-2 [&>*]:min-w-0">
          <section className={card}>
            <header className="border-b border-border px-5 py-4"><h2 className="font-semibold">Money still owed</h2><p className="text-sm text-muted-foreground">By how long ago the job was.</p></header>
            <ul className="divide-y divide-border">
              {old.map((a) => (
                <li key={a.label} className="px-5 py-3">
                  <div className="flex items-baseline justify-between gap-3 text-sm"><span>{a.label}</span><span className="font-medium">{money(a.amount)} <span className="font-normal text-muted-foreground">· {a.count}</span></span></div>
                  <div className="mt-2 h-2 rounded-full bg-muted"><div className="h-2 rounded-full bg-primary" style={{ width: `${owed ? (a.amount / owed) * 100 : 0}%` }} /></div>
                </li>
              ))}
              <li className="flex justify-between px-5 py-3 text-sm font-semibold"><span>Total owed</span><span>{money(owed)}</span></li>
            </ul>
          </section>
          <section className={card}>
            <header className="border-b border-border px-5 py-4"><h2 className="font-semibold">Payments received</h2><p className="text-sm text-muted-foreground">By payment method.</p></header>
            {methods.length === 0 ? <p className="px-5 py-10 text-center text-sm text-muted-foreground">No payments recorded for these jobs.</p> : (
              <ul className="divide-y divide-border">
                {methods.map((m) => (
                  <li key={m.method} className="flex items-baseline justify-between gap-3 px-5 py-3 text-sm"><span>{m.method}</span><span className="font-medium">{money(m.amount)} <span className="font-normal text-muted-foreground">· {m.count} payment{m.count === 1 ? "" : "s"}</span></span></li>
                ))}
                <li className="flex justify-between px-5 py-3 text-sm font-semibold"><span>Total received</span><span>{money(methods.reduce((s, m) => s + m.amount, 0))}</span></li>
              </ul>
            )}
          </section>
        </div>
      </>
    );
  }
}

// ---------- Operations ----------
function Bars({ items, format }: { items: { name: string; value: number; note?: string }[]; format?: (n: number) => string }) {
  const max = Math.max(1, ...items.map((i) => i.value));
  return (
    <ul className="divide-y divide-border">
      {items.map((i) => (
        <li key={i.name} className="px-5 py-3">
          <div className="flex items-baseline justify-between gap-3 text-sm"><span className="truncate">{i.name}</span><span className="shrink-0 font-medium">{format ? format(i.value) : i.value}{i.note && <span className="font-normal text-muted-foreground"> · {i.note}</span>}</span></div>
          <div className="mt-2 h-2 rounded-full bg-muted"><div className="h-2 rounded-full bg-primary" style={{ width: `${(i.value / max) * 100}%` }} /></div>
        </li>
      ))}
    </ul>
  );
}

function Operations({ rows }: { rows: ReturnType<typeof filterOrders> }) {
  const { customers, providers } = useStore();
  const byStatus = (Object.keys(STATUS_LABEL) as (keyof typeof STATUS_LABEL)[]).map((s) => ({ name: STATUS_LABEL[s], value: rows.filter((w) => w.status === s).length }));
  const byTrade = useMemo(() => groupBy(rows, (w) => w.category), [rows]);
  const byArea = useMemo(() => groupBy(rows, (w) => w.area, "No area"), [rows]);
  const byType = useMemo(() => groupBy(rows, (w) => w.type, "Not set"), [rows]);
  const tr = useMemo(() => trend(rows), [rows]);
  const maxJobs = Math.max(1, ...tr.points.map((p) => p.jobs));
  const sorted = useMemo(() => [...rows].sort((a, b) => dateOf(b).localeCompare(dateOf(a)) || (b.time ?? "").localeCompare(a.time ?? "")), [rows]);
  const paged = usePaged(sorted, 12, rows.length + rows.map((w) => w.id).join().length + "");
  const nameOf = (id: string) => customers.find((c) => c.id === id)?.name || "Unnamed caller";
  const providerName = (id: string | null) => providers.find((p) => p.id === id)?.name ?? "Unassigned";
  const s = summarise(rows);
  return (
    <>
      <section className={card}>
        <header className="border-b border-border px-5 py-4"><h2 className="font-semibold">Jobs over time</h2><p className="text-sm text-muted-foreground">Jobs per {tr.unit}. Hover a bar for the value invoiced.</p></header>
        <div className="overflow-x-auto px-5 pb-4 pt-5">
          <div className="flex h-40 items-end gap-1.5" style={{ minWidth: `${tr.points.length * 1.6}rem` }}>
            {tr.points.map((p) => (
              <div key={p.key} className="flex h-full min-w-0 flex-1 flex-col justify-end" title={`${p.label}: ${p.jobs} job${p.jobs === 1 ? "" : "s"}, ${money(p.invoiced)} invoiced`}>
                {p.jobs > 0 && <span className="mb-1 text-center text-[11px] font-medium">{p.jobs}</span>}
                <div className={cn("w-full rounded-t-sm", p.jobs ? "bg-primary" : "bg-muted")} style={{ height: `${p.jobs ? Math.max(6, (p.jobs / maxJobs) * 100) : 2}%` }} />
              </div>
            ))}
          </div>
          <div className="mt-2 flex gap-1.5" style={{ minWidth: `${tr.points.length * 1.6}rem` }}>
            {tr.points.map((p, i) => <span key={p.key} className="flex min-w-0 flex-1 justify-center whitespace-nowrap text-[11px] text-muted-foreground">{i % Math.max(1, Math.ceil(tr.points.length / 8)) ? "" : p.label}</span>)}
          </div>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2 [&>*]:min-w-0">
        <section className={card}>
          <header className="border-b border-border px-5 py-4"><h2 className="font-semibold">Where jobs stand</h2><p className="text-sm text-muted-foreground">{s.unassigned} open job{s.unassigned === 1 ? "" : "s"} without a worker · {s.urgent} urgent</p></header>
          <Bars items={byStatus} />
        </section>
        <section className={card}>
          <header className="border-b border-border px-5 py-4"><h2 className="font-semibold">By trade</h2><p className="text-sm text-muted-foreground">Jobs, with the value invoiced.</p></header>
          <Bars items={byTrade.map((g) => ({ name: g.name, value: g.jobs, note: money(g.invoiced) }))} />
        </section>
        <section className={card}>
          <header className="border-b border-border px-5 py-4"><h2 className="font-semibold">By area</h2><p className="text-sm text-muted-foreground">Where the work is.</p></header>
          <Bars items={byArea.map((g) => ({ name: g.name, value: g.jobs, note: money(g.invoiced) }))} />
        </section>
        <section className={card}>
          <header className="border-b border-border px-5 py-4"><h2 className="font-semibold">By job type</h2><p className="text-sm text-muted-foreground">Repair, installation, inspection, maintenance.</p></header>
          <Bars items={byType.map((g) => ({ name: g.name, value: g.jobs, note: `${g.completed} done` }))} />
        </section>
      </div>

      <section className={card}>
        <header className="border-b border-border px-5 py-4"><h2 className="font-semibold">Operations log</h2><p className="text-sm text-muted-foreground">Every job in this report, newest first.</p></header>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[52rem]">
            <thead className="border-b border-border bg-muted/40"><tr><th className={th}>Work order</th><th className={th}>Date</th><th className={th}>Customer</th><th className={th}>Job</th><th className={th}>Area</th><th className={th}>Provider</th><th className={th}>Status</th></tr></thead>
            <tbody className="divide-y divide-border">
              {paged.items.map((w) => (
                <tr key={w.id} className="hover:bg-muted/40">
                  <td className={td}><Link href={`/admin/work-orders/${w.id}`} className="font-medium underline-offset-4 hover:underline">{w.no}</Link></td>
                  <td className={cn(td, "whitespace-nowrap")}>{fmtDate(dateOf(w))}{w.time && <span className="block text-xs text-muted-foreground">{w.time}</span>}</td>
                  <td className={td}>{nameOf(w.customerId)}</td>
                  <td className={cn(td, "max-w-[16rem] truncate")}>{w.title}<span className="block truncate text-xs text-muted-foreground">{w.category}{w.type ? ` · ${w.type}` : ""}{w.priority === "urgent" ? " · Urgent" : ""}</span></td>
                  <td className={td}>{w.area || "—"}</td>
                  <td className={td}>{providerName(w.providerId)}</td>
                  <td className={td}><span className="rounded-md bg-muted px-2 py-0.5 text-xs font-medium">{STATUS_LABEL[w.status]}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pagination {...paged} />
      </section>
    </>
  );
}

// ---------- Worker productivity ----------
type SortKey = "name" | "assigned" | "completed" | "completionRate" | "hours" | "invoiced" | "avgJob" | "rating";
function Workers({ rows }: { rows: ReturnType<typeof filterOrders> }) {
  const { providers, ratings } = useStore();
  const [sort, setSort] = useState<{ key: SortKey; dir: 1 | -1 }>({ key: "completed", dir: -1 });
  const data = useMemo(() => {
    const list = workerRows(rows, providers, ratings);
    return list.sort((a, b) => {
      const [x, y] = [a[sort.key], b[sort.key]];
      if (typeof x === "string" && typeof y === "string") return x.localeCompare(y) * sort.dir;
      return (((x as number | null) ?? -1) - ((y as number | null) ?? -1)) * sort.dir || a.name.localeCompare(b.name);
    });
  }, [rows, providers, ratings, sort]);
  const unassigned = rows.filter((w) => !w.providerId && w.status !== "cancelled");
  const head = (key: SortKey, label: string, right = true) => (
    <th className={cn(th, right && "text-right")} aria-sort={sort.key === key ? (sort.dir === 1 ? "ascending" : "descending") : "none"}>
      <button onClick={() => setSort((s) => ({ key, dir: s.key === key ? (s.dir === 1 ? -1 : 1) : key === "name" ? 1 : -1 }))} className="inline-flex items-center gap-1 uppercase tracking-wide hover:text-foreground">
        {label}{sort.key === key && (sort.dir === 1 ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />)}
      </button>
    </th>
  );
  const top = data.filter((d) => d.completed > 0)[0];
  return (
    <section className={card}>
      <header className="border-b border-border px-5 py-4">
        <h2 className="font-semibold">Worker productivity</h2>
        <p className="text-sm text-muted-foreground">
          Completion rate is completed jobs out of all assigned jobs that were not cancelled. Hours are the booked length of completed jobs. Click a heading to sort.
        </p>
      </header>
      {data.length === 0 ? <p className="px-5 py-10 text-center text-sm text-muted-foreground">No team members yet.</p> : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[60rem]">
            <thead className="border-b border-border bg-muted/40"><tr>
              {head("name", "Worker", false)}{head("assigned", "Assigned")}{head("completed", "Completed")}<th className={cn(th, "text-right")}>Active</th>
              {head("completionRate", "Completion")}{head("hours", "Hours")}{head("invoiced", "Invoiced")}{head("avgJob", "Avg job")}{head("rating", "Rating")}
            </tr></thead>
            <tbody className="divide-y divide-border">
              {data.map((r: WorkerRow) => (
                <tr key={r.id} className="hover:bg-muted/40">
                  <td className={td}><span className="font-medium">{r.name}</span>{r.left && <span className="ml-2 rounded-md bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">Left</span>}<span className="block text-xs text-muted-foreground">{r.category}</span></td>
                  <td className={cn(td, "text-right")}>{r.assigned}</td>
                  <td className={cn(td, "text-right font-medium")}>{r.completed}</td>
                  <td className={cn(td, "text-right")}>{r.active}</td>
                  <td className={cn(td, "text-right")}>{pct(r.completionRate)}</td>
                  <td className={cn(td, "text-right")}>{r.hours}</td>
                  <td className={cn(td, "whitespace-nowrap text-right")}>{money(r.invoiced)}<span className="block text-xs text-muted-foreground">{money(r.collected)} collected</span></td>
                  <td className={cn(td, "whitespace-nowrap text-right")}>{r.completed ? money(Math.round(r.avgJob)) : "—"}</td>
                  <td className={cn(td, "whitespace-nowrap text-right")}>{r.rating ? `${r.rating.toFixed(1)} ★` : "—"}{r.ratings > 0 && <span className="block text-xs text-muted-foreground">{r.ratings} rating{r.ratings === 1 ? "" : "s"}</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <footer className="border-t border-border px-5 py-3 text-sm text-muted-foreground">
        {top ? <>Most jobs completed: <strong className="font-semibold text-foreground">{top.name}</strong> ({top.completed}). </> : "No jobs completed in this report yet. "}
        {unassigned.length > 0 && <>{unassigned.length} job{unassigned.length === 1 ? " has" : "s have"} no worker assigned and {unassigned.length === 1 ? "is" : "are"} not counted above.</>}
      </footer>
    </section>
  );
}
