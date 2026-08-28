import { useCallback, useEffect, useState } from "react";
import { labelsApi } from "../labels/api";
import { tasksApi } from "./api";
import type { Task, TaskStatus } from "./types";

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(() => tasksApi.list().then(setTasks), []);

  useEffect(() => {
    refresh().finally(() => setLoading(false));
  }, [refresh]);

  const addTask = useCallback(async (description: string) => {
    const task = await tasksApi.create(description);
    setTasks((prev) => [task, ...prev]);
  }, []);

  const updateTask = useCallback(async (id: string, patch: Partial<{ notes: string; status: TaskStatus }>) => {
    const task = await tasksApi.update(id, patch);
    setTasks((prev) => prev.map((t) => (t.id === id ? task : t)));
  }, []);

  const removeTask = useCallback(async (id: string) => {
    await tasksApi.remove(id);
    setTasks((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addLabel = useCallback(async (taskId: string, key: string, value: string) => {
    const labels = await labelsApi.attach(taskId, key, value);
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, labels } : t)));
  }, []);

  const removeLabel = useCallback(async (taskId: string, labelId: string) => {
    const labels = await labelsApi.detach(taskId, labelId);
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, labels } : t)));
  }, []);

  return { tasks, loading, addTask, updateTask, removeTask, addLabel, removeLabel };
}
