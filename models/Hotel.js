// models/Hotel.js
import mongoose from "mongoose";

const HotelMemberSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  role: { type: String, enum: ["owner", "manager", "staff"], required: true },
}, { _id: false });

const HotelSchema = new mongoose.Schema({
  name: { type: String, required: true },
  address: { type: String },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // hotel-level owner (user id)
  members: { type: [HotelMemberSchema], default: [] }, // includes owner as a member
}, { timestamps: true });

export default mongoose.model("Hotel", HotelSchema);
