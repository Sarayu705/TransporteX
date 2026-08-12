const express = require("express");
const { NewsletterSubscriber } = require("../db/models");

const router = express.Router();

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// POST /api/newsletter - subscribe an email address
router.post("/", async (req, res, next) => {
  try {
    const { email } = req.body || {};

    if (!email || !EMAIL_RE.test(String(email).trim())) {
      return res.status(400).json({ error: "A valid email is required." });
    }

    const normalized = String(email).trim().toLowerCase();

    const existing = await NewsletterSubscriber.findOne({ email: normalized });

    if (existing) {
      return res.status(200).json({ message: "You're already subscribed — thanks!" });
    }

    await NewsletterSubscriber.create({ email: normalized });

    res.status(201).json({ message: "Subscribed! Watch your inbox for offers and updates." });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
