import { Router } from "express";
import { asyncHandler } from "../../shared/asyncHandler.js";
import { requireAuth } from "../auth/auth.middleware.js";
import { labelsService } from "../labels/labels.service.js";
import { tasksService } from "./tasks.service.js";

export const tasksRouter = Router();
tasksRouter.use(requireAuth);

tasksRouter.get("/", (req, res) => {
  const tasks = tasksService.list(req.user!.id);
  const labelsByTask = labelsService.forTasks(tasks.map((t) => t.id));
  res.json({ tasks: tasks.map((task) => ({ ...task, labels: labelsByTask.get(task.id) ?? [] })) });
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
    res.status(201).json({ task: { ...task, labels: [] } });
  })
);

tasksRouter.patch(
  "/:id",
  asyncHandler(async (req, res) => {
    const task = tasksService.update(req.user!.id, req.params.id, req.body ?? {});
    const labels = labelsService.forTask(task!.id);
    res.json({ task: { ...task, labels } });
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
