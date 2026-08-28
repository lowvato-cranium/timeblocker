import { useMemo, useState, type ChangeEvent } from "react";
import { LabelPicker } from "../labels/LabelPicker";
import type { Label } from "../labels/types";
import { formatDuration } from "../../shared/format";
import { STATUS_LABELS, type Task, type TaskStatus } from "./types";

interface Props {
  task: Task;
  labelCatalog: Label[];
  onUpdate: (id: string, patch: Partial<{ notes: string; status: TaskStatus }>) => void;
  onRemove: (id: string) => void;
  onAddLabel: (taskId: string, key: string, value: string) => void;
  onRemoveLabel: (taskId: string, labelId: string) => void;
  onSetActive: (taskId: string, active: boolean) => void;
}

export function TaskRow({ task, labelCatalog, onUpdate, onRemove, onAddLabel, onRemoveLabel, onSetActive }: Props) {
  const [notes, setNotes] = useState(task.notes);
  const [pickerOpen, setPickerOpen] = useState(false);

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
    </li>
  );
}
