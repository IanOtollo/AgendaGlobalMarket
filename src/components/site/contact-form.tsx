"use client";
import { useState } from "react";
import { CheckCircle2, MessageCircle, Send } from "lucide-react";
import { Button } from "@/components/ds/button";
import { waUrl } from "@/lib/contact";
import { track } from "@/lib/analytics";

const field = "w-full rounded-lg border border-border-strong bg-card px-4 text-base outline-none transition placeholder:text-muted-foreground focus:border-foreground focus-visible:ring-2 focus-visible:ring-ring";
const label = "mb-1.5 block text-[15px] font-medium";
const EMPTY = { name: "", contact: "", message: "", company: "" };

/**
 * Three fields, one tap: name, a phone number or email, and what they need. The message goes straight to the office and
 * lands in the admin as a new request. The contact field is required so the office can always get back to the customer.
 */
export function ContactForm({ phone: officePhone }: { phone: string }) {
  const [f, setF] = useState(EMPTY);
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");
  const [error, setError] = useState("");
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => { setF((x) => ({ ...x, [k]: e.target.value })); setError(""); };

  const check = () => {
    if (!f.name.trim()) return "Please add your name.";
    const c = f.contact.trim();
    const digits = c.replace(/\D/g, "");
    const ok = c.includes("@") ? /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(c) : digits.length >= 7 && digits.length <= 15 && /^[0-9+()\-\s.]+$/.test(c);
    if (!ok) return "Please add a phone number or email the office can reach you on.";
    if (!f.message.trim()) return "Tell us what you need.";
    return "";
  };

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const problem = check();
    if (problem) { setError(problem); return; }
    setState("sending"); setError("");
    try {
      const res = await fetch("/api/contact", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(f) });
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        setError(j.error ?? "Something went wrong. Please try again."); setState("idle"); return;
      }
      track("contact_form_sent", { channel: "office" });
      setState("sent");
    } catch {
      setError("We could not send that. Check your connection and try again."); setState("idle");
    }
  }

  if (state === "sent") {
    return (
      <div role="status" className="rounded-card border border-border bg-card p-8">
        <CheckCircle2 className="h-10 w-10 text-success" aria-hidden />
        <h3 className="mt-4 text-h3">Thank you, {f.name.trim().split(" ")[0]}.</h3>
        <p className="mt-2 max-w-[48ch] text-base leading-relaxed text-muted-foreground">Your message has reached the office. We will contact you on {f.contact.trim()} to confirm the details.</p>
        <Button variant="secondary" className="mt-6" onClick={() => { setF(EMPTY); setState("idle"); }}>Send another message</Button>
      </div>
    );
  }

  const wa = waUrl(officePhone, ["Hi, I'd like to make an enquiry.", f.name && `Name: ${f.name.trim()}`, f.message.trim()].filter(Boolean).join("\n"));

  return (
    <form onSubmit={submit} noValidate className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <div><label htmlFor="cf-name" className={label}>Your name</label><input id="cf-name" autoComplete="name" required maxLength={80} value={f.name} onChange={set("name")} className={`${field} h-12`} /></div>
        <div><label htmlFor="cf-contact" className={label}>Phone number / email</label><input id="cf-contact" required maxLength={120} autoComplete="tel email" value={f.contact} onChange={set("contact")} className={`${field} h-12`} /></div>
      </div>
      <div><label htmlFor="cf-message" className={label}>What do you need?</label><textarea id="cf-message" rows={4} required maxLength={1000} value={f.message} onChange={set("message")} placeholder="For example: a leaking tap in Kilimani, tomorrow morning." className={`${field} py-3`} /></div>
      {/* Hidden from people; bots tend to fill every field. */}
      <div aria-hidden className="absolute -left-[9999px] h-0 w-0 overflow-hidden"><label>Company<input tabIndex={-1} autoComplete="off" value={f.company} onChange={set("company")} /></label></div>
      {error && <p role="alert" className="text-[15px] font-medium text-destructive">{error}</p>}
      <div className="flex flex-wrap gap-3">
        <Button type="submit" variant="accent" size="lg" disabled={state === "sending"}><Send className="h-5 w-5" aria-hidden /> {state === "sending" ? "Sending…" : "Send message"}</Button>
        {wa && <a href={wa} target="_blank" rel="noreferrer noopener" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border border-border-strong bg-card px-6 text-base font-semibold transition hover:bg-muted"><MessageCircle className="h-5 w-5" aria-hidden /> Or WhatsApp us</a>}
      </div>
    </form>
  );
}
