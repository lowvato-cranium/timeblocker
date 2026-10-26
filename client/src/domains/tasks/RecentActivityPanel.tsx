import { useState } from "react";
import { formatDateTime } from "../../shared/format";
import { TaskEditModal } from "./TaskEditModal";
import { STATUS_LABELS, type Task, type TaskStatus } from "./types";

const DAY_MS = 24 * 60 * 60 * 1000;

interface Props {
  tasks: Task[];
  onUpdate: (id: string, patch: Partial<{ notes: string; status: TaskStatus; description: string }>) => Promise<void>;
  onAddSession: (taskId: string, startedAt: number, endedAt: number) => Promise<void>;
}

export function RecentActivityPanel({ tasks, onUpdate, onAddSession }: Props) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const cutoff = Date.now() - DAY_MS;
  const recent = tasks.filter((t) => t.createdAt >= cutoff).sort((a, b) => b.createdAt - a.createdAt);

  const editing = tasks.find((t) => t.id === editingId);

  return (
    <section className="recent-activity-panel">
      <h2>Last 24 Hours</h2>
      {recent.length === 0 ? (
        <p className="muted">No tasks worked on in the last 24 hours.</p>
      ) : (
        <div className="recent-activity-table-wrap">
          <table className="recent-activity-table">
            <thead>
              <tr>
                <th>Task</th>
                <th>Started</th>
                <th>Status Changed</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {recent.map((task) => (
                <tr key={task.id} data-searchable>
                  <td>{task.description}</td>
                  <td>{formatDateTime(task.createdAt)}</td>
                  <td>{formatDateTime(task.statusChangedAt)}</td>
                  <td>
                    <span className={`status-pill status-${task.status}`}>{STATUS_LABELS[task.status]}</span>
                  </td>
                  <td>
                    <button type="button" className="task-edit-btn" onClick={() => setEditingId(task.id)} aria-label="Edit task">
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {editing && (
        <TaskEditModal
          task={editing}
          onClose={() => setEditingId(null)}
          onSave={(patch) => onUpdate(editing.id, patch)}
          onAddSession={(startedAt, endedAt) => onAddSession(editing.id, startedAt, endedAt)}
        />
      )}
    </section>
  );
}
