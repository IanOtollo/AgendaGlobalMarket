"use client";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Globe, Printer } from "lucide-react";
import { useStore } from "@/lib/store";
import { BRAND } from "@/lib/config";
import { balanceOf, invoiceNo, itemsOf, paidOf, payStatus, totalOf } from "@/lib/billing";
import { fmtDate, money } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export default function Invoice() {
  const { id } = useParams<{ id: string }>();
  const { workOrders, customers, providers, settings } = useStore();
  const wo = workOrders.find((w) => w.id === id);
  const customer = customers.find((c) => c.id === wo?.customerId);
  const provider = providers.find((p) => p.id === wo?.providerId);

  if (!wo) return <p className="text-muted-foreground">Work order not found.</p>;
  const items = itemsOf(wo);
  const status = payStatus(wo);

  return (
    <>
      <div className="mb-6 flex items-center justify-between print:hidden">
        <Link href="/admin/work-orders" className="inline-flex items-center gap-2 text-sm text-muted-foreground transition hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Work orders
        </Link>
        <Button onClick={() => window.print()}><Printer className="h-4 w-4" /> Print or save as PDF</Button>
      </div>

      <article className="mx-auto max-w-3xl rounded-lg border border-border/50 bg-card p-8 print:max-w-none print:rounded-none print:border-0 print:p-0 sm:p-12">
        <header className="flex flex-wrap items-start justify-between gap-6">
          <div>
            <span className="flex items-center gap-3 font-semibold">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-brand"><Globe className="h-5 w-5" /></span>
              {settings.businessName}
            </span>
            <p className="mt-3 text-sm text-muted-foreground">{settings.adminPhone}<br />{BRAND.email}<br />{BRAND.website}</p>
          </div>
          <div className="text-right">
            <h1 className="text-3xl font-semibold tracking-tight">Invoice</h1>
            <p className="mt-1 text-sm text-muted-foreground">{invoiceNo(wo)}</p>
            <p className="text-sm text-muted-foreground">Issued {fmtDate(wo.date ?? wo.createdAt.slice(0, 10))}</p>
            <p className="mt-2 inline-block rounded-md bg-muted px-3 py-1 text-xs font-semibold uppercase tracking-wide">
              {status === "paid" ? "Paid" : status === "part" ? "Part paid" : "Payment due"}
            </p>
          </div>
        </header>

        <section className="mt-10 grid gap-6 sm:grid-cols-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Billed to</p>
            <p className="mt-2 font-medium">{customer?.name}</p>
            <p className="text-sm text-muted-foreground">{customer?.phone}<br />{customer?.address}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Service</p>
            <p className="mt-2 font-medium">{wo.title}</p>
            <p className="text-sm text-muted-foreground">{wo.category}{provider && ` · ${provider.name}`}<br />{wo.no}</p>
          </div>
        </section>

        <table className="mt-10 w-full text-left text-sm">
          <thead className="border-b border-border text-muted-foreground">
            <tr><th className="py-3 font-medium">Description</th><th className="py-3 text-right font-medium">Qty</th><th className="py-3 text-right font-medium">Price</th><th className="py-3 text-right font-medium">Amount</th></tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {items.map((i) => (
              <tr key={i.id}>
                <td className="py-3">{i.description || "—"}</td>
                <td className="py-3 text-right">{i.qty}</td>
                <td className="py-3 text-right">{money(i.unitPrice)}</td>
                <td className="py-3 text-right font-medium">{money(i.qty * i.unitPrice)}</td>
              </tr>
            ))}
            {!items.length && <tr><td colSpan={4} className="py-8 text-center text-muted-foreground">No charges added yet.</td></tr>}
          </tbody>
        </table>

        <dl className="ml-auto mt-6 w-full max-w-xs space-y-2 text-sm">
          <div className="flex justify-between"><dt className="text-muted-foreground">Total</dt><dd>{money(totalOf(wo))}</dd></div>
          <div className="flex justify-between"><dt className="text-muted-foreground">Paid</dt><dd>{money(paidOf(wo))}</dd></div>
          <div className="flex justify-between border-t border-border pt-2 text-base font-semibold"><dt>Balance due</dt><dd>{money(balanceOf(wo))}</dd></div>
        </dl>

        {(wo.payments ?? []).length > 0 && (
          <section className="mt-10">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Payments received</p>
            <ul className="mt-2 space-y-1 text-sm">
              {wo.payments!.map((p) => <li key={p.id} className="flex justify-between"><span>{fmtDate(p.at.slice(0, 10))} · {p.method}</span><span>{money(p.amount)}</span></li>)}
            </ul>
          </section>
        )}

        <footer className="mt-12 border-t border-border/60 pt-6 text-center text-xs text-muted-foreground">
          Thank you for choosing {settings.businessName}. {BRAND.tagline}
        </footer>
      </article>
    </>
  );
}
