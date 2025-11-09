// models/User.js
import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String },
    email: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true },
    // global role: 'owner' for super-admin, otherwise default is 'staff'
    role: { type: String, enum: ["owner", "manager", "staff"], default: "staff" },
    refreshToken: { type: String }, // store refresh token (rotate on refresh)
    hotels: [{ type: mongoose.Schema.Types.ObjectId, ref: "Hotel" }], // optional convenience
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);
