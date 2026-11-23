"use client";
import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { BRAND } from "@/lib/config";
import { ease } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password }) });
      if (res.ok) {
        // Only ever return to an admin path on this site.
        const next = new URLSearchParams(window.location.search).get("next") ?? "";
        window.location.assign(next.startsWith("/admin") && !next.startsWith("//") ? next : "/admin");
        return;
      }
      const data = await res.json().catch(() => ({}));
      setError(typeof data.error === "string" ? data.error : "Sign-in failed. Please try again.");
    } catch {
      setError("Could not reach the server. Check your connection and try again.");
    }
    setBusy(false);
  };

  return (
    <main className="grid h-[100dvh] overflow-hidden lg:grid-cols-2">
      <section className="relative hidden overflow-hidden bg-primary p-12 text-primary-foreground lg:flex lg:flex-col lg:justify-between">
        <span className="relative flex items-center gap-3 font-semibold">
          <span className="inline-flex rounded-xl bg-white px-3 py-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand/logo.png" alt="" width={570} height={170} className="h-10 w-auto" />
          </span>
          <span className="sr-only">{BRAND.name}</span>
        </span>
        <div className="relative">
          <h2 className="text-3xl font-semibold tracking-tight">Operations portal</h2>
          <p className="mt-3 max-w-sm text-primary-foreground/70">Manage work orders, schedule your team without conflicts, track billing and maintain staff records.</p>
        </div>
        <p className="relative text-sm text-primary-foreground/50">{BRAND.tagline}</p>
      </section>

      <section className="flex h-full min-h-0 flex-col px-4 sm:px-6">
        <div className="flex flex-1 items-center justify-center">
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease }} className="w-full max-w-sm">
          <Link href="/" className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground transition hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Back to site
          </Link>
          <h1 className="text-2xl font-semibold tracking-tight">Sign in</h1>
          <p className="mt-2 text-sm text-muted-foreground">Enter your credentials to access the operations portal.</p>

          <form onSubmit={submit} className="mt-8 space-y-4">
            <Field label="Email"><Input type="text" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" /></Field>
            <Field label="Password"><Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" /></Field>
            {error && <p role="alert" className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full" disabled={busy}>{busy ? "Signing in…" : "Sign in"}</Button>
          </form>
        </motion.div>
        </div>
        <p className="shrink-0 py-4 text-center text-xs text-muted-foreground">© {new Date().getFullYear()} {BRAND.name}. All rights reserved.</p>
      </section>
    </main>
  );
}
