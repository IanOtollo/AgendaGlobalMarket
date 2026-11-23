"use client";
import { useEffect, useState } from "react";
import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";
import { PageHeader } from "@/components/layout/admin-shell";

export default function SettingsPage() {
  const { settings, setSettings } = useStore();
  const [f, setF] = useState(settings);
  useEffect(() => setF(settings), [settings]);

  return (
    <>
      <PageHeader title="Settings" />
      <div className="max-w-md space-y-4 rounded-lg border border-border/50 bg-card p-8">
        <Field label="Business name"><Input value={f.businessName} onChange={(e) => setF({ ...f, businessName: e.target.value })} /></Field>
        <Field label="Admin phone (the only number shown to clients)">
          <Input value={f.adminPhone} onChange={(e) => setF({ ...f, adminPhone: e.target.value })} inputMode="tel" placeholder="+254700000000" />
        </Field>
        <p className="text-xs text-muted-foreground">Used for every Call and WhatsApp button. Include the country code.</p>
        <Button onClick={() => setSettings(f)}>Save changes</Button>
      </div>
    </>
  );
}
