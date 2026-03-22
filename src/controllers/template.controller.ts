import { Request, Response } from "express";
import axios from "axios";
import { Channel } from "../models/channel.model";

// 🔥 Helper: Get Channel
const getChannel = async (channelId: string) => {
  const channel = await Channel.findById(channelId);
  if (!channel) throw new Error("Channel not found");
  return channel;
};

// ✅ Create Marketing Template
export const createTemplate = async (req: Request, res: Response) => {
  try {
    const { channelId } = req.params;

    const {
      name,
      language,
      category, // MARKETING | UTILITY | AUTHENTICATION
      components, // fully dynamic
    } = req.body;

    // ✅ Basic validation
    if (!name || !language || !category || !components) {
      return res.status(400).json({
        message: "name, language, category, components are required",
      });
    }

    const channel = await getChannel(channelId);

    // 🔥 Meta API payload (fully dynamic)
    const payload = {
      name,
      language,
      category,
      components,
    };

    const response = await axios.post(
      `https://graph.facebook.com/v19.0/${channel.waba_id}/message_templates`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${channel.access_token}`,
          "Content-Type": "application/json",
        },
      },
    );

    return res.json({
      success: true,
      data: response.data,
    });
  } catch (error: any) {
    return res.status(500).json({
      message: error.response?.data || error.message,
    });
  }
};

// ✅ Get All Templates
export const getTemplates = async (req: Request, res: Response) => {
  try {
    const { channelId } = req.params;

    const channel = await getChannel(channelId);

    const response = await axios.get(
      `https://graph.facebook.com/v19.0/${channel.waba_id}/message_templates`,
      {
        headers: {
          Authorization: `Bearer ${channel.access_token}`,
        },
      },
    );

    res.json({
      success: true,
      data: response.data.data,
    });
  } catch (error: any) {
    res.status(500).json({
      message: error.response?.data || error.message,
    });
  }
};

export const getTemplateById = async (req: Request, res: Response) => {
  try {
    const { channelId, templateId } = req.params;

    const channel = await getChannel(channelId);

    const response = await axios.get(
      `https://graph.facebook.com/v19.0/${templateId}`,
      {
        headers: {
          Authorization: `Bearer ${channel.access_token}`,
        },
      },
    );

    return res.json({
      success: true,
      data: response.data,
    });
  } catch (error: any) {
    return res.status(500).json({
      message: error.response?.data || error.message,
    });
  }
};

export const updateTemplate = async (req: Request, res: Response) => {
  try {
    const { channelId, templateId } = req.params;
    const { name, language, category, components } = req.body;

    const channel = await getChannel(channelId);

    // 🔥 new unique name (required by Meta)
    const newName = `${name}_v${Date.now()}`;

    const response = await axios.post(
      `https://graph.facebook.com/v19.0/${channel.waba_id}/message_templates`,
      {
        name: newName,
        language,
        category,
        components,
      },
      {
        headers: {
          Authorization: `Bearer ${channel.access_token}`,
          "Content-Type": "application/json",
        },
      },
    );

    return res.json({
      success: true,
      message: "Template updated (recreated)",
      data: response.data,
    });
  } catch (error: any) {
    return res.status(500).json({
      message: error.response?.data || error.message,
    });
  }
};

export const deleteTemplate = async (req: Request, res: Response) => {
  try {
    const { channelId, templateId } = req.params;

    const channel = await getChannel(channelId);

    await axios.delete(`https://graph.facebook.com/v19.0/${templateId}`, {
      headers: {
        Authorization: `Bearer ${channel.access_token}`,
      },
    });

    return res.json({
      success: true,
      message: "Template deleted successfully",
    });
  } catch (error: any) {
    return res.status(500).json({
      message: error.response?.data || error.message,
    });
  }
};
