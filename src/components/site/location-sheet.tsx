"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { Check, LocateFixed, Loader2, MapPin, Search } from "lucide-react";
import { AREA_LIST } from "@/lib/areas";
import { RADII } from "@/lib/location";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ds/button";
import { Chip } from "@/components/ds/primitives";
import { Sheet } from "@/components/ds/sheet";
import { useLocation } from "./providers";

/** Soft-ask and Location Sheet in one: current location, "use my location", area search, recent areas, radius. */
export function LocationSheet() {
  const loc = useLocation();
  const [q, setQ] = useState("");
  const [help, setHelp] = useState(false);

  const matches = useMemo(() => {
    const t = q.trim().toLowerCase();
    return (t ? AREA_LIST.filter((a) => a.name.toLowerCase().includes(t)) : AREA_LIST).slice(0, 8);
  }, [q]);

  return (
    <Sheet open={loc.sheetOpen} onClose={loc.closeSheet} title={loc.hasLocation ? "Your location" : "See pros closest to you"}
      footer={loc.hasLocation ? <Button variant="ghost" block onClick={() => { loc.clear(); setQ(""); }}>Clear my location</Button> : undefined}>
      <div className="space-y-6">
        {loc.hasLocation && loc.area && (
          <p className="flex items-center gap-2 rounded-lg bg-muted px-4 py-3 text-[15px]">
            <MapPin className="h-4 w-4 shrink-0" aria-hidden />
            <span>Showing pros near <strong className="font-semibold">{loc.area.name}</strong>{loc.state === "granted" ? " (from your device)" : ""}</span>
          </p>
        )}

        <div>
          <p className="text-[15px] leading-relaxed text-muted-foreground">
            We use your location only to show nearby professionals and accurate distances. We never share it with them, and it stays on your device.
          </p>
          <Button data-autofocus variant="accent" size="lg" block className="mt-4" disabled={loc.state === "prompting"} onClick={loc.requestGps}>
            {loc.state === "prompting" ? <><Loader2 className="h-5 w-5 animate-spin" aria-hidden /> Locating…</> : <><LocateFixed className="h-5 w-5" aria-hidden /> Use my current location</>}
          </Button>
          {loc.state === "denied" && (
            <div className="mt-3 text-[15px] text-muted-foreground" role="status">
              Location is blocked for this site, so please choose an area below.{" "}
              <button className="font-medium text-foreground underline underline-offset-4" onClick={() => setHelp((h) => !h)} aria-expanded={help}>How to enable location</button>
              {help && <p className="mt-2 rounded-lg bg-muted p-3">In your browser, open the site settings next to the address bar, set Location to Allow, then reload. On iPhone: Settings, Privacy, Location Services, your browser, While Using.</p>}
            </div>
          )}
          {loc.state === "unavailable" && <p className="mt-3 text-[15px] text-muted-foreground" role="status">We could not get your location. Choose an area below instead.</p>}
        </div>

        <div>
          <label htmlFor="area-search" className="text-[15px] font-semibold">Or search for an area</label>
          <div className="relative mt-2">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
            <input id="area-search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Kilimani, Westlands, Karen…" autoComplete="off"
              className="h-12 w-full rounded-lg border border-border-strong bg-card pl-10 pr-4 text-base" />
          </div>
          {!q && loc.recent.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2" aria-label="Recent areas">
              {loc.recent.map((a) => <Chip key={a.slug} selected={loc.area?.slug === a.slug} onClick={() => { loc.chooseArea(a.slug); loc.closeSheet(); }}>{a.name}</Chip>)}
            </div>
          )}
          <ul className="mt-3 max-h-56 divide-y divide-border overflow-y-auto rounded-lg border border-border">
            {matches.map((a) => (
              <li key={a.slug}>
                <button onClick={() => { loc.chooseArea(a.slug); loc.closeSheet(); setQ(""); }}
                  className={cn("flex min-h-11 w-full items-center justify-between px-4 text-left text-[15px] hover:bg-muted", loc.area?.slug === a.slug && "font-semibold")}>
                  {a.name}{loc.area?.slug === a.slug && <Check className="h-4 w-4" aria-label="selected" />}
                </button>
              </li>
            ))}
            {matches.length === 0 && <li className="px-4 py-4 text-[15px] text-muted-foreground">No matching area. Try a nearby estate or road.</li>}
          </ul>
        </div>

        <div>
          <p className="text-[15px] font-semibold" id="radius-label">Search radius</p>
          <div className="mt-2 flex flex-wrap gap-2" role="group" aria-labelledby="radius-label">
            {RADII.map((r) => <Chip key={r} selected={loc.radius === r} onClick={() => loc.setRadius(r)}>{r} km</Chip>)}
          </div>
        </div>

        <p className="text-small text-muted-foreground">See our <Link href="/legal/privacy" onClick={loc.closeSheet} className="underline underline-offset-4 hover:text-foreground">Privacy Policy</Link> for how location is handled.</p>
      </div>
    </Sheet>
  );
}
