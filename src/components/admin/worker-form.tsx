"use client";
import { useState } from "react";
import { AREAS, CATEGORIES } from "@/lib/config";
import { slugify } from "@/lib/slug";
import { today } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { ProfileGlyph } from "@/components/site/profile-glyph";
import type { Provider } from "@/lib/types";

export type WorkerData = Omit<Provider, "id">;

const csv = (s: string) => s.split(",").map((x) => x.trim()).filter(Boolean);

export function WorkerForm({ initial, submitLabel, onSubmit }: { initial?: Provider; submitLabel: string; onSubmit: (d: WorkerData) => void }) {
  const [f, setF] = useState({
    name: initial?.name ?? "", category: initial?.category ?? (CATEGORIES[0] as string), years: String(initial?.years ?? 1),
    phone: initial?.phone ?? "", email: initial?.email ?? "", idNumber: initial?.idNumber ?? "",
    joinedOn: initial?.joinedOn ?? today(), area: initial?.area ?? Object.keys(AREAS)[0],
    qualifications: initial?.qualifications.join(", ") ?? "", bio: initial?.bio ?? "",
    slug: initial?.slug ?? "", fromPrice: initial?.fromPrice != null ? String(initial.fromPrice) : "",
    availability: initial?.availability ?? "", languages: initial?.languages?.join(", ") ?? "",
    serviceRadiusKm: initial?.serviceRadiusKm != null ? String(initial.serviceRadiusKm) : "",
  });
  const [photo, setPhoto] = useState<string | undefined>(initial?.photo);
  const [upErr, setUpErr] = useState("");
  const [busy, setBusy] = useState(false);
  const upload = async (file: File | undefined) => {
    if (!file) return;
    setUpErr(""); setBusy(true);
    const fd = new FormData(); fd.append("file", file);
    try {
      const r = await fetch("/api/db/photo", { method: "POST", body: fd });
      const j = await r.json().catch(() => ({}));
      if (r.ok && j.url) setPhoto(j.url); else setUpErr(j.error ?? "Upload failed");
    } catch { setUpErr("Upload failed. Check your connection."); }
    setBusy(false);
  };
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setF((s) => ({ ...s, [k]: e.target.value }));

  const submit = () =>
    onSubmit({
      name: f.name.trim(), category: f.category, years: Number(f.years) || 0, phone: f.phone.trim(),
      email: f.email.trim() || undefined, idNumber: f.idNumber.trim() || undefined, joinedOn: f.joinedOn || undefined,
      area: f.area, ...AREAS[f.area], bio: f.bio,
      qualifications: csv(f.qualifications),
      // Public profile fields. Empty means "not provided", and the site hides that line.
      slug: slugify(f.slug || f.name),
      fromPrice: f.fromPrice ? Number(f.fromPrice) : undefined,
      availability: (f.availability || undefined) as Provider["availability"],
      languages: csv(f.languages).length ? csv(f.languages) : undefined,
      serviceRadiusKm: f.serviceRadiusKm ? Number(f.serviceRadiusKm) : undefined,
      photo, gallery: initial?.gallery,
      active: initial?.active ?? true, employment: initial?.employment ?? "active", leftOn: initial?.leftOn, leftReason: initial?.leftReason,
    });

  return (
    <div className="space-y-6">
      <section className="space-y-4">
        <h3 className="text-sm font-semibold">Personal details <span className="font-normal text-muted-foreground">· private</span></h3>
        <Field label="Full name"><Input value={f.name} onChange={set("name")} /></Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Phone"><Input value={f.phone} onChange={set("phone")} inputMode="tel" placeholder="+254 7…" /></Field>
          <Field label="Email (optional)"><Input type="email" value={f.email} onChange={set("email")} /></Field>
          <Field label="National ID (optional)"><Input value={f.idNumber} onChange={set("idNumber")} /></Field>
          <Field label="Date joined"><Input type="date" value={f.joinedOn} onChange={set("joinedOn")} /></Field>
        </div>
        <p className="text-xs text-muted-foreground">Contact and ID details stay in the admin. They are never sent to the public site.</p>
      </section>

      <section className="space-y-4">
        <h3 className="text-sm font-semibold">Public profile <span className="font-normal text-muted-foreground">· shown on the site</span></h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Trade"><Select value={f.category} onChange={set("category")}>{CATEGORIES.map((c) => <option key={c}>{c}</option>)}</Select></Field>
          <Field label="Years of experience"><Input type="number" min={0} value={f.years} onChange={set("years")} /></Field>
        </div>
        <Field label="Base area (also used for nearest-first sorting)">
          <Select value={f.area} onChange={set("area")}>{Object.keys(AREAS).map((a) => <option key={a}>{a}</option>)}</Select>
        </Field>
        <Field label="Qualifications (comma separated)"><Input value={f.qualifications} onChange={set("qualifications")} /></Field>
        <Field label="Short bio"><Textarea value={f.bio} onChange={set("bio")} /></Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="From price per visit, KES (optional)"><Input type="number" min={0} value={f.fromPrice} onChange={set("fromPrice")} /></Field>
          <Field label="Availability (optional)">
            <Select value={f.availability} onChange={set("availability")}>
              <option value="">Not shown</option><option value="today">Available today</option>
              <option value="week">Available this week</option><option value="booked">Fully booked</option>
            </Select>
          </Field>
          <Field label="Languages (comma separated, optional)"><Input value={f.languages} onChange={set("languages")} placeholder="English, Swahili" /></Field>
          <Field label="Service radius, km (optional)"><Input type="number" min={1} value={f.serviceRadiusKm} onChange={set("serviceRadiusKm")} /></Field>
        </div>
        <Field label="Web address name (optional)"><Input value={f.slug} onChange={set("slug")} placeholder={slugify(f.name) || "created from the name"} /></Field>
        <div className="flex items-center gap-4">
          <span className="flex h-16 w-16 shrink-0 items-end justify-center overflow-hidden rounded-full bg-primary text-brand">
            {photo ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={photo} alt="" className="h-full w-full object-cover" /> : <ProfileGlyph className="h-12 w-12" />}
          </span>
          <div className="min-w-0 space-y-1">
            <p className="text-sm font-medium">Profile photo <span className="font-normal text-muted-foreground">· optional</span></p>
            <div className="flex flex-wrap gap-2">
              <label className="inline-flex min-h-9 cursor-pointer items-center rounded-lg border border-border bg-background px-3 text-sm font-medium hover:bg-muted focus-within:ring-2 focus-within:ring-ring">
                {busy ? "Uploading…" : photo ? "Change photo" : "Upload photo"}
                <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" disabled={busy} onChange={(e) => { upload(e.target.files?.[0]); e.target.value = ""; }} />
              </label>
              {photo && <button type="button" onClick={() => setPhoto(undefined)} className="inline-flex min-h-9 items-center rounded-lg px-3 text-sm font-medium text-muted-foreground hover:bg-muted">Remove</button>}
            </div>
            <p className="text-xs text-muted-foreground" role={upErr ? "alert" : undefined}>{upErr || "JPG, PNG or WebP, up to 2 MB. Without one, a profile icon is shown."}</p>
          </div>
        </div>
      </section>

      <Button className="w-full" disabled={!f.name.trim() || !f.phone.trim()} onClick={submit}>{submitLabel}</Button>
    </div>
  );
}
