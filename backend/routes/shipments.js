const express = require("express");
const { Shipment } = require("../db/models");
const { getTokenFromReq, getUserFromToken } = require("../lib/auth-utils");

const router = express.Router();

function formatShipment(shipment) {
  return {
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
  };
}

router.post("/", async (req, res, next) => {
  try {
    const { origin, destination, serviceType, weightKg, eta, trackingId } = req.body || {};
    const token = getTokenFromReq(req);
    const user = await getUserFromToken(token);

    if (!origin || !String(origin).trim()) {
      return res.status(400).json({ error: "Origin is required." });
    }
    if (!destination || !String(destination).trim()) {
      return res.status(400).json({ error: "Destination is required." });
    }
    if (!serviceType || !String(serviceType).trim()) {
      return res.status(400).json({ error: "Service type is required." });
    }

    const normalizedTrackingId = trackingId
      ? String(trackingId).trim().toUpperCase()
      : `TPX-${Math.floor(100000 + Math.random() * 900000)}-UX`;

    const shipment = await Shipment.create({
      trackingId: normalizedTrackingId,
      origin: String(origin).trim(),
      destination: String(destination).trim(),
      serviceType: String(serviceType).trim(),
      eta: eta ? String(eta).trim() : null,
      weightKg: weightKg ? Number(weightKg) : null,
      userId: user ? user.id : null,
    });

    res.status(201).json({ message: "Shipment request created.", shipment: formatShipment(shipment) });
  } catch (err) {
    next(err);
  }
});

router.get("/mine", async (req, res, next) => {
  try {
    const token = getTokenFromReq(req);
    const user = await getUserFromToken(token);

    if (!user) {
      return res.status(401).json({ error: "Please log in to view your shipments." });
    }

    const shipments = await Shipment.find({ userId: user.id }).sort({ createdAt: -1 }).lean();

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
        createdAt: shipment.createdAt,
      }))
    );
  } catch (err) {
    next(err);
  }
});

module.exports = router;
