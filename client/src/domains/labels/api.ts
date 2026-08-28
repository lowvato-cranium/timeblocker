import { api } from "../../api/client";
import type { Label } from "./types";

export const labelsApi = {
  list: () => api.get<{ labels: Label[] }>("/labels").then((r) => r.labels),
  attach: (taskId: string, key: string, value: string) =>
    api.post<{ labels: Label[] }>(`/tasks/${taskId}/labels`, { key, value }).then((r) => r.labels),
  detach: (taskId: string, labelId: string) =>
    api.delete<{ labels: Label[] }>(`/tasks/${taskId}/labels/${labelId}`).then((r) => r.labels),
};
