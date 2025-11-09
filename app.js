// app.js
import dotenv from "dotenv";
dotenv.config({ path: "./.env" });

import express from "express";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import helmet from "helmet";
import cors from "cors";

import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import hotelRoutes from "./routes/hotelRoutes.js";

const app = express();
const PORT = process.env.PORT || 4000;

// 🧩 Middleware
app.use(helmet()); // adds secure HTTP headers
app.use(morgan("dev"));
app.use(express.json());
app.use(cookieParser());

// 🧠 Basic CORS setup (adjust for your frontend URL)
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true, // needed for sending cookies
  })
);

// 🩵 Health check route
app.get("/", (req, res) => res.send("✅ Hotel POS API Server is running"));

// 🛣️ Routes
app.use("/api/auth", authRoutes);
app.use("/api/hotels", hotelRoutes);

// ⚠️ 404 fallback
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// 🔥 Global error handler
app.use((err, req, res, next) => {
  console.error("❌ Error:", err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
});

// 🚀 Server start function
const start = async () => {
  try {
    await connectDB();
    app.listen(PORT, () =>
      console.log(`🚀 Server running on http://localhost:${PORT}`)
    );
  } catch (err) {
    console.error("❌ Failed to start server:", err.message);
    process.exit(1);
  }
};

start();
