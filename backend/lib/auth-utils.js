const crypto = require("crypto");
const { customAlphabet } = require("nanoid");
const { User, AuthToken } = require("../db/models");

const tokenAlphabet = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
const tokenGenerator = customAlphabet(tokenAlphabet, 32);

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const derived = crypto.pbkdf2Sync(password, salt, 310000, 32, "sha256").toString("hex");
  return `${salt}$${derived}`;
}

function verifyPassword(password, storedHash) {
  if (!storedHash || typeof storedHash !== "string") {
    return false;
  }

  const [salt, derived] = storedHash.split("$");
  if (!salt || !derived) {
    return false;
  }

  const candidate = crypto.pbkdf2Sync(password, salt, 310000, 32, "sha256").toString("hex");
  return crypto.timingSafeEqual(Buffer.from(candidate, "hex"), Buffer.from(derived, "hex"));
}

function generateToken() {
  return tokenGenerator();
}

function getTokenFromReq(req) {
  const header = String(req.headers.authorization || "").trim();
  if (header.toLowerCase().startsWith("bearer ")) {
    return header.slice(7).trim();
  }
  return req.query.token || req.body?.token || null;
}

async function getUserFromToken(token) {
  if (!token) return null;

  const authToken = await AuthToken.findOne({
    token,
    expiresAt: { $gt: new Date() },
  }).lean();

  if (!authToken) return null;

  const user = await User.findById(authToken.userId).lean();
  if (!user) return null;

  return {
    id: user._id.toString(),
    username: user.username,
    email: user.email,
    role: user.role,
  };
}

module.exports = {
  hashPassword,
  verifyPassword,
  generateToken,
  getTokenFromReq,
  getUserFromToken,
};
