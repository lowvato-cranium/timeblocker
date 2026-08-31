import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import { LabelPicker } from "../labels/LabelPicker";
import type { Label } from "../labels/types";
import { formatDuration } from "../../shared/format";
import { TaskEditModal } from "./TaskEditModal";
import { STATUS_LABELS, type Task, type TaskStatus } from "./types";

interface Props {
  task: Task;
  labelCatalog: Label[];
  onUpdate: (id: string, patch: Partial<{ notes: string; status: TaskStatus; description: string }>) => Promise<void>;
  onRemove: (id: string) => void;
  onAddLabel: (taskId: string, key: string, value: string) => void;
  onRemoveLabel: (taskId: string, labelId: string) => void;
  onSetActive: (taskId: string, active: boolean) => void;
  onAddSession: (taskId: string, startedAt: number, endedAt: number) => Promise<void>;
}

function PencilIcon() {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
      <path d="M15 6.75L17.25 9" />
    </svg>
  );
}

export function TaskRow({
  task,
  labelCatalog,
  onUpdate,
  onRemove,
  onAddLabel,
  onRemoveLabel,
  onSetActive,
  onAddSession,
}: Props) {
  const [notes, setNotes] = useState(task.notes);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  // Keeps the inline textarea in sync when notes change from elsewhere —
  // namely a save from the edit modal.
  useEffect(() => setNotes(task.notes), [task.notes]);

  const appliedLabelIds = useMemo(() => new Set(task.labels.map((l) => l.id)), [task.labels]);

  const sessionSummary = useMemo(() => {
    if (task.sessions.length === 0) return null;
    const now = Date.now();
    const totalMs = task.sessions.reduce((sum, s) => sum + ((s.endedAt ?? now) - s.startedAt), 0);
    const hasOpenSession = task.sessions.some((s) => s.endedAt === null);
    return { count: task.sessions.length, totalMs, hasOpenSession };
  }, [task.sessions]);

  function handleStatusChange(e: ChangeEvent<HTMLSelectElement>) {
    onUpdate(task.id, { status: e.target.value as TaskStatus });
  }

  function handleNotesBlur() {
    if (notes !== task.notes) onUpdate(task.id, { notes });
  }

  return (
    <li className={`task-row status-${task.status}`}>
      <div className="task-row-main">
        <input
          type="checkbox"
          className="task-active-checkbox"
          checked={task.active}
          onChange={(e) => onSetActive(task.id, e.target.checked)}
          aria-label={task.active ? "Mark task inactive" : "Mark task active"}
          title={task.active ? "Active" : "Not active"}
        />
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
        <button type="button" className="task-edit-btn" onClick={() => setEditOpen(true)} aria-label="Edit task">
          <PencilIcon />
        </button>
      </div>

      {sessionSummary && (
        <div className="task-sessions-summary muted">
          {sessionSummary.count} {sessionSummary.count === 1 ? "session" : "sessions"} ·{" "}
          {formatDuration(sessionSummary.totalMs)}
          {sessionSummary.hasOpenSession && " (in progress)"}
        </div>
      )}

      <div className="task-labels">
        {task.labels.map((label) => (
          <span key={label.id} className="label-chip">
            {label.key}:{label.value}
            <button
              type="button"
              className="label-chip-remove"
              onClick={() => onRemoveLabel(task.id, label.id)}
              aria-label={`Remove label ${label.key}:${label.value}`}
            >
              ×
            </button>
          </span>
        ))}
        <div className="label-add-wrap">
          <button type="button" className="label-add-btn" onClick={() => setPickerOpen((v) => !v)}>
            + Label
          </button>
          {pickerOpen && (
            <LabelPicker
              labels={labelCatalog}
              excludeIds={appliedLabelIds}
              onSelect={(key, value) => {
                onAddLabel(task.id, key, value);
                setPickerOpen(false);
              }}
              onClose={() => setPickerOpen(false)}
            />
          )}
        </div>
      </div>

      <textarea
        className="task-notes"
        placeholder="Notes..."
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        onBlur={handleNotesBlur}
      />

      {editOpen && (
        <TaskEditModal
          task={task}
          onClose={() => setEditOpen(false)}
          onSave={(patch) => onUpdate(task.id, patch)}
          onAddSession={(startedAt, endedAt) => onAddSession(task.id, startedAt, endedAt)}
        />
      )}
    </li>
  );
}
