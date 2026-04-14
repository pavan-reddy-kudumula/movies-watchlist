import express from "express";
import bcrypt from "bcrypt";
import UserModel from "../models/User.js";
import authMiddleware from "./auth.js";
import { generateToken } from "../lib/utils.js";
import { ensureGeneralFolder } from "./folders.js";

const router = express.Router();

router.post("/api/auth/signup", async (req, res) => {
  try {
    const { username, email, password } = req.body;

    const normalizedEmail = email.trim().toLowerCase();
    const existingEmail = await UserModel.findOne({ email: normalizedEmail });
    if (existingEmail) {
      return res.status(400).json({ msg: "Email already in use" });
    }

    const normalizedUsername = username.trim();
    const existingUsername = await UserModel.findOne({ username: normalizedUsername });
    if (existingUsername) {
      return res.status(400).json({ msg: "Username already taken" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new UserModel({
      username: normalizedUsername,
      email: normalizedEmail,
      displayEmail: email.trim(),
      password: hashedPassword
    });

    await newUser.save();
    await ensureGeneralFolder(newUser._id);
    generateToken(newUser._id, res);

    res.status(201).json({
      user: {
        id: newUser._id,
        username: newUser.normalizedUsername,
        email: newUser.displayEmail
      }
    });
  } catch (err) {
    console.error(err);
    if (err.code === 11000) {
      if (err.keyPattern?.email) {
        return res.status(400).json({ msg: "Email already in use" });
      }
      if (err.keyPattern?.username) {
        return res.status(400).json({ msg: "Username already taken" });
      }
      return res.status(400).json({ msg: "Duplicate field value" });
    }
    res.status(500).json({ msg: "Server error" });
  }
});

router.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const normalizedEmail = email.trim().toLowerCase();
    const user = await UserModel.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(400).json({ msg: "No account found with this email" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ msg: "Invalid password" });
    }

    generateToken(user._id, res);
    res.json({
      user: {
        id: user._id,
        username: user.username,
        email: user.displayEmail
      }
    });
  } catch (err) {
    res.status(500).json({ msg: "Server error" });
  }
});

router.post("/api/auth/logout", (req, res) => {
  try {
    res.clearCookie("jwt", {
      httpOnly: true,
      sameSite: process.env.NODE_ENV === "development" ? "lax" : "none",
      secure: process.env.NODE_ENV !== "development"
    });
    res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    console.log("error in login controller ", error.message);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/api/auth/profile", authMiddleware, async (req, res) => {
  try {
    const user = req.user;
    res.json({ id: user._id, username: user.username, email: user.displayEmail });
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
});

export default router;