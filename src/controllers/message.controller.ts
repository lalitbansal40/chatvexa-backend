import { Request, Response } from "express";
import mongoose from "mongoose";
import Message from "../models/message.model";
import { Channel } from "../models/channel.model";
import Contact from "../models/contact.model";
import { createWhatsAppClient } from "../services/whatsapp.client";

/* ================================
   Attach Reply Messages
================================ */
async function attachReplyMessages(messages: any[]) {
  const replyIds = messages.filter((m) => m.reply_to).map((m) => m.reply_to);

  if (replyIds.length === 0) return messages;

  const repliedMessages = await Message.find({
    wa_message_id: { $in: replyIds },
  }).lean();

  const replyMap: any = {};

  repliedMessages.forEach((msg) => {
    replyMap[msg.wa_message_id] = msg;
  });

  messages.forEach((m: any) => {
    if (m.reply_to) {
      m.reply_message = replyMap[m.reply_to] || null;
    }
  });

  return messages;
}

/* ================================
   Get Messages By Contact
================================ */
export const getMessagesByContact = async (req: Request, res: Response) => {
  try {
    const { contactId } = req.params;
    const { cursor, limit = 30 } = req.query;

    // Validate contactId
    if (!contactId || !mongoose.Types.ObjectId.isValid(contactId)) {
      return res.status(400).json({
        success: false,
        message: "Valid contactId is required",
      });
    }

    const query: any = {
      contact_id: new mongoose.Types.ObjectId(contactId),
    };

    // Cursor pagination
    if (cursor) {
      query.createdAt = {
        $lt: new Date(cursor as string),
      };
    }

    // Fetch messages
    let messages = await Message.find(query)
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .lean();

    // Attach reply messages
    messages = await attachReplyMessages(messages);

    return res.status(200).json({
      success: true,
      count: messages.length,
      nextCursor:
        messages.length > 0 ? messages[messages.length - 1].createdAt : null,
      data: messages.reverse(), // oldest → newest
    });
  } catch (error: any) {
    console.error("Get Messages By Contact Error:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const sendTextMessage = async (req: Request, res: Response) => {
  try {
    const { channelId, contactId, text } = req.body;

    if (!channelId || !contactId || !text) {
      return res.status(400).json({
        success: false,
        message: "channelId, contactId and text are required",
      });
    }

    // 1️⃣ Get Channel
    const channel = await Channel.findById(channelId);
    if (!channel) {
      return res.status(404).json({
        success: false,
        message: "Channel not found",
      });
    }

    // 2️⃣ Get Contact
    const contact = await Contact.findById(contactId);
    if (!contact) {
      return res.status(404).json({
        success: false,
        message: "Contact not found",
      });
    }

    // 3️⃣ Create WhatsApp Client
    const whatsapp = createWhatsAppClient(channel, contact);

    // 4️⃣ Send Message (this internally saves message)
    await whatsapp.sendText(contact.phone, text);

    // 5️⃣ Get latest message for response
    const message = await Message.findOne({
      contact_id: contactId,
      channel_id: channelId,
      direction: "OUT",
    })
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      data: message,
    });
  } catch (error) {
    console.error("Send Message Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to send message",
    });
  }
};

export const markMessagesAsRead = async (req: Request, res: Response) => {
  try {
    const { contactId } = req.params;

    await Message.updateMany(
      {
        contact_id: contactId,
        direction: "IN",
        is_read: false,
      },
      {
        $set: { is_read: true },
      },
    );

    await Contact.updateOne({ _id: contactId }, { $set: { unread_count: 0 } });

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false });
  }
};
