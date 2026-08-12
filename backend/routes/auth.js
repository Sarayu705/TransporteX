const express = require("express");
const { User, AuthToken } = require("../db/models");
const { hashPassword, verifyPassword, generateToken } = require("../lib/auth-utils");

const router = express.Router();

const USERNAME_RE = /^[a-zA-Z0-9._-]{3,32}$/;
const PASSWORD_MIN_LENGTH = 8;

router.post("/register", async (req, res, next) => {
  try {
    const { username, email, password, role } = req.body || {};

    if (!username || !USERNAME_RE.test(String(username).trim())) {
      return res.status(400).json({ error: "Username is required and must be 3-32 characters." });
    }
    if (!email || !String(email).trim()) {
      return res.status(400).json({ error: "Email is required." });
    }
    if (!password || String(password).length < PASSWORD_MIN_LENGTH) {
      return res.status(400).json({ error: `Password must be at least ${PASSWORD_MIN_LENGTH} characters.` });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const normalizedUsername = String(username).trim();
    const normalizedRole = role === "admin" ? "admin" : "user";

    const existingUser = await User.findOne({
      $or: [{ username: normalizedUsername }, { email: normalizedEmail }],
    });

    if (existingUser) {
      return res.status(409).json({ error: "A user with that username or email already exists." });
    }

    const passwordHash = hashPassword(String(password));
    const user = await User.create({
      username: normalizedUsername,
      email: normalizedEmail,
      passwordHash,
      role: normalizedRole,
    });

    res.status(201).json({
      user: {
        id: user._id.toString(),
        username: user.username,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
      },
    });
  } catch (err) {
    next(err);
  }
});

router.post("/login", async (req, res, next) => {
  try {
    const { username, password } = req.body || {};

    if (!username || !String(username).trim()) {
      return res.status(400).json({ error: "Username is required." });
    }
    if (!password || !String(password).trim()) {
      return res.status(400).json({ error: "Password is required." });
    }

    const user = await User.findOne({ username: String(username).trim() });

    if (!user || !verifyPassword(password, user.passwordHash)) {
      return res.status(401).json({ error: "Invalid username or password." });
    }

    const token = generateToken();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await AuthToken.create({ userId: user._id, token, expiresAt });

    res.json({
      token,
      user: { id: user._id.toString(), username: user.username, email: user.email, role: user.role },
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
