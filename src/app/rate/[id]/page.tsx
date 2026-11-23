"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";
import { Stars } from "@/components/ui/stars";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/field";
import { ease } from "@/lib/utils";

type Info = { state: "loading" } | { state: "unavailable" } | { state: "done" } | { state: "ready"; providerName: string; jobTitle: string };

// Public page. It talks only to /api/rate/[id], which returns the provider's name and the job title and nothing else.
export default function RatePage() {
  const { id } = useParams<{ id: string }>();
  const [info, setInfo] = useState<Info>({ state: "loading" });
  const [stars, setStars] = useState(0);
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/rate/${encodeURIComponent(id)}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => setInfo(d))
      .catch(() => setInfo({ state: "unavailable" }));
  }, [id]);

  const submit = async () => {
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/rate/${encodeURIComponent(id)}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ stars, comment }) });
      if (res.ok || res.status === 409) setInfo({ state: "done" });
      else setError("We could not save your rating. Please try again.");
    } catch {
      setError("Could not reach the server. Please try again.");
    }
    setBusy(false);
  };

  let body: React.ReactNode;
  if (info.state === "loading") {
    body = <p className="text-muted-foreground">Loading…</p>;
  } else if (info.state === "unavailable") {
    body = <p className="text-muted-foreground">This job isn&apos;t available for rating yet.</p>;
  } else if (info.state === "done") {
    body = (
      <div className="space-y-3">
        <CheckCircle2 className="mx-auto h-10 w-10 text-success" />
        <h1 className="text-2xl font-semibold">Thank you</h1>
        <p className="text-muted-foreground">Your feedback helps others choose with confidence.</p>
      </div>
    );
  } else {
    body = (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">How was {info.providerName}?</h1>
          <p className="mt-2 text-sm text-muted-foreground">{info.jobTitle}</p>
        </div>
        <div className="flex justify-center"><Stars value={stars} onChange={setStars} size="h-10 w-10" /></div>
        <Textarea placeholder="Tell us more (optional)" maxLength={500} value={comment} onChange={(e) => setComment(e.target.value)} />
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        <Button className="w-full" disabled={!stars || busy} onClick={submit}>{busy ? "Saving…" : "Submit rating"}</Button>
      </div>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease }}
        className="w-full max-w-md rounded-lg border border-border/50 bg-card p-8 text-center">
        {body}
      </motion.div>
    </main>
  );
}
