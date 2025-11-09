// routes/authRoutes.js
import express from "express";
import {
  registerFirstOwner,
  registerByOwner,
  login,
  refreshToken,
  logout,
} from "../controllers/authController.js";

import { authenticate, authorizeRoles } from "../middleware/authMiddleware.js";

const router = express.Router();

// Public: only when DB empty
router.post("/register-first", registerFirstOwner);

// Protected: only owner can create other users
router.post("/register", authenticate, authorizeRoles("owner"), registerByOwner);

// Login / Refresh / Logout
router.post("/login", login);
router.post("/refresh", refreshToken);
router.post("/logout", logout);

export default router;
