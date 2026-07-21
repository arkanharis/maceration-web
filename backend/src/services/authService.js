import bcrypt from "bcrypt";
import { createUser, findUserByEmail } from "../repositories/userRepository.js";
import { signToken } from "../utils/jwt.js";

const SALT_ROUNDS = 10;

/**
 * Custom error type so the controller can distinguish "expected" auth
 * failures (bad input, duplicate email, wrong password) from unexpected
 * server errors and respond with the right HTTP status code.
 */
export class AuthError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.name = "AuthError";
    this.statusCode = statusCode;
  }
}

/**
 * Register a new user.
 * @param {Object} params
 * @param {string} params.name
 * @param {string} params.email
 * @param {string} params.password - plaintext password
 * @returns {Promise<{user: Object, token: string}>}
 */
export async function registerUser({ name, email, password }) {
  if (!name || !email || !password) {
    throw new AuthError("name, email, and password are required", 400);
  }
  if (password.length < 8) {
    throw new AuthError("password must be at least 8 characters", 400);
  }

  const normalizedEmail = email.trim().toLowerCase();

  const existing = await findUserByEmail(normalizedEmail);
  if (existing) {
    throw new AuthError("email is already registered", 409);
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  const user = await createUser({
    name: name.trim(),
    email: normalizedEmail,
    passwordHash,
  });

  const token = signToken({
    id: user.id,
    email: user.email,
    global_role: user.global_role,
  });

  return { user, token };
}

/**
 * Log in an existing user.
 * @param {Object} params
 * @param {string} params.email
 * @param {string} params.password - plaintext password
 * @returns {Promise<{user: Object, token: string}>}
 */
export async function loginUser({ email, password }) {
  if (!email || !password) {
    throw new AuthError("email and password are required", 400);
  }

  const normalizedEmail = email.trim().toLowerCase();

  const userRow = await findUserByEmail(normalizedEmail);
  if (!userRow) {
    throw new AuthError("invalid email or password", 401);
  }

  const passwordMatches = await bcrypt.compare(password, userRow.password_hash);
  if (!passwordMatches) {
    throw new AuthError("invalid email or password", 401);
  }

  const token = signToken({
    id: userRow.id,
    email: userRow.email,
    global_role: userRow.global_role,
  });

  // Strip password_hash before returning to the controller/client.
  const { password_hash, ...user } = userRow;

  return { user, token };
}
