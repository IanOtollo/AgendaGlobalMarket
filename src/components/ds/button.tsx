import Link from "next/link";
import { cn } from "@/lib/utils";
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";

// accent = the one yellow call-to-action (fill only, navy text). primary = navy ink. Use one accent button per view.
type Variant = "accent" | "primary" | "secondary" | "ghost" | "link";
type Size = "md" | "lg";

export function buttonStyles({ variant = "secondary", size = "md", block = false }: { variant?: Variant; size?: Size; block?: boolean } = {}) {
  return cn(
    "inline-flex select-none items-center justify-center gap-2 whitespace-nowrap font-semibold transition duration-150 ease-ui active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50",
    block && "w-full",
    variant === "link"
      ? "min-h-11 px-1 text-[15px] underline underline-offset-4 hover:opacity-70"
      : cn("rounded-lg", size === "lg" ? "min-h-12 px-6 text-base" : "min-h-11 px-5 text-[15px]"),
    variant === "accent" && "bg-brand text-on-accent hover:brightness-95",
    variant === "primary" && "bg-primary text-primary-foreground hover:opacity-90",
    variant === "secondary" && "border border-border-strong bg-card text-foreground hover:bg-muted",
    variant === "ghost" && "text-foreground hover:bg-muted",
  );
}

type Common = { variant?: Variant; size?: Size; block?: boolean; className?: string; children: ReactNode };

export function Button({ variant, size, block, className, ...p }: Common & ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button type="button" {...p} className={cn(buttonStyles({ variant, size, block }), className)} />;
}

export function ButtonLink({ variant, size, block, className, href, external, ...p }: Common & Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & { href: string; external?: boolean }) {
  const cls = cn(buttonStyles({ variant, size, block }), className);
  return external || /^(tel:|mailto:|https?:)/.test(href)
    ? <a href={href} className={cls} {...(external ? { target: "_blank", rel: "noreferrer noopener" } : {})} {...p} />
    : <Link href={href} className={cls} {...p} />;
}
