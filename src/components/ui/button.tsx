import { cn } from "@/lib/utils";
import type { ButtonHTMLAttributes } from "react";

type P = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" | "ghost" | "danger"; size?: "sm" | "md" };
export function Button({ variant = "primary", size = "md", className, ...p }: P) {
  return (
    <button
      {...p}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-md font-medium transition active:scale-[0.98] disabled:opacity-50",
        size === "md" ? "px-5 py-2.5 text-sm" : "px-3 py-1.5 text-sm",
        variant === "primary" && "bg-primary text-primary-foreground hover:opacity-90",
        variant === "secondary" && "border border-border bg-background hover:bg-muted",
        variant === "ghost" && "hover:bg-muted/50",
        variant === "danger" && "text-destructive hover:bg-destructive/10",
        className,
      )}
    />
  );
}
