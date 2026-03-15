import express from "express";
import {
  getMessagesByContact,
  markMessagesAsRead,
  sendTextMessage,
} from "../controllers/message.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
import { subscriptionGuard } from "../middlewares/subcription.middleware";

const router = express.Router();

router.get("/:contactId", authMiddleware, getMessagesByContact);
router.post("/send-text", authMiddleware, subscriptionGuard, sendTextMessage);
router.patch(
  "/read/:contactId",
  authMiddleware,
  subscriptionGuard,
  markMessagesAsRead,
);

export default router;
