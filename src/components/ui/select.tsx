"use client";
import { Children, isValidElement, useEffect, useId, useRef, useState, type ReactNode, type SelectHTMLAttributes } from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

type Opt = { value: string; label: string; disabled: boolean };

const textOf = (n: ReactNode): string =>
  Array.isArray(n) ? n.map(textOf).join("") : typeof n === "string" || typeof n === "number" ? String(n) : isValidElement<{ children?: ReactNode }>(n) ? textOf(n.props.children) : "";

// Drop-in replacement for <select>: same <option> children and the same onChange shape,
// but with a styled, keyboard-accessible list that is never clipped by modals or panels.
export function Select({ value, onChange, children, disabled, className, id, ...rest }: SelectHTMLAttributes<HTMLSelectElement>) {
  const options: Opt[] = Children.toArray(children).flatMap((c) => {
    if (!isValidElement<{ value?: string | number; disabled?: boolean; children?: ReactNode }>(c)) return [];
    const label = textOf(c.props.children);
    return [{ value: String(c.props.value ?? label), label, disabled: !!c.props.disabled }];
  });
  const current = options.find((o) => o.value === String(value ?? ""));

  const uid = useId();
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [pos, setPos] = useState<{ left: number; width: number; top?: number; bottom?: number } | null>(null);
  const btn = useRef<HTMLButtonElement>(null);
  const list = useRef<HTMLUListElement>(null);

  const openList = () => {
    if (disabled || !btn.current) return;
    const r = btn.current.getBoundingClientRect();
    const up = window.innerHeight - r.bottom < 260 && r.top > window.innerHeight - r.bottom;
    const width = Math.max(r.width, 160);
    const left = Math.max(8, Math.min(r.left, window.innerWidth - width - 8)); // keep the list on screen on phones
    setPos({ left, width, ...(up ? { bottom: window.innerHeight - r.top + 6 } : { top: r.bottom + 6 }) });
    setActive(Math.max(0, options.findIndex((o) => o.value === String(value ?? ""))));
    setOpen(true);
  };
  const choose = (o: Opt) => {
    if (o.disabled) return;
    onChange?.({ target: { value: o.value }, currentTarget: { value: o.value } } as unknown as React.ChangeEvent<HTMLSelectElement>);
    setOpen(false);
    btn.current?.focus();
  };
  const move = (dir: 1 | -1) =>
    setActive((a) => {
      let i = a;
      for (let n = 0; n < options.length; n++) {
        i = (i + dir + options.length) % options.length;
        if (!options[i].disabled) return i;
      }
      return a;
    });

  useEffect(() => {
    if (!open) return;
    const close = (e: Event) => {
      if (e instanceof MouseEvent && (btn.current?.contains(e.target as Node) || list.current?.contains(e.target as Node))) return;
      if (e.type === "scroll" && list.current?.contains(e.target as Node)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", close);
    window.addEventListener("resize", close);
    window.addEventListener("scroll", close, true);
    return () => { document.removeEventListener("mousedown", close); window.removeEventListener("resize", close); window.removeEventListener("scroll", close, true); };
  }, [open]);
  useEffect(() => { if (open) document.getElementById(`${uid}-${active}`)?.scrollIntoView({ block: "nearest" }); }, [active, open, uid]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!open) {
      if (["ArrowDown", "ArrowUp", "Enter", " "].includes(e.key)) { e.preventDefault(); openList(); }
      return;
    }
    if (e.key === "ArrowDown") { e.preventDefault(); move(1); }
    else if (e.key === "ArrowUp") { e.preventDefault(); move(-1); }
    else if (e.key === "Home") { e.preventDefault(); setActive(0); }
    else if (e.key === "End") { e.preventDefault(); setActive(options.length - 1); }
    else if (e.key === "Enter" || e.key === " ") { e.preventDefault(); options[active] && choose(options[active]); }
    else if (e.key === "Escape" || e.key === "Tab") setOpen(false);
  };

  return (
    <>
      <button
        ref={btn} id={id} type="button" disabled={disabled} role="combobox" aria-haspopup="listbox" aria-expanded={open}
        aria-controls={`${uid}-list`} aria-label={rest["aria-label"]} onClick={() => (open ? setOpen(false) : openList())} onKeyDown={onKeyDown}
        className={cn(
          "flex w-full items-center justify-between gap-2 rounded-md border border-border bg-background px-4 py-2.5 text-left text-sm outline-none transition",
          "focus-visible:border-foreground/40 disabled:cursor-not-allowed disabled:opacity-60", open && "border-foreground/40", className,
        )}>
        <span className={cn("truncate", !current && "text-muted-foreground")}>{current?.label || "Select"}</span>
        <ChevronDown className={cn("h-4 w-4 shrink-0 text-muted-foreground transition-transform", open && "rotate-180")} />
      </button>
      {open && pos && typeof document !== "undefined" &&
        createPortal(
          <ul ref={list} id={`${uid}-list`} role="listbox" style={{ position: "fixed", left: pos.left, width: pos.width, top: pos.top, bottom: pos.bottom }}
            className="z-[60] max-h-64 overflow-y-auto rounded-md border border-border bg-card p-1 shadow-lg">
            {options.map((o, i) => (
              <li key={`${o.value}-${i}`} id={`${uid}-${i}`} role="option" aria-selected={o === current} aria-disabled={o.disabled}
                onMouseEnter={() => !o.disabled && setActive(i)} onMouseDown={(e) => e.preventDefault()} onClick={() => choose(o)}
                className={cn("flex cursor-pointer items-center justify-between gap-3 rounded-md px-3 py-2 text-sm",
                  i === active && !o.disabled && "bg-muted", o.disabled && "cursor-not-allowed text-muted-foreground/60")}>
                <span className="truncate">{o.label}</span>
                {o === current && <Check className="h-4 w-4 shrink-0" />}
              </li>
            ))}
          </ul>,
          document.body,
        )}
    </>
  );
}
