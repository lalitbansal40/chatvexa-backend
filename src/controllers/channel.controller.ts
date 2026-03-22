import { Response } from "express";
import { Channel } from "../models/channel.model";
import mongoose from "mongoose";
import { AuthRequest } from "../types/auth.types";

/* =====================================================
   CREATE CHANNEL (ADMIN ONLY)
===================================================== */
export const createChannel = async (req: AuthRequest, res: Response) => {
  try {
    const accountId = req.user?.account_id;
    const role = req.user?.role;

    if (!accountId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // 🔐 Only admin can create channel
    if (role !== "admin") {
      return res.status(403).json({
        message: "Only admin can create channel",
      });
    }

    const {
      channel_name,
      phone_number_id,
      display_phone_number,
      access_token,
    } = req.body;

    if (
      !channel_name ||
      !phone_number_id ||
      !display_phone_number ||
      !access_token
    ) {
      return res.status(400).json({
        message: "All fields are required",
      });
    }

    // 🚀 create directly (handle duplicate via DB)
    let channel;
    try {
      channel = await Channel.create({
        channel_name,
        phone_number_id,
        display_phone_number,
        access_token,
        account_id: accountId, // ✅ correct
      });
    } catch (err: any) {
      if (err.code === 11000) {
        return res.status(400).json({
          message: "Channel with this phone number already exists",
        });
      }
      throw err;
    }

    return res.status(201).json({
      message: "Channel created successfully",
      channel: {
        _id: channel._id,
        channel_name: channel.channel_name,
        phone_number_id: channel.phone_number_id,
        display_phone_number: channel.display_phone_number,
      }, // 🔐 hide access_token
    });
  } catch (error) {
    console.error("Create channel error:", error);
    return res.status(500).json({
      message: "Failed to create channel",
    });
  }
};

/* =====================================================
   GET CHANNELS (ACCOUNT LEVEL)
===================================================== */
export const getChannelsByAccountId = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const accountId = req.user?.account_id;

    if (!accountId || !mongoose.Types.ObjectId.isValid(accountId)) {
      return res.status(400).json({
        success: false,
        message: "Valid accountId is required",
      });
    }

    const channels = await Channel.find({
      account_id: accountId,
      is_active: true,
    })
      .select("-access_token") // 🔐 hide token
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      count: channels.length,
      data: channels,
    });
  } catch (error) {
    console.error("Get Channels Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};