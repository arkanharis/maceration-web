import { registerUser, loginUser, AuthError } from "../services/authService.js";

export async function register(req, res) {
  try {
    const { name, email, password } = req.body;
    const { user, token } = await registerUser({ name, email, password });
    return res.status(201).json({ user, token });
  } catch (err) {
    if (err instanceof AuthError) {
      return res.status(err.statusCode).json({ error: err.message });
    }
    console.error("[authController.register]", err);
    return res.status(500).json({ error: "internal server error" });
  }
}

export async function login(req, res) {
  try {
    const { email, password } = req.body;
    const { user, token } = await loginUser({ email, password });
    return res.status(200).json({ user, token });
  } catch (err) {
    if (err instanceof AuthError) {
      return res.status(err.statusCode).json({ error: err.message });
    }
    console.error("[authController.login]", err);
    return res.status(500).json({ error: "internal server error" });
  }
}

/**
 * GET /api/v1/auth/me
 * Requires requireAuth middleware — req.user is already populated with the
 * current user's fresh data (id, name, email, global_role, created_at).
 */
export async function me(req, res) {
  return res.status(200).json({ user: req.user });
}

/**
 * POST /api/v1/auth/logout
 *
 * JWTs are stateless, so the server can't "invalidate" a token by itself
 * without a blacklist/allowlist store (e.g. Redis) — out of scope for this
 * app's scale (<20 users, per rancangan). The real logout action is the
 * client discarding its stored token. This endpoint exists so the client
 * has a clear, authenticated action to call as part of the logout flow,
 * and as a place to plug in token blacklisting later if ever needed.
 */
export async function logout(req, res) {
  return res.status(200).json({ message: "logged out successfully" });
}