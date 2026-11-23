"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Printer } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ds/button";
import { Breadcrumbs, Container, Section } from "@/components/ds/primitives";
import type { LegalDoc as Doc } from "@/content/legal";

const LINKS: [string, string][] = [["terms", "Terms of Service"], ["privacy", "Privacy Policy"], ["cookies", "Cookie Policy"], ["pro-agreement", "Pro Agreement"], ["cancellation-refunds", "Cancellations and Refunds"], ["acceptable-use", "Acceptable Use"], ["accessibility", "Accessibility"]];
export const legalHref = (slug: string) => (slug === "accessibility" ? "/accessibility" : `/legal/${slug}`);

/** Legal page template: sticky table of contents with scroll-spy, plain-language summaries, numbered clauses, print and change log. */
export function LegalDocView({ doc, minutes }: { doc: Doc; minutes: number }) {
  const [active, setActive] = useState(doc.sections[0].id);

  useEffect(() => {
    const els = doc.sections.map((s) => document.getElementById(s.id)).filter((e): e is HTMLElement => !!e);
    const io = new IntersectionObserver((entries) => {
      const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
      if (visible) setActive(visible.target.id);
    }, { rootMargin: "-90px 0px -65% 0px" });
    els.forEach((e) => io.observe(e));
    return () => io.disconnect();
  }, [doc]);

  const toc = (
    <ol className="space-y-0.5 text-[15px]">
      {doc.sections.map((s, i) => (
        <li key={s.id}>
          <a href={`#${s.id}`} aria-current={active === s.id ? "location" : undefined}
            className={cn("flex min-h-10 items-center gap-2 rounded-lg px-3 py-1.5 leading-snug hover:bg-muted", active === s.id ? "bg-muted font-semibold text-foreground" : "text-muted-foreground")}>
            <span className="w-5 shrink-0 text-small tabular-nums">{i + 1}.</span>{s.title}
          </a>
        </li>
      ))}
    </ol>
  );

  return (
    <Section className="!pt-8 md:!pt-12">
      {/* DRAFT: requires review by qualified counsel before launch. Source-only marker, not shown to visitors. */}
      <div hidden data-draft="DRAFT: requires review by qualified counsel before launch" />
      <Container>
        <div className="print:hidden"><Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Legal" }, { label: doc.title }]} /></div>
        <div className="mt-6 grid gap-12 lg:grid-cols-[16rem_1fr]">
          <aside className="print:hidden lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)] lg:self-start lg:overflow-y-auto" aria-label="Legal pages and contents">
            <details className="lg:hidden rounded-card border border-border bg-card"><summary className="flex min-h-12 cursor-pointer list-none items-center px-4 text-[15px] font-semibold [&::-webkit-details-marker]:hidden">On this page</summary><nav className="px-2 pb-3" aria-label="On this page">{toc}</nav></details>
            <nav className="hidden lg:block" aria-label="On this page"><p className="mb-2 px-3 text-micro font-semibold uppercase tracking-wide text-muted-foreground">On this page</p>{toc}</nav>
            <nav className="mt-8 hidden border-t border-border pt-5 lg:block" aria-label="Other legal pages">
              <p className="mb-2 px-3 text-micro font-semibold uppercase tracking-wide text-muted-foreground">Legal</p>
              <ul className="space-y-0.5">{LINKS.map(([s, l]) => <li key={s}><Link href={legalHref(s)} aria-current={s === doc.slug ? "page" : undefined} className={cn("flex min-h-10 items-center rounded-lg px-3 text-[15px] hover:bg-muted", s === doc.slug ? "font-semibold" : "text-muted-foreground")}>{l}</Link></li>)}</ul>
            </nav>
          </aside>

          <article className="min-w-0 max-w-[720px]">
            <h1 className="text-h1">{doc.title}</h1>
            <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-[15px] text-muted-foreground">
              <span>Last updated {doc.updated}</span><span aria-hidden>·</span><span>{minutes} min read</span>
              <Button variant="secondary" className="ml-auto print:hidden" onClick={() => window.print()}><Printer className="h-4 w-4" aria-hidden /> Print</Button>
            </div>
            <p className="mt-6 text-[17px] leading-relaxed text-muted-foreground">{doc.description}</p>

            {doc.sections.map((s, i) => (
              <section key={s.id} id={s.id} aria-labelledby={`${s.id}-h`} className="scroll-mt-28 border-t border-border pt-8 mt-10">
                <h2 id={`${s.id}-h`} className="text-h3"><span className="mr-2 tabular-nums text-muted-foreground">{i + 1}.</span>{s.title}</h2>
                <div className="mt-4 rounded-card border-l-4 border-brand bg-muted px-5 py-4">
                  <p className="text-micro font-semibold uppercase tracking-wide text-muted-foreground">In short</p>
                  <p className="mt-1 text-base">{s.summary}</p>
                </div>
                <ol className="mt-5 space-y-4 text-[17px] leading-relaxed">
                  {s.clauses.map((c, j) => (
                    <li key={j} className="flex gap-3">
                      <span className="mt-0.5 w-9 shrink-0 text-[15px] tabular-nums text-muted-foreground">{i + 1}.{j + 1}</span>
                      <div className="min-w-0">
                        {typeof c === "string" ? c : <>
                          <p>{c.text}</p>
                          <ul className="mt-2 list-disc space-y-1.5 pl-5">{c.items.map((it) => <li key={it}>{it}</li>)}</ul>
                        </>}
                      </div>
                    </li>
                  ))}
                </ol>
              </section>
            ))}

            <section aria-labelledby="changelog-h" className="mt-14 border-t border-border pt-8">
              <h2 id="changelog-h" className="text-h3">Change log</h2>
              <ul className="mt-4 space-y-2 text-[15px]">{doc.changelog.map((c) => <li key={c.date}><span className="font-medium">{c.date}</span> <span className="text-muted-foreground">{c.note}</span></li>)}</ul>
            </section>
          </article>
        </div>
      </Container>
    </Section>
  );
}
