import bcrypt from "bcrypt";
import { createUser, findUserByEmail, findUserById, updateUserProfile } from "../repositories/userRepository.js";
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

/**
 * Update logged-in user's own profile (name and/or password).
 */
export async function updateUserSelf({ userId, name, currentPassword, newPassword }) {
  const hasNameChange = name !== undefined && name.trim().length > 0;
  const hasPasswordChange = newPassword !== undefined;

  if (!hasNameChange && !hasPasswordChange) {
    throw new AuthError("at least one field (name or newPassword) is required", 400);
  }

  const userRow = await findUserByEmail(
    (await findUserById(userId))?.email
  );
  if (!userRow) throw new AuthError("user not found", 404);

  let passwordHash;
  if (hasPasswordChange) {
    if (!currentPassword) {
      throw new AuthError("current_password is required to change password", 400);
    }
    if (newPassword.length < 8) {
      throw new AuthError("new password must be at least 8 characters", 400);
    }
    const matches = await bcrypt.compare(currentPassword, userRow.password_hash);
    if (!matches) throw new AuthError("current_password is incorrect", 401);
    passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
  }

  return updateUserProfile(userId, {
    name: hasNameChange ? name.trim() : undefined,
    passwordHash,
  });
}
