import { Response } from "express";
import mongoose from "mongoose";
import ContactAttribute from "../models/contactAttribute.model";
import { AuthRequest } from "../types/auth.types";

/* =====================================================
   UPSERT CONTACT ATTRIBUTES (ADMIN ONLY)
===================================================== */
export const upsertContactAttributes = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const accountId = req.user?.account_id;
    const role = req.user?.role;
    const { attributes } = req.body;

    if (!accountId || !mongoose.Types.ObjectId.isValid(accountId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid accountId",
      });
    }

    // 🔐 Only admin can update schema
    if (role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Only admin can update attributes",
      });
    }

    if (!Array.isArray(attributes)) {
      return res.status(400).json({
        success: false,
        message: "Attributes must be an array",
      });
    }

    // 🔥 Validate attributes
    const ids = new Set();

    for (const attr of attributes) {
      if (!attr.id || !attr.name || !attr.type) {
        return res.status(400).json({
          success: false,
          message: "Each attribute must have id, name and type",
        });
      }

      if (ids.has(attr.id)) {
        return res.status(400).json({
          success: false,
          message: `Duplicate attribute id: ${attr.id}`,
        });
      }

      if (!["string", "number", "boolean", "object"].includes(attr.type)) {
        return res.status(400).json({
          success: false,
          message: `Invalid type for ${attr.id}`,
        });
      }

      ids.add(attr.id);
    }

    const updated = await ContactAttribute.findOneAndUpdate(
      { account_id: accountId },
      { $set: { attributes } },
      { new: true, upsert: true }
    );

    return res.status(200).json({
      success: true,
      message: "Attributes saved successfully",
      data: updated,
    });
  } catch (error: any) {
    console.error("Upsert attributes error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

/* =====================================================
   GET CONTACT ATTRIBUTES
===================================================== */
export const getContactAttributes = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const accountId = req.user?.account_id;

    if (!accountId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const data = await ContactAttribute.findOne({
      account_id: accountId,
    }).lean();

    return res.status(200).json({
      success: true,
      data: data?.attributes || [],
    });
  } catch (error) {
    console.error("Get attributes error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};