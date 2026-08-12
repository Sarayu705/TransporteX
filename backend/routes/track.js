const express = require("express");
const { Shipment } = require("../db/models");

const router = express.Router();

// GET /api/track/:trackingId - look up a shipment and its event history
router.get("/:trackingId", async (req, res, next) => {
  try {
    const trackingId = String(req.params.trackingId || "").trim().toUpperCase();

    if (!trackingId) {
      return res.status(400).json({ error: "A tracking ID is required." });
    }

    const shipment = await Shipment.findOne({ trackingId }).lean();

    if (!shipment) {
      return res.status(404).json({
        error: `No shipment found for tracking ID "${trackingId}".`,
      });
    }

    const events = [...(shipment.events || [])]
      .sort((a, b) => new Date(a.occurredAt) - new Date(b.occurredAt))
      .map((event) => ({
        status: event.status,
        location: event.location,
        note: event.note,
        // NOTE: the frontend timeline (assets/js/script.js) reads
        // `event.occurred_at` (snake_case) directly, so that exact key is
        // kept here to match the original SQLite response shape.
        occurred_at: event.occurredAt,
      }));

    res.json({
      trackingId: shipment.trackingId,
      origin: shipment.origin,
      destination: shipment.destination,
      serviceType: shipment.serviceType,
      status: shipment.status,
      eta: shipment.eta,
      weightKg: shipment.weightKg,
      events,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
