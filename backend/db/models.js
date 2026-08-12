const mongoose = require("mongoose");

const { Schema } = mongoose;

// --- Users ------------------------------------------------------------
const userSchema = new Schema({
  username: { type: String, required: true, unique: true, trim: true },
  email: { type: String, required: true, unique: true, trim: true, lowercase: true },
  passwordHash: { type: String, required: true },
  role: { type: String, required: true, default: "user" },
  createdAt: { type: Date, default: Date.now },
});

// --- Auth tokens --------------------------------------------------------
const authTokenSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  token: { type: String, required: true, unique: true },
  expiresAt: { type: Date, required: true },
  createdAt: { type: Date, default: Date.now },
});

// --- Shipment tracking events (embedded, keeps ordered history per shipment) ---
const shipmentEventSchema = new Schema(
  {
    status: { type: String, required: true },
    location: { type: String, required: true },
    note: { type: String, default: null },
    occurredAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

// --- Shipments ------------------------------------------------------------
const shipmentSchema = new Schema({
  trackingId: { type: String, required: true, unique: true, uppercase: true, trim: true },
  origin: { type: String, required: true },
  destination: { type: String, required: true },
  serviceType: { type: String, required: true },
  status: { type: String, required: true, default: "Booked" },
  eta: { type: String, default: null },
  weightKg: { type: Number, default: null },
  userId: { type: Schema.Types.ObjectId, ref: "User", default: null },
  events: { type: [shipmentEventSchema], default: [] },
  createdAt: { type: Date, default: Date.now },
});

// --- Contact messages -------------------------------------------------
const contactMessageSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, default: null },
  subject: { type: String, default: null },
  message: { type: String, required: true },
  userId: { type: Schema.Types.ObjectId, ref: "User", default: null },
  createdAt: { type: Date, default: Date.now },
});

// --- Quote requests -----------------------------------------------------
const quoteRequestSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, default: null },
  serviceType: { type: String, required: true },
  origin: { type: String, required: true },
  destination: { type: String, required: true },
  cargoDetails: { type: String, default: null },
  userId: { type: Schema.Types.ObjectId, ref: "User", default: null },
  createdAt: { type: Date, default: Date.now },
});

// --- Newsletter subscribers ---------------------------------------------
const newsletterSubscriberSchema = new Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  createdAt: { type: Date, default: Date.now },
});

const User = mongoose.model("User", userSchema);
const AuthToken = mongoose.model("AuthToken", authTokenSchema);
const Shipment = mongoose.model("Shipment", shipmentSchema);
const ContactMessage = mongoose.model("ContactMessage", contactMessageSchema);
const QuoteRequest = mongoose.model("QuoteRequest", quoteRequestSchema);
const NewsletterSubscriber = mongoose.model("NewsletterSubscriber", newsletterSubscriberSchema);

module.exports = {
  User,
  AuthToken,
  Shipment,
  ContactMessage,
  QuoteRequest,
  NewsletterSubscriber,
};
