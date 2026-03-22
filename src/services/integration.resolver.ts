import { Types } from "mongoose";
import Integration from "../models/integration.model";

/* =====================================================
   GET INTEGRATION (ACCOUNT BASED + SECURE)
===================================================== */
export const getIntegration = async (
  accountId: string,
  slug: string
) => {
  const integration = await Integration.findOne({
    account_id: new Types.ObjectId(accountId),
    slug,
    is_active: true,
  }).select("+secrets"); // 🔐 include secrets

  if (!integration) {
    throw new Error(`${slug} integration not configured`);
  }

  return {
    config: integration.config || {},
    secrets: integration.secrets || {},
  };
};