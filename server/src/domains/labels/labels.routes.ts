import { Router } from "express";
import { requireAuth } from "../auth/auth.middleware.js";
import { labelsService } from "./labels.service.js";

export const labelsRouter = Router();
labelsRouter.use(requireAuth);

labelsRouter.get("/", (req, res) => {
  res.json({ labels: labelsService.list(req.user!.id) });
});
