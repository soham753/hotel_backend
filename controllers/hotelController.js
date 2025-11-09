// controllers/hotelController.js
import User from "../models/User.js";
import Hotel from "../models/Hotel.js";
import bcrypt from "bcryptjs";

/* Create hotel: only global owner (authorizeRoles("owner")) should call this */
export const createHotel = async (req, res, next) => {
  try {
    const { name, address } = req.body;
    if (!name) return res.status(400).json({ message: "Hotel name required" });

    const hotel = await Hotel.create({
      name,
      address,
      owner: req.user.id,
      members: [{ user: req.user.id, role: "owner" }],
    });

    await User.findByIdAndUpdate(req.user.id, { $addToSet: { hotels: hotel._id } });

    res.status(201).json(hotel);
  } catch (err) {
    next(err);
  }
};

/*
  Add user to a hotel (hotel owner or global owner must call)
  If user exists: add membership; else create user with given password and add.
*/
export const addHotelUser = async (req, res, next) => {
  try {
    const { hotelId } = req.params;
    const { name, email, password, role } = req.body;

    const allowed = ["owner", "manager", "staff"];
    if (!allowed.includes(role)) return res.status(400).json({ message: `Role must be one of ${allowed.join(", ")}` });

    const hotel = await Hotel.findById(hotelId);
    if (!hotel) return res.status(404).json({ message: "Hotel not found" });

    // Check permission: middleware authorizeHotelRoles("owner") should have enforced this

    let user = await User.findOne({ email });
    if (!user) {
      if (!password) return res.status(400).json({ message: "Password required to create new user" });
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(password, salt);
      // keep new user's global role minimal (staff) unless owner explicitly needed
      const globalRole = role === "owner" ? "owner" : "staff";
      user = await User.create({ name, email, passwordHash, role: globalRole });
    }

    const already = hotel.members.some(m => m.user.toString() === user._id.toString());
    if (already) return res.status(409).json({ message: "User already member of this hotel" });

    hotel.members.push({ user: user._id, role });
    await hotel.save();

    await User.findByIdAndUpdate(user._id, { $addToSet: { hotels: hotel._id } });

    res.status(201).json({ message: "User added to hotel", hotelId: hotel._id, userId: user._id, role });
  } catch (err) {
    next(err);
  }
};

export const listHotelMembers = async (req, res, next) => {
  try {
    const { hotelId } = req.params;
    const hotel = await Hotel.findById(hotelId).populate("members.user", "name email role");
    if (!hotel) return res.status(404).json({ message: "Hotel not found" });

    res.json({ id: hotel._id, name: hotel.name, members: hotel.members });
  } catch (err) {
    next(err);
  }
};
