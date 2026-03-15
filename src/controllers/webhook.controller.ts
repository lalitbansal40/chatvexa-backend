import { Request, Response } from "express";
import dotenv from "dotenv";
import path from "path";
import { Channel } from "../models/channel.model";
import Automation from "../models/automation.model";
import AutomationSession from "../models/automationSession.model";
import { createWhatsAppClient } from "../services/whatsapp.client";
import { runAutomation } from "../engine/automationExecuter";
import Contact from "../models/contact.model";
import Message from "../models/message.model";
import { sendTypingIndicator } from "../helpers/whatsapp.helper";
dotenv.config({ path: path.join(".env") });

const SHEET_ID = "1xlAP136l66VtTjoMkdTEueo-FXKD7_L1RJUlaxefXzI";
const REFERENCE_COORDS = {
  lat: 26.838606673565817,
  lng: 75.82641420437723,
};

const INTERNAL_NOTIFY_NUMBERS = ["919664114023", "917413048269"];
/* =====================================================
   SHOP CONSTANTS (FIXED)
===================================================== */
const SHOP_ADDRESS =
  "Shiv Bhole Bakers, vivek vihar mod, jagatpura, Jaipur, Rajasthan, India";
const SHOP_PHONE = "9664114023";

export const verifyWebhook = async (
  req: Request,
  res: Response,
): Promise<Response> => {
  try {
    console.log("Received webhook verification request:", {
      query: req.query,
    });
    const mode = req.query["hub.mode"] as string | undefined;
    const token = req.query["hub.verify_token"] as string | undefined;
    const challenge = req.query["hub.challenge"] as string | undefined;

    console.log("Webhook verification attempt:", { mode, token, challenge });
    if (
      mode === "subscribe" &&
      token === process.env.WHATSAPP_VERIFY_TOKEN &&
      challenge
    ) {
      return res.status(200).set("Content-Type", "text/plain").send(challenge);
    }

    return res.sendStatus(403);
  } catch (error) {
    console.error("verifyWebhook error:", error);
    return res.sendStatus(500);
  }
};

/* =====================================================
   WHATSAPP MESSAGE RECEIVE
===================================================== */
export const receiveMessage = async (req: Request, res: Response) => {
  try {
    console.log("req.bod.   ::  ", JSON.stringify(req.body));
    const value = req.body?.entry?.[0]?.changes?.[0]?.value;
    if (!value?.messages) return res.sendStatus(200);

    const phoneNumberId = value.metadata.phone_number_id;
    const message = value.messages[0];
    const from = message.from;
    const text = message.text?.body || "";

    const channel = await Channel.findOne({
      phone_number_id: phoneNumberId,
      is_active: true,
    });
    if (!channel) return res.sendStatus(200);

    const automation = await Automation.findOne({
      channel_id: channel._id,
      trigger: "new_message_received",
      status: "active",
    });
    if (!automation) return res.sendStatus(200);

    const contact = await Contact.findOneAndUpdate(
      {
        channel_id: channel._id,
        phone: from,
      },
      {
        $set: {
          name: value.contacts?.[0]?.profile?.name,
        },
      },
      {
        upsert: true,
        new: true,
      },
    );

    const incoming = value.messages[0];
    const replyTo = incoming.context?.id || null;

    const msg = await Message.create({
      channel_id: channel._id,
      contact_id: contact._id,
      direction: "IN",
      type: incoming.type || "unknown",
      status: "SENT",
      wa_message_id: incoming.id,
      reply_to: incoming.context?.id || null, // ⭐ important
      payload: incoming,
      is_read: false,
    });

    // update contact last message
    await Contact.updateOne(
      { _id: contact._id },
      {
        $inc: { unread_count: 1 },
        $set: {
          last_message_id: msg._id,
          last_message_at: new Date(),
        },
      },
    );

    let session = await AutomationSession.findOne({
      phone: from,
      automation_id: automation._id,
    });

    if (!session) {
      session = await AutomationSession.create({
        phone: from,
        automation_id: automation._id,
        channel_id: channel._id,
        contact_id: contact._id, // 🔥 IMPORTANT
        current_node: "start",
        waiting_for: null,
        data: {},
        status: "active",
      });
    }

    const whatsapp = createWhatsAppClient(channel, contact);

    sendTypingIndicator(
      channel.phone_number_id,
      channel.access_token,
      incoming.id,
    );

    // stop typing after 3 seconds (non-blocking)

    await runAutomation({
      automation,
      session,
      message,
      whatsapp,
      updateSession: async (updates) => {
        Object.assign(session, updates);
        await session.save();
      },
    });

    return res.sendStatus(200);
  } catch (error) {
    console.error("❌ receiveMessage error", error);
    return res.sendStatus(200);
  }
};
