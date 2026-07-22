import { pool } from "../config/db.js";

/**
 * Repository layer for the `users` table.
 * Pure data-access functions only — no business logic (hashing, validation,
 * etc.) belongs here. That lives in the service/controller layer (Task 1.2+).
 */

/**
 * Create a new user.
 * @param {Object} params
 * @param {string} params.name
 * @param {string} params.email
 * @param {string} params.passwordHash - already-hashed password (bcrypt)
 * @param {string} [params.globalRole] - 'user' | 'superadmin', defaults to 'user'
 * @returns {Promise<Object>} the created user row
 */
export async function createUser({ name, email, passwordHash, globalRole = "user" }) {
  const query = `
    INSERT INTO users (name, email, password_hash, global_role)
    VALUES ($1, $2, $3, $4)
    RETURNING id, name, email, global_role, created_at
  `;
  const values = [name, email, passwordHash, globalRole];
  const { rows } = await pool.query(query, values);
  return rows[0];
}

/**
 * Find a user by email. Includes password_hash — needed for login checks.
 * @param {string} email
 * @returns {Promise<Object|null>}
 */
export async function findUserByEmail(email) {
  const query = `
    SELECT id, name, email, password_hash, global_role, created_at
    FROM users
    WHERE email = $1
  `;
  const { rows } = await pool.query(query, [email]);
  return rows[0] || null;
}

/**
 * Find a user by id. Excludes password_hash — safe to return to clients.
 * @param {string} id - UUID
 * @returns {Promise<Object|null>}
 */
export async function findUserById(id) {
  const query = `
    SELECT id, name, email, global_role, created_at
    FROM users
    WHERE id = $1
  `;
  const { rows } = await pool.query(query, [id]);
  return rows[0] || null;
}

/**
 * Update a user's global role (e.g. promote to superadmin).
 * @param {string} id - UUID
 * @param {string} globalRole - 'user' | 'superadmin'
 * @returns {Promise<Object|null>} the updated user row, or null if not found
 */
export async function updateUserRole(id, globalRole) {
  const query = `
    UPDATE users
    SET global_role = $2
    WHERE id = $1
    RETURNING id, name, email, global_role, created_at
  `;
  const { rows } = await pool.query(query, [id, globalRole]);
  return rows[0] || null;
}

/**
 * Update a user's own profile (name and/or password_hash).
 * Only updates fields that are provided (non-null).
 * @param {string} id - UUID
 * @param {Object} fields
 * @param {string} [fields.name]
 * @param {string} [fields.passwordHash]
 * @returns {Promise<Object|null>}
 */
export async function updateUserProfile(id, { name, passwordHash } = {}) {
  const sets = [];
  const values = [id];
  if (name !== undefined) { sets.push(`name = $${values.push(name)}`); }
  if (passwordHash !== undefined) { sets.push(`password_hash = $${values.push(passwordHash)}`); }
  if (sets.length === 0) return findUserById(id);
  const query = `
    UPDATE users SET ${sets.join(", ")}
    WHERE id = $1
    RETURNING id, name, email, global_role, created_at
  `;
  const { rows } = await pool.query(query, values);
  return rows[0] || null;
}

/**
 * Admin: update a user's name and/or email.
 * @param {string} id - UUID
 * @param {Object} fields
 * @param {string} [fields.name]
 * @param {string} [fields.email]
 * @returns {Promise<Object|null>}
 */
export async function adminUpdateUser(id, { name, email } = {}) {
  const sets = [];
  const values = [id];
  if (name !== undefined) { sets.push(`name = $${values.push(name)}`); }
  if (email !== undefined) { sets.push(`email = $${values.push(email)}`); }
  if (sets.length === 0) return findUserById(id);
  const query = `
    UPDATE users SET ${sets.join(", ")}
    WHERE id = $1
    RETURNING id, name, email, global_role, created_at
  `;
  const { rows } = await pool.query(query, values);
  return rows[0] || null;
}

/**
 * Delete a user by id. Cascades handled at service layer (devices → unclaimed).
 * @param {string} id - UUID
 * @returns {Promise<boolean>} true if deleted, false if not found
 */
export async function deleteUser(id) {
  const { rowCount } = await pool.query(`DELETE FROM users WHERE id = $1`, [id]);
  return rowCount > 0;
}

/**
 * List all users in the system (admin panel, Task 2.6).
 * Includes a count of how many devices each user owns (owner role),
 * useful for the superadmin overview.
 * @returns {Promise<Object[]>}
 */
export async function listAllUsers({ search } = {}) {
  const values = [];
  const where = search
    ? `WHERE u.name ILIKE $${values.push(`%${search}%`)} OR u.email ILIKE $${values.push(`%${search}%`)}`
    : "";
  const query = `
    SELECT u.id, u.name, u.email, u.global_role, u.created_at,
           COUNT(d.id)::int AS owned_device_count
    FROM users u
    LEFT JOIN devices d ON d.owner_id = u.id
    ${where}
    GROUP BY u.id
    ORDER BY u.created_at DESC
  `;
  const { rows } = await pool.query(query, values);
  return rows;
}