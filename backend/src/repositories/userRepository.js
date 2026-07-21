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
 * List all users in the system (admin panel, Task 2.6).
 * Includes a count of how many devices each user owns (owner role),
 * useful for the superadmin overview.
 * @returns {Promise<Object[]>}
 */
export async function listAllUsers() {
  const query = `
    SELECT u.id, u.name, u.email, u.global_role, u.created_at,
           COUNT(d.id)::int AS owned_device_count
    FROM users u
    LEFT JOIN devices d ON d.owner_id = u.id
    GROUP BY u.id
    ORDER BY u.created_at DESC
  `;
  const { rows } = await pool.query(query);
  return rows;
}