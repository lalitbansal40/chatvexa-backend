import mongoose, { Schema, Document } from "mongoose";

export type IntegrationSlug =
  | "google_sheet"
  | "razorpay"
  | "borzo"
  | "shiprocket";

export interface IntegrationDocument extends Document {
  account_id: mongoose.Types.ObjectId; // ✅ FIXED

  slug: IntegrationSlug;
  is_active: boolean;

  config: Record<string, any>;

  secrets: Record<string, any>; // 🔐 NEW

  createdAt: Date;
  updatedAt: Date;
}

const IntegrationSchema = new Schema<IntegrationDocument>(
  {
    account_id: {
      type: Schema.Types.ObjectId,
      ref: "Account",
      required: true,
      index: true,
    },

    slug: {
      type: String,
      enum: [
        "google_sheet",
        "razorpay",
        "borzo",
        "shiprocket",
      ],
      required: true,
      index: true,
    },

    is_active: {
      type: Boolean,
      default: true,
    },

    config: {
      type: Schema.Types.Mixed,
      default: {},
    },

    secrets: {
      type: Schema.Types.Mixed,
      default: {},
      select: false, // 🔐 VERY IMPORTANT
    },
  },
  { timestamps: true }
);

/**
 * 🔥 ONE integration per account per service
 */
IntegrationSchema.index(
  { account_id: 1, slug: 1 },
  { unique: true }
);

export default mongoose.model<IntegrationDocument>(
  "Integration",
  IntegrationSchema
);