import { cn } from "@/lib/utils";

const tone: Record<string, string> = {
  new: "bg-info/10 text-info", scheduled: "bg-warning/10 text-warning", in_progress: "bg-warning/10 text-warning",
  completed: "bg-success/10 text-success", cancelled: "bg-muted text-muted-foreground",
  converted: "bg-success/10 text-success", dismissed: "bg-muted text-muted-foreground", urgent: "bg-destructive/10 text-destructive",
  normal: "bg-muted text-muted-foreground", low: "bg-muted text-muted-foreground",
};
export function Badge({ kind, children }: { kind: string; children: React.ReactNode }) {
  return <span className={cn("inline-flex rounded-md px-2.5 py-0.5 text-xs font-medium", tone[kind] ?? "bg-muted text-muted-foreground")}>{children}</span>;
}
