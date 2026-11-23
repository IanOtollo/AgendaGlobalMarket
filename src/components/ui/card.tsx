import { cn } from "@/lib/utils";

export function Card({ title, subtitle, action, children, className, flush }: {
  title?: string; subtitle?: string; action?: React.ReactNode; children: React.ReactNode; className?: string; flush?: boolean;
}) {
  return (
    <section className={cn("rounded-lg border border-border bg-card", className)}>
      {(title || action) && (
        <header className="flex flex-wrap items-start justify-between gap-x-4 gap-y-3 border-b border-border px-5 py-4">
          <div>
            <h2 className="text-sm font-semibold">{title}</h2>
            {subtitle && <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>}
          </div>
          {action}
        </header>
      )}
      <div className={flush ? "" : "p-5"}>{children}</div>
    </section>
  );
}
