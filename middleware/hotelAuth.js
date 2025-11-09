// middleware/hotelAuth.js
import Hotel from "../models/Hotel.js";
import User from "../models/User.js";

/*
  authorizeHotelRoles(...allowedRoles)
  - global owner bypass
  - else find membership in hotel's members array and check role
*/
export const authorizeHotelRoles = (...allowedRoles) => {
  return async (req, res, next) => {
    try {
      const userId = req.user?.id;
      if (!userId) return res.status(401).json({ message: "Unauthorized" });

      // global owner bypass
      const me = await User.findById(userId).select("role");
      if (me?.role === "owner") return next();

      const hotelId = req.params.hotelId;
      if (!hotelId) return res.status(400).json({ message: "hotelId param required" });

      const hotel = await Hotel.findById(hotelId);
      if (!hotel) return res.status(404).json({ message: "Hotel not found" });

      const membership = hotel.members.find(m => m.user.toString() === userId.toString());
      if (!membership) return res.status(403).json({ message: "Forbidden - not a member of this hotel" });

      if (!allowedRoles.includes(membership.role)) {
        return res.status(403).json({ message: "Forbidden - insufficient hotel role" });
      }

      req.hotel = hotel;
      req.hotelMembership = membership;
      next();
    } catch (err) {
      next(err);
    }
  };
};
