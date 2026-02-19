import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import { getUsage } from "../services/usage.service.js";

export const analyticsRouter = Router();

analyticsRouter.use(authenticate);

analyticsRouter.get("/usage", async (req, res, next) => {
  try {
    const usage = await getUsage(req.auth!.id);
    res.json({ usage });
  } catch (error) {
    next(error);
  }
});
