import { Response } from "express";
import Integration from "../models/integration.model";
import { AuthRequest } from "../types/auth.types";

/* =====================================================
   COMMON UPSERT HELPER
===================================================== */
const upsertIntegration = async ({
  accountId,
  slug,
  config = {},
  secrets = {},
}: {
  accountId: string;
  slug: string;
  config?: Record<string, any>;
  secrets?: Record<string, any>;
}) => {
  return Integration.findOneAndUpdate(
    { account_id: accountId, slug },
    {
      account_id: accountId,
      slug,
      is_active: true,
      config,
      secrets, // 🔐 store sensitive data separately
    },
    { upsert: true, new: true }
  );
};

/* =====================================================
   GOOGLE SHEET
===================================================== */
export const configureGoogleSheet = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const accountId = req.user?.account_id;
    const role = req.user?.role;

    if (!accountId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (role !== "admin") {
      return res.status(403).json({
        message: "Only admin can configure integrations",
      });
    }

    await upsertIntegration({
      accountId,
      slug: "google_sheet",
      config: {}, // add sheet config later if needed
    });

    return res.json({
      message: "Google Sheet integration configured successfully",
    });
  } catch (error) {
    console.error("GoogleSheet error:", error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

/* =====================================================
   BORZO
===================================================== */
export const configureBorzo = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const accountId = req.user?.account_id;
    const role = req.user?.role;

    if (!accountId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (role !== "admin") {
      return res.status(403).json({
        message: "Only admin can configure integrations",
      });
    }

    const { auth_token, environment = "test" } = req.body;

    if (!auth_token) {
      return res.status(400).json({
        message: "Borzo auth_token is required",
      });
    }

    if (!["test", "production"].includes(environment)) {
      return res.status(400).json({
        message: "Invalid environment",
      });
    }

    await upsertIntegration({
      accountId,
      slug: "borzo",
      config: {
        environment,
      },
      secrets: {
        auth_token, // 🔐 secret
      },
    });

    return res.json({
      message: "Borzo integration configured successfully",
    });
  } catch (error) {
    console.error("Borzo error:", error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

/* =====================================================
   RAZORPAY
===================================================== */
export const configureRazorpay = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const accountId = req.user?.account_id;
    const role = req.user?.role;

    if (!accountId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (role !== "admin") {
      return res.status(403).json({
        message: "Only admin can configure integrations",
      });
    }

    const { key_id, key_secret, environment = "test" } = req.body;

    if (!key_id || !key_secret) {
      return res.status(400).json({
        message: "Razorpay key_id and key_secret are required",
      });
    }

    if (!["test", "production"].includes(environment)) {
      return res.status(400).json({
        message: "Invalid environment",
      });
    }

    await upsertIntegration({
      accountId,
      slug: "razorpay",
      config: {
        key_id,
        environment,
      },
      secrets: {
        key_secret, // 🔐 secret
      },
    });

    return res.json({
      message: "Razorpay integration configured successfully",
    });
  } catch (error) {
    console.error("Razorpay error:", error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};