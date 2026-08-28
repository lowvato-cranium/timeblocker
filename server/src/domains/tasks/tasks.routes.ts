import { Router } from "express";
import { asyncHandler } from "../../shared/asyncHandler.js";
import { requireAuth } from "../auth/auth.middleware.js";
import { labelsService } from "../labels/labels.service.js";
import { tasksService } from "./tasks.service.js";

export const tasksRouter = Router();
tasksRouter.use(requireAuth);

function tasksWithRelations(userId: string) {
  const tasks = tasksService.list(userId);
  const taskIds = tasks.map((t) => t.id);
  const labelsByTask = labelsService.forTasks(taskIds);
  const sessionsByTask = tasksService.sessionsForTasks(taskIds);
  return tasks.map((task) => ({
    ...task,
    labels: labelsByTask.get(task.id) ?? [],
    sessions: sessionsByTask.get(task.id) ?? [],
  }));
}

tasksRouter.get("/", (req, res) => {
  res.json({ tasks: tasksWithRelations(req.user!.id) });
});

tasksRouter.post(
  "/",
  asyncHandler(async (req, res) => {
    const { description } = req.body ?? {};
    if (typeof description !== "string") {
      res.status(400).json({ error: "description is required" });
      return;
    }
    const task = tasksService.create(req.user!.id, description);
    res.status(201).json({ task: { ...task, labels: [], sessions: [] } });
  })
);

// Bulk session control tied to the Focus Timer's Work phase — declared
// ahead of the "/:id" routes for readability, though the differing segment
// counts mean there's no actual routing collision between them.
tasksRouter.post("/sessions/start-active", (req, res) => {
  tasksService.startActiveSessions(req.user!.id);
  res.json({ tasks: tasksWithRelations(req.user!.id) });
});

tasksRouter.post("/sessions/stop-active", (req, res) => {
  tasksService.stopActiveSessions(req.user!.id);
  res.json({ tasks: tasksWithRelations(req.user!.id) });
});

tasksRouter.patch(
  "/:id",
  asyncHandler(async (req, res) => {
    const task = tasksService.update(req.user!.id, req.params.id, req.body ?? {});
    const labels = labelsService.forTask(task!.id);
    const sessions = tasksService.sessionsForTask(task!.id);
    res.json({ task: { ...task, labels, sessions } });
  })
);

tasksRouter.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    tasksService.remove(req.user!.id, req.params.id);
    res.json({ ok: true });
  })
);

tasksRouter.post(
  "/:id/labels",
  asyncHandler(async (req, res) => {
    const task = tasksService.getOwned(req.user!.id, req.params.id);
    const { key, value } = req.body ?? {};
    if (typeof key !== "string" || typeof value !== "string") {
      res.status(400).json({ error: "key and value are required" });
      return;
    }
    const labels = labelsService.attachToTask(req.user!.id, task.id, key, value);
    res.json({ labels });
  })
);

tasksRouter.delete(
  "/:id/labels/:labelId",
  asyncHandler(async (req, res) => {
    const task = tasksService.getOwned(req.user!.id, req.params.id);
    const labels = labelsService.detachFromTask(req.user!.id, task.id, req.params.labelId);
    res.json({ labels });
  })
);

// Single-task session control — used when Active is toggled mid-Work-phase.
tasksRouter.post(
  "/:id/sessions/start",
  asyncHandler(async (req, res) => {
    const task = tasksService.getOwned(req.user!.id, req.params.id);
    const sessions = tasksService.startSession(task.id);
    res.json({ sessions });
  })
);

tasksRouter.post(
  "/:id/sessions/stop",
  asyncHandler(async (req, res) => {
    const task = tasksService.getOwned(req.user!.id, req.params.id);
    const sessions = tasksService.stopSession(task.id);
    res.json({ sessions });
  })
);
