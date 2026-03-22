import mongoose, { Schema, Document } from "mongoose";

export type PaymentStatus = "pending" | "paid" | "expired" | "cancelled";
export type PlanType = "TRIAL" | "MONTHLY" | "YEARLY";

export interface UserDocument extends Document {
  email: string;
  phone: string;
  password: string;
  name: string;
  role: "admin" | "user";
  is_active: boolean;
  account_id: mongoose.Types.ObjectId;
  subscription?: {
    plan: PlanType;
    payment_status: PaymentStatus;
    payment_id?: string;
    amount?: number | string;
    payment_start_date?: Date;
    payment_end_date?: Date;
    is_active: boolean;
  };
  account_name: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<UserDocument>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      index: true,
    },
    name: {
      type: String,
    },
    account_id: {
      type: Schema.Types.ObjectId,
      ref: "Account",
      required: true,
      index: true,
    },
    account_name: {
      type: String,
      ref: "Account",
      required: false,
    },
    role: {
      type: String,
      enum: ["admin", "user"],
      default: "user",
    },

    phone: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    password: {
      type: String,
      required: true,
    },

    is_active: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true },
);

const User =
  mongoose.models.User || mongoose.model<UserDocument>("User", UserSchema);

export default User;
