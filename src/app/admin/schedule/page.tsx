"use client";
import { useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/layout/admin-shell";
import { slot } from "@/lib/schedule";
import { isWorking } from "@/lib/team";
import { cn } from "@/lib/utils";

const iso = (d: Date) => {
  const x = new Date(d);
  x.setMinutes(x.getMinutes() - x.getTimezoneOffset());
  return x.toISOString().slice(0, 10);
};
const tone = {
  new: "bg-info/10", scheduled: "bg-warning/10", in_progress: "bg-warning/10", completed: "bg-success/10", cancelled: "bg-muted",
} as const;

export default function Schedule() {
  const { workOrders, providers, customers } = useStore();
  const [offset, setOffset] = useState(0);

  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + offset * 7 + i);
    return d;
  });
  const unassigned = workOrders.filter((w) => !w.providerId && w.date && w.status !== "cancelled");

  return (
    <>
      <PageHeader title="Team schedule" action={
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={() => setOffset(offset - 1)} aria-label="Previous week"><ChevronLeft className="h-4 w-4" /></Button>
          <Button variant="secondary" size="sm" onClick={() => setOffset(0)}>Today</Button>
          <Button variant="secondary" size="sm" onClick={() => setOffset(offset + 1)} aria-label="Next week"><ChevronRight className="h-4 w-4" /></Button>
        </div>
      } />
      <p className="mb-6 text-sm text-muted-foreground">Every provider&apos;s week at a glance. Empty cells are free, so book from there.</p>

      <div className="overflow-x-auto rounded-lg border border-border/50 bg-card">
        <table className="w-full min-w-[56rem] table-fixed text-left text-sm">
          <thead className="border-b border-border/60">
            <tr>
              <th className="sticky left-0 z-10 w-36 bg-card px-4 py-3 font-medium text-muted-foreground sm:w-44">Provider</th>
              {days.map((d) => (
                <th key={iso(d)} className={cn("px-2 py-3 font-medium", iso(d) === iso(new Date()) ? "text-foreground" : "text-muted-foreground")}>
                  {d.toLocaleDateString(undefined, { weekday: "short", day: "numeric" })}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {providers.filter(isWorking).map((p) => (
              <tr key={p.id} className="align-top">
                <td className="sticky left-0 z-10 bg-card px-4 py-3"><p className="font-medium">{p.name}</p><p className="text-xs text-muted-foreground">{p.category}</p></td>
                {days.map((d) => {
                  const jobs = workOrders
                    .filter((w) => w.providerId === p.id && w.date === iso(d) && w.status !== "cancelled")
                    .sort((a, b) => (a.time ?? "").localeCompare(b.time ?? ""));
                  return (
                    <td key={iso(d)} className="space-y-1 p-2">
                      {jobs.map((w) => (
                        <Link key={w.id} href={`/admin/work-orders/${w.id}`}
                          className={cn("block w-full rounded-md p-2 text-left text-xs transition hover:opacity-80", tone[w.status])}>
                          <p className="font-semibold">{slot(w) || "Anytime"}</p>
                          <p className="truncate">{w.title}</p>
                          <p className="truncate text-muted-foreground">{customers.find((c) => c.id === w.customerId)?.name}</p>
                        </Link>
                      ))}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {unassigned.length > 0 && (
        <div className="mt-6 rounded-lg border border-border/50 bg-card p-6">
          <h2 className="mb-3 text-lg font-semibold">Dated but unassigned</h2>
          <ul className="space-y-1 text-sm text-muted-foreground">
            {unassigned.map((w) => <li key={w.id}>{w.no} · {w.title} · {w.date} {slot(w)}</li>)}
          </ul>
        </div>
      )}
    </>
  );
}
