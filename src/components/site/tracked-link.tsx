"use client";
import { ButtonLink } from "@/components/ds/button";
import { track, type EventName } from "@/lib/analytics";
import type { ComponentProps } from "react";

/** A button-styled link that records an analytics event on click. */
export function TrackedLink({ event, ...p }: { event: EventName } & ComponentProps<typeof ButtonLink>) {
  return <ButtonLink {...p} onClick={() => track(event, { from: "page" })} />;
}
