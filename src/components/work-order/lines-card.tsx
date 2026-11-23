"use client";
import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { useStore } from "@/lib/store";
import { activity } from "@/lib/activity";
import { balanceOf, itemsOf, paidOf, totalOf } from "@/lib/billing";
import { fmtDate, money, uid } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/field";
import type { LineItem, Payment, WorkOrder } from "@/lib/types";

export function LinesCard({ wo }: { wo: WorkOrder }) {
  const { updateWorkOrder } = useStore();
  const items = itemsOf(wo);
  const setItems = (next: LineItem[]) => updateWorkOrder(wo.id, { items: next });
  const edit = (id: string, p: Partial<LineItem>) => setItems(items.map((i) => (i.id === id ? { ...i, ...p } : i)));
  const add = (kind: "service" | "part") => setItems([...items, { id: uid("li"), kind, description: "", qty: 1, unitPrice: 0 }]);

  return (
    <Card title="Services and parts" subtitle="Labour, materials and spare parts for this job." flush
      action={
        <div className="flex gap-2">
          <Button size="sm" variant="secondary" onClick={() => add("service")}><Plus className="h-3.5 w-3.5" /> Service</Button>
          <Button size="sm" variant="secondary" onClick={() => add("part")}><Plus className="h-3.5 w-3.5" /> Part</Button>
        </div>
      }>
      {/* Phones: each line is a small stacked form instead of a wide table */}
      <ul className="divide-y divide-border sm:hidden">
        {items.map((i) => (
          <li key={i.id} className="space-y-3 p-4">
            <div className="flex items-center gap-2">
              <Select value={i.kind ?? "service"} onChange={(e) => edit(i.id, { kind: e.target.value as LineItem["kind"] })} className="w-28 shrink-0 py-2">
                <option value="service">Service</option><option value="part">Part</option>
              </Select>
              <Input value={i.description} onChange={(e) => edit(i.id, { description: e.target.value })} placeholder="Description" className="py-2" />
              <button onClick={() => setItems(items.filter((x) => x.id !== i.id))} aria-label="Remove line" className="shrink-0 rounded-md p-2 text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
            </div>
            <div className="grid grid-cols-[4.5rem_1fr_auto] items-center gap-3">
              <Input type="number" min={1} value={i.qty} onChange={(e) => edit(i.id, { qty: Math.max(1, Number(e.target.value) || 1) })} aria-label="Quantity" className="py-2" />
              <Input type="number" min={0} value={i.unitPrice} onChange={(e) => edit(i.id, { unitPrice: Number(e.target.value) || 0 })} aria-label="Unit price" className="py-2" />
              <span className="min-w-[5.5rem] text-right text-sm font-medium tabular-nums">{money(i.qty * i.unitPrice)}</span>
            </div>
          </li>
        ))}
        {!items.length && <li className="px-4 py-8 text-center text-sm text-muted-foreground">No services or parts added yet.</li>}
      </ul>

      <div className="hidden overflow-x-auto sm:block">
        <table className="w-full min-w-[40rem] text-sm">
          <thead className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-5 py-2.5 font-medium">Type</th><th className="py-2.5 font-medium">Description</th>
              <th className="py-2.5 font-medium">Qty</th><th className="py-2.5 font-medium">Unit price</th>
              <th className="py-2.5 text-right font-medium">Amount</th><th className="w-12" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {items.map((i) => (
              <tr key={i.id}>
                <td className="px-5 py-2.5">
                  <Select value={i.kind ?? "service"} onChange={(e) => edit(i.id, { kind: e.target.value as LineItem["kind"] })} className="w-28 py-1.5">
                    <option value="service">Service</option><option value="part">Part</option>
                  </Select>
                </td>
                <td className="py-2.5 pr-3"><Input value={i.description} onChange={(e) => edit(i.id, { description: e.target.value })} placeholder="Description" className="py-1.5" /></td>
                <td className="py-2.5 pr-3"><Input type="number" min={1} value={i.qty} onChange={(e) => edit(i.id, { qty: Math.max(1, Number(e.target.value) || 1) })} className="w-20 py-1.5" /></td>
                <td className="py-2.5 pr-3"><Input type="number" min={0} value={i.unitPrice} onChange={(e) => edit(i.id, { unitPrice: Number(e.target.value) || 0 })} className="w-28 py-1.5" /></td>
                <td className="py-2.5 text-right font-medium tabular-nums">{money(i.qty * i.unitPrice)}</td>
                <td className="py-2.5 pr-3 text-right">
                  <button onClick={() => setItems(items.filter((x) => x.id !== i.id))} aria-label="Remove line" className="rounded-md p-1.5 text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
                </td>
              </tr>
            ))}
            {!items.length && <tr><td colSpan={6} className="px-5 py-8 text-center text-muted-foreground">No services or parts added yet.</td></tr>}
          </tbody>
        </table>
      </div>
      <dl className="ml-auto w-full max-w-xs space-y-1.5 border-t border-border p-5 text-sm">
        <div className="flex justify-between"><dt className="text-muted-foreground">Total</dt><dd className="font-medium tabular-nums">{money(totalOf(wo))}</dd></div>
        <div className="flex justify-between"><dt className="text-muted-foreground">Paid</dt><dd className="font-medium tabular-nums">{money(paidOf(wo))}</dd></div>
        <div className="flex justify-between border-t border-border pt-1.5 font-semibold"><dt>Balance due</dt><dd className="tabular-nums">{money(balanceOf(wo))}</dd></div>
      </dl>
    </Card>
  );
}

export function PaymentsCard({ wo }: { wo: WorkOrder }) {
  const { updateWorkOrder } = useStore();
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<Payment["method"]>("M-Pesa");
  const payments = wo.payments ?? [];
  const balance = balanceOf(wo);

  const record = () => {
    const n = Number(amount);
    if (!(n > 0)) return;
    updateWorkOrder(wo.id, {
      payments: [...payments, { id: uid("pay"), amount: n, method, at: new Date().toISOString() }],
      activity: [...(wo.activity ?? []), activity(`Payment of ${money(n)} recorded (${method})`)],
    });
    setAmount("");
  };

  return (
    <Card title="Payments" subtitle="Money received against this work order.">
      <ul className="divide-y divide-border">
        {payments.map((p) => (
          <li key={p.id} className="flex items-center justify-between py-2.5 text-sm">
            <span className="text-muted-foreground">{fmtDate(p.at.slice(0, 10))} · {p.method}</span>
            <span className="flex items-center gap-3 font-medium tabular-nums">
              {money(p.amount)}
              <button onClick={() => updateWorkOrder(wo.id, { payments: payments.filter((x) => x.id !== p.id) })} aria-label="Remove payment" className="text-muted-foreground transition hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
            </span>
          </li>
        ))}
        {!payments.length && <li className="py-3 text-sm text-muted-foreground">No payments recorded.</li>}
      </ul>
      {balance > 0 && (
        <div className="mt-4 grid gap-2 sm:grid-cols-[1fr_7rem_auto]">
          <Input type="number" min={0} value={amount} onChange={(e) => setAmount(e.target.value)} placeholder={`Amount, balance ${money(balance)}`} />
          <Select value={method} onChange={(e) => setMethod(e.target.value as Payment["method"])}>
            {["M-Pesa", "Cash", "Bank", "Card"].map((m) => <option key={m}>{m}</option>)}
          </Select>
          <Button onClick={record} disabled={!(Number(amount) > 0)}>Record payment</Button>
        </div>
      )}
    </Card>
  );
}
