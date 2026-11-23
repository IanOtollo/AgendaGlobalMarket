"use client";
import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Field, Input } from "@/components/ui/field";
import { PageHeader } from "@/components/layout/admin-shell";

export default function Customers() {
  const { customers, workOrders, addCustomer } = useStore();
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ name: "", phone: "", address: "" });
  const [q, setQ] = useState("");
  // Arriving from the global search pre-fills the filter (?q=name).
  useEffect(() => setQ(new URLSearchParams(window.location.search).get("q") ?? ""), []);
  const t = q.trim().toLowerCase();
  const rows = customers.filter((c) => !t || [c.name, c.phone, c.address].some((s) => s?.toLowerCase().includes(t)));

  return (
    <>
      <PageHeader title="Customers" subtitle={`${customers.length} on record`} action={<Button onClick={() => setOpen(true)}><Plus className="h-4 w-4" /> Add customer</Button>} />
      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Filter by name, phone or address"
        className="mb-4 w-full max-w-sm rounded-md border border-border bg-card px-4 py-2.5 text-sm outline-none transition focus:border-foreground/40" />
      <div className="overflow-x-auto rounded-lg border border-border bg-card">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border text-muted-foreground">
            <tr>{["Name", "Phone", "Address", "Work orders"].map((h) => <th key={h} className="px-6 py-3 font-medium">{h}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-border">
            {!rows.length && <tr><td colSpan={4} className="px-6 py-10 text-center text-muted-foreground">No customers match.</td></tr>}
            {rows.map((c) => (
              <tr key={c.id}>
                <td className="px-6 py-4 font-medium">{c.name}</td>
                <td className="px-6 py-4">{c.phone}</td>
                <td className="px-6 py-4">{c.address}</td>
                <td className="px-6 py-4">{workOrders.filter((w) => w.customerId === c.id).length}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Modal open={open} onClose={() => setOpen(false)} title="Add customer">
        <div className="space-y-4">
          <Field label="Name"><Input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field>
          <Field label="Phone"><Input value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} inputMode="tel" /></Field>
          <Field label="Address"><Input value={f.address} onChange={(e) => setF({ ...f, address: e.target.value })} /></Field>
          <Button className="w-full" disabled={!f.name || !f.phone} onClick={() => { addCustomer(f); setF({ name: "", phone: "", address: "" }); setOpen(false); }}>Save</Button>
        </div>
      </Modal>
    </>
  );
}
