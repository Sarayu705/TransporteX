const mongoose = require("mongoose");
const passwordUtil = require("../lib/password");
const { User } = require("./models");

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/transportex";

let connectionPromise = null;

async function ensureDefaultAdmin() {
  const adminEmail = process.env.DEFAULT_ADMIN_EMAIL || "admin@transportex.example";
  const adminUsername = process.env.DEFAULT_ADMIN_USERNAME || "admin";
  const adminPassword = process.env.DEFAULT_ADMIN_PASSWORD || "AdminPassword123";

  const existingAdmin = await User.findOne({
    $or: [{ username: adminUsername }, { email: adminEmail }],
  });

  if (!existingAdmin) {
    const passwordHash = passwordUtil.hashPassword(adminPassword);
    await User.create({
      username: adminUsername,
      email: adminEmail,
      passwordHash,
      role: "admin",
    });
    console.log(`Default admin account ready.`);
  }
}

// Connects to MongoDB (once) and makes sure the default admin exists.
// Safe to call multiple times - subsequent calls reuse the same connection.
async function connectDB() {
  if (!connectionPromise) {
    connectionPromise = mongoose
      .connect(MONGODB_URI)
      .then(async (conn) => {
        console.log(`Connected to MongoDB at ${MONGODB_URI}`);
        await ensureDefaultAdmin();
        return conn;
      })
      .catch((err) => {
        connectionPromise = null;
        throw err;
      });
  }
  return connectionPromise;
}

module.exports = { connectDB, mongoose };
