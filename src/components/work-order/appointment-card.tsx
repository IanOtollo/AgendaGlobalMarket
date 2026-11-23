"use client";
import { AlertTriangle } from "lucide-react";
import { useStore } from "@/lib/store";
import { activity } from "@/lib/activity";
import { DEFAULT_HOURS, findConflict, slot } from "@/lib/schedule";
import { isBookable } from "@/lib/team";
import { Card } from "@/components/ui/card";
import { Field, Input, Select } from "@/components/ui/field";
import type { WorkOrder } from "@/lib/types";

export function AppointmentCard({ wo, onViewProvider }: { wo: WorkOrder; onViewProvider: (id: string) => void }) {
  const { workOrders, providers, updateWorkOrder } = useStore();
  const hours = wo.duration ?? DEFAULT_HOURS;
  const provider = providers.find((p) => p.id === wo.providerId);
  const busy = (pid: string) => findConflict(workOrders, pid, wo.date, wo.time, hours, wo.id);
  const clash = wo.providerId && wo.status !== "cancelled" ? busy(wo.providerId) : undefined;
  const locked = wo.status === "completed" || wo.status === "cancelled";

  const assign = (pid: string) => {
    const p = providers.find((x) => x.id === pid);
    updateWorkOrder(wo.id, {
      providerId: pid || null,
      activity: [...(wo.activity ?? []), activity(p ? `Assigned to ${p.name}` : "Provider unassigned")],
    });
  };

  return (
    <Card title="Appointment" subtitle="Who attends, and when.">
      <div className="space-y-4">
        <Field label="Provider">
          <Select value={wo.providerId ?? ""} disabled={locked} onChange={(e) => assign(e.target.value)}>
            <option value="">Not assigned</option>
            {providers.filter((p) => p.category === wo.category && (isBookable(p) || p.id === wo.providerId)).map((p) => {
              const c = busy(p.id);
              return <option key={p.id} value={p.id} disabled={!!c}>{p.name} · {p.years} yrs{c ? ` · busy ${slot(c)}` : ""}</option>;
            })}
          </Select>
        </Field>
        {provider && <button onClick={() => onViewProvider(provider.id)} className="text-sm font-medium underline underline-offset-4 transition hover:opacity-70">View {provider.name.split(" ")[0]}&apos;s profile</button>}
        <div className="grid grid-cols-2 gap-3">
          <Field label="Date"><Input type="date" disabled={locked} value={wo.date ?? ""} onChange={(e) => updateWorkOrder(wo.id, { date: e.target.value || undefined })} /></Field>
          <Field label="Start time"><Input type="time" disabled={locked} value={wo.time ?? ""} onChange={(e) => updateWorkOrder(wo.id, { time: e.target.value || undefined })} /></Field>
        </div>
        <Field label="Expected duration">
          <Select value={hours} disabled={locked} onChange={(e) => updateWorkOrder(wo.id, { duration: Number(e.target.value) })}>
            {[1, 2, 3, 4, 6, 8].map((h) => <option key={h} value={h}>{h} hour{h > 1 ? "s" : ""}</option>)}
          </Select>
        </Field>
        {clash && (
          <p className="flex items-start gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            {provider?.name} already has {clash.no} at {slot(clash)}. Change the time or the provider.
          </p>
        )}
      </div>
    </Card>
  );
}
