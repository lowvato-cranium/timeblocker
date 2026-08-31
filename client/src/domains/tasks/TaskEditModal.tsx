import { useEffect, useState, type FormEvent, type MouseEvent } from "react";
import { ApiError } from "../../api/client";
import { formatDateTime } from "../../shared/format";
import type { Task } from "./types";

interface Props {
  task: Task;
  onClose: () => void;
  onSave: (patch: { description: string; notes: string }) => Promise<void>;
  onAddSession: (startedAt: number, endedAt: number) => Promise<void>;
}

function toDatetimeLocalValue(ms: number): string {
  const d = new Date(ms);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function TaskEditModal({ task, onClose, onSave, onAddSession }: Props) {
  const [description, setDescription] = useState(task.description);
  const [notes, setNotes] = useState(task.notes);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [sessionStart, setSessionStart] = useState("");
  const [sessionEnd, setSessionEnd] = useState(() => toDatetimeLocalValue(Date.now()));
  const [addingSession, setAddingSession] = useState(false);
  const [sessionError, setSessionError] = useState<string | null>(null);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  function handleBackdropClick(e: MouseEvent<HTMLDivElement>) {
    if (e.target === e.currentTarget) onClose();
  }

  async function handleSave() {
    const trimmed = description.trim();
    if (!trimmed) {
      setSaveError("Description is required");
      return;
    }
    setSaving(true);
    setSaveError(null);
    try {
      await onSave({ description: trimmed, notes });
      onClose();
    } catch (err) {
      setSaveError(err instanceof ApiError ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function handleAddSession(e: FormEvent) {
    e.preventDefault();
    if (!sessionStart || !sessionEnd) return;
    const startedAt = new Date(sessionStart).getTime();
    const endedAt = new Date(sessionEnd).getTime();
    if (endedAt <= startedAt) {
      setSessionError("End time must be after start time");
      return;
    }
    setAddingSession(true);
    setSessionError(null);
    try {
      await onAddSession(startedAt, endedAt);
      setSessionStart("");
    } catch (err) {
      setSessionError(err instanceof ApiError ? err.message : "Could not add session");
    } finally {
      setAddingSession(false);
    }
  }

  return (
    <div className="modal-backdrop" onClick={handleBackdropClick}>
      <div className="modal-dialog" role="dialog" aria-modal="true" aria-label="Edit task">
        <div className="modal-header">
          <h3>Edit Task</h3>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>

        <div className="modal-body">
          <label className="modal-field">
            Description
            <input value={description} onChange={(e) => setDescription(e.target.value)} />
          </label>
          <label className="modal-field">
            Notes
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={4} />
          </label>
          {saveError && <p className="error">{saveError}</p>}

          <div className="modal-sessions">
            <h4>Sessions</h4>
            {task.sessions.length === 0 ? (
              <p className="muted">No sessions yet.</p>
            ) : (
              <ul className="modal-session-list">
                {task.sessions.map((s) => (
                  <li key={s.id}>
                    {formatDateTime(s.startedAt)} – {s.endedAt ? formatDateTime(s.endedAt) : "ongoing"}
                  </li>
                ))}
              </ul>
            )}

            <form className="modal-add-session-form" onSubmit={handleAddSession}>
              <label>
                Start
                <input
                  type="datetime-local"
                  value={sessionStart}
                  onChange={(e) => setSessionStart(e.target.value)}
                  required
                />
              </label>
              <label>
                End
                <input
                  type="datetime-local"
                  value={sessionEnd}
                  onChange={(e) => setSessionEnd(e.target.value)}
                  required
                />
              </label>
              <button type="submit" disabled={addingSession}>
                {addingSession ? "Adding..." : "Add Session"}
              </button>
            </form>
            {sessionError && <p className="error">{sessionError}</p>}
          </div>
        </div>

        <div className="modal-footer">
          <button type="button" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="primary" onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
