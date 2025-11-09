// controllers/authController.js
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

/* Token helpers */
const createAccessToken = (user) =>
    jwt.sign({ id: user._id, role: user.role }, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: process.env.ACCESS_TOKEN_EXPIRES || "15m",
    });

const createRefreshToken = (user) =>
    jwt.sign({ id: user._id }, process.env.REFRESH_TOKEN_SECRET, {
        expiresIn: process.env.REFRESH_TOKEN_EXPIRES || "7d",
    });

/* Public: create the first global owner (only if no users exist) */
export const registerFirstOwner = async (req, res, next) => {
    try {
        const count = await User.countDocuments();
        if (count > 0) return res.status(403).json({ message: "First owner already created." });

        const { name, email, password } = req.body;
        if (!email || !password) return res.status(400).json({ message: "Email and password required" });

        if (await User.findOne({ email })) return res.status(409).json({ message: "Email already registered" });

        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        const user = await User.create({ name, email, passwordHash, role: "owner" });
        res.status(201).json({ id: user._id, email: user.email, role: user.role });
    } catch (err) {
        next(err);
    }
};

/* Protected: owner registers other users (owner only) */
export const registerByOwner = async (req, res, next) => {
    try {
        const { name, email, password, role } = req.body;
        if (!email || !password) return res.status(400).json({ message: "Email and password required" });

        const allowedRoles = ["owner", "manager", "staff"];
        const newRole = role || "staff";
        if (!allowedRoles.includes(newRole)) return res.status(400).json({ message: `Invalid role: ${allowedRoles.join(", ")}` });

        if (await User.findOne({ email })) return res.status(409).json({ message: "Email already registered" });

        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        const user = await User.create({ name, email, passwordHash, role: newRole });
        res.status(201).json({ id: user._id, email: user.email, role: user.role });
    } catch (err) {
        next(err);
    }
};

/* Login: returns access token, sets refresh token cookie (rotating) */
export const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) return res.status(400).json({ message: "Email and password required" });

        const user = await User.findOne({ email });
        if (!user) return res.status(401).json({ message: "Invalid credentials" });

        const match = await bcrypt.compare(password, user.passwordHash);
        if (!match) return res.status(401).json({ message: "Invalid credentials" });

        const accessToken = createAccessToken(user);
        const refreshToken = createRefreshToken(user);

        user.refreshToken = refreshToken;
        await user.save();

        // set refresh token cookie
        // set refresh token cookie (still secure for browsers)
        res.cookie("jid", refreshToken, {
            httpOnly: true,
            secure: process.env.COOKIE_SECURE === "true",
            sameSite: "lax",
            maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
        });

        // also send refreshToken in response body (for mobile/Postman testing)
        res.json({
            accessToken,
            refreshToken,
            user: {
                id: user._id,
                email: user.email,
                role: user.role,
            },
        });

    } catch (err) {
        next(err);
    }
};

/* Refresh: rotate refresh token (uses cookie or body/header) */
export const refreshToken = async (req, res, next) => {
    try {
        const token = req.cookies?.jid || req.body.refreshToken || req.headers["x-refresh-token"];
        if (!token) return res.status(401).json({ message: "No refresh token provided" });

        let payload;
        try {
            payload = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);
        } catch (e) {
            return res.status(401).json({ message: "Invalid refresh token" });
        }

        const user = await User.findById(payload.id);
        if (!user || user.refreshToken !== token) return res.status(401).json({ message: "Refresh token revoked" });

        const newAccessToken = createAccessToken(user);
        const newRefreshToken = createRefreshToken(user);

        user.refreshToken = newRefreshToken;
        await user.save();

        res.cookie("jid", newRefreshToken, {
            httpOnly: true,
            secure: process.env.COOKIE_SECURE === "true",
            sameSite: "lax",
            maxAge: 1000 * 60 * 60 * 24 * 7,
        });

        res.json({ accessToken: newAccessToken });
    } catch (err) {
        next(err);
    }
};

/* Logout: revoke refresh token and clear cookie */
export const logout = async (req, res, next) => {
    try {
        const token = req.cookies?.jid || req.body.refreshToken || req.headers["x-refresh-token"];
        if (token) {
            try {
                const payload = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);
                await User.findByIdAndUpdate(payload.id, { $unset: { refreshToken: 1 } });
            } catch (e) {
                // ignore invalid token
            }
        }

        res.clearCookie("jid", { httpOnly: true, sameSite: "lax", secure: process.env.COOKIE_SECURE === "true" });
        res.json({ message: "Logged out" });
    } catch (err) {
        next(err);
    }
};
