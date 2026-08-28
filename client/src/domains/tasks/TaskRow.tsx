import { useState, type ChangeEvent } from "react";
import { STATUS_LABELS, type Task, type TaskStatus } from "./types";

interface Props {
  task: Task;
  onUpdate: (id: string, patch: Partial<{ notes: string; status: TaskStatus }>) => void;
  onRemove: (id: string) => void;
}

export function TaskRow({ task, onUpdate, onRemove }: Props) {
  const [notes, setNotes] = useState(task.notes);

  function handleStatusChange(e: ChangeEvent<HTMLSelectElement>) {
    onUpdate(task.id, { status: e.target.value as TaskStatus });
  }

  function handleNotesBlur() {
    if (notes !== task.notes) onUpdate(task.id, { notes });
  }

  return (
    <li className={`task-row status-${task.status}`}>
      <div className="task-row-main">
        <span className="task-description">{task.description}</span>
        <select value={task.status} onChange={handleStatusChange} aria-label="Task status">
          {Object.entries(STATUS_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <button className="task-remove" onClick={() => onRemove(task.id)} aria-label="Remove task">
          ×
        </button>
      </div>
      <textarea
        className="task-notes"
        placeholder="Notes..."
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        onBlur={handleNotesBlur}
      />
    </li>
  );
}
