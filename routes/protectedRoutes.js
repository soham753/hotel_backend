// routes/protectedRoutes.js
import express from "express";
import { authenticate, authorizeRoles } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/any", authenticate, (req, res) => {
  res.json({ msg: "Any authenticated user", user: req.user });
});

router.get("/owner-only", authenticate, authorizeRoles("owner"), (req, res) => {
  res.json({ msg: "Owner access", user: req.user });
});

router.get("/manager-owner", authenticate, authorizeRoles("owner", "manager"), (req, res) => {
  res.json({ msg: "Manager or Owner", user: req.user });
});

router.get("/staff-or-above", authenticate, authorizeRoles("owner", "manager", "staff"), (req, res) => {
  res.json({ msg: "Staff+, all roles allowed", user: req.user });
});

export default router;
