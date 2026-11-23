import { Check } from "lucide-react";
import { STATUS_LABEL } from "@/lib/config";
import { cn } from "@/lib/utils";
import type { WOStatus } from "@/lib/types";

const STEPS: WOStatus[] = ["new", "scheduled", "in_progress", "completed"];

export function Stepper({ status }: { status: WOStatus }) {
  if (status === "cancelled") return <p className="text-sm font-medium text-muted-foreground">This work order has been cancelled.</p>;
  const current = STEPS.indexOf(status);
  return (
    <ol className="flex items-center">
      {STEPS.map((s, i) => (
        <li key={s} className="flex flex-1 items-center last:flex-none">
          <span className="flex items-center gap-2.5">
            <span className={cn("flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
              i < current ? "bg-primary text-primary-foreground" : i === current ? "bg-brand text-primary" : "bg-muted text-muted-foreground")}>
              {i < current ? <Check className="h-3.5 w-3.5" /> : i + 1}
            </span>
            <span className={cn("hidden text-sm sm:block", i === current ? "font-semibold" : "text-muted-foreground")}>{STATUS_LABEL[s]}</span>
          </span>
          {i < STEPS.length - 1 && <span className={cn("mx-3 h-px flex-1", i < current ? "bg-primary" : "bg-border")} />}
        </li>
      ))}
    </ol>
  );
}
