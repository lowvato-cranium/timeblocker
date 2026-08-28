import { useCallback, useEffect, useState } from "react";
import type { TimerPhase } from "./types";

interface UseTimerOptions {
  workMinutes: number;
  otherMinutes: number;
  // Fired the instant a phase's countdown reaches zero, before the next
  // phase starts, so the caller can flush any in-progress task edit.
  onTimerEnd?: () => void;
}

export function useTimer({ workMinutes, otherMinutes, onTimerEnd }: UseTimerOptions) {
  const [phase, setPhase] = useState<TimerPhase>("idle");
  const [secondsLeft, setSecondsLeft] = useState(workMinutes * 60);

  // Keep the idle display in sync with settings edits made while stopped.
  useEffect(() => {
    if (phase === "idle") setSecondsLeft(workMinutes * 60);
  }, [workMinutes, phase]);

  // Countdown ticker — runs while a phase is active.
  useEffect(() => {
    if (phase === "idle") return;
    const id = window.setInterval(() => {
      setSecondsLeft((prev) => Math.max(prev - 1, 0));
    }, 1000);
    return () => window.clearInterval(id);
  }, [phase]);

  // Cycle work <-> other things once the active phase's countdown hits zero.
  useEffect(() => {
    if (phase === "idle" || secondsLeft > 0) return;
    onTimerEnd?.();
    if (phase === "work") {
      setPhase("other");
      setSecondsLeft(otherMinutes * 60);
    } else {
      setPhase("work");
      setSecondsLeft(workMinutes * 60);
    }
  }, [secondsLeft, phase, workMinutes, otherMinutes, onTimerEnd]);

  const start = useCallback(() => {
    setPhase("work");
    setSecondsLeft(workMinutes * 60);
  }, [workMinutes]);

  const stop = useCallback(() => {
    setPhase("idle");
    setSecondsLeft(workMinutes * 60);
  }, [workMinutes]);

  return { phase, secondsLeft, start, stop };
}
