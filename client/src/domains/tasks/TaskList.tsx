import { useMemo } from "react";
import type { Label } from "../labels/types";
import { TaskRow } from "./TaskRow";
import type { Task, TaskStatus } from "./types";

interface Props {
  tasks: Task[];
  loading: boolean;
  labelCatalog: Label[];
  onUpdate: (id: string, patch: Partial<{ notes: string; status: TaskStatus }>) => void;
  onRemove: (id: string) => void;
  onAddLabel: (taskId: string, key: string, value: string) => void;
  onRemoveLabel: (taskId: string, labelId: string) => void;
  onSetActive: (taskId: string, active: boolean) => void;
}

function TaskGroup({
  title,
  tasks,
  emptyMessage,
  ...rowProps
}: {
  title: string;
  tasks: Task[];
  emptyMessage: string;
} & Omit<Props, "tasks" | "loading">) {
  return (
    <div className="task-group">
      <h3>{title}</h3>
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

export function TaskList({ tasks, loading, labelCatalog, onUpdate, onRemove, onAddLabel, onRemoveLabel, onSetActive }: Props) {
  // Active: every task with the Active checkbox on, regardless of status.
  // Inactive: everything else, except Complete and Rejected/Won't Do —
  // those drop out of both panels once they're done or discarded.
  const activeTasks = useMemo(() => tasks.filter((t) => t.active), [tasks]);
  const inactiveTasks = useMemo(
    () => tasks.filter((t) => !t.active && t.status !== "complete" && t.status !== "rejected"),
    [tasks]
  );

  const rowProps = { labelCatalog, onUpdate, onRemove, onAddLabel, onRemoveLabel, onSetActive };

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
          <TaskGroup title="Inactive" tasks={inactiveTasks} emptyMessage="Nothing here." {...rowProps} />
        </>
      )}
    </section>
  );
}
