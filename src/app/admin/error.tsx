"use client";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function AdminError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error(error); }, [error]);
  return (
    <div className="mx-auto max-w-md rounded-xl border border-border bg-card p-8 text-center">
      <h1 className="text-xl font-semibold">This page could not load</h1>
      <p className="mt-2 text-sm text-muted-foreground">Nothing was lost. Your data is saved. Try again, or reload the page.</p>
      <Button className="mt-6" onClick={reset}>Try again</Button>
    </div>
  );
}
