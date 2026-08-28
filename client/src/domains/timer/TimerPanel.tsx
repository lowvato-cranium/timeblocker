import { useEffect, useState, type FormEvent } from "react";
import { timerApi } from "./api";
import type { TimerSettings } from "./types";
import { useTimer } from "./useTimer";

interface Props {
  onAddTask: (description: string) => Promise<void>;
  onTimerEnd?: () => void;
}

const DEFAULT_SETTINGS: TimerSettings = { workMinutes: 25, otherMinutes: 5 };

function formatTime(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export function TimerPanel({ onAddTask, onTimerEnd }: Props) {
  const [settings, setSettings] = useState<TimerSettings>(DEFAULT_SETTINGS);
  const [settingsLoaded, setSettingsLoaded] = useState(false);
  const [description, setDescription] = useState("");
  const [savingSettings, setSavingSettings] = useState(false);

  useEffect(() => {
    timerApi.getSettings().then((s) => {
      setSettings(s);
      setSettingsLoaded(true);
    });
  }, []);

  const { phase, secondsLeft, start, stop } = useTimer({ ...settings, onTimerEnd });
  const running = phase !== "idle";

  async function handleSettingsChange(field: keyof TimerSettings, value: number) {
    if (!Number.isFinite(value)) return;
    const next = { ...settings, [field]: value };
    setSettings(next);
    setSavingSettings(true);
    try {
      await timerApi.updateSettings(next);
    } finally {
      setSavingSettings(false);
    }
  }

  async function handleAddTask(e: FormEvent) {
    e.preventDefault();
    const trimmed = description.trim();
    if (!trimmed) return;
    await onAddTask(trimmed);
    setDescription("");
  }

  return (
    <section className="timer-panel">
      <h2>Focus Timer</h2>

      <div className="timer-settings">
        <label>
          Work (min)
          <input
            type="number"
            min={1}
            max={180}
            value={settings.workMinutes}
            disabled={running || !settingsLoaded}
            onChange={(e) => handleSettingsChange("workMinutes", Number(e.target.value))}
          />
        </label>
        <label>
          Other things (min)
          <input
            type="number"
            min={1}
            max={180}
            value={settings.otherMinutes}
            disabled={running || !settingsLoaded}
            onChange={(e) => handleSettingsChange("otherMinutes", Number(e.target.value))}
          />
        </label>
        {savingSettings && <span className="muted">Saving...</span>}
      </div>

      <div className={`timer-display phase-${phase}`}>
        <div className="timer-phase-label">
          {phase === "idle" && "Ready"}
          {phase === "work" && "Work"}
          {phase === "other" && "Other Things"}
        </div>
        <div className="timer-clock">{formatTime(secondsLeft)}</div>
      </div>

      <div className="timer-controls">
        {!running && (
          <button className="primary" onClick={start} disabled={!settingsLoaded}>
            Start
          </button>
        )}
        {running && (
          <button className="danger" onClick={stop}>
            Stop
          </button>
        )}
      </div>

      <form className="add-task-form" onSubmit={handleAddTask}>
        <label>
          Task
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What are you working on?"
          />
        </label>
        <button type="submit" disabled={!description.trim()}>
          Add task
        </button>
      </form>
    </section>
  );
}
