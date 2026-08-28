import { TaskRow } from "./TaskRow";
import type { Task, TaskStatus } from "./types";

interface Props {
  tasks: Task[];
  loading: boolean;
  onUpdate: (id: string, patch: Partial<{ notes: string; status: TaskStatus }>) => void;
  onRemove: (id: string) => void;
}

export function TaskList({ tasks, loading, onUpdate, onRemove }: Props) {
  return (
    <section className="task-list-panel">
      <h2>Tasks</h2>
      {loading && <p className="muted">Loading...</p>}
      {!loading && tasks.length === 0 && (
        <p className="muted">No tasks yet. Add one from the timer panel to get started.</p>
      )}
      <ul className="task-list">
        {tasks.map((task) => (
          <TaskRow key={task.id} task={task} onUpdate={onUpdate} onRemove={onRemove} />
        ))}
      </ul>
    </section>
  );
}
