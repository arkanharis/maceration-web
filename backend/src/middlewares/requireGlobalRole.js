/**
 * requireGlobalRole(role) — factory that returns a middleware ensuring the
 * authenticated user's global_role matches the given role (e.g. 'superadmin').
 *
 * Must be used AFTER requireAuth, since it depends on req.user being set.
 *
 * Usage:
 *   router.get('/admin/devices', requireAuth, requireGlobalRole('superadmin'), handler)
 */
export function requireGlobalRole(role) {
  return function (req, res, next) {
    if (!req.user) {
      // Defensive check — indicates requireAuth wasn't applied before this middleware.
      return res.status(401).json({ error: "authentication required" });
    }

    if (req.user.global_role !== role) {
      return res.status(403).json({ error: "insufficient permissions" });
    }

    next();
  };
}