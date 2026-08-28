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
}

export function TaskList({ tasks, loading, labelCatalog, onUpdate, onRemove, onAddLabel, onRemoveLabel }: Props) {
  return (
    <section className="task-list-panel">
      <h2>Tasks</h2>
      {loading && <p className="muted">Loading...</p>}
      {!loading && tasks.length === 0 && (
        <p className="muted">No tasks yet. Add one from the timer panel to get started.</p>
      )}
      <ul className="task-list">
        {tasks.map((task) => (
          <TaskRow
            key={task.id}
            task={task}
            labelCatalog={labelCatalog}
            onUpdate={onUpdate}
            onRemove={onRemove}
            onAddLabel={onAddLabel}
            onRemoveLabel={onRemoveLabel}
          />
        ))}
      </ul>
    </section>
  );
}
