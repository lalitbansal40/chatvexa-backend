import { Response, NextFunction } from "express";
import { AuthRequest } from "../types/auth.types";
import Subscription from "../models/subcription.model";
import { Types } from "mongoose";

/* =====================================================
   SUBSCRIPTION GUARD (ACCOUNT LEVEL)
===================================================== */
export const subscriptionGuard = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const accountId = req.user?.account_id;

    if (!accountId) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    const subscription = await Subscription.findOne({
      account_id: new Types.ObjectId(accountId),
      payment_status: "paid",
      payment_end_date: { $gte: new Date() },
    });

    if (!subscription) {
      return res.status(403).json({
        message: "Subscription inactive or expired",
      });
    }

    next();
  } catch (error) {
    console.error("Subscription guard error:", error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};