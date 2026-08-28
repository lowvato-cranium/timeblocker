import { Router } from "express";
import { asyncHandler } from "../../shared/asyncHandler.js";
import { requireAuth } from "../auth/auth.middleware.js";
import { timerService } from "./timer.service.js";

export const timerRouter = Router();
timerRouter.use(requireAuth);

timerRouter.get("/settings", (req, res) => {
  res.json({ settings: timerService.get(req.user!.id) });
});

timerRouter.put(
  "/settings",
  asyncHandler(async (req, res) => {
    const { workMinutes, otherMinutes } = req.body ?? {};
    const settings = timerService.update(req.user!.id, Number(workMinutes), Number(otherMinutes));
    res.json({ settings });
  })
);
