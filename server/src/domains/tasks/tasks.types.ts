export const TASK_STATUSES = ["incomplete", "not_started", "complete"] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];

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
