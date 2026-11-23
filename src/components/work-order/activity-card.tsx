import { Card } from "@/components/ui/card";
import type { Activity } from "@/lib/types";

const stamp = (iso: string) =>
  new Date(iso).toLocaleString(undefined, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

export function ActivityCard({ items }: { items: Activity[] }) {
  const rows = [...items].reverse();
  return (
    <Card title="Activity" subtitle="A record of what has happened on this job.">
      <ol className="relative space-y-4 border-l border-border pl-5">
        {rows.map((a) => (
          <li key={a.id} className="relative">
            <span className="absolute -left-[1.6rem] top-1.5 h-2 w-2 rounded-full bg-primary" />
            <p className="text-sm">{a.text}</p>
            <p className="text-xs text-muted-foreground">{stamp(a.at)}</p>
          </li>
        ))}
        {!rows.length && <li className="text-sm text-muted-foreground">No activity recorded yet.</li>}
      </ol>
    </Card>
  );
}
