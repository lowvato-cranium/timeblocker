import { api } from "../../api/client";
import type { Task, TaskStatus } from "./types";

export const tasksApi = {
  list: () => api.get<{ tasks: Task[] }>("/tasks").then((r) => r.tasks),
  create: (description: string) => api.post<{ task: Task }>("/tasks", { description }).then((r) => r.task),
  update: (id: string, patch: Partial<{ notes: string; status: TaskStatus; description: string }>) =>
    api.patch<{ task: Task }>(`/tasks/${id}`, patch).then((r) => r.task),
  remove: (id: string) => api.delete(`/tasks/${id}`),
};
