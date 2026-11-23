import { cn } from "@/lib/utils";
import type { InputHTMLAttributes, TextareaHTMLAttributes } from "react";

// Control borders use --border-strong (3.9:1) so fields are identifiable (WCAG 1.4.11); focus shows the global ring.
const base = "w-full rounded-md border border-border-strong bg-background px-4 py-2.5 text-sm transition focus-visible:border-foreground disabled:opacity-60";
export const Input = (p: InputHTMLAttributes<HTMLInputElement>) => <input {...p} className={cn(base, p.className)} />;
export { Select } from "./select";
export const Textarea = (p: TextareaHTMLAttributes<HTMLTextAreaElement>) => <textarea rows={3} {...p} className={cn(base, p.className)} />;
export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-medium text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}
