require("dotenv").config();

const express = require("express");
const cors = require("cors");
const rateLimit = require("express-rate-limit");

const { connectDB } = require("./db/database");

const trackRoutes = require("./routes/track");
const contactRoutes = require("./routes/contact");
const quoteRoutes = require("./routes/quote");
const newsletterRoutes = require("./routes/newsletter");
const authRoutes = require("./routes/auth");
const shipmentRoutes = require("./routes/shipments");
const adminRoutes = require("./routes/admin");

const app = express();
const PORT = process.env.PORT || 4000;

const allowedOrigins = (process.env.CORS_ORIGIN || "")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: allowedOrigins.length ? allowedOrigins : true,
  })
);
app.use(express.json());

// Basic protection against form-spamming the write endpoints.
const writeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests. Please try again later." },
});

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", service: "transportex-backend", time: new Date().toISOString() });
});

app.use("/api/auth", authRoutes);
app.use("/api/shipments", shipmentRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/track", trackRoutes);
app.use("/api/contact", writeLimiter, contactRoutes);
app.use("/api/quote", writeLimiter, quoteRoutes);
app.use("/api/newsletter", writeLimiter, newsletterRoutes);

// 404 handler for unknown API routes
app.use("/api", (req, res) => {
  res.status(404).json({ error: "Not found." });
});

// Central error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "Something went wrong on our end." });
});

// Connect to MongoDB first (this also ensures the default admin user
// exists), then start accepting requests - mirrors the old behavior where
// the SQLite tables/admin user were guaranteed to exist before the server
// started listening.
connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Transportex API listening on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Failed to connect to MongoDB:", err.message);
    process.exit(1);
  });
