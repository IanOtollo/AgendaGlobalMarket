"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ClipboardList, Plus, Search, User, Users, type LucideIcon } from "lucide-react";
import { useStore } from "@/lib/store";
import { NAV } from "@/lib/nav";
import { STATUS_LABEL } from "@/lib/config";
import { isWorking } from "@/lib/team";
import { cn } from "@/lib/utils";

type Group = "Quick actions" | "Pages" | "Workers" | "Work orders" | "Customers";
type Item = { id: string; group: Group; title: string; sub?: string; icon: LucideIcon; badge?: string; hay: string; run: () => void };

const ORDER: Group[] = ["Quick actions", "Pages", "Workers", "Work orders", "Customers"];

export function GlobalSearch({ onOpenWorker }: { onOpenWorker: (id: string) => void }) {
  const router = useRouter();
  const { providers, workOrders, customers } = useStore();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const box = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);

  const done = () => { setOpen(false); setQ(""); input.current?.blur(); };

  const index = useMemo<Item[]>(() => {
    const cust = (id: string) => customers.find((c) => c.id === id);
    return [
      { id: "new-wo", group: "Quick actions", title: "New work order", sub: "Log a call", icon: Plus, hay: "new create add work order job call log", run: () => { done(); router.push("/admin/work-orders/new"); } },
      ...NAV.map((n): Item => ({ id: n.href, group: "Pages", title: n.label, sub: n.blurb, icon: n.icon, hay: `${n.label} ${n.keywords} ${n.blurb}`.toLowerCase(), run: () => { done(); router.push(n.href); } })),
      ...providers.map((p): Item => ({
        id: p.id, group: "Workers", title: p.name, sub: `${p.category} · ${p.phone} · ${p.area}`, icon: User,
        badge: isWorking(p) ? undefined : "Former",
        hay: [p.name, p.phone, p.email, p.category, p.area, p.idNumber, ...p.qualifications].join(" ").toLowerCase(),
        run: () => { done(); onOpenWorker(p.id); },
      })),
      ...workOrders.map((w): Item => {
        const c = cust(w.customerId);
        const pr = providers.find((p) => p.id === w.providerId);
        return {
          id: w.id, group: "Work orders", title: `${w.no} · ${w.title}`, sub: `${c?.name ?? "—"} · ${w.category}`, icon: ClipboardList,
          badge: STATUS_LABEL[w.status], hay: [w.no, w.title, w.category, c?.name, c?.phone, pr?.name].join(" ").toLowerCase(),
          run: () => { done(); router.push(`/admin/work-orders/${w.id}`); },
        };
      }),
      ...customers.map((c): Item => ({
        id: c.id, group: "Customers", title: c.name, sub: `${c.phone}${c.address ? ` · ${c.address}` : ""}`, icon: Users,
        hay: [c.name, c.phone, c.address].join(" ").toLowerCase(),
        run: () => { done(); router.push(`/admin/customers?q=${encodeURIComponent(c.name)}`); },
      })),
    ];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [providers, workOrders, customers]);

  const results = useMemo(() => {
    const tokens = q.toLowerCase().split(/\s+/).filter(Boolean);
    const limit: Record<Group, number> = { "Quick actions": 1, Pages: tokens.length ? 4 : 6, Workers: 5, "Work orders": 5, Customers: 4 };
    const rank = (i: Item) => (tokens.length && i.title.toLowerCase().startsWith(tokens[0]) ? 0 : tokens.length && i.title.toLowerCase().includes(tokens[0]) ? 1 : 2);
    const hits = tokens.length ? index.filter((i) => tokens.every((t) => i.hay.includes(t))) : index.filter((i) => i.group === "Quick actions" || i.group === "Pages");
    return ORDER.flatMap((g) => hits.filter((i) => i.group === g).sort((a, b) => rank(a) - rank(b)).slice(0, limit[g]));
  }, [q, index]);

  useEffect(() => setActive(0), [q]);
  useEffect(() => {
    const onDown = (e: MouseEvent) => { if (box.current && !box.current.contains(e.target as Node)) setOpen(false); };
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") { e.preventDefault(); input.current?.focus(); setOpen(true); }
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onDown); document.removeEventListener("keydown", onKey); };
  }, []);
  useEffect(() => { document.getElementById(`gs-${active}`)?.scrollIntoView({ block: "nearest" }); }, [active]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setOpen(true); setActive((a) => Math.min(a + 1, results.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); }
    else if (e.key === "Enter") { e.preventDefault(); results[active]?.run(); }
    else if (e.key === "Escape") { setOpen(false); input.current?.blur(); }
  };

  let lastGroup = "";
  return (
    <div ref={box} className="relative w-full max-w-xl">
      <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <input
        ref={input} value={q} role="combobox" aria-expanded={open} aria-controls="gs-list" aria-autocomplete="list"
        onChange={(e) => { setQ(e.target.value); setOpen(true); }} onFocus={() => setOpen(true)} onKeyDown={onKeyDown}
        placeholder="Search workers, work orders, customers, pages"
        className="w-full rounded-md border border-border bg-card py-2.5 pl-10 pr-16 text-sm outline-none transition focus:border-foreground/40"
      />
      <kbd className="pointer-events-none absolute right-3 top-1/2 hidden -translate-y-1/2 rounded-md border border-border bg-muted px-1.5 py-0.5 text-[11px] text-muted-foreground sm:block">Ctrl K</kbd>

      {open && (
        <div id="gs-list" role="listbox" className="absolute inset-x-0 top-full z-30 mt-2 max-h-[28rem] overflow-y-auto rounded-lg border border-border bg-card p-2 shadow-lg">
          {results.length === 0 && <p className="px-4 py-8 text-center text-sm text-muted-foreground">No results for “{q}”</p>}
          {results.map((r, i) => {
            const header = r.group !== lastGroup;
            lastGroup = r.group;
            const Icon = r.icon;
            return (
              <div key={`${r.group}-${r.id}`}>
                {header && <p className="px-3 pb-1 pt-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground first:pt-1">{r.group}</p>}
                <button id={`gs-${i}`} role="option" aria-selected={i === active} onClick={r.run} onMouseEnter={() => setActive(i)}
                  className={cn("flex w-full items-center gap-3 rounded-md px-3 py-2 text-left transition", i === active && "bg-muted")}>
                  <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{r.title}</span>
                    {r.sub && <span className="block truncate text-xs text-muted-foreground">{r.sub}</span>}
                  </span>
                  {r.badge && <span className="shrink-0 rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground">{r.badge}</span>}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
