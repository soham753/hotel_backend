// middleware/authMiddleware.js
import jwt from "jsonwebtoken";
import User from "../models/User.js";

/* Authenticate (access token from Authorization header) */
export const authenticate = async (req, res, next) => {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith("Bearer ")) return res.status(401).json({ message: "Unauthorized" });

  const token = auth.split(" ")[1];
  try {
    const payload = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    // attach user id & role to req.user
    req.user = { id: payload.id, role: payload.role };
    // optionally fetch latest user role from DB:
    const fresh = await User.findById(payload.id).select("role");
    if (fresh) req.user.role = fresh.role || req.user.role;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

/* Authorize by global roles (owner = super-admin) */
export const authorizeRoles = (...allowedRoles) => (req, res, next) => {
  if (!req.user) return res.status(401).json({ message: "Unauthorized" });
  if (!allowedRoles.includes(req.user.role)) return res.status(403).json({ message: "Forbidden - insufficient role" });
  next();
};
