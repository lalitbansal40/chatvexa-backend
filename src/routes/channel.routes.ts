import { Router } from "express";
import {
  createChannel,
  getChannelsByAccountId,
} from "../controllers/channel.controller";
import { subscriptionGuard } from "../middlewares/subcription.middleware";
import { authMiddleware } from "../middlewares/auth.middleware";

const router = Router();

/**
 * POST /api/channels
 * Protected + Subscription required
 */
router.get(
  "/",
  authMiddleware,
  subscriptionGuard,
  getChannelsByAccountId,
);

router.post("/", authMiddleware, subscriptionGuard, createChannel);

export default router;
