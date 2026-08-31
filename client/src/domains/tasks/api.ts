import { api } from "../../api/client";
import type { Task, TaskSession, TaskStatus } from "./types";

export const tasksApi = {
  list: () => api.get<{ tasks: Task[] }>("/tasks").then((r) => r.tasks),
  create: (description: string) => api.post<{ task: Task }>("/tasks", { description }).then((r) => r.task),
  update: (id: string, patch: Partial<{ notes: string; status: TaskStatus; description: string; active: boolean }>) =>
    api.patch<{ task: Task }>(`/tasks/${id}`, patch).then((r) => r.task),
  remove: (id: string) => api.delete(`/tasks/${id}`),

  // Single-task session control, for toggling Active mid-Work-phase.
  startSession: (taskId: string) =>
    api.post<{ sessions: TaskSession[] }>(`/tasks/${taskId}/sessions/start`).then((r) => r.sessions),
  stopSession: (taskId: string) =>
    api.post<{ sessions: TaskSession[] }>(`/tasks/${taskId}/sessions/stop`).then((r) => r.sessions),
  addSession: (taskId: string, startedAt: number, endedAt: number) =>
    api.post<{ sessions: TaskSession[] }>(`/tasks/${taskId}/sessions`, { startedAt, endedAt }).then((r) => r.sessions),

  // Bulk session control, tied to the Focus Timer's Work phase starting/ending.
  startActiveSessions: () => api.post<{ tasks: Task[] }>("/tasks/sessions/start-active").then((r) => r.tasks),
  stopActiveSessions: () => api.post<{ tasks: Task[] }>("/tasks/sessions/stop-active").then((r) => r.tasks),
};
