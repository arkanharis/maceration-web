import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

if (!JWT_SECRET) {
  // Fail loudly at startup rather than silently signing tokens with `undefined`.
  console.warn(
    "[jwt] WARNING: JWT_SECRET is not set in the environment. Set it in your .env file."
  );
}

/**
 * Sign a JWT for a given user.
 * @param {Object} payload - data to embed in the token (keep minimal: id, email, global_role)
 * @returns {string}
 */
export function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

/**
 * Verify a JWT and return its decoded payload.
 * Throws if the token is invalid or expired.
 * @param {string} token
 * @returns {Object}
 */
export function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET);
}
