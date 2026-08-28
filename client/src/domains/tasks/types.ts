import type { Label } from "../labels/types";

export const TASK_STATUSES = ["incomplete", "in_process", "not_started", "complete", "rejected"] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];

export const STATUS_LABELS: Record<TaskStatus, string> = {
  incomplete: "Incomplete",
  not_started: "Not Started",
  in_process: "In Process",
  complete: "Complete",
  rejected: "Rejected/Won't Do",
};

// A single work interval on a task: opened while the task is Active and the
// Focus Timer's Work phase is running, closed when either stops. A task
// accumulates many of these over time — endedAt is null while still open.
export interface TaskSession {
  id: string;
  taskId: string;
  startedAt: number;
  endedAt: number | null;
}

export interface Task {
  id: string;
  userId: string;
  description: string;
  notes: string;
  status: TaskStatus;
  // Whether this task is currently in the Active panel and receiving time
  // from the Focus Timer's Work phase. Independent of `status`.
  active: boolean;
  createdAt: number;
  updatedAt: number;
  statusChangedAt: number;
  labels: Label[];
  sessions: TaskSession[];
}
