const express = require("express");
const { QuoteRequest, ContactMessage, Shipment, User } = require("../db/models");
const { getTokenFromReq, getUserFromToken } = require("../lib/auth-utils");

const router = express.Router();

async function requireAdmin(req, res, next) {
  try {
    const token = getTokenFromReq(req);
    const user = await getUserFromToken(token);

    if (!user) {
      return res.status(401).json({ error: "Authentication required." });
    }
    if (user.role !== "admin") {
      return res.status(403).json({ error: "Admin access required." });
    }

    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
}

router.get("/requests", requireAdmin, async (req, res, next) => {
  try {
    const rows = await QuoteRequest.find().sort({ createdAt: -1 }).lean();
    res.json(
      rows.map((row) => ({
        id: row._id.toString(),
        name: row.name,
        email: row.email,
        phone: row.phone,
        serviceType: row.serviceType,
        origin: row.origin,
        destination: row.destination,
        cargoDetails: row.cargoDetails,
        createdAt: row.createdAt,
      }))
    );
  } catch (err) {
    next(err);
  }
});

router.get("/contacts", requireAdmin, async (req, res, next) => {
  try {
    const rows = await ContactMessage.find().sort({ createdAt: -1 }).lean();
    res.json(
      rows.map((row) => ({
        id: row._id.toString(),
        name: row.name,
        email: row.email,
        phone: row.phone,
        subject: row.subject,
        message: row.message,
        createdAt: row.createdAt,
      }))
    );
  } catch (err) {
    next(err);
  }
});

router.get("/shipments", requireAdmin, async (req, res, next) => {
  try {
    const shipments = await Shipment.find().sort({ createdAt: -1 }).lean();

    res.json(
      shipments.map((shipment) => ({
        id: shipment._id.toString(),
        trackingId: shipment.trackingId,
        origin: shipment.origin,
        destination: shipment.destination,
        serviceType: shipment.serviceType,
        status: shipment.status,
        eta: shipment.eta,
        weightKg: shipment.weightKg,
        userId: shipment.userId ? shipment.userId.toString() : null,
        createdAt: shipment.createdAt,
        events: (shipment.events || [])
          .slice()
          .sort((a, b) => new Date(a.occurredAt) - new Date(b.occurredAt))
          .map((event) => ({
            shipmentId: shipment._id.toString(),
            status: event.status,
            location: event.location,
            note: event.note,
            occurredAt: event.occurredAt,
          })),
      }))
    );
  } catch (err) {
    next(err);
  }
});

router.get("/users", requireAdmin, async (req, res, next) => {
  try {
    const rows = await User.find().sort({ createdAt: -1 }).lean();
    res.json(
      rows.map((row) => ({
        id: row._id.toString(),
        username: row.username,
        email: row.email,
        role: row.role,
        createdAt: row.createdAt,
      }))
    );
  } catch (err) {
    next(err);
  }
});

router.post("/shipments/:trackingId/status", requireAdmin, async (req, res, next) => {
  try {
    const trackingId = String(req.params.trackingId || "").trim();
    const { status, location, note, eta } = req.body || {};

    if (!trackingId) {
      return res.status(400).json({ error: "A valid tracking ID is required." });
    }
    if (!status || !String(status).trim()) {
      return res.status(400).json({ error: "A status is required." });
    }
    if (!location || !String(location).trim()) {
      return res.status(400).json({ error: "A location is required." });
    }

    // The schema normalizes trackingId to uppercase on save, so an
    // uppercase comparison here reproduces the old case-insensitive
    // `UPPER(tracking_id) = UPPER(?)` SQLite lookup.
    const shipment = await Shipment.findOne({ trackingId: trackingId.toUpperCase() });
    if (!shipment) {
      return res.status(404).json({ error: `No shipment found for tracking ID "${trackingId}".` });
    }

    const normalizedStatus = String(status).trim();
    const normalizedLocation = String(location).trim();
    const normalizedNote = note ? String(note).trim() : null;
    const normalizedEta = eta ? String(eta).trim() : shipment.eta;

    shipment.status = normalizedStatus;
    shipment.eta = normalizedEta;
    shipment.events.push({
      status: normalizedStatus,
      location: normalizedLocation,
      note: normalizedNote,
      occurredAt: new Date(),
    });

    await shipment.save();

    res.json({
      message: "Shipment status updated.",
      shipment: {
        id: shipment._id.toString(),
        trackingId: shipment.trackingId,
        origin: shipment.origin,
        destination: shipment.destination,
        serviceType: shipment.serviceType,
        status: shipment.status,
        eta: shipment.eta,
        weightKg: shipment.weightKg,
        createdAt: shipment.createdAt,
      },
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
