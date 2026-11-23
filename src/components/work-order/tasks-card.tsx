"use client";
import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { useStore } from "@/lib/store";
import { activity } from "@/lib/activity";
import { uid } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/field";
import type { Task, WorkOrder } from "@/lib/types";

export function TasksCard({ wo }: { wo: WorkOrder }) {
  const { updateWorkOrder } = useStore();
  const [title, setTitle] = useState("");
  const tasks = wo.tasks ?? [];
  const done = tasks.filter((t) => t.done).length;
  const set = (next: Task[], log?: string) =>
    updateWorkOrder(wo.id, { tasks: next, ...(log ? { activity: [...(wo.activity ?? []), activity(log)] } : {}) });
  const add = () => {
    if (!title.trim()) return;
    set([...tasks, { id: uid("t"), title: title.trim(), done: false }]);
    setTitle("");
  };

  return (
    <Card title="Service tasks" subtitle={tasks.length ? `${done} of ${tasks.length} completed` : "The steps the technician should follow."}>
      {tasks.length > 0 && (
        <div className="mb-4 h-1.5 overflow-hidden rounded-full bg-muted">
          <div className="h-full bg-primary transition-all" style={{ width: `${(done / tasks.length) * 100}%` }} />
        </div>
      )}
      <ul className="divide-y divide-border">
        {tasks.map((t) => (
          <li key={t.id} className="flex items-center gap-3 py-2.5">
            <input type="checkbox" checked={t.done} className="h-4 w-4"
              onChange={(e) => set(tasks.map((x) => (x.id === t.id ? { ...x, done: e.target.checked } : x)), e.target.checked ? `Task completed: ${t.title}` : undefined)} />
            <span className={t.done ? "flex-1 text-sm text-muted-foreground line-through" : "flex-1 text-sm"}>{t.title}</span>
            <button onClick={() => set(tasks.filter((x) => x.id !== t.id))} aria-label="Remove task" className="rounded-md p-1.5 text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive">
              <Trash2 className="h-4 w-4" />
            </button>
          </li>
        ))}
        {!tasks.length && <li className="py-3 text-sm text-muted-foreground">No tasks yet.</li>}
      </ul>
      <div className="mt-4 flex gap-2">
        <Input value={title} onChange={(e) => setTitle(e.target.value)} onKeyDown={(e) => e.key === "Enter" && add()} placeholder="Add a task, for example “Isolate water supply”" />
        <Button variant="secondary" onClick={add} disabled={!title.trim()}><Plus className="h-4 w-4" /> Add</Button>
      </div>
    </Card>
  );
}
