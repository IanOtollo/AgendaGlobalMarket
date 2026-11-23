"use client";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { ChevronDown, Download, Eye, EyeOff, MapPin, Plus, Trash2 } from "lucide-react";
import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { useConfirm } from "@/components/ui/confirm";
import { PageHeader } from "@/components/layout/admin-shell";
import { TRADE_ICONS, iconOf, tradesOf } from "@/lib/trades";
import { BUILT_IN_AREAS } from "@/lib/areas";
import { parsePin } from "@/lib/pin";
import { slugify } from "@/lib/slug";
import { cn, uid } from "@/lib/utils";
import type { ServiceArea, Trade } from "@/lib/types";

const card = "rounded-xl border border-border/60 bg-card p-6";
const phoneOk = (s: string) => /^\+?\d{9,15}$/.test(s.replace(/[\s-]/g, ""));
const plain = (t: Trade): Trade => ({ id: t.id, name: t.name, noun: t.noun, blurb: t.blurb, icon: t.icon });
const iconBtn = "flex h-11 w-11 shrink-0 items-center justify-center rounded-lg";
const removeBtn = cn(iconBtn, "text-muted-foreground hover:bg-destructive/10 hover:text-destructive disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-muted-foreground");

/** A card that folds away to a one-line summary, so long lists do not take over the page. */
function Fold({ id, title, summary, children, defaultOpen = false }: { id: string; title: string; summary: ReactNode; children: ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section className={card} aria-labelledby={`${id}-h`}>
      <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-controls={`${id}-body`} className="flex w-full items-center justify-between gap-4 rounded-lg text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
        <span className="min-w-0">
          <span id={`${id}-h`} className="block text-lg font-semibold">{title}</span>
          <span className="mt-0.5 block truncate text-sm text-muted-foreground">{summary}</span>
        </span>
        <ChevronDown className={cn("h-5 w-5 shrink-0 text-muted-foreground transition-transform duration-300", open && "rotate-180")} aria-hidden />
      </button>
      <div id={`${id}-body`} className={cn("grid transition-[grid-template-rows] duration-300 ease-out", open ? "grid-rows-[1fr]" : "grid-rows-[0fr]")} {...(open ? {} : ({ inert: "" } as object))}>
        <div className="min-h-0 overflow-hidden"><div className="space-y-4 pt-5">{children}</div></div>
      </div>
    </section>
  );
}

type AreaRow = { key: string; name: string; loc: string; origName?: string };
const areaRows = (list?: ServiceArea[]): AreaRow[] => (list ?? []).map((a) => ({ key: a.slug, name: a.name, loc: `${a.lat}, ${a.lng}`, origName: a.name }));

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
  const [open, setOpen] = useState<string | null>(null); // trade whose icon and description panel is open
  const [savingTrades, setSavingTrades] = useState(false);
  useEffect(() => setDraft(saved), [saved]);
  const tradesDirty = JSON.stringify(draft) !== JSON.stringify(saved);
  const useOfTrade = (name: string) => ({ workers: providers.filter((p) => p.category === name).length, jobs: workOrders.filter((w) => w.category === name).length });
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
    // A saved trade keeps its icon; only a new trade can choose one.
    const clean = draft.map((t) => ({ ...t, name: t.name.trim(), noun: t.noun.trim(), blurb: t.blurb.trim(), icon: saved.find((o) => o.id === t.id)?.icon ?? t.icon }));
    const renames: Record<string, string> = {};
    saved.forEach((o) => { const n = clean.find((t) => t.id === o.id); if (n && n.name !== o.name) renames[o.name] = n.name; });
    const removed = saved.filter((o) => !clean.some((t) => t.id === o.id)).map((o) => o.name);
    const affected = Object.keys(renames).reduce((n, old) => n + useOfTrade(old).workers + useOfTrade(old).jobs, 0);
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

  /* ---------- Service areas (the Nairobi list is always available; these are the ones you add) ---------- */
  const savedAreas = useMemo(() => areaRows(settings.extraAreas), [settings.extraAreas]);
  const [areas, setAreas] = useState<AreaRow[]>(savedAreas);
  const [savingAreas, setSavingAreas] = useState(false);
  useEffect(() => setAreas(savedAreas), [savedAreas]);
  const areasDirty = JSON.stringify(areas) !== JSON.stringify(savedAreas);
  const useOfArea = (name?: string) => ({ workers: providers.filter((p) => p.area === name).length, jobs: workOrders.filter((w) => w.area === name).length });
  const builtIn = new Set(BUILT_IN_AREAS.flatMap((a) => [a.name.toLowerCase(), a.slug]));
  const areaErrors = areas.map((a, i) => {
    if (!a.name.trim()) return "Give the area a name.";
    if (builtIn.has(a.name.trim().toLowerCase()) || builtIn.has(slugify(a.name))) return "That area is already in the list.";
    if (areas.some((o, j) => j !== i && slugify(o.name) === slugify(a.name))) return "Another area already has this name.";
    if (!parsePin(a.loc)) return "Paste a Google Maps link (from the address bar) or coordinates like -1.2921, 36.8219.";
    return "";
  });
  const areasBad = areaErrors.some(Boolean);

  const saveAreas = async () => {
    if (areasBad) return toast("error", "Fix the highlighted areas first");
    const extra: ServiceArea[] = areas.map((a) => { const p = parsePin(a.loc)!; return { name: a.name.trim(), slug: slugify(a.name), lat: p.lat, lng: p.lng }; });
    const renames: Record<string, string> = {};
    areas.forEach((a) => { if (a.origName && a.origName !== a.name.trim()) renames[a.origName] = a.name.trim(); });
    const removed = savedAreas.filter((o) => !areas.some((a) => a.key === o.key)).map((o) => o.name);
    if ((removed.length || Object.keys(renames).length) && !(await confirm({
      title: "Save these area changes?",
      body: [Object.keys(renames).length ? `${Object.entries(renames).map(([a, b]) => `${a} becomes ${b}`).join(", ")}. Workers and work orders in them are carried over.` : "", removed.length ? `Removed: ${removed.join(", ")}.` : "", "The website's area lists and map update straight away."].filter(Boolean).join(" "),
      confirmLabel: "Save areas", danger: removed.length > 0,
    }))) return;
    setSavingAreas(true);
    const ok = await setSettings({ ...settings, extraAreas: extra }, undefined, renames);
    setSavingAreas(false);
    ok ? toast("success", "Service areas saved", "They now appear in area pickers and on the map.") : toast("error", "Service areas were not saved", "Check your connection and try again.");
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
      <div className="grid items-start gap-6 xl:grid-cols-2">
        {/* Left: the everyday details */}
        <div className="space-y-6">
          <section className={cn(card, "space-y-4")} aria-labelledby="biz-h">
            <h2 id="biz-h" className="text-lg font-semibold">Business</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Business name"><Input value={f.businessName} onChange={(e) => setF({ ...f, businessName: e.target.value })} /></Field>
              <Field label="Admin phone (the only number shown to clients)">
                <Input value={f.adminPhone} onChange={(e) => setF({ ...f, adminPhone: e.target.value })} inputMode="tel" placeholder="+254700000000" aria-invalid={phoneBad} />
              </Field>
            </div>
            <p className={cn("text-xs", phoneBad ? "text-destructive" : "text-muted-foreground")}>{phoneBad ? "That does not look like a phone number. Include the country code." : "Used for every Call and WhatsApp button. Include the country code."}</p>
            <Button onClick={saveBusiness} disabled={savingBiz || !bizDirty}>{savingBiz ? "Saving…" : "Save changes"}</Button>
          </section>

          <section className={cn(card, "space-y-4")} aria-labelledby="pw-h">
            <div>
              <h2 id="pw-h" className="text-lg font-semibold">Change password</h2>
              <p className="mt-2 rounded-lg bg-muted px-3 py-2 text-sm text-muted-foreground">Ready for later: sign-in is switched off for now, so this form does not change anything yet.</p>
            </div>
            <div className="max-w-xs"><Field label="Current password"><Input type={show ? "text" : "password"} value={pw.current} onChange={(e) => setPw({ ...pw, current: e.target.value })} autoComplete="current-password" /></Field></div>
            <div className="grid gap-4 md:grid-cols-2">
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

          <section className={cn(card, "space-y-3")} aria-labelledby="backup-h">
            <h2 id="backup-h" className="text-lg font-semibold">Data backup</h2>
            <p className="text-sm text-muted-foreground">Download a complete copy of your workers, customers, work orders and ratings. Keep it somewhere safe. Nothing is ever deleted from the system, but a copy of your own is good practice.</p>
            <a href="/api/db/export" download className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-border bg-background px-5 text-[15px] font-medium hover:bg-muted"><Download className="h-4 w-4" aria-hidden /> Download backup</a>
          </section>
        </div>

        {/* Right: the lists that can grow, folded away until needed */}
        <div className="space-y-6">
          <Fold id="trades" title="Trades" summary={`${draft.length} ${draft.length === 1 ? "trade" : "trades"}: ${draft.map((t) => t.name || "New trade").join(", ")}`}>
            <p className="text-sm text-muted-foreground">The kinds of work you offer. They appear in the website menus, filters and search, and in the team and work order forms.</p>
            <ul className="space-y-2">
              {draft.map((t, i) => {
                const Icon = iconOf(t.icon);
                const u = useOfTrade(saved.find((o) => o.id === t.id)?.name ?? t.name);
                const isSaved = saved.some((o) => o.id === t.id);
                const inUse = u.workers + u.jobs > 0 && isSaved;
                return (
                  <li key={t.id} className="rounded-lg border border-border/60 p-2.5">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <button type="button" onClick={() => setOpen(open === t.id ? null : t.id)} aria-expanded={open === t.id} aria-label={isSaved ? `Description for ${t.name || "this trade"}` : `Icon and description for ${t.name || "this trade"}`}
                        className={cn(iconBtn, "border border-border bg-background hover:bg-muted")}><Icon className="h-5 w-5" aria-hidden /></button>
                      <div className="min-w-[9rem] flex-1"><Input value={t.name} onChange={(e) => patch(t.id, { name: e.target.value })} placeholder="Trade name" aria-label="Trade name" /></div>
                      <div className="min-w-[9rem] flex-1"><Input value={t.noun} onChange={(e) => patch(t.id, { noun: e.target.value })} placeholder="People are called, e.g. Plumbers" aria-label="People are called" /></div>
                      <button type="button" disabled={inUse || draft.length === 1} onClick={() => setDraft((d) => d.filter((x) => x.id !== t.id))}
                        aria-label={`Remove ${t.name || "trade"}`} title={inUse ? "In use: reassign its workers and jobs first" : draft.length === 1 ? "Keep at least one trade" : "Remove"} className={removeBtn}><Trash2 className="h-4 w-4" aria-hidden /></button>
                    </div>
                    {open === t.id && (
                      <div className="mt-3 space-y-3 border-t border-border/60 pt-3">
                        {!isSaved && <div className="grid grid-cols-5 gap-2 sm:grid-cols-10" role="group" aria-label="Choose an icon">
                          {Object.entries(TRADE_ICONS).map(([key, { Icon: I, label }]) => (
                            <button key={key} type="button" aria-label={label} aria-pressed={t.icon === key} title={label} onClick={() => patch(t.id, { icon: key })}
                              className={cn("flex h-10 items-center justify-center rounded-lg border", t.icon === key ? "border-primary bg-primary text-primary-foreground" : "border-border hover:bg-muted")}><I className="h-5 w-5" aria-hidden /></button>
                          ))}
                        </div>}
                        <Field label="Short description (shown on the website)"><Input value={t.blurb} onChange={(e) => patch(t.id, { blurb: e.target.value })} placeholder="Leak repairs, pipe installation…" /></Field>
                      </div>
                    )}
                    {errors[i] && <p role="alert" className="mt-2 text-xs text-destructive">{errors[i]}</p>}
                    {inUse && <p className="mt-2 text-xs text-muted-foreground">In use by {u.workers} {u.workers === 1 ? "worker" : "workers"} and {u.jobs} {u.jobs === 1 ? "work order" : "work orders"}. Renaming carries them over; to remove it, reassign them first.</p>}
                  </li>
                );
              })}
            </ul>
            <div className="flex flex-wrap items-center gap-3">
              <Button variant="secondary" onClick={() => { const id = uid("t"); setDraft((d) => [...d, { id, name: "", noun: "", blurb: "", icon: "wrench" }]); setOpen(id); }}><Plus className="h-4 w-4" aria-hidden /> Add a trade</Button>
              <Button onClick={saveTrades} disabled={savingTrades || !tradesDirty}>{savingTrades ? "Saving…" : "Save trades"}</Button>
              {tradesDirty && <button type="button" onClick={() => setDraft(saved)} className="text-sm font-medium text-muted-foreground underline-offset-4 hover:underline">Discard changes</button>}
            </div>
          </Fold>

          <Fold id="areas" title="Service areas" summary={`${BUILT_IN_AREAS.length + areas.length} areas${areas.length ? `, including ${areas.length} you added: ${areas.map((a) => a.name || "New area").join(", ")}` : ""}`}>
            <p className="text-sm text-muted-foreground">The {BUILT_IN_AREAS.length} Nairobi areas are always available. Add others here (for example a town just outside Nairobi). They appear in the worker and work order forms, the website&apos;s area pickers and on the map.</p>
            <details className="rounded-lg bg-muted/60 px-3 py-2 text-sm">
              <summary className="cursor-pointer font-medium">See the Nairobi areas</summary>
              <p className="mt-2 text-muted-foreground">{BUILT_IN_AREAS.map((a) => a.name).join(", ")}</p>
            </details>
            <ul className="space-y-2">
              {areas.map((a, i) => {
                const u = useOfArea(a.origName);
                const inUse = !!a.origName && u.workers + u.jobs > 0;
                const pin = parsePin(a.loc);
                return (
                  <li key={a.key} className="rounded-lg border border-border/60 p-2.5">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <div className="min-w-[9rem] flex-1"><Input value={a.name} onChange={(e) => setAreas((l) => l.map((x) => (x.key === a.key ? { ...x, name: e.target.value } : x)))} placeholder="Area name" aria-label="Area name" /></div>
                      <div className="min-w-[12rem] flex-[1.4]"><Input value={a.loc} onChange={(e) => setAreas((l) => l.map((x) => (x.key === a.key ? { ...x, loc: e.target.value } : x)))} placeholder="Google Maps link or -1.2921, 36.8219" aria-label="Location" aria-invalid={!pin} /></div>
                      <button type="button" disabled={inUse} onClick={() => setAreas((l) => l.filter((x) => x.key !== a.key))} aria-label={`Remove ${a.name || "area"}`} title={inUse ? "In use: reassign its workers and jobs first" : "Remove"} className={removeBtn}><Trash2 className="h-4 w-4" aria-hidden /></button>
                    </div>
                    {pin && !areaErrors[i] && <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground"><MapPin className="h-3.5 w-3.5" aria-hidden />Pinned at {pin.lat.toFixed(4)}, {pin.lng.toFixed(4)}</p>}
                    {areaErrors[i] && (a.name || a.loc) && <p role="alert" className="mt-2 text-xs text-destructive">{areaErrors[i]}</p>}
                    {inUse && <p className="mt-2 text-xs text-muted-foreground">In use by {u.workers} {u.workers === 1 ? "worker" : "workers"} and {u.jobs} {u.jobs === 1 ? "work order" : "work orders"}. Renaming carries them over; to remove it, reassign them first.</p>}
                  </li>
                );
              })}
            </ul>
            <div className="flex flex-wrap items-center gap-3">
              <Button variant="secondary" onClick={() => setAreas((l) => [...l, { key: uid("a"), name: "", loc: "" }])}><Plus className="h-4 w-4" aria-hidden /> Add an area</Button>
              <Button onClick={saveAreas} disabled={savingAreas || !areasDirty}>{savingAreas ? "Saving…" : "Save areas"}</Button>
              {areasDirty && <button type="button" onClick={() => setAreas(savedAreas)} className="text-sm font-medium text-muted-foreground underline-offset-4 hover:underline">Discard changes</button>}
            </div>
          </Fold>
        </div>
      </div>
    </>
  );
}
