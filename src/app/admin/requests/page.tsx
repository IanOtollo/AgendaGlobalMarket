"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Inbox, Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Pagination, usePaged } from "@/components/ui/pagination";
import { PageHeader } from "@/components/layout/admin-shell";
import { useConfirm } from "@/components/ui/confirm";
import { useToast } from "@/components/ui/toast";
import { cn, digits, fmtDate } from "@/lib/utils";
import type { Request } from "@/lib/types";

const TABS = [["new", "New"], ["converted", "Work order created"], ["dismissed", "Dismissed"]] as const;

const ago = (iso: string) => {
  const m = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  return h < 24 ? `${h} h ago` : fmtDate(iso.slice(0, 10));
};

export default function Requests() {
  const router = useRouter();
  const confirm = useConfirm();
  const toast = useToast();
  const { requests, workOrders, convertRequest, updateRequest } = useStore();
  const [tab, setTab] = useState<Request["status"]>("new");
  const count = (s: Request["status"]) => requests.filter((r) => r.status === s).length;
  const rows = requests.filter((r) => r.status === tab);
  const paged = usePaged(rows, 10, tab);

  const link = "inline-flex min-h-9 items-center gap-1.5 rounded-md border border-border px-3 text-sm font-medium transition hover:bg-muted";

  return (
    <>
      <PageHeader title="Requests" subtitle="Messages from the website contact form, ready to turn into work orders." />

      <div className="rounded-lg border border-border bg-card">
        <div role="tablist" className="flex flex-wrap gap-x-5 border-b border-border px-4 pt-3">
          {TABS.map(([s, l]) => (
            <button key={s} role="tab" aria-selected={tab === s} onClick={() => setTab(s)}
              className={cn("-mb-px border-b-2 px-1 pb-3 text-sm font-medium transition", tab === s ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground")}>
              {l} <span className="ml-1 text-xs text-muted-foreground">{count(s)}</span>
            </button>
          ))}
        </div>

        {rows.length === 0 ? (
          <div className="flex flex-col items-center px-6 py-16 text-center">
            <Inbox className="h-8 w-8 text-muted-foreground" aria-hidden />
            <p className="mt-3 font-medium">{tab === "new" ? "No new requests" : tab === "converted" ? "Nothing converted yet" : "Nothing dismissed"}</p>
            {tab === "new" && <p className="mt-1 max-w-sm text-sm text-muted-foreground">When someone sends the contact form on the website, it appears here straight away.</p>}
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {paged.items.map((r) => {
              const wo = workOrders.find((w) => w.requestId === r.id);
              return (
                <li key={r.id} className="px-5 py-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-base font-semibold">{r.name}</p>
                      <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                        <span>{ago(r.createdAt)}</span>
                        {r.category && <span className="rounded-md bg-muted px-2 py-0.5 font-medium text-foreground">{r.category}</span>}
                        {r.address && <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" aria-hidden />{r.address}</span>}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {r.phone && <a href={`tel:${r.phone}`} className={link}><Phone className="h-4 w-4" aria-hidden /> {r.phone}</a>}
                      {r.phone && <a href={`https://wa.me/${digits(r.phone)}`} target="_blank" rel="noreferrer noopener" className={link}><MessageCircle className="h-4 w-4" aria-hidden /> WhatsApp</a>}
                      {r.email && <a href={`mailto:${r.email}`} className={link}><Mail className="h-4 w-4" aria-hidden /> {r.email}</a>}
                    </div>
                  </div>
                  {r.description && <p className="mt-3 max-w-[70ch] whitespace-pre-line text-[15px] leading-relaxed">{r.description}</p>}

                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    {r.status === "new" && (
                      <>
                        <Button size="sm" onClick={() => { convertRequest(r.id); toast("success", "Work order created", r.name); router.push("/admin/work-orders"); }}>Create work order</Button>
                        <Button size="sm" variant="secondary" onClick={async () => {
                          if (!(await confirm({ title: "Dismiss this request?", body: `${r.name}'s message moves to Dismissed. You can restore it later.`, confirmLabel: "Dismiss" }))) return;
                          updateRequest(r.id, { status: "dismissed" }); toast("success", "Request dismissed", r.name);
                        }}>Dismiss</Button>
                      </>
                    )}
                    {r.status === "dismissed" && <Button size="sm" variant="secondary" onClick={() => { updateRequest(r.id, { status: "new" }); toast("success", "Request restored", r.name); }}>Restore</Button>}
                    {r.status === "converted" && (wo
                      ? <Link href={`/admin/work-orders/${wo.id}`} className="text-sm font-medium underline-offset-4 hover:underline">Open {wo.no}</Link>
                      : <span className="text-sm text-muted-foreground">A work order was created from this request.</span>)}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
        <Pagination {...paged} />
      </div>
    </>
  );
}
