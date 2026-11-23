"use client";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, Mail, MapPin, MessageCircle, Pencil, Phone, Star, X } from "lucide-react";
import { useStore } from "@/lib/store";
import { ProfileGlyph } from "@/components/site/profile-glyph";
import { availability, isWorking } from "@/lib/team";
import { ratingOf } from "@/lib/rating";
import { slot } from "@/lib/schedule";
import { iconOf, tradesOf } from "@/lib/trades";
import { cn, digits, ease, fmtDate, today } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { Stars } from "@/components/ui/stars";
import { WorkerForm } from "@/components/admin/worker-form";
import { useConfirm } from "@/components/ui/confirm";
import { useToast } from "@/components/ui/toast";

export function WorkerDrawer({ id, onClose }: { id: string | null; onClose: () => void }) {
  const { providers, workOrders, customers, ratings, updateProvider, offboardProvider, reinstateProvider, settings } = useStore();
  const confirm = useConfirm();
  const toast = useToast();
  const [mode, setMode] = useState<"view" | "edit" | "exit">("view");
  const [kind, setKind] = useState<"resigned" | "terminated">("resigned");
  const [leftOn, setLeftOn] = useState(today());
  const [reason, setReason] = useState("");

  const p = providers.find((x) => x.id === id);
  const close = () => { setMode("view"); setReason(""); onClose(); };

  const mine = workOrders.filter((w) => w.providerId === p?.id);
  const upcoming = mine
    .filter((w) => !["completed", "cancelled"].includes(w.status) && (!w.date || w.date >= today()))
    .sort((a, b) => `${a.date ?? "9"}${a.time ?? ""}`.localeCompare(`${b.date ?? "9"}${b.time ?? ""}`));
  const done = mine.filter((w) => w.status === "completed").length;
  const r = p ? ratingOf(ratings, p.id) : { avg: 0, count: 0 };
  const reviews = ratings.filter((x) => x.providerId === p?.id && x.comment).slice(-3).reverse();
  const av = p ? availability(p.id, workOrders) : null;
  const working = p ? isWorking(p) : false;
  const Icon = p ? iconOf(tradesOf(settings).find((t) => t.name === p.category)?.icon) : null;

  return (
    <AnimatePresence>
      {p && (
        <>
          <motion.div key="scrim" className="fixed inset-0 z-40 bg-foreground/20 backdrop-blur-[2px]"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={close} />
          <motion.aside key="panel"
            className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l border-border bg-card shadow-lg"
            initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ duration: 0.35, ease }}>
            <header className="flex items-start justify-between gap-4 border-b border-border/60 p-6">
              <div className="flex items-center gap-4">
                <span className="flex h-14 w-14 shrink-0 items-end justify-center overflow-hidden rounded-full bg-primary text-brand">{p.photo ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={p.photo} alt="" className="h-full w-full object-cover" /> : <ProfileGlyph className="h-11 w-11" />}</span>
                <div>
                  <h2 className="text-xl font-semibold tracking-tight">{p.name}</h2>
                  <p className="flex items-center gap-1.5 text-sm text-muted-foreground">{Icon && <Icon className="h-3.5 w-3.5" />}{p.category} · {p.years} yrs experience</p>
                  {working && av && (
                    <p className="mt-1.5 inline-flex items-center gap-1.5 text-xs font-medium">
                      <span className={cn("h-2 w-2 rounded-full", av.busy ? "bg-warning" : "bg-success")} />{av.text}
                    </p>
                  )}
                </div>
              </div>
              <button onClick={close} aria-label="Close" className="rounded-md p-2 hover:bg-muted"><X className="h-4 w-4" /></button>
            </header>

            <div className="flex-1 space-y-6 overflow-y-auto p-6">
              {mode === "edit" ? (
                <WorkerForm initial={p} submitLabel="Save changes" onSubmit={async (d) => {
                  if (!(await confirm({ title: `Save changes to ${p.name}?`, body: "This replaces their current details, and the website profile updates straight away.", confirmLabel: "Save changes" }))) return;
                  updateProvider(p.id, d); setMode("view"); toast("success", "Worker updated", p.name);
                }} />
              ) : (
                <>
                  {!working && (
                    <section className="rounded-lg bg-destructive/10 p-4 text-sm">
                      <p className="font-semibold text-destructive">{p.employment === "terminated" ? "Let go" : "Resigned"} · {fmtDate(p.leftOn)}</p>
                      {p.leftReason && <p className="mt-1 text-foreground/80">{p.leftReason}</p>}
                      <Button variant="secondary" size="sm" className="mt-3" onClick={async () => { if (await confirm({ title: `Reinstate ${p.name}?`, body: "They return to the active team. They go back on the website once marked as listed.", confirmLabel: "Reinstate" })) { reinstateProvider(p.id); toast("success", "Reinstated", p.name); } }}>Reinstate</Button>
                    </section>
                  )}

                  <dl className="grid grid-cols-3 gap-2 text-center">
                    {[
                      { k: "Rating", v: r.count ? <span className="inline-flex items-center gap-1"><Star className="h-3.5 w-3.5 fill-brand text-brand" />{r.avg.toFixed(1)}</span> : "New" },
                      { k: "Jobs done", v: done },
                      { k: "Upcoming", v: upcoming.length },
                    ].map((s) => (
                      <div key={s.k} className="rounded-lg bg-muted/60 p-3">
                        <dd className="text-lg font-semibold">{s.v}</dd><dt className="text-xs text-muted-foreground">{s.k}</dt>
                      </div>
                    ))}
                  </dl>

                  <section className="space-y-2">
                    <h3 className="text-sm font-semibold">Contact <span className="font-normal text-muted-foreground">· private</span></h3>
                    <div className="flex flex-wrap gap-2">
                      <a href={`tel:${p.phone}`} className="inline-flex items-center gap-2 rounded-md bg-muted px-3 py-1.5 text-sm transition hover:bg-muted/70"><Phone className="h-3.5 w-3.5" />{p.phone}</a>
                      <a href={`https://wa.me/${digits(p.phone)}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-md bg-muted px-3 py-1.5 text-sm transition hover:bg-muted/70"><MessageCircle className="h-3.5 w-3.5" />WhatsApp</a>
                      {p.email && <a href={`mailto:${p.email}`} className="inline-flex items-center gap-2 rounded-md bg-muted px-3 py-1.5 text-sm transition hover:bg-muted/70"><Mail className="h-3.5 w-3.5" />{p.email}</a>}
                    </div>
                    <p className="flex items-center gap-2 text-sm text-muted-foreground"><MapPin className="h-3.5 w-3.5" />Based in {p.area}</p>
                    <p className="text-sm text-muted-foreground">
                      {p.idNumber && <>ID {p.idNumber} · </>}Joined {fmtDate(p.joinedOn)}
                    </p>
                  </section>

                  <section className="space-y-2">
                    <h3 className="text-sm font-semibold">Upcoming jobs</h3>
                    {upcoming.length ? (
                      <ul className="space-y-2">
                        {upcoming.slice(0, 6).map((w) => (
                          <li key={w.id} className="rounded-md bg-muted/60 p-3 text-sm">
                            <p className="font-medium">{w.title}</p>
                            <p className="text-muted-foreground">{w.date ? `${fmtDate(w.date)} ${slot(w)}` : "No time set"} · {customers.find((c) => c.id === w.customerId)?.name}</p>
                          </li>
                        ))}
                      </ul>
                    ) : <p className="text-sm text-muted-foreground">Nothing booked.</p>}
                  </section>

                  <section className="space-y-2">
                    <h3 className="text-sm font-semibold">Qualifications</h3>
                    <div className="flex flex-wrap gap-2">
                      {p.qualifications.map((q) => <span key={q} className="rounded-md border border-border px-3 py-1 text-xs text-muted-foreground">{q}</span>)}
                      {!p.qualifications.length && <p className="text-sm text-muted-foreground">None added.</p>}
                    </div>
                    {p.bio && <p className="pt-1 text-sm text-muted-foreground">{p.bio}</p>}
                  </section>

                  {reviews.length > 0 && (
                    <section className="space-y-2">
                      <h3 className="text-sm font-semibold">Recent feedback</h3>
                      {reviews.map((x) => <div key={x.id} className="rounded-md bg-muted/60 p-3"><Stars value={x.stars} /><p className="mt-1 text-sm">{x.comment}</p></div>)}
                    </section>
                  )}

                  {working && (
                    <label className="flex items-center justify-between gap-4 rounded-lg border border-border/60 p-4">
                      <span><span className="block text-sm font-medium">Listed on the public site</span>
                        <span className="block text-xs text-muted-foreground">Turn off for leave or a break. They stay on staff but can&apos;t be booked.</span></span>
                      <input type="checkbox" checked={p.active} onChange={(e) => updateProvider(p.id, { active: e.target.checked })} className="h-5 w-5" />
                    </label>
                  )}

                  {mode === "exit" && (
                    <section className="space-y-4 rounded-lg border border-destructive/30 p-4">
                      <h3 className="text-sm font-semibold text-destructive">Resign or let go</h3>
                      <div className="grid grid-cols-2 gap-3">
                        <Field label="Reason type"><Select value={kind} onChange={(e) => setKind(e.target.value as typeof kind)}><option value="resigned">Resigned</option><option value="terminated">Let go</option></Select></Field>
                        <Field label="Last day"><Input type="date" value={leftOn} onChange={(e) => setLeftOn(e.target.value)} /></Field>
                      </div>
                      <Field label="Notes (optional)"><Textarea value={reason} onChange={(e) => setReason(e.target.value)} /></Field>
                      <p className="flex items-start gap-2 text-sm text-muted-foreground">
                        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                        {upcoming.filter((w) => w.status !== "in_progress").length} upcoming job(s) go back to &quot;New&quot; so you can reassign them. Past jobs, ratings and records are kept. They&apos;re removed from the public site.
                      </p>
                      <div className="flex gap-2">
                        <Button variant="secondary" className="flex-1" onClick={() => setMode("view")}>Keep on staff</Button>
                        <Button className="flex-1 bg-destructive text-background" onClick={async () => {
                          const verb = kind === "resigned" ? "resigned" : "let go";
                          if (!(await confirm({ title: `Mark ${p.name} as ${verb}?`, body: "They come off the website and their open future jobs return to the queue. Their history is kept.", confirmLabel: kind === "resigned" ? "Mark as resigned" : "Let go", danger: true }))) return;
                          offboardProvider(p.id, kind, leftOn, reason.trim()); setMode("view"); toast("success", `${p.name} marked as ${verb}`);
                        }}>Confirm</Button>
                      </div>
                    </section>
                  )}
                </>
              )}
            </div>

            {mode === "view" && (
              <footer className="flex gap-2 border-t border-border/60 p-6">
                <Button variant="secondary" className="flex-1" onClick={() => setMode("edit")}><Pencil className="h-4 w-4" /> Edit details</Button>
                {working && <Button variant="danger" className="flex-1" onClick={() => setMode("exit")}>Resign / let go</Button>}
              </footer>
            )}
            {mode === "edit" && (
              <footer className="border-t border-border/60 p-6"><Button variant="ghost" className="w-full" onClick={() => setMode("view")}>Cancel</Button></footer>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
