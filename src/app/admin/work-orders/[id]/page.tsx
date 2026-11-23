"use client";
import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ChevronRight, FileText, MapPin, MessageCircle, Phone } from "lucide-react";
import { useStore } from "@/lib/store";
import { activity } from "@/lib/activity";
import { balanceOf, invoiceNo, payStatus, paidOf, totalOf } from "@/lib/billing";
import { AREAS, JOB_TYPES, STATUS_LABEL } from "@/lib/config";
import { DEFAULT_HOURS, findConflict } from "@/lib/schedule";
import { cn, digits, fmtDate, money } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { useConfirm } from "@/components/ui/confirm";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { Stars } from "@/components/ui/stars";
import { Stepper } from "@/components/work-order/stepper";
import { TasksCard } from "@/components/work-order/tasks-card";
import { LinesCard, PaymentsCard } from "@/components/work-order/lines-card";
import { AppointmentCard } from "@/components/work-order/appointment-card";
import { ActivityCard } from "@/components/work-order/activity-card";
import { WorkerDrawer } from "@/components/admin/worker-drawer";
import type { JobType, WOStatus } from "@/lib/types";

const PAY = {
  none: null,
  unpaid: { label: "Unpaid", tone: "bg-destructive/10 text-destructive" },
  part: { label: "Part paid", tone: "bg-warning/10 text-warning" },
  paid: { label: "Paid", tone: "bg-success/10 text-success" },
} as const;

export default function WorkOrderPage() {
  const { id } = useParams<{ id: string }>();
  const { workOrders, customers, providers, ratings, updateWorkOrder } = useStore();
  const [workerId, setWorkerId] = useState<string | null>(null);
  const [signer, setSigner] = useState("");

  const wo = workOrders.find((w) => w.id === id);
  if (!wo) {
    return (
      <div className="py-24 text-center">
        <h1 className="text-xl font-semibold">Work order not found</h1>
        <Link href="/admin/work-orders" className="mt-4 inline-block text-sm font-medium underline underline-offset-4">Back to work orders</Link>
      </div>
    );
  }

  const customer = customers.find((c) => c.id === wo.customerId);
  const provider = providers.find((p) => p.id === wo.providerId);
  const rating = ratings.find((r) => r.workOrderId === wo.id);
  const tasks = wo.tasks ?? [];
  const tasksOpen = tasks.filter((t) => !t.done).length;
  const hours = wo.duration ?? DEFAULT_HOURS;
  const clash = wo.providerId && wo.status !== "cancelled" ? findConflict(workOrders, wo.providerId, wo.date, wo.time, hours, wo.id) : undefined;
  const ready = !!(wo.providerId && wo.date && wo.time) && !clash;
  const pay = PAY[payStatus(wo)];
  const log = (text: string) => [...(wo.activity ?? []), activity(text)];
  const patch = (p: Parameters<typeof updateWorkOrder>[1]) => updateWorkOrder(wo.id, p);
  const confirm = useConfirm();
  const toast = useToast();
  const guarded = async (to: WOStatus) => {
    if (to === "cancelled" && !(await confirm({ title: `Cancel ${wo.no}?`, body: "The booking is cancelled and the time is freed for others. You can reopen it later.", confirmLabel: "Cancel work order", cancelLabel: "Keep it", danger: true }))) return;
    if (to === "completed" && !(await confirm({ title: `Mark ${wo.no} as completed?`, body: "The customer can then be sent the rating link and the job is invoiced as done.", confirmLabel: "Mark completed" }))) return;
    advance(to);
    toast("success", `${wo.no}: ${STATUS_LABEL[to]}`);
  };
  const advance = (to: WOStatus) => patch({ status: to, activity: log(`Status changed to ${STATUS_LABEL[to]}`) });

  let next: { label: string; to: WOStatus; disabled: boolean; hint?: string } | null = null;
  if (wo.status === "new") next = { label: "Confirm schedule", to: "scheduled", disabled: !ready, hint: ready ? undefined : clash ? "Resolve the scheduling conflict to continue." : "Assign a provider, date and start time to confirm the schedule." };
  else if (wo.status === "scheduled") next = { label: "Start job", to: "in_progress", disabled: !!clash, hint: clash ? "Resolve the scheduling conflict to continue." : undefined };
  else if (wo.status === "in_progress") next = { label: "Mark complete", to: "completed", disabled: tasksOpen > 0, hint: tasksOpen > 0 ? `${tasksOpen} service task${tasksOpen > 1 ? "s" : ""} still open. Complete them before closing the job.` : undefined };

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const wa = (text: string) => `https://wa.me/${digits(customer?.phone ?? "")}?text=${encodeURIComponent(text)}`;
  const confirmMsg = provider ? `Hello ${customer?.name}, your ${wo.category.toLowerCase()} job (${wo.no}) is confirmed for ${fmtDate(wo.date)} at ${wo.time} with ${provider.name}. Reply here if anything changes.` : "";
  const rateMsg = `Thank you for choosing us. Please rate your service: ${origin}/rate/${wo.id}`;
  const link = "inline-flex items-center gap-2 text-sm font-medium transition hover:opacity-70";

  return (
    <>
      <nav className="mb-4 flex items-center gap-1.5 text-sm text-muted-foreground" aria-label="Breadcrumb">
        <Link href="/admin/work-orders" className="transition hover:text-foreground">Work orders</Link>
        <ChevronRight className="h-3.5 w-3.5" /><span className="text-foreground">{wo.no}</span>
      </nav>

      <header className="rounded-lg border border-border bg-card">
        <div className="flex flex-wrap items-start justify-between gap-4 p-5 sm:p-6">
          <div className="min-w-0 flex-1 basis-full sm:basis-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-medium text-muted-foreground">{wo.no}</span>
              <Badge kind={wo.status}>{STATUS_LABEL[wo.status]}</Badge>
              {wo.priority === "urgent" && <Badge kind="urgent">Urgent</Badge>}
              {pay && <span className={cn("inline-flex rounded-md px-2.5 py-0.5 text-xs font-medium", pay.tone)}>{pay.label}</span>}
              {wo.billable === false && <span className="inline-flex rounded-md bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">Non-billable</span>}
            </div>
            <input value={wo.title} onChange={(e) => patch({ title: e.target.value })} aria-label="Job title"
              className="mt-2 w-full rounded-md bg-transparent text-2xl font-semibold tracking-tight outline-none transition hover:bg-muted/60 focus:bg-muted/60" />
            <p className="mt-1 text-sm text-muted-foreground">{customer?.name} · {wo.category}{provider ? ` · ${provider.name}` : " · Unassigned"}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {wo.billable !== false && (
              <Link href={`/admin/invoice/${wo.id}`} className="inline-flex items-center gap-2 rounded-md border border-border px-4 py-2.5 text-sm font-medium transition hover:bg-muted">
                <FileText className="h-4 w-4" /> Invoice
              </Link>
            )}
            {next && <Button disabled={next.disabled} onClick={() => guarded(next!.to)}>{next.label}</Button>}
          </div>
        </div>
        <div className="border-t border-border px-5 py-4 sm:px-6">
          <Stepper status={wo.status} />
          {next?.hint && <p className="mt-3 text-sm text-muted-foreground">{next.hint}</p>}
        </div>
      </header>

      <div className="mt-6 grid gap-6 lg:grid-cols-3 [&>*]:min-w-0">
        <div className="space-y-6 lg:col-span-2">
          <Card title="Job details">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Job type">
                <Select value={wo.type ?? "Repair"} onChange={(e) => patch({ type: e.target.value as JobType })}>
                  {JOB_TYPES.map((t) => <option key={t}>{t}</option>)}
                </Select>
              </Field>
              <Field label="Trade"><Input value={wo.category} disabled /></Field>
              <Field label="Priority">
                <Select value={wo.priority} onChange={(e) => patch({ priority: e.target.value as typeof wo.priority })}>
                  <option value="low">Low</option><option value="normal">Normal</option><option value="urgent">Urgent</option>
                </Select>
              </Field>
              <Field label="Billing">
                <Select value={wo.billable === false ? "no" : "yes"} onChange={(e) => patch({ billable: e.target.value === "yes" })}>
                  <option value="yes">Billable</option><option value="no">Non-billable</option>
                </Select>
              </Field>
              <div className="sm:col-span-2">
                <Field label="Service area">
                  <Select value={wo.area ?? ""} onChange={(e) => patch({ area: e.target.value || undefined })}>
                    <option value="">Not set</option>
                    {Object.keys(AREAS).map((a) => <option key={a}>{a}</option>)}
                  </Select>
                </Field>
              </div>
              <div className="sm:col-span-2">
                <Field label="Description of the work">
                  <Textarea rows={4} value={wo.description} onChange={(e) => patch({ description: e.target.value })} placeholder="What the customer reported and what needs to be done." />
                </Field>
              </div>
            </div>
          </Card>

          <TasksCard wo={wo} />
          <LinesCard wo={wo} />
          {wo.billable !== false && <PaymentsCard wo={wo} />}

          <Card title="Service report" subtitle="Findings from the visit and the customer's confirmation.">
            {wo.status === "in_progress" || wo.status === "completed" ? (
              <div className="space-y-4">
                <Field label="Technician notes">
                  <Textarea rows={4} value={wo.notes} onChange={(e) => patch({ notes: e.target.value })} placeholder="Work carried out, findings, parts used, recommendations." />
                </Field>
                {wo.signedBy ? (
                  <p className="rounded-md bg-success/10 p-3 text-sm text-success">Signed off by <span className="font-semibold">{wo.signedBy}</span> on {fmtDate(wo.signedAt?.slice(0, 10))}.</p>
                ) : (
                  <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
                    <Input value={signer} onChange={(e) => setSigner(e.target.value)} placeholder="Customer name confirming the work is complete" />
                    <Button variant="secondary" disabled={!signer.trim()}
                      onClick={() => { patch({ signedBy: signer.trim(), signedAt: new Date().toISOString(), activity: log(`Customer sign-off recorded (${signer.trim()})`) }); setSigner(""); }}>
                      Record sign-off
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">The report becomes available once the job has started.</p>
            )}
          </Card>

          <ActivityCard items={wo.activity ?? []} />
        </div>

        <aside className="space-y-6">
          <Card title="Customer">
            <p className="font-medium">{customer?.name}</p>
            <p className="mt-1 flex items-start gap-2 text-sm text-muted-foreground"><MapPin className="mt-0.5 h-4 w-4 shrink-0" />{customer?.address || "No address on record"}</p>
            <div className="mt-4 flex flex-col gap-2.5">
              <a href={`tel:${customer?.phone}`} className={link}><Phone className="h-4 w-4" />{customer?.phone}</a>
              {wo.status === "scheduled" && provider && (
                <a href={wa(confirmMsg)} target="_blank" rel="noreferrer" className={link}><MessageCircle className="h-4 w-4" /> Send confirmation on WhatsApp</a>
              )}
              {wo.status === "completed" && !rating && (
                <a href={wa(rateMsg)} target="_blank" rel="noreferrer" className={link}><MessageCircle className="h-4 w-4" /> Send rating link on WhatsApp</a>
              )}
            </div>
          </Card>

          <AppointmentCard wo={wo} onViewProvider={setWorkerId} />

          <Card title="Summary">
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between"><dt className="text-muted-foreground">Total</dt><dd className="font-medium tabular-nums">{money(totalOf(wo))}</dd></div>
              <div className="flex justify-between"><dt className="text-muted-foreground">Paid</dt><dd className="font-medium tabular-nums">{money(paidOf(wo))}</dd></div>
              <div className="flex justify-between border-t border-border pt-2 font-semibold"><dt>Balance</dt><dd className="tabular-nums">{money(balanceOf(wo))}</dd></div>
              <div className="flex justify-between pt-1 text-xs text-muted-foreground"><dt>Invoice</dt><dd>{invoiceNo(wo)}</dd></div>
            </dl>
          </Card>

          {wo.status === "completed" && (
            <Card title="Customer rating">
              {rating ? (
                <div className="space-y-2"><Stars value={rating.stars} /><p className="text-sm">{rating.comment || "No comment left."}</p></div>
              ) : (
                <p className="text-sm text-muted-foreground">Awaiting the customer&apos;s rating.</p>
              )}
            </Card>
          )}

          {wo.status !== "completed" && (
            <Card title="Manage">
              {wo.status === "cancelled" ? (
                <Button variant="secondary" className="w-full" onClick={() => advance("new")}>Reopen work order</Button>
              ) : (
                <Button variant="danger" className="w-full justify-start" onClick={() => guarded("cancelled")}>Cancel work order</Button>
              )}
            </Card>
          )}
        </aside>
      </div>

      <WorkerDrawer id={workerId} onClose={() => setWorkerId(null)} />
    </>
  );
}
