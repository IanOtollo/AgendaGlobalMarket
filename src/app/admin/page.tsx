"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/layout/admin-shell";
import { WorkerDrawer } from "@/components/admin/worker-drawer";
import { balanceOf } from "@/lib/billing";
import { STATUS_LABEL } from "@/lib/config";
import { slot } from "@/lib/schedule";
import { availability, isWorking } from "@/lib/team";
import { cn, money, today } from "@/lib/utils";
import type { WorkOrder } from "@/lib/types";

export default function Dashboard() {
  const { workOrders, customers, providers } = useStore();
  const router = useRouter();
  const [opening, startOpening] = useTransition();
  const [workerId, setWorkerId] = useState<string | null>(null);
  const openOrder = (id: string) => router.push(`/admin/work-orders/${id}`);

  const cust = (id: string) => customers.find((c) => c.id === id)?.name ?? "—";
  const open = workOrders.filter((w) => w.status !== "cancelled");
  const needs = open.filter((w) => w.status === "new" || (w.priority === "urgent" && w.status !== "completed"));
  const todays = open.filter((w) => w.date === today()).sort((a, b) => (a.time ?? "").localeCompare(b.time ?? ""));
  const count = (s: WorkOrder["status"]) => workOrders.filter((w) => w.status === s).length;
  const outstanding = open.reduce((s, w) => s + Math.max(0, balanceOf(w)), 0);

  const kpis = [
    { label: "Awaiting assignment", value: count("new") },
    { label: "Scheduled", value: count("scheduled") },
    { label: "In progress", value: count("in_progress") },
    { label: "Completed", value: count("completed") },
    { label: "Outstanding balance", value: money(outstanding) },
  ];
  const card = "rounded-lg border border-border bg-card";
  const row = "flex w-full items-center gap-4 px-5 py-3 text-left transition hover:bg-muted/60";

  return (
    <>
      <PageHeader title="Dashboard" subtitle={new Date().toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
        action={<Button disabled={opening} onClick={() => startOpening(() => router.push("/admin/work-orders/new"))}><Plus className="h-4 w-4" /> {opening ? "Opening…" : "New work order"}</Button>} />

      <dl className={cn(card, "grid grid-cols-2 divide-border sm:grid-cols-3 lg:grid-cols-5 lg:divide-x")}>
        {kpis.map((k) => (
          <div key={k.label} className="border-b border-border p-5 last:border-b-0 lg:border-b-0">
            <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{k.label}</dt>
            <dd className="mt-2 text-2xl font-semibold tracking-tight">{k.value}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-6 grid gap-6 xl:grid-cols-2 [&>*]:min-w-0">
        <section className={card}>
          <header className="border-b border-border px-5 py-4">
            <h2 className="font-semibold">Needs attention</h2>
            <p className="text-sm text-muted-foreground">Jobs without a provider, and urgent jobs.</p>
          </header>
          <ul className="divide-y divide-border">
            {needs.map((w) => (
              <li key={w.id}>
                <button onClick={() => openOrder(w.id)} className={cn(row, "flex-wrap sm:flex-nowrap")}>
                  <span className="min-w-0 flex-1 basis-full sm:basis-0">
                    <span className="block truncate text-sm font-medium">{w.no} · {w.title}</span>
                    <span className="block truncate text-sm text-muted-foreground">{cust(w.customerId)} · {w.category}</span>
                  </span>
                  {w.priority === "urgent" && <span className="rounded-md bg-destructive/10 px-2 py-0.5 text-xs font-medium text-destructive">Urgent</span>}
                  {!w.providerId && <span className="rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">Unassigned</span>}
                </button>
              </li>
            ))}
            {!needs.length && <li className="px-5 py-10 text-center text-sm text-muted-foreground">Nothing needs attention.</li>}
          </ul>
        </section>

        <section className={card}>
          <header className="border-b border-border px-5 py-4">
            <h2 className="font-semibold">Today&apos;s schedule</h2>
            <p className="text-sm text-muted-foreground">In order of start time.</p>
          </header>
          <ul className="divide-y divide-border">
            {todays.map((w) => (
              <li key={w.id}>
                <button onClick={() => openOrder(w.id)} className={row}>
                  <span className="w-28 shrink-0 text-sm font-medium tabular-nums">{slot(w) || "Time not set"}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{w.title}</span>
                    <span className="block truncate text-sm text-muted-foreground">{providers.find((p) => p.id === w.providerId)?.name ?? "Unassigned"} · {cust(w.customerId)}</span>
                  </span>
                  <span className="text-xs text-muted-foreground">{STATUS_LABEL[w.status]}</span>
                </button>
              </li>
            ))}
            {!todays.length && <li className="px-5 py-10 text-center text-sm text-muted-foreground">No jobs scheduled for today.</li>}
          </ul>
        </section>
      </div>

      <section className={cn(card, "mt-6")}>
        <header className="border-b border-border px-5 py-4">
          <h2 className="font-semibold">Team right now</h2>
          <p className="text-sm text-muted-foreground">Check who is free before you promise a time. Select a person to open their profile.</p>
        </header>
        <ul className="divide-y divide-border">
          {providers.filter(isWorking).map((p) => {
            const s = availability(p.id, workOrders);
            return (
              <li key={p.id}>
                <button onClick={() => setWorkerId(p.id)} className={row}>
                  <span className={cn("h-2 w-2 shrink-0 rounded-full", s.busy ? "bg-warning" : "bg-success")} aria-hidden />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{p.name}</span>
                    <span className="block truncate text-sm text-muted-foreground">{p.category} · {p.area}</span>
                  </span>
                  <span className="hidden text-sm text-muted-foreground sm:block">{s.text}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      <WorkerDrawer id={workerId} onClose={() => setWorkerId(null)} />
    </>
  );
}
