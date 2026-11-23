"use client";
import { useEffect, useMemo, useState } from "react";
import { Eye, EyeOff, Plus, Trash2 } from "lucide-react";
import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { useConfirm } from "@/components/ui/confirm";
import { PageHeader } from "@/components/layout/admin-shell";
import { TRADE_ICONS, iconOf, tradesOf } from "@/lib/trades";
import { slugify } from "@/lib/slug";
import { cn, uid } from "@/lib/utils";
import type { Trade } from "@/lib/types";

const card = "rounded-xl border border-border/60 bg-card p-6 sm:p-8";
const phoneOk = (s: string) => /^\+?\d{9,15}$/.test(s.replace(/[\s-]/g, ""));
const plain = (t: Trade): Trade => ({ id: t.id, name: t.name, noun: t.noun, blurb: t.blurb, icon: t.icon });

export default function SettingsPage() {
  const { settings, setSettings, providers, workOrders } = useStore();
  const toast = useToast();
  const confirm = useConfirm();

  /* ---------- Business ---------- */
  const [f, setF] = useState({ businessName: settings.businessName, adminPhone: settings.adminPhone });
  const [savingBiz, setSavingBiz] = useState(false);
  useEffect(() => setF({ businessName: settings.businessName, adminPhone: settings.adminPhone }), [settings.businessName, settings.adminPhone]);
  const bizDirty = f.businessName !== settings.businessName || f.adminPhone !== settings.adminPhone;
  const phoneBad = f.adminPhone.trim() !== "" && !phoneOk(f.adminPhone);

  const saveBusiness = async () => {
    if (!f.businessName.trim()) return toast("error", "Business name is required");
    if (phoneBad) return toast("error", "Check the admin phone", "Include the country code, for example +254700000000.");
    if (f.adminPhone.replace(/[\s-]/g, "") !== settings.adminPhone && !(await confirm({ title: "Change the admin phone?", body: "Every Call and WhatsApp button on the website will use the new number straight away.", confirmLabel: "Change number" }))) return;
    setSavingBiz(true);
    const ok = await setSettings({ ...settings, businessName: f.businessName.trim(), adminPhone: f.adminPhone.replace(/[\s-]/g, "") });
    setSavingBiz(false);
    ok ? toast("success", "Settings saved", "The website now uses the new details.") : toast("error", "Settings were not saved", "Check your connection and try again.");
  };

  /* ---------- Trades ---------- */
  const saved = useMemo(() => tradesOf(settings).map(plain), [settings]);
  const [draft, setDraft] = useState<Trade[]>(saved);
  const [open, setOpen] = useState<string | null>(null); // trade whose icon picker is open
  const [savingTrades, setSavingTrades] = useState(false);
  useEffect(() => setDraft(saved), [saved]);
  const tradesDirty = JSON.stringify(draft) !== JSON.stringify(saved);
  const use = (name: string) => ({ workers: providers.filter((p) => p.category === name).length, jobs: workOrders.filter((w) => w.category === name).length });
  const patch = (id: string, p: Partial<Trade>) => setDraft((d) => d.map((t) => (t.id === id ? { ...t, ...p } : t)));
  const errors = draft.map((t, i) => {
    if (!t.name.trim()) return "Give the trade a name.";
    if (!t.noun.trim()) return "Add the plural people name, for example Plumbers.";
    if (draft.some((o, j) => j !== i && slugify(o.name) === slugify(t.name))) return "Another trade already has this name.";
    return "";
  });
  const tradesBad = errors.some(Boolean);

  const saveTrades = async () => {
    if (tradesBad) return toast("error", "Fix the highlighted trades first");
    const clean = draft.map((t) => ({ ...t, name: t.name.trim(), noun: t.noun.trim(), blurb: t.blurb.trim() }));
    const renames: Record<string, string> = {};
    saved.forEach((o) => { const n = clean.find((t) => t.id === o.id); if (n && n.name !== o.name) renames[o.name] = n.name; });
    const removed = saved.filter((o) => !clean.some((t) => t.id === o.id)).map((o) => o.name);
    const affected = Object.keys(renames).reduce((n, old) => n + use(old).workers + use(old).jobs, 0);
    if ((removed.length || Object.keys(renames).length) && !(await confirm({
      title: "Save these trade changes?",
      body: [Object.keys(renames).length ? `${Object.entries(renames).map(([a, b]) => `${a} becomes ${b}`).join(", ")}. ${affected} existing workers and work orders are carried over.` : "", removed.length ? `Removed: ${removed.join(", ")}.` : "", "The website menus update straight away."].filter(Boolean).join(" "),
      confirmLabel: "Save trades", danger: removed.length > 0,
    }))) return;
    setSavingTrades(true);
    const ok = await setSettings({ ...settings, trades: clean }, renames);
    setSavingTrades(false);
    ok ? toast("success", "Trades saved", Object.keys(renames).length ? "Renamed trades were carried over to workers and work orders." : "The website menus and filters now show them.") : toast("error", "Trades were not saved", "Check your connection and try again.");
  };

  /* ---------- Password (template: not connected while sign-in is switched off) ---------- */
  const [pw, setPw] = useState({ current: "", next: "", again: "" });
  const [show, setShow] = useState(false);
  const pwError = pw.next && pw.next.length < 8 ? "Use at least 8 characters." : pw.again && pw.next !== pw.again ? "The two new passwords do not match." : pw.next && pw.next === pw.current ? "The new password must be different." : "";
  const submitPw = () => {
    if (!pw.current || !pw.next || !pw.again) return toast("error", "Fill in all three password fields");
    if (pwError) return toast("error", "Password not changed", pwError);
    toast("info", "Not connected yet", "Sign-in is switched off, so no password was changed. This form is ready to be connected.");
    setPw({ current: "", next: "", again: "" });
  };

  return (
    <>
      <PageHeader title="Settings" />
      <div className="max-w-2xl space-y-6">
        <section className={cn(card, "space-y-4")} aria-labelledby="biz-h">
          <h2 id="biz-h" className="text-lg font-semibold">Business</h2>
          <Field label="Business name"><Input value={f.businessName} onChange={(e) => setF({ ...f, businessName: e.target.value })} /></Field>
          <Field label="Admin phone (the only number shown to clients)">
            <Input value={f.adminPhone} onChange={(e) => setF({ ...f, adminPhone: e.target.value })} inputMode="tel" placeholder="+254700000000" aria-invalid={phoneBad} />
          </Field>
          <p className={cn("text-xs", phoneBad ? "text-destructive" : "text-muted-foreground")}>{phoneBad ? "That does not look like a phone number. Include the country code." : "Used for every Call and WhatsApp button. Include the country code."}</p>
          <Button onClick={saveBusiness} disabled={savingBiz || !bizDirty}>{savingBiz ? "Saving…" : "Save changes"}</Button>
        </section>

        <section className={cn(card, "space-y-4")} aria-labelledby="trades-h">
          <div>
            <h2 id="trades-h" className="text-lg font-semibold">Trades</h2>
            <p className="mt-1 text-sm text-muted-foreground">The kinds of work you offer. They appear in the website menus, filters and search, and in the team and work order forms.</p>
          </div>
          <ul className="space-y-3">
            {draft.map((t, i) => {
              const Icon = iconOf(t.icon);
              const u = use(saved.find((o) => o.id === t.id)?.name ?? t.name);
              const inUse = u.workers + u.jobs > 0 && saved.some((o) => o.id === t.id);
              return (
                <li key={t.id} className="rounded-lg border border-border/60 p-4">
                  <div className="flex items-start gap-3">
                    <button type="button" onClick={() => setOpen(open === t.id ? null : t.id)} aria-expanded={open === t.id} aria-label={`Change icon for ${t.name || "this trade"}`}
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-border bg-background hover:bg-muted"><Icon className="h-5 w-5" aria-hidden /></button>
                    <div className="grid min-w-0 flex-1 gap-3 sm:grid-cols-2">
                      <Field label="Trade name"><Input value={t.name} onChange={(e) => patch(t.id, { name: e.target.value })} placeholder="Plumbing" /></Field>
                      <Field label="People are called"><Input value={t.noun} onChange={(e) => patch(t.id, { noun: e.target.value })} placeholder="Plumbers" /></Field>
                      <div className="sm:col-span-2"><Field label="Short description (shown on the website)"><Input value={t.blurb} onChange={(e) => patch(t.id, { blurb: e.target.value })} placeholder="Leak repairs, pipe installation…" /></Field></div>
                    </div>
                    <button type="button" disabled={inUse || draft.length === 1} onClick={() => setDraft((d) => d.filter((x) => x.id !== t.id))}
                      aria-label={`Remove ${t.name || "trade"}`} title={inUse ? "In use: reassign its workers and jobs first" : draft.length === 1 ? "Keep at least one trade" : "Remove"}
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-muted-foreground"><Trash2 className="h-4 w-4" aria-hidden /></button>
                  </div>
                  {open === t.id && (
                    <div className="mt-3 grid grid-cols-5 gap-2 sm:grid-cols-10" role="group" aria-label="Choose an icon">
                      {Object.entries(TRADE_ICONS).map(([key, { Icon: I, label }]) => (
                        <button key={key} type="button" aria-label={label} aria-pressed={t.icon === key} title={label} onClick={() => { patch(t.id, { icon: key }); setOpen(null); }}
                          className={cn("flex h-10 items-center justify-center rounded-lg border", t.icon === key ? "border-primary bg-primary text-primary-foreground" : "border-border hover:bg-muted")}><I className="h-5 w-5" aria-hidden /></button>
                      ))}
                    </div>
                  )}
                  {errors[i] && <p role="alert" className="mt-2 text-xs text-destructive">{errors[i]}</p>}
                  {inUse && <p className="mt-2 text-xs text-muted-foreground">In use by {u.workers} {u.workers === 1 ? "worker" : "workers"} and {u.jobs} {u.jobs === 1 ? "work order" : "work orders"}. Renaming carries them over; to remove it, reassign them first.</p>}
                </li>
              );
            })}
          </ul>
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="secondary" onClick={() => { const id = uid("t"); setDraft((d) => [...d, { id, name: "", noun: "", blurb: "", icon: "wrench" }]); }}><Plus className="h-4 w-4" aria-hidden /> Add a trade</Button>
            <Button onClick={saveTrades} disabled={savingTrades || !tradesDirty}>{savingTrades ? "Saving…" : "Save trades"}</Button>
            {tradesDirty && <button type="button" onClick={() => setDraft(saved)} className="text-sm font-medium text-muted-foreground underline-offset-4 hover:underline">Discard changes</button>}
          </div>
        </section>

        <section className={cn(card, "space-y-4")} aria-labelledby="pw-h">
          <div>
            <h2 id="pw-h" className="text-lg font-semibold">Change password</h2>
            <p className="mt-1 rounded-lg bg-muted px-3 py-2 text-sm text-muted-foreground">Ready for later: sign-in is switched off for now, so this form does not change anything yet.</p>
          </div>
          <div className="max-w-xs"><Field label="Current password"><Input type={show ? "text" : "password"} value={pw.current} onChange={(e) => setPw({ ...pw, current: e.target.value })} autoComplete="current-password" /></Field></div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="New password"><Input type={show ? "text" : "password"} value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} autoComplete="new-password" aria-invalid={!!pwError} /></Field>
            <Field label="Confirm new password"><Input type={show ? "text" : "password"} value={pw.again} onChange={(e) => setPw({ ...pw, again: e.target.value })} autoComplete="new-password" aria-invalid={!!pwError} /></Field>
          </div>
          <p className={cn("text-xs", pwError ? "text-destructive" : "text-muted-foreground")} role={pwError ? "alert" : undefined}>{pwError || "At least 8 characters. A few random words is stronger than one with symbols."}</p>
          <div className="flex flex-wrap items-center gap-3">
            <Button onClick={submitPw}>Update password</Button>
            <button type="button" onClick={() => setShow((v) => !v)} className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground">
              {show ? <EyeOff className="h-4 w-4" aria-hidden /> : <Eye className="h-4 w-4" aria-hidden />}{show ? "Hide passwords" : "Show passwords"}
            </button>
          </div>
        </section>
      </div>
    </>
  );
}
