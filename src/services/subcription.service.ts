import Subscription from "../models/subcription.model";
import { Types } from "mongoose";

/* =====================================================
   ACTIVATE SUBSCRIPTION (ACCOUNT LEVEL)
===================================================== */
export const activateSubscription = async (
  accountId: string,
  days: number
) => {
  const start = new Date();
  const end = new Date();
  end.setDate(end.getDate() + days);

  const subscription = await Subscription.findOneAndUpdate(
    { account_id: new Types.ObjectId(accountId) },
    {
      payment_status: "paid",
      payment_start_date: start,
      payment_end_date: end,
    },
    { new: true, upsert: true } // 🔥 important
  );

  return subscription;
};