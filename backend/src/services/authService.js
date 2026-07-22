import bcrypt from "bcrypt";
import { OAuth2Client } from "google-auth-library";
import {
  createUser,
  findUserByEmail,
  findUserByGoogleId,
  findUserById,
  updateUserProfile,
  linkGoogleId,
} from "../repositories/userRepository.js";
import { signToken } from "../utils/jwt.js";

const SALT_ROUNDS = 10;

function getGoogleClient() {
  const googleClientId = process.env.GOOGLE_CLIENT_ID;
  if (!googleClientId) {
    throw new AuthError("Google client ID is not configured on backend", 500);
  }
  return new OAuth2Client(googleClientId);
}

/**
 * Custom error type so the controller can distinguish "expected" auth
 * failures (bad input, duplicate email, wrong password) from unexpected
 * server errors and respond with the right HTTP status code.
 */
export class AuthError extends Error {
  constructor(message, statusCode = 400, errorCode = null) {
    super(message);
    this.name = "AuthError";
    this.statusCode = statusCode;
    this.errorCode = errorCode;
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
  if (!userRow || !userRow.password_hash) {
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

export async function loginWithGoogle({ idToken }) {
  if (!idToken) {
    throw new AuthError("id_token is required", 400);
  }

  let ticket;
  try {
    ticket = await getGoogleClient().verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
  } catch (err) {
    console.error("[authService.loginWithGoogle] token verification failed", err);
    throw new AuthError("invalid Google ID token", 401);
  }

  const payload = ticket.getPayload();
  if (!payload?.email_verified) {
    throw new AuthError("Google account email must be verified", 401);
  }

  const email = payload.email.trim().toLowerCase();
  const name = payload.name || payload.email.split("@")[0];
  const googleId = payload.sub;

  let user = await findUserByGoogleId(googleId);
  if (!user) {
    throw new AuthError("google_account_not_registered", 401, "GOOGLE_ACCOUNT_NOT_REGISTERED");
  }

  const token = signToken({
    id: user.id,
    email: user.email,
    global_role: user.global_role,
  });

  const { password_hash, ...userData } = user;
  return { user: userData, token };
}

export async function registerWithGoogle({ idToken }) {
  if (!idToken) {
    throw new AuthError("id_token is required", 400);
  }

  let ticket;
  try {
    ticket = await getGoogleClient().verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
  } catch (err) {
    console.error("[authService.registerWithGoogle] token verification failed", err);
    throw new AuthError("invalid Google ID token", 401);
  }

  const payload = ticket.getPayload();
  if (!payload?.email_verified) {
    throw new AuthError("Google account email must be verified", 401);
  }

  const normalizedEmail = payload.email.trim().toLowerCase();
  const name = payload.name || normalizedEmail.split("@")[0];
  const googleId = payload.sub;

  const existingByEmail = await findUserByEmail(normalizedEmail);
  if (existingByEmail && !existingByEmail.google_id) {
    await linkGoogleId(existingByEmail.id, googleId);
    const user = await findUserById(existingByEmail.id);
    const token = signToken({
      id: user.id,
      email: user.email,
      global_role: user.global_role,
    });
    const { password_hash, ...userData } = user;
    return { user: userData, token };
  }

  if (existingByEmail && existingByEmail.google_id && existingByEmail.google_id !== googleId) {
    throw new AuthError("email already registered with another Google account", 409);
  }

  if (existingByEmail && existingByEmail.google_id === googleId) {
    const token = signToken({
      id: existingByEmail.id,
      email: existingByEmail.email,
      global_role: existingByEmail.global_role,
    });
    const { password_hash, ...userData } = existingByEmail;
    return { user: userData, token };
  }

  const user = await createUser({
    name: name.trim(),
    email: normalizedEmail,
    passwordHash: null,
    googleId,
  });

  const token = signToken({
    id: user.id,
    email: user.email,
    global_role: user.global_role,
  });

  const { password_hash, ...userData } = user;
  return { user: userData, token };
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
    if (newPassword.length < 8) {
      throw new AuthError("new password must be at least 8 characters", 400);
    }

    if (userRow.password_hash) {
      if (!currentPassword) {
        throw new AuthError("current_password is required to change password", 400);
      }
      const matches = await bcrypt.compare(currentPassword, userRow.password_hash);
      if (!matches) throw new AuthError("current_password is incorrect", 401);
    }

    passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
  }

  return updateUserProfile(userId, {
    name: hasNameChange ? name.trim() : undefined,
    passwordHash,
  });
}
