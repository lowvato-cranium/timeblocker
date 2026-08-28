import { Router } from "express";
import { asyncHandler } from "../../shared/asyncHandler.js";
import { requireAuth } from "../auth/auth.middleware.js";
import { tasksService } from "./tasks.service.js";

export const tasksRouter = Router();
tasksRouter.use(requireAuth);

tasksRouter.get("/", (req, res) => {
  res.json({ tasks: tasksService.list(req.user!.id) });
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
    res.status(201).json({ task });
  })
);

tasksRouter.patch(
  "/:id",
  asyncHandler(async (req, res) => {
    const task = tasksService.update(req.user!.id, req.params.id, req.body ?? {});
    res.json({ task });
  })
);

tasksRouter.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    tasksService.remove(req.user!.id, req.params.id);
    res.json({ ok: true });
  })
);
