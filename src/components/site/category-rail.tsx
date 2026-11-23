"use client";
import Link from "next/link";
import { iconOf } from "@/lib/trades";
import { track } from "@/lib/analytics";
import { cn } from "@/lib/utils";
import { useSiteData, useTrades } from "./providers";

/** Horizontal, snap-scrolling row of trade tiles (a grid from `lg`). With `onSelect` it filters in place; otherwise it links. */
export function CategoryRail({ selected, onSelect, hrefFor }: { selected?: string | null; onSelect?: (name: string | null) => void; hrefFor?: (slug: string) => string }) {
  const { pros } = useSiteData();
  const CATEGORY_LIST = useTrades();
  const tile = "flex min-h-[5.5rem] w-40 shrink-0 snap-start flex-col justify-between rounded-card border p-4 text-left transition duration-150 ease-ui lg:w-auto";
  return (
    <ul className="-mx-5 flex snap-x gap-3 overflow-x-auto px-5 pb-2 sm:-mx-8 sm:px-8 lg:mx-0 lg:grid lg:grid-cols-[repeat(auto-fit,minmax(9.5rem,1fr))] lg:overflow-visible lg:px-0" aria-label="Trades">
      {CATEGORY_LIST.map((c) => {
        const Icon = iconOf(c.icon);
        const n = pros.filter((p) => p.category === c.name).length;
        const on = selected === c.name;
        const body = (
          <>
            <Icon className="h-6 w-6" strokeWidth={1.5} aria-hidden />
            <span><span className="block text-[15px] font-semibold">{c.name}</span><span className="block text-small text-muted-foreground">{n} {n === 1 ? "pro" : "pros"}</span></span>
          </>
        );
        const cls = cn(tile, on ? "border-primary bg-primary/[0.08] ring-1 ring-primary" : "border-border bg-card hover:border-border-strong hover:bg-muted");
        return (
          <li key={c.slug} className="contents">
            {onSelect ? (
              <button className={cls} aria-pressed={on} onClick={() => { track("category_selected", { trade: c.name }); onSelect(on ? null : c.name); }}>{body}</button>
            ) : (
              <Link className={cls} aria-current={on ? "page" : undefined} href={hrefFor ? hrefFor(c.slug) : `/services/${c.slug}`} onClick={() => track("category_selected", { trade: c.name })}>{body}</Link>
            )}
          </li>
        );
      })}
    </ul>
  );
}
