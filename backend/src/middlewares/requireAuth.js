import { verifyToken } from "../utils/jwt.js";
import { findUserById } from "../repositories/userRepository.js";

/**
 * requireAuth — verifies the JWT from the Authorization header and attaches
 * the current user to req.user.
 *
 * We re-fetch the user from the DB (instead of trusting the JWT payload
 * as-is) so that req.user.global_role always reflects the current value —
 * important if an admin changes a user's role after a token was issued.
 *
 * Expected header: `Authorization: Bearer <token>`
 */
export async function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization || "";
  const [scheme, token] = authHeader.split(" ");

  if (scheme !== "Bearer" || !token) {
    return res.status(401).json({ error: "missing or malformed authorization header" });
  }

  let decoded;
  try {
    decoded = verifyToken(token);
  } catch (err) {
    return res.status(401).json({ error: "invalid or expired token" });
  }

  let user;
  try {
    user = await findUserById(decoded.id);
  } catch (err) {
    console.error("[requireAuth] failed to look up user", err);
    return res.status(500).json({ error: "internal server error" });
  }

  if (!user) {
    return res.status(401).json({ error: "user no longer exists" });
  }

  req.user = user;
  next();
}