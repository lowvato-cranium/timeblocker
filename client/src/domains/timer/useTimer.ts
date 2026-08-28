import { useCallback, useEffect, useRef, useState } from "react";
import type { TimerPhase } from "./types";

interface UseTimerOptions {
  workMinutes: number;
  otherMinutes: number;
  // Fired the instant a phase's countdown reaches zero, before the next
  // phase starts, so the caller can flush any in-progress task edit.
  onTimerEnd?: () => void;
  // Fired whenever the Work phase begins/ends, from ANY cause — natural
  // cycling, a manual Start Work/Start Other click, or Stop — so a caller
  // can start/stop crediting time to whatever tasks are marked Active.
  onWorkStart?: () => void;
  onWorkEnd?: () => void;
}

// Anchored to a wall-clock deadline (Date.now()) rather than counted down
// tick-by-tick: background tabs get their setInterval callbacks throttled
// or fully suspended by the browser, which silently stalls a pure tick
// counter (and this app is a work timer — being tabbed away while "work"
// counts down is the normal case, not an edge case). Recomputing remaining
// time from the deadline on every tick, and again on tab-visibility change,
// means a throttled/suspended interval just catches up instead of losing
// the transition entirely.
export function useTimer({ workMinutes, otherMinutes, onTimerEnd, onWorkStart, onWorkEnd }: UseTimerOptions) {
  const [phase, setPhase] = useState<TimerPhase>("idle");
  const [secondsLeft, setSecondsLeft] = useState(workMinutes * 60);

  const phaseRef = useRef<TimerPhase>("idle");
  const deadlineRef = useRef<number | null>(null);
  const durationsRef = useRef({ workMinutes, otherMinutes });
  durationsRef.current = { workMinutes, otherMinutes };
  const callbacksRef = useRef({ onTimerEnd, onWorkStart, onWorkEnd });
  callbacksRef.current = { onTimerEnd, onWorkStart, onWorkEnd };

  // Keep the idle display in sync with settings edits made while stopped.
  useEffect(() => {
    if (phase === "idle") setSecondsLeft(workMinutes * 60);
  }, [workMinutes, phase]);

  const beginPhase = useCallback((targetPhase: "work" | "other") => {
    const wasWork = phaseRef.current === "work";
    const minutes = targetPhase === "work" ? durationsRef.current.workMinutes : durationsRef.current.otherMinutes;
    phaseRef.current = targetPhase;
    deadlineRef.current = Date.now() + minutes * 60_000;
    setPhase(targetPhase);
    setSecondsLeft(minutes * 60);
    if (wasWork && targetPhase !== "work") callbacksRef.current.onWorkEnd?.();
    if (!wasWork && targetPhase === "work") callbacksRef.current.onWorkStart?.();
  }, []);

  const tick = useCallback(() => {
    if (deadlineRef.current === null) return;
    const remainingMs = deadlineRef.current - Date.now();
    if (remainingMs > 0) {
      setSecondsLeft(Math.ceil(remainingMs / 1000));
      return;
    }
    callbacksRef.current.onTimerEnd?.();
    beginPhase(phaseRef.current === "work" ? "other" : "work");
  }, [beginPhase]);

  useEffect(() => {
    if (phase === "idle") return;
    tick(); // catch up immediately in case time already passed (e.g. tab was backgrounded)
    const id = window.setInterval(tick, 1000);
    document.addEventListener("visibilitychange", tick);
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", tick);
    };
  }, [phase, tick]);

  // This hook's state is component-local — navigating away (e.g. to the
  // Reports page) unmounts it, silently discarding an in-progress Work
  // phase with no beginPhase/stop call to fire onWorkEnd. Without this,
  // any task credited via that phase would be left with a session open
  // forever. Runs once, checking the live ref rather than the closed-over
  // `phase` so it reflects whatever was current at the moment of unmount.
  useEffect(() => {
    return () => {
      if (phaseRef.current === "work") callbacksRef.current.onWorkEnd?.();
    };
  }, []);

  const startWork = useCallback(() => beginPhase("work"), [beginPhase]);
  const startOther = useCallback(() => beginPhase("other"), [beginPhase]);

  const stop = useCallback(() => {
    const wasWork = phaseRef.current === "work";
    phaseRef.current = "idle";
    deadlineRef.current = null;
    setPhase("idle");
    setSecondsLeft(durationsRef.current.workMinutes * 60);
    if (wasWork) callbacksRef.current.onWorkEnd?.();
  }, []);

  return { phase, secondsLeft, startWork, startOther, stop };
}
