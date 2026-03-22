import { Router } from "express";
import {
  createTemplate,
  deleteTemplate,
  getTemplateById,
  getTemplates,
  updateTemplate,
} from "../controllers/template.controller";

import { authMiddleware } from "../middlewares/auth.middleware";
import { subscriptionGuard } from "../middlewares/subcription.middleware";

const router = Router();

/**
 * 🔥 All routes protected + subscription required
 */

// ✅ Get all templates
router.get("/:channelId", authMiddleware, subscriptionGuard, getTemplates);
router.get(
  "/:channelId/:templateId",
  authMiddleware,
  subscriptionGuard,
  getTemplateById,
);

// ✅ Create Marketing Template
router.post(
  "/marketing/:channelId",
  authMiddleware,
  subscriptionGuard,
  createTemplate,
);

// UPDATE (recreate)
router.put("/:channelId/:templateId", updateTemplate);

// DELETE
router.delete("/:channelId/:templateId", deleteTemplate);

export default router;
