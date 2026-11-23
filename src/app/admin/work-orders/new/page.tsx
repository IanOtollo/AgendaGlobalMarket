"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertTriangle, ChevronRight, UserCheck } from "lucide-react";
import { useStore } from "@/lib/store";
import { AREAS, CATEGORIES, JOB_TYPES } from "@/lib/config";
import { CATEGORY_ICONS } from "@/lib/icons";
import { DEFAULT_HOURS, findConflict, slot } from "@/lib/schedule";
import { isBookable } from "@/lib/team";
import { cn, digits } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import type { JobType, Priority } from "@/lib/types";

const blank = {
  phone: "", name: "", address: "", category: CATEGORIES[0] as string, type: "Repair" as JobType, title: "", description: "",
  priority: "normal" as Priority, billable: "yes", area: "", providerId: "", date: "", time: "", hours: String(DEFAULT_HOURS), price: "",
};

export default function NewWorkOrderPage() {
  const router = useRouter();
  const { customers, providers, workOrders, addCustomer, addWorkOrder } = useStore();
  // /admin/work-orders/new?date=YYYY-MM-DD (from the calendar) pre-fills the day.
  const [f, setF] = useState(() => {
    const d = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("date") ?? "" : "";
    return { ...blank, date: /^d{4}-d{2}-d{2}$/.test(d) ? d : "" };
  });
  const set = (k: keyof typeof blank) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setF((s) => ({ ...s, [k]: e.target.value }));

  // Phone-first: a returning caller is recognised by their number.
  const known = digits(f.phone).length >= 7 ? customers.find((c) => digits(c.phone).endsWith(digits(f.phone).slice(-9))) : undefined;
  const hours = Number(f.hours);
  const options = providers.filter((p) => isBookable(p) && p.category === f.category);
  const busy = (id: string) => findConflict(workOrders, id, f.date, f.time, hours);
  const clash = busy(f.providerId);
  const valid = f.phone && (known || f.name) && f.title && !clash;

  const create = () => {
    const customerId = known ? known.id : addCustomer({ name: f.name, phone: f.phone, address: f.address });
    const scheduled = !!(f.providerId && f.date && f.time);
    const id = addWorkOrder({
      customerId, category: f.category, type: f.type, title: f.title, description: f.description, priority: f.priority,
      billable: f.billable === "yes", area: f.area || undefined, providerId: f.providerId || null,
      date: f.date || undefined, time: f.time || undefined, duration: hours, price: f.price ? Number(f.price) : undefined,
      notes: "", tasks: [], status: scheduled ? "scheduled" : "new",
    });
    router.push(`/admin/work-orders/${id}`);
  };

  return (
    <>
      <nav className="mb-4 flex items-center gap-1.5 text-sm text-muted-foreground" aria-label="Breadcrumb">
        <Link href="/admin/work-orders" className="transition hover:text-foreground">Work orders</Link>
        <ChevronRight className="h-3.5 w-3.5" /><span className="text-foreground">New</span>
      </nav>
      <h1 className="mb-6 text-2xl font-semibold tracking-tight">New work order</h1>

      <div className="grid gap-6 lg:grid-cols-3 [&>*]:min-w-0">
        <div className="space-y-6 lg:col-span-2">
          <Card title="Customer" subtitle="Enter the caller's number. Returning customers are recognised automatically.">
            <div className="space-y-4">
              <Field label="Phone number"><Input value={f.phone} onChange={set("phone")} inputMode="tel" placeholder="+254 7…" autoFocus /></Field>
              {known ? (
                <p className="flex items-center gap-3 rounded-md bg-success/10 p-3 text-sm text-success">
                  <UserCheck className="h-4 w-4 shrink-0" />
                  <span><span className="font-semibold">{known.name}</span> · existing customer{known.address && `, ${known.address}`}</span>
                </p>
              ) : f.phone.length > 5 ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Name"><Input value={f.name} onChange={set("name")} /></Field>
                  <Field label="Address"><Input value={f.address} onChange={set("address")} /></Field>
                </div>
              ) : null}
            </div>
          </Card>

          <Card title="Job details">
            <div className="space-y-4">
              <div>
                <p className="mb-1.5 text-sm font-medium text-muted-foreground">Trade</p>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
                  {CATEGORIES.map((c) => {
                    const Icon = CATEGORY_ICONS[c];
                    return (
                      <button key={c} type="button" onClick={() => setF((s) => ({ ...s, category: c, providerId: "" }))}
                        className={cn("flex items-center justify-center gap-2 rounded-md border px-3 py-2.5 text-sm font-medium transition",
                          f.category === c ? "border-primary bg-primary text-primary-foreground" : "border-border hover:bg-muted")}>
                        <Icon className="h-4 w-4" />{c}
                      </button>
                    );
                  })}
                </div>
              </div>
              <Field label="Job title"><Input value={f.title} onChange={set("title")} placeholder="e.g. Fix leaking kitchen tap" /></Field>
              <div className="grid gap-4 sm:grid-cols-3">
                <Field label="Job type"><Select value={f.type} onChange={set("type")}>{JOB_TYPES.map((t) => <option key={t}>{t}</option>)}</Select></Field>
                <Field label="Priority"><Select value={f.priority} onChange={set("priority")}><option value="low">Low</option><option value="normal">Normal</option><option value="urgent">Urgent</option></Select></Field>
                <Field label="Billing"><Select value={f.billable} onChange={set("billable")}><option value="yes">Billable</option><option value="no">Non-billable</option></Select></Field>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Service area"><Select value={f.area} onChange={set("area")}><option value="">Not set</option>{Object.keys(AREAS).map((a) => <option key={a}>{a}</option>)}</Select></Field>
                <Field label="Quoted price (optional)"><Input type="number" value={f.price} onChange={set("price")} /></Field>
              </div>
              <Field label="Description of the work"><Textarea rows={4} value={f.description} onChange={set("description")} placeholder="What the customer reported and what needs to be done." /></Field>
            </div>
          </Card>
        </div>

        <aside className="space-y-6">
          <Card title="Appointment" subtitle="Optional. You can schedule later from the work order.">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <Field label="Date"><Input type="date" value={f.date} onChange={set("date")} /></Field>
                <Field label="Start time"><Input type="time" value={f.time} onChange={set("time")} /></Field>
              </div>
              <Field label="Expected duration">
                <Select value={f.hours} onChange={set("hours")}>{[1, 2, 3, 4, 6, 8].map((h) => <option key={h} value={h}>{h} hour{h > 1 ? "s" : ""}</option>)}</Select>
              </Field>
              <Field label="Provider">
                <Select value={f.providerId} onChange={set("providerId")}>
                  <option value="">Assign later</option>
                  {options.map((p) => {
                    const c = busy(p.id);
                    return <option key={p.id} value={p.id} disabled={!!c}>{p.name} · {p.years} yrs{c ? ` · busy ${slot(c)}` : ""}</option>;
                  })}
                </Select>
              </Field>
              {clash && (
                <p className="flex items-start gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /> Already booked: {clash.no} at {slot(clash)}.
                </p>
              )}
            </div>
          </Card>
          <div className="flex gap-3">
            <Button variant="secondary" className="flex-1" onClick={() => router.push("/admin/work-orders")}>Cancel</Button>
            <Button className="flex-1" disabled={!valid} onClick={create}>Create work order</Button>
          </div>
        </aside>
      </div>
    </>
  );
}
