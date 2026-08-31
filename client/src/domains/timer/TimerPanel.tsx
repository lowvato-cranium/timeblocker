import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { ApiError } from "../../api/client";
import { timerApi } from "./api";
import { playNotificationSound } from "./sound";
import { NOTIFICATION_MODES, NOTIFICATION_MODE_LABELS, type NotificationMode, type TimerPhase, type TimerSettings } from "./types";
import { useTimer } from "./useTimer";

interface Props {
  onAddTask: (description: string) => Promise<void>;
  onTimerEnd?: () => void;
  onWorkStart?: () => void;
  onWorkEnd?: () => void;
  onPhaseChange?: (phase: TimerPhase) => void;
}

const DEFAULT_SETTINGS: TimerSettings = {
  workMinutes: 25,
  otherMinutes: 5,
  notificationMode: "sound",
  customSoundFilename: null,
};

// How long the ambient background pulse runs on each side of a natural
// phase boundary — matches the countdown-side window used to decide
// `isPulsing` below.
const PULSE_WINDOW_SECONDS = 15;

function formatTime(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export function TimerPanel({ onAddTask, onTimerEnd, onWorkStart, onWorkEnd, onPhaseChange }: Props) {
  const [settings, setSettings] = useState<TimerSettings>(DEFAULT_SETTINGS);
  const [settingsLoaded, setSettingsLoaded] = useState(false);
  const [description, setDescription] = useState("");
  const [savingSettings, setSavingSettings] = useState(false);
  const [uploadingSound, setUploadingSound] = useState(false);
  const [soundError, setSoundError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    timerApi.getSettings().then((s) => {
      setSettings(s);
      setSettingsLoaded(true);
    });
  }, []);

  const customSoundUrl = settings.customSoundFilename ? `/uploads/sounds/${settings.customSoundFilename}` : null;

  // Only a naturally-expiring phase plays a sound — "expires" implies the
  // countdown actually ran out, not a manual Start Work/Start Other override.
  function handleNaturalTimerEnd() {
    if (settings.notificationMode === "sound") playNotificationSound(customSoundUrl);
    onTimerEnd?.();
  }

  const { phase, secondsLeft, startWork, startOther, stop } = useTimer({
    ...settings,
    onTimerEnd: handleNaturalTimerEnd,
    onWorkStart,
    onWorkEnd,
  });
  const running = phase !== "idle";

  useEffect(() => {
    onPhaseChange?.(phase);
  }, [phase, onPhaseChange]);

  // The "before" window only applies to a genuinely upcoming natural
  // expiration; the "after" window applies to however the current phase
  // began (natural or a manual override) — acknowledging a phase just
  // started doesn't require having anticipated it in advance.
  const totalPhaseSeconds = phase === "work" ? settings.workMinutes * 60 : settings.otherMinutes * 60;
  const elapsedInPhase = totalPhaseSeconds - secondsLeft;
  const isPulsing =
    running &&
    settings.notificationMode === "pulse" &&
    (secondsLeft <= PULSE_WINDOW_SECONDS || elapsedInPhase <= PULSE_WINDOW_SECONDS);

  useEffect(() => {
    const body = document.body;
    if (isPulsing) {
      body.classList.add("timer-pulse");
      body.classList.toggle("timer-pulse-work", phase === "work");
      body.classList.toggle("timer-pulse-other", phase === "other");
    } else {
      body.classList.remove("timer-pulse", "timer-pulse-work", "timer-pulse-other");
    }
    return () => {
      body.classList.remove("timer-pulse", "timer-pulse-work", "timer-pulse-other");
    };
  }, [isPulsing, phase]);

  async function persistSettings(next: TimerSettings) {
    setSettings(next);
    setSavingSettings(true);
    try {
      await timerApi.updateSettings(next);
    } finally {
      setSavingSettings(false);
    }
  }

  function handleMinutesChange(field: "workMinutes" | "otherMinutes", value: number) {
    if (!Number.isFinite(value)) return;
    persistSettings({ ...settings, [field]: value });
  }

  function handleNotificationModeChange(mode: NotificationMode) {
    persistSettings({ ...settings, notificationMode: mode });
  }

  async function handleSoundFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingSound(true);
    setSoundError(null);
    try {
      setSettings(await timerApi.uploadSound(file));
    } catch (err) {
      setSoundError(err instanceof ApiError ? err.message : "Upload failed");
    } finally {
      setUploadingSound(false);
      e.target.value = "";
    }
  }

  async function handleRemoveSound() {
    setUploadingSound(true);
    setSoundError(null);
    try {
      setSettings(await timerApi.removeSound());
    } finally {
      setUploadingSound(false);
    }
  }

  function handleTestSound() {
    playNotificationSound(customSoundUrl);
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
            onChange={(e) => handleMinutesChange("workMinutes", Number(e.target.value))}
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
            onChange={(e) => handleMinutesChange("otherMinutes", Number(e.target.value))}
          />
        </label>
        <div className="timer-phase-actions">
          <button
            type="button"
            className={`timer-phase-btn phase-work${phase === "work" ? " active" : ""}`}
            onClick={startWork}
            disabled={!settingsLoaded}
          >
            Start Work Timer
          </button>
          <button
            type="button"
            className={`timer-phase-btn phase-other${phase === "other" ? " active" : ""}`}
            onClick={startOther}
            disabled={!settingsLoaded}
          >
            Start Other Timer
          </button>
        </div>
        {savingSettings && <span className="muted">Saving...</span>}
      </div>

      <div className="notification-settings">
        <span className="notification-settings-label">When a timer ends</span>
        <div className="notification-mode-options">
          {NOTIFICATION_MODES.map((mode) => (
            <label key={mode} className="notification-mode-option">
              <input
                type="radio"
                name="notificationMode"
                value={mode}
                checked={settings.notificationMode === mode}
                onChange={() => handleNotificationModeChange(mode)}
                disabled={!settingsLoaded}
              />
              {NOTIFICATION_MODE_LABELS[mode]}
            </label>
          ))}
        </div>

        {settings.notificationMode === "sound" && (
          <div className="sound-settings">
            <span className="muted">{settings.customSoundFilename ? "Using a custom sound" : "Using the default ding"}</span>
            <button type="button" onClick={handleTestSound}>
              Test
            </button>
            <label className="sound-upload-btn">
              {uploadingSound ? "Uploading..." : "Upload WAV"}
              <input
                ref={fileInputRef}
                type="file"
                accept=".wav,audio/wav"
                onChange={handleSoundFileChange}
                disabled={uploadingSound}
                hidden
              />
            </label>
            {settings.customSoundFilename && (
              <button type="button" onClick={handleRemoveSound} disabled={uploadingSound}>
                Use default ding
              </button>
            )}
            {soundError && <p className="error">{soundError}</p>}
          </div>
        )}
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
