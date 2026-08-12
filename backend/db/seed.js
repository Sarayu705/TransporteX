// Seeds a handful of demo shipments so the tracking widget on the
// frontend has real data to look up out of the box.
require("dotenv").config();

const { connectDB, mongoose } = require("./database");
const { Shipment } = require("./models");

const sampleShipments = [
  {
    trackingId: "TPX-48213-IN",
    origin: "Mumbai, IN",
    destination: "Rotterdam, NL",
    serviceType: "Ocean Freight",
    status: "In Transit",
    eta: "2026-08-22",
    weightKg: 1240,
    events: [
      { status: "Booked", location: "Mumbai, IN", note: "Shipment booked and manifest generated." },
      { status: "Picked Up", location: "Mumbai, IN", note: "Cargo collected from warehouse." },
      { status: "Departed Origin Port", location: "Nhava Sheva Port, IN", note: "Loaded onto vessel MV Kohinoor." },
      { status: "In Transit", location: "Arabian Sea", note: "Vessel en route to Rotterdam." },
    ],
  },
  {
    trackingId: "TPX-90876-US",
    origin: "Chicago, US",
    destination: "Toronto, CA",
    serviceType: "Road Freight",
    status: "Out for Delivery",
    eta: "2026-08-11",
    weightKg: 320,
    events: [
      { status: "Booked", location: "Chicago, US", note: "Shipment booked." },
      { status: "Picked Up", location: "Chicago, US", note: "Cargo collected." },
      { status: "In Transit", location: "Detroit, US", note: "Crossed state line, en route to border." },
      { status: "Customs Cleared", location: "Windsor–Detroit Border", note: "Cleared customs, continuing to Toronto." },
      { status: "Out for Delivery", location: "Toronto, CA", note: "On last-mile delivery vehicle." },
    ],
  },
  {
    trackingId: "TPX-11209-DE",
    origin: "Hamburg, DE",
    destination: "Kolkata, IN",
    serviceType: "Air Freight",
    status: "Delivered",
    eta: "2026-07-30",
    weightKg: 88,
    events: [
      { status: "Booked", location: "Hamburg, DE", note: "Shipment booked." },
      { status: "Picked Up", location: "Hamburg, DE", note: "Cargo collected from sender." },
      { status: "Departed Origin Hub", location: "Hamburg Airport, DE", note: "Flight THX-221 departed." },
      { status: "Arrived Destination Hub", location: "Kolkata Airport, IN", note: "Cleared customs on arrival." },
      { status: "Delivered", location: "Kolkata, IN", note: "Signed for by recipient." },
    ],
  },
];

async function seed() {
  await connectDB();

  for (const s of sampleShipments) {
    const existing = await Shipment.findOne({ trackingId: s.trackingId });
    if (existing) {
      // Mirrors the old "INSERT OR IGNORE" + "only seed events if none exist" behavior.
      continue;
    }
    await Shipment.create(s);
  }

  console.log(`Seeded ${sampleShipments.length} demo shipments:`);
  sampleShipments.forEach((s) => console.log(`  - ${s.trackingId} (${s.status})`));

  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error("Seeding failed:", err);
  process.exit(1);
});
