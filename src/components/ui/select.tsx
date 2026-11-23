"use client";
import { Children, isValidElement, useEffect, useId, useRef, useState, type ReactNode, type SelectHTMLAttributes } from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown, Search } from "lucide-react";
import { cn } from "@/lib/utils";

type Opt = { value: string; label: string; disabled: boolean };

const textOf = (n: ReactNode): string =>
  Array.isArray(n) ? n.map(textOf).join("") : typeof n === "string" || typeof n === "number" ? String(n) : isValidElement<{ children?: ReactNode }>(n) ? textOf(n.props.children) : "";

// Lists longer than this get a search box at the top of the dropdown.
const SEARCH_FROM = 8;

// Drop-in replacement for <select>: same <option> children and the same onChange shape,
// but with a styled, keyboard-accessible list that is never clipped by modals or panels.
export function Select({ value, onChange, children, disabled, className, id, ...rest }: SelectHTMLAttributes<HTMLSelectElement>) {
  const options: Opt[] = Children.toArray(children).flatMap((c) => {
    if (!isValidElement<{ value?: string | number; disabled?: boolean; children?: ReactNode }>(c)) return [];
    const label = textOf(c.props.children);
    return [{ value: String(c.props.value ?? label), label, disabled: !!c.props.disabled }];
  });
  const current = options.find((o) => o.value === String(value ?? ""));
  const searchable = options.length > SEARCH_FROM;

  const uid = useId();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const [pos, setPos] = useState<{ left: number; width: number; top?: number; bottom?: number } | null>(null);
  const btn = useRef<HTMLButtonElement>(null);
  const box = useRef<HTMLDivElement>(null);
  const search = useRef<HTMLInputElement>(null);

  // What the list shows: everything, or only the options matching the search.
  const q = query.trim().toLowerCase();
  const view = q ? options.filter((o) => o.label.toLowerCase().includes(q)) : options;

  const openList = () => {
    if (disabled || !btn.current) return;
    const r = btn.current.getBoundingClientRect();
    const need = searchable ? 320 : 260;
    const up = window.innerHeight - r.bottom < need && r.top > window.innerHeight - r.bottom;
    const width = Math.max(r.width, 200);
    const left = Math.max(8, Math.min(r.left, window.innerWidth - width - 8)); // keep the list on screen on phones
    setPos({ left, width, ...(up ? { bottom: window.innerHeight - r.top + 6 } : { top: r.bottom + 6 }) });
    setQuery("");
    setActive(Math.max(0, options.findIndex((o) => o.value === String(value ?? ""))));
    setOpen(true);
  };
  const closeList = () => { setOpen(false); setQuery(""); };
  const choose = (o: Opt) => {
    if (o.disabled) return;
    onChange?.({ target: { value: o.value }, currentTarget: { value: o.value } } as unknown as React.ChangeEvent<HTMLSelectElement>);
    closeList();
    btn.current?.focus();
  };
  const move = (dir: 1 | -1) =>
    setActive((a) => {
      let i = a;
      for (let n = 0; n < view.length; n++) {
        i = (i + dir + view.length) % view.length;
        if (!view[i].disabled) return i;
      }
      return a;
    });

  useEffect(() => {
    if (!open) return;
    const close = (e: Event) => {
      if (e instanceof MouseEvent && (btn.current?.contains(e.target as Node) || box.current?.contains(e.target as Node))) return;
      if (e.type === "scroll" && box.current?.contains(e.target as Node)) return;
      closeList();
    };
    document.addEventListener("mousedown", close);
    window.addEventListener("resize", close);
    window.addEventListener("scroll", close, true);
    return () => { document.removeEventListener("mousedown", close); window.removeEventListener("resize", close); window.removeEventListener("scroll", close, true); };
  }, [open]);
  useEffect(() => { if (open) document.getElementById(`${uid}-${active}`)?.scrollIntoView({ block: "nearest" }); }, [active, open, uid]);
  // With a search box, typing goes straight into it.
  useEffect(() => { if (open && searchable) search.current?.focus(); }, [open, searchable]);
  // A new search starts at the top of the matches.
  useEffect(() => { if (open && q) setActive(Math.max(0, view.findIndex((o) => !o.disabled))); }, [q]); // eslint-disable-line react-hooks/exhaustive-deps

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!open) {
      if (["ArrowDown", "ArrowUp", "Enter", " "].includes(e.key)) { e.preventDefault(); openList(); }
      return;
    }
    const typing = e.target === search.current;
    if (e.key === "ArrowDown") { e.preventDefault(); move(1); }
    else if (e.key === "ArrowUp") { e.preventDefault(); move(-1); }
    else if (e.key === "Home" && !typing) { e.preventDefault(); setActive(0); }
    else if (e.key === "End" && !typing) { e.preventDefault(); setActive(view.length - 1); }
    else if (e.key === "Enter" || (e.key === " " && !typing)) { e.preventDefault(); view[active] && choose(view[active]); }
    else if (e.key === "Escape" || e.key === "Tab") { closeList(); if (e.key === "Escape") btn.current?.focus(); }
  };

  return (
    <>
      <button
        ref={btn} id={id} type="button" disabled={disabled} role="combobox" aria-haspopup="listbox" aria-expanded={open}
        aria-controls={`${uid}-list`} aria-label={rest["aria-label"]} onClick={() => (open ? closeList() : openList())} onKeyDown={onKeyDown}
        className={cn(
          "flex w-full items-center justify-between gap-2 rounded-md border border-border bg-background px-4 py-2.5 text-left text-sm outline-none transition",
          "focus-visible:border-foreground/40 disabled:cursor-not-allowed disabled:opacity-60", open && "border-foreground/40", className,
        )}>
        <span className={cn("truncate", !current && "text-muted-foreground")}>{current?.label || "Select"}</span>
        <ChevronDown className={cn("h-4 w-4 shrink-0 text-muted-foreground transition-transform", open && "rotate-180")} />
      </button>
      {open && pos && typeof document !== "undefined" &&
        createPortal(
          <div ref={box} style={{ position: "fixed", left: pos.left, width: pos.width, top: pos.top, bottom: pos.bottom }}
            className="z-[60] overflow-hidden rounded-md border border-border bg-card shadow-lg">
            {searchable && (
              <div className="relative border-b border-border p-1.5">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
                <input ref={search} value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={onKeyDown} placeholder="Search" aria-label="Search the list"
                  role="searchbox" aria-controls={`${uid}-list`} aria-activedescendant={view[active] ? `${uid}-${active}` : undefined} autoComplete="off"
                  className="w-full rounded-md bg-muted/60 py-2 pl-9 pr-3 text-sm outline-none placeholder:text-muted-foreground focus:bg-muted" />
              </div>
            )}
            <ul id={`${uid}-list`} role="listbox" className="max-h-60 overflow-y-auto p-1">
              {view.map((o, i) => (
                <li key={`${o.value}-${i}`} id={`${uid}-${i}`} role="option" aria-selected={o === current} aria-disabled={o.disabled}
                  onMouseEnter={() => !o.disabled && setActive(i)} onMouseDown={(e) => e.preventDefault()} onClick={() => choose(o)}
                  className={cn("flex cursor-pointer items-center justify-between gap-3 rounded-md px-3 py-2 text-sm",
                    i === active && !o.disabled && "bg-muted", o.disabled && "cursor-not-allowed text-muted-foreground/60")}>
                  <span className="truncate">{o.label}</span>
                  {o === current && <Check className="h-4 w-4 shrink-0" />}
                </li>
              ))}
              {view.length === 0 && <li className="px-3 py-3 text-sm text-muted-foreground" role="presentation">No match</li>}
            </ul>
          </div>,
          document.body,
        )}
    </>
  );
}
