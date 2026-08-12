const express = require("express");
const { ContactMessage } = require("../db/models");
const { getTokenFromReq, getUserFromToken } = require("../lib/auth-utils");

const router = express.Router();

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// POST /api/contact - store a message sent from the contact form
router.post("/", async (req, res, next) => {
  try {
    const { name, email, phone, subject, message } = req.body || {};
    const token = getTokenFromReq(req);
    const user = await getUserFromToken(token);

    if (!name || !String(name).trim()) {
      return res.status(400).json({ error: "Name is required." });
    }
    if (!email || !EMAIL_RE.test(String(email).trim())) {
      return res.status(400).json({ error: "A valid email is required." });
    }
    if (!message || !String(message).trim()) {
      return res.status(400).json({ error: "Message is required." });
    }

    const contactMessage = await ContactMessage.create({
      name: String(name).trim(),
      email: String(email).trim(),
      phone: phone ? String(phone).trim() : null,
      subject: subject ? String(subject).trim() : null,
      message: String(message).trim(),
      userId: user ? user.id : null,
    });

    res.status(201).json({
      message: "Thanks — your message has been received. Our team will get back to you shortly.",
      id: contactMessage._id.toString(),
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/contact - list stored messages (simple admin/debug endpoint)
router.get("/", async (req, res, next) => {
  try {
    const rows = await ContactMessage.find().sort({ createdAt: -1 }).lean();
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
