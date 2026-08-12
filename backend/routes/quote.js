const express = require("express");
const { QuoteRequest } = require("../db/models");
const { getTokenFromReq, getUserFromToken } = require("../lib/auth-utils");

const router = express.Router();

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// POST /api/quote - store a freight quote request
router.post("/", async (req, res, next) => {
  try {
    const { name, email, phone, serviceType, origin, destination, cargoDetails } = req.body || {};
    const token = getTokenFromReq(req);
    const user = await getUserFromToken(token);

    const required = { name, email, serviceType, origin, destination };
    for (const [key, value] of Object.entries(required)) {
      if (!value || !String(value).trim()) {
        return res.status(400).json({ error: `"${key}" is required.` });
      }
    }
    if (!EMAIL_RE.test(String(email).trim())) {
      return res.status(400).json({ error: "A valid email is required." });
    }

    const quoteRequest = await QuoteRequest.create({
      name: String(name).trim(),
      email: String(email).trim(),
      phone: phone ? String(phone).trim() : null,
      serviceType: String(serviceType).trim(),
      origin: String(origin).trim(),
      destination: String(destination).trim(),
      cargoDetails: cargoDetails ? String(cargoDetails).trim() : null,
      userId: user ? user.id : null,
    });

    res.status(201).json({
      message: "Quote request received. A logistics specialist will reach out with pricing shortly.",
      id: quoteRequest._id.toString(),
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/quote - list stored quote requests (simple admin/debug endpoint)
router.get("/", async (req, res, next) => {
  try {
    const rows = await QuoteRequest.find().sort({ createdAt: -1 }).lean();
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
