"use client";
import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Search } from "lucide-react";
import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Pagination, usePaged } from "@/components/ui/pagination";
import { PageHeader } from "@/components/layout/admin-shell";
import { payStatus, totalOf } from "@/lib/billing";
import { STATUS_LABEL } from "@/lib/config";
import { slot } from "@/lib/schedule";
import { cn, fmtDate, money } from "@/lib/utils";
import type { WOStatus } from "@/lib/types";

const TABS = ["all", "new", "scheduled", "in_progress", "completed", "cancelled"] as const;
const PAY = { none: "—", unpaid: "Unpaid", part: "Part paid", paid: "Paid" } as const;

export default function WorkOrders() {
  const router = useRouter();
  const [opening, startOpening] = useTransition();
  const { workOrders, customers, providers } = useStore();
  const [tab, setTab] = useState<"all" | WOStatus>("all");
  const [q, setQ] = useState("");

  const t = q.trim().toLowerCase();
  const matches = (w: (typeof workOrders)[number]) => {
    if (!t) return true;
    const c = customers.find((x) => x.id === w.customerId);
    const p = providers.find((x) => x.id === w.providerId);
    return [w.no, w.title, w.category, c?.name, c?.phone, p?.name].some((s) => s?.toLowerCase().includes(t));
  };
  const count = (s: "all" | WOStatus) => workOrders.filter((w) => (s === "all" ? w.status !== "cancelled" : w.status === s) && matches(w)).length;
  const rows = workOrders.filter((w) => (tab === "all" ? w.status !== "cancelled" : w.status === tab) && matches(w));
  const paged = usePaged(rows, 15, `${tab}|${q}`);

  return (
    <>
      <PageHeader title="Work orders" subtitle="Every job, from first call to final payment."
        action={<Button disabled={opening} onClick={() => startOpening(() => router.push("/admin/work-orders/new"))}><Plus className="h-4 w-4" /> {opening ? "Opening…" : "New work order"}</Button>} />

      <div className="rounded-lg border border-border bg-card">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 pt-3">
          <div role="tablist" className="flex flex-wrap gap-x-5">
            {TABS.map((s) => (
              <button key={s} role="tab" aria-selected={tab === s} onClick={() => setTab(s)}
                className={cn("-mb-px border-b-2 px-1 pb-3 text-sm font-medium transition",
                  tab === s ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground")}>
                {s === "all" ? "All" : STATUS_LABEL[s]} <span className="ml-1 text-xs text-muted-foreground">{count(s)}</span>
              </button>
            ))}
          </div>
          <div className="relative mb-3">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Filter by customer, job or provider"
              className="w-64 rounded-md border border-border bg-background py-2 pl-9 pr-3 text-sm outline-none transition focus:border-foreground/40" />
          </div>
        </div>

        {/* Phones: one stacked row per job */}
        <ul className="divide-y divide-border md:hidden">
          {paged.items.map((w) => {
            const customer = customers.find((c) => c.id === w.customerId);
            const provider = providers.find((p) => p.id === w.providerId);
            return (
              <li key={w.id}>
                <Link href={`/admin/work-orders/${w.id}`} className="block px-4 py-3.5 transition hover:bg-muted/60">
                  <span className="flex items-center justify-between gap-3">
                    <span className="text-sm font-medium">{w.no}</span>
                    <Badge kind={w.status}>{STATUS_LABEL[w.status]}</Badge>
                  </span>
                  <span className="mt-1 block truncate text-sm">{w.title}</span>
                  <span className="block truncate text-sm text-muted-foreground">{customer?.name ?? "—"} · {w.category}</span>
                  <span className="mt-1 block truncate text-xs text-muted-foreground">
                    {provider?.name ?? "Unassigned"}{w.date ? ` · ${fmtDate(w.date)} ${slot(w)}` : " · Not scheduled"}
                  </span>
                </Link>
              </li>
            );
          })}
          {!rows.length && <li className="px-4 py-12 text-center text-sm text-muted-foreground">No work orders match.</li>}
        </ul>

        <div className="hidden overflow-x-auto md:block">
          <table className="w-full min-w-[56rem] text-left text-sm">
            <thead className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                {["Work order", "Customer", "Service", "Provider", "Appointment", "Status", "Payment", "Total"].map((h) => (
                  <th key={h} className={cn("px-4 py-3 font-medium", h === "Total" && "text-right")}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {paged.items.map((w) => {
                const customer = customers.find((c) => c.id === w.customerId);
                const provider = providers.find((p) => p.id === w.providerId);
                return (
                  <tr key={w.id} onClick={() => router.push(`/admin/work-orders/${w.id}`)} className="cursor-pointer transition hover:bg-muted/60">
                    <td className="px-4 py-3">
                      <Link href={`/admin/work-orders/${w.id}`} onClick={(e) => e.stopPropagation()} className="font-medium hover:underline">{w.no}</Link>
                      <p className="max-w-[16rem] truncate text-muted-foreground">{w.title}</p>
                    </td>
                    <td className="px-4 py-3">{customer?.name ?? "—"}</td>
                    <td className="px-4 py-3">{w.category}{w.priority === "urgent" && <span className="ml-2"><Badge kind="urgent">Urgent</Badge></span>}</td>
                    <td className="px-4 py-3">{provider?.name ?? <span className="text-muted-foreground">Unassigned</span>}</td>
                    <td className="px-4 py-3">{w.date ? <>{fmtDate(w.date)}<p className="text-muted-foreground">{slot(w)}</p></> : <span className="text-muted-foreground">Not scheduled</span>}</td>
                    <td className="px-4 py-3"><Badge kind={w.status}>{STATUS_LABEL[w.status]}</Badge></td>
                    <td className="px-4 py-3 text-muted-foreground">{PAY[payStatus(w)]}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{totalOf(w) ? money(totalOf(w)) : "—"}</td>
                  </tr>
                );
              })}
              {!rows.length && <tr><td colSpan={8} className="px-4 py-14 text-center text-muted-foreground">No work orders match.</td></tr>}
            </tbody>
          </table>
        </div>
        <Pagination {...paged} />
      </div>
    </>
  );
}
