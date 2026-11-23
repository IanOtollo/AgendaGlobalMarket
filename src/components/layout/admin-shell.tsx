"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { LogOut, MoreHorizontal } from "lucide-react";
import { useStore } from "@/lib/store";
import { NAV, NAV_GROUPS } from "@/lib/nav";
import { cn, ease } from "@/lib/utils";
import { GlobalSearch } from "@/components/admin/global-search";
import { WorkerDrawer } from "@/components/admin/worker-drawer";

// Phones get a bottom tab bar: the four daily areas, plus "More" for the rest.
const TABS = NAV.slice(0, 4);
const MORE = NAV.slice(4);
const isActive = (path: string, href: string) => (href === "/admin" ? path === href : path.startsWith(href));

export function AdminShell({ children, email }: { children: React.ReactNode; email: string }) {
  const path = usePathname();
  const { settings, workOrders } = useStore();
  const waiting = workOrders.filter((w) => w.status === "new").length;
  const [workerId, setWorkerId] = useState<string | null>(null);
  const [more, setMore] = useState(false);
  useEffect(() => setMore(false), [path]);
  useEffect(() => {
    if (!more) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMore(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [more]);

  const moreActive = MORE.some((n) => isActive(path, n.href));

  return (
    <div className="min-h-screen bg-muted/40 print:bg-white lg:flex">
      {/* Desktop sidebar. On phones this is just a slim brand bar. */}
      <aside className="bg-primary text-primary-foreground print:hidden lg:sticky lg:top-0 lg:flex lg:h-screen lg:w-60 lg:shrink-0 lg:flex-col">
        <div className="flex items-center gap-3 px-4 py-3 lg:px-5 lg:py-6">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/logo-mark.png" alt="" width={190} height={150} className="h-9 w-auto rounded-md bg-white px-1.5 py-0.5" />
          <span className="leading-tight">
            <span className="block text-sm font-semibold">{settings.businessName}</span>
            <span className="block text-xs text-primary-foreground/60">Operations</span>
          </span>
        </div>
        <nav aria-label="Main" className="hidden lg:block lg:flex-1 lg:space-y-6 lg:overflow-y-auto lg:overflow-x-hidden lg:pb-4 lg:pt-2">
          {NAV_GROUPS.map((group) => (
            <div key={group.title} className="flex flex-col gap-1 px-3">
              <p className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-primary-foreground/40">{group.title}</p>
              {group.items.map(({ href, label, icon: Icon }) => {
                const active = isActive(path, href);
                return (
                  <Link key={href} href={href} aria-current={active ? "page" : undefined}
                    className={cn("relative flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition",
                      active ? "bg-primary-foreground/10 text-primary-foreground" : "text-primary-foreground/60 hover:bg-primary-foreground/5 hover:text-primary-foreground")}>
                    {active && <span className="absolute inset-y-1.5 left-0 w-0.5 bg-brand" />}
                    <Icon className="h-4 w-4" /> {label}
                    {label === "Work Orders" && waiting > 0 && (
                      <span className="ml-auto rounded-md bg-brand px-1.5 py-0.5 text-xs font-semibold text-primary">{waiting}</span>
                    )}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>
        <div className="hidden border-t border-primary-foreground/10 p-3 lg:block">
          <div className="flex items-center gap-3 rounded-md px-3 py-2">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-foreground/10 text-xs font-semibold">{(email || "A")[0].toUpperCase()}</span>
            <span className="min-w-0 flex-1 truncate text-sm text-primary-foreground/80">{email || "Admin"}</span>
            <form method="post" action="/api/auth/logout">
              <button type="submit" aria-label="Sign out" className="rounded-md p-1.5 text-primary-foreground/60 transition hover:bg-primary-foreground/10 hover:text-primary-foreground">
                <LogOut className="h-4 w-4" />
              </button>
            </form>
          </div>
        </div>
      </aside>

      <main className="min-w-0 flex-1 px-4 pb-28 pt-6 print:p-0 sm:px-6 lg:px-10 lg:pb-8 lg:pt-8">
        <div className="mb-8 print:hidden">
          <GlobalSearch onOpenWorker={setWorkerId} />
        </div>
        {children}
      </main>

      {/* Phone bottom navigation */}
      <nav aria-label="Primary" className="fixed inset-x-0 bottom-0 z-[46] border-t border-border bg-card pb-[env(safe-area-inset-bottom)] print:hidden lg:hidden">
        <ul className="grid grid-cols-5">
          {TABS.map(({ href, label, icon: Icon }) => {
            const active = isActive(path, href);
            return (
              <li key={href}>
                <Link href={href} aria-current={active ? "page" : undefined}
                  className={cn("relative flex flex-col items-center gap-1 px-1 py-2.5 text-[11px] font-medium transition", active ? "text-foreground" : "text-muted-foreground")}>
                  {active && <span className="absolute inset-x-5 top-0 h-0.5 bg-brand" />}
                  <span className="relative">
                    <Icon className="h-5 w-5" strokeWidth={active ? 2.25 : 1.75} />
                    {label === "Work Orders" && waiting > 0 && (
                      <span className="absolute -right-2.5 -top-1.5 min-w-4 rounded-md bg-brand px-1 text-center text-[10px] font-semibold leading-4 text-primary">{waiting}</span>
                    )}
                  </span>
                  <span className="max-w-full truncate">{label === "Work Orders" ? "Orders" : label}</span>
                </Link>
              </li>
            );
          })}
          <li>
            <button onClick={() => setMore((m) => !m)} aria-expanded={more} aria-haspopup="dialog"
              className={cn("relative flex w-full flex-col items-center gap-1 px-1 py-2.5 text-[11px] font-medium transition", moreActive || more ? "text-foreground" : "text-muted-foreground")}>
              {moreActive && <span className="absolute inset-x-5 top-0 h-0.5 bg-brand" />}
              <MoreHorizontal className="h-5 w-5" strokeWidth={moreActive || more ? 2.25 : 1.75} />
              <span>More</span>
            </button>
          </li>
        </ul>
      </nav>

      <AnimatePresence>
        {more && (
          <>
            <motion.div key="scrim" className="fixed inset-0 z-40 bg-foreground/30 lg:hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setMore(false)} />
            <motion.div key="sheet" role="dialog" aria-label="More" className="fixed inset-x-0 bottom-[calc(env(safe-area-inset-bottom)+3.9rem)] z-[45] rounded-t-lg border-t border-border bg-card shadow-lg lg:hidden"
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ duration: 0.3, ease }}>
              <div className="mx-auto mt-2 h-1 w-10 rounded-full bg-border" />
              <ul className="p-3">
                {MORE.map(({ href, label, icon: Icon, blurb }) => (
                  <li key={href}>
                    <Link href={href} className={cn("flex items-center gap-3 rounded-md px-3 py-3 transition hover:bg-muted", isActive(path, href) && "bg-muted")}>
                      <Icon className="h-5 w-5 text-muted-foreground" />
                      <span><span className="block text-sm font-medium">{label}</span><span className="block text-xs text-muted-foreground">{blurb}</span></span>
                    </Link>
                  </li>
                ))}
              </ul>
              <div className="flex items-center gap-3 border-t border-border px-6 py-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold">{(email || "A")[0].toUpperCase()}</span>
                <span className="min-w-0 flex-1 truncate text-sm text-muted-foreground">{email || "Admin"}</span>
                <form method="post" action="/api/auth/logout">
                  <button type="submit" className="inline-flex min-h-10 items-center gap-2 rounded-md px-3 text-sm font-medium text-destructive transition hover:bg-destructive/10">
                    <LogOut className="h-4 w-4" /> Sign out
                  </button>
                </form>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <WorkerDrawer id={workerId} onClose={() => setWorkerId(null)} />
    </div>
  );
}

export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
