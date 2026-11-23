import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode } from "react";

/** Page width: max 1240px, gutters 20px (mobile) / 32px (desktop). */
export function Container({ className, ...p }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("mx-auto w-full max-w-site px-5 sm:px-8", className)} {...p} />;
}

/** Vertical rhythm: 64px on mobile, 96px on desktop. */
export function Section({ className, children, ...p }: HTMLAttributes<HTMLElement>) {
  return <section className={cn("py-16 md:py-24", className)} {...p}>{children}</section>;
}

/** Yellow highlighter fill behind navy text. Yellow is a fill only; the text stays navy. Use on 1 to 3 words of a headline. */
export function Highlight({ children, className }: { children: ReactNode; className?: string }) {
  return <mark className={cn("rounded-[0.18em] bg-brand px-[0.14em] text-on-accent [box-decoration-break:clone] [-webkit-box-decoration-break:clone]", className)}>{children}</mark>;
}

/** Selectable filter chip (toggle). */
export function Chip({ selected, className, children, ...p }: { selected?: boolean; children: ReactNode } & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button type="button" aria-pressed={selected} {...p}
      className={cn("inline-flex min-h-10 shrink-0 items-center gap-2 rounded-lg border px-4 text-[15px] font-medium transition duration-150 ease-ui",
        selected ? "border-primary bg-primary/[0.08] text-foreground" : "border-border-strong bg-card text-foreground hover:bg-muted", className)}>
      {children}
    </button>
  );
}

/** Status pill. */
export function Pill({ tone = "neutral", children, className }: { tone?: "success" | "warning" | "neutral"; children: ReactNode; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[13px] font-medium",
      tone === "success" && "bg-success/10 text-success-text", tone === "warning" && "bg-warning/10 text-warning-text",
      tone === "neutral" && "bg-muted text-foreground", className)}>
      {children}
    </span>
  );
}

/** Loading placeholder with fixed dimensions, so nothing shifts when content arrives. */
export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden className={cn("animate-pulse rounded-lg bg-muted", className)} />;
}

export function Breadcrumbs({ items }: { items: { label: string; href?: string }[] }) {
  return (
    <nav aria-label="Breadcrumb" className="text-small text-muted-foreground">
      <ol className="flex flex-wrap items-center gap-1.5">
        {items.map((it, i) => (
          <li key={it.label} className="flex items-center gap-1.5">
            {it.href && i < items.length - 1 ? <Link href={it.href} className="inline-flex min-h-11 items-center hover:text-foreground hover:underline">{it.label}</Link> : <span aria-current={i === items.length - 1 ? "page" : undefined} className={i === items.length - 1 ? "inline-flex min-h-11 items-center text-foreground" : undefined}>{it.label}</span>}
            {i < items.length - 1 && <ChevronRight className="h-3.5 w-3.5" aria-hidden />}
          </li>
        ))}
      </ol>
    </nav>
  );
}

/** FAQ accordion on native <details>: keyboard and screen-reader friendly, works without JavaScript. */
export function Accordion({ items }: { items: { q: string; a: ReactNode }[] }) {
  return (
    <div className="divide-y divide-border border-y border-border">
      {items.map((it) => (
        <details key={it.q} className="group py-1">
          <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-6 py-3 text-base font-semibold [&::-webkit-details-marker]:hidden">
            {it.q}
            <span aria-hidden className="text-2xl font-normal leading-none text-muted-foreground transition duration-240 ease-ui group-open:rotate-45">+</span>
          </summary>
          <div className="max-w-[65ch] pb-4 text-base leading-relaxed text-muted-foreground">{it.a}</div>
        </details>
      ))}
    </div>
  );
}
