// routes/hotelRoutes.js
import express from "express";
import { createHotel, addHotelUser, listHotelMembers } from "../controllers/hotelController.js";
import { authenticate, authorizeRoles } from "../middleware/authMiddleware.js";
import { authorizeHotelRoles } from "../middleware/hotelAuth.js";

const router = express.Router();

// Create hotel: only global owner
router.post("/", authenticate, authorizeRoles("owner"), createHotel);

// Add user to specific hotel: only hotel owner (or global owner)
router.post("/:hotelId/users", authenticate, authorizeHotelRoles("owner"), addHotelUser);

// List members of hotel: any member can view
router.get("/:hotelId/members", authenticate, authorizeHotelRoles("owner", "manager", "staff"), listHotelMembers);

export default router;
