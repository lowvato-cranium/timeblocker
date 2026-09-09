import { useMemo, useState, type ReactNode } from "react";
import type { Label } from "../labels/types";
import { TaskRow } from "./TaskRow";
import type { Task, TaskStatus } from "./types";

interface Props {
  tasks: Task[];
  loading: boolean;
  labelCatalog: Label[];
  onUpdate: (id: string, patch: Partial<{ notes: string; status: TaskStatus; description: string }>) => Promise<void>;
  onRemove: (id: string) => void;
  onAddLabel: (taskId: string, key: string, value: string) => void;
  onRemoveLabel: (taskId: string, labelId: string) => void;
  onSetActive: (taskId: string, active: boolean) => void;
  onAddSession: (taskId: string, startedAt: number, endedAt: number) => Promise<void>;
}

const DEFAULT_SORT_CATEGORY = "priority";

// Natural / "version-aware" comparison so label values like "priority:1-High"
// vs "priority:2-Medium" vs "priority:10-Low" order as 1, 2, 10 rather than
// lexicographically (1, 10, 2). Splits each value into runs of digits and
// non-digits and compares digit runs numerically.
function compareLabelValues(a: string, b: string): number {
  const pattern = /(\d+|\D+)/g;
  const aParts = a.match(pattern) ?? [];
  const bParts = b.match(pattern) ?? [];
  const len = Math.max(aParts.length, bParts.length);
  for (let i = 0; i < len; i++) {
    const ap = aParts[i] ?? "";
    const bp = bParts[i] ?? "";
    if (ap === bp) continue;
    if (/^\d+$/.test(ap) && /^\d+$/.test(bp)) {
      const diff = Number(ap) - Number(bp);
      if (diff !== 0) return diff;
    } else {
      const cmp = ap.localeCompare(bp);
      if (cmp !== 0) return cmp;
    }
  }
  return 0;
}

function TaskGroup({
  title,
  headerExtra,
  tasks,
  emptyMessage,
  ...rowProps
}: {
  title: string;
  headerExtra?: ReactNode;
  tasks: Task[];
  emptyMessage: string;
} & Omit<Props, "tasks" | "loading">) {
  return (
    <div className="task-group">
      <div className="task-group-header">
        <h3>{title}</h3>
        {headerExtra}
      </div>
      {tasks.length === 0 ? (
        <p className="muted">{emptyMessage}</p>
      ) : (
        <ul className="task-list">
          {tasks.map((task) => (
            <TaskRow key={task.id} task={task} {...rowProps} />
          ))}
        </ul>
      )}
    </div>
  );
}

export function TaskList({
  tasks,
  loading,
  labelCatalog,
  onUpdate,
  onRemove,
  onAddLabel,
  onRemoveLabel,
  onSetActive,
  onAddSession,
}: Props) {
  const [sortCategory, setSortCategory] = useState(DEFAULT_SORT_CATEGORY);
  const [sortAscending, setSortAscending] = useState(true);

  // Available categories are just the distinct label keys in use (e.g.
  // "priority", "client", "project"), plus whatever's currently selected so
  // the dropdown never shows a blank value even before any task has that
  // label applied.
  const sortCategoryOptions = useMemo(() => {
    const keys = new Set(labelCatalog.map((l) => l.key));
    keys.add(sortCategory);
    return Array.from(keys).sort((a, b) => a.localeCompare(b));
  }, [labelCatalog, sortCategory]);

  // Active: every task with the Active checkbox on, regardless of status.
  // Inactive: everything else, except Complete and Rejected/Won't Do —
  // those drop out of both panels once they're done or discarded.
  const activeTasks = useMemo(() => tasks.filter((t) => t.active), [tasks]);

  const inactiveTasks = useMemo(() => {
    const base = tasks.filter((t) => !t.active && t.status !== "complete" && t.status !== "rejected");

    const withLabel: { task: Task; value: string }[] = [];
    const withoutLabel: Task[] = [];
    for (const task of base) {
      const label = task.labels.find((l) => l.key === sortCategory);
      if (label) withLabel.push({ task, value: label.value });
      else withoutLabel.push(task);
    }
    withLabel.sort((a, b) => compareLabelValues(a.value, b.value) * (sortAscending ? 1 : -1));

    // Tasks without the selected label have no sort position to speak of —
    // always park them after the labeled ones (in either direction) rather
    // than flipping them to the front on Descending, which would read as
    // "highest priority" and bury the actually-labeled tasks.
    return [...withLabel.map((w) => w.task), ...withoutLabel];
  }, [tasks, sortCategory, sortAscending]);

  const rowProps = { labelCatalog, onUpdate, onRemove, onAddLabel, onRemoveLabel, onSetActive, onAddSession };

  return (
    <section className="task-list-panel">
      <h2>Tasks</h2>
      {loading && <p className="muted">Loading...</p>}
      {!loading && (
        <>
          <TaskGroup
            title="Active"
            tasks={activeTasks}
            emptyMessage="No active tasks. Check a task's Active box to start tracking it here."
            {...rowProps}
          />
          <TaskGroup
            title="Inactive"
            tasks={inactiveTasks}
            emptyMessage="Nothing here."
            headerExtra={
              <div className="task-sort-controls">
                <label>
                  Sort by
                  <select value={sortCategory} onChange={(e) => setSortCategory(e.target.value)}>
                    {sortCategoryOptions.map((key) => (
                      <option key={key} value={key}>
                        {key}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="task-sort-direction">
                  <input
                    type="checkbox"
                    checked={sortAscending}
                    onChange={(e) => setSortAscending(e.target.checked)}
                  />
                  {sortAscending ? "Asc" : "Desc"}
                </label>
              </div>
            }
            {...rowProps}
          />
        </>
      )}
    </section>
  );
}
