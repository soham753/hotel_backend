// app.js
import dotenv from "dotenv";
dotenv.config({ path: "./.env" });

import express from "express";
import cookieParser from "cookie-parser";
import morgan from "morgan";

import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import hotelRoutes from "./routes/hotelRoutes.js";

const app = express();
const PORT = process.env.PORT || 4000;

app.use(morgan("dev"));
app.use(express.json());
app.use(cookieParser());

app.get("/", (req, res) => res.send("Server up"));

const start = async () => {
  await connectDB();

  app.use("/api/auth", authRoutes);
  app.use("/api/hotels", hotelRoutes);

  app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
};

start();
