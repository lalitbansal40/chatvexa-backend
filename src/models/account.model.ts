import { Schema, model } from "mongoose";

const AccountSchema = new Schema(
  {
    name: { type: String, required: true },
    owner_id: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
  },
  { timestamps: true }
);

export default model("Account", AccountSchema);