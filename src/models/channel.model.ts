import { Schema, model, models, Types } from "mongoose";

export interface ChannelDocument {
  channel_name: string;
  waba_id: string; // 🔥 NEW

  phone_number_id: string;
  display_phone_number: string;
  access_token: string;

  account_id: Types.ObjectId;

  is_active: boolean;

  createdAt: Date;
  updatedAt: Date;
}

const ChannelSchema = new Schema<ChannelDocument>(
  {
    channel_name: {
      type: String,
      required: true,
      index: true,
    },

    // ✅ WABA ID (IMPORTANT)
    waba_id: {
      type: String,
      required: true,
      index: true, // 🔥 fast query for templates
    },

    phone_number_id: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    display_phone_number: {
      type: String,
      required: true,
    },

    access_token: {
      type: String,
      required: true,
    },

    account_id: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    is_active: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    collection: "channels",
  }
);

// 🔥 Compound index
ChannelSchema.index({ account_id: 1, is_active: 1 });

export const Channel =
  models.Channel || model<ChannelDocument>("Channel", ChannelSchema);