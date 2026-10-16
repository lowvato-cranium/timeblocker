import { Router } from "express";
import { asyncHandler } from "../../shared/asyncHandler.js";
import { requireAuth } from "../auth/auth.middleware.js";
import { labelsService } from "../labels/labels.service.js";
import { tasksService } from "./tasks.service.js";

export const tasksRouter = Router();
tasksRouter.use(requireAuth);

tasksRouter.get("/", (req, res) => {
  res.json({ tasks: tasksService.listWithRelations(req.user!.id) });
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
  res.json({ tasks: tasksService.listWithRelations(req.user!.id) });
});

tasksRouter.post("/sessions/stop-active", (req, res) => {
  tasksService.stopActiveSessions(req.user!.id);
  res.json({ tasks: tasksService.listWithRelations(req.user!.id) });
});

tasksRouter.patch(
  "/:id",
  asyncHandler(async (req, res) => {
    const task = tasksService.update(req.user!.id, req.params.id, req.body ?? {});
    res.json({ task: tasksService.withRelations(task) });
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

// Manually log a completed session (e.g. retroactively, without ever
// toggling Active) — from the task editor modal.
tasksRouter.post(
  "/:id/sessions",
  asyncHandler(async (req, res) => {
    const task = tasksService.getOwned(req.user!.id, req.params.id);
    const { startedAt, endedAt } = req.body ?? {};
    const sessions = tasksService.addManualSession(task.id, Number(startedAt), Number(endedAt));
    res.json({ sessions });
  })
);
