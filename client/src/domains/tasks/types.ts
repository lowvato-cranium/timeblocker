export const TASK_STATUSES = ["incomplete", "not_started", "complete"] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];

export const STATUS_LABELS: Record<TaskStatus, string> = {
  incomplete: "Incomplete",
  not_started: "Not Started",
  complete: "Complete",
};

export interface Task {
  id: string;
  userId: string;
  description: string;
  notes: string;
  status: TaskStatus;
  createdAt: number;
  updatedAt: number;
  statusChangedAt: number;
}
