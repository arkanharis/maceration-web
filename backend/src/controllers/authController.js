import { registerUser, loginUser, loginWithGoogle, registerWithGoogle, updateUserSelf, AuthError } from "../services/authService.js";

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

export async function googleAuth(req, res) {
  try {
    const { id_token, action } = req.body || {};
    if (action === "register") {
      const { user, token } = await registerWithGoogle({ idToken: id_token });
      return res.status(200).json({ user, token });
    }

    const { user, token } = await loginWithGoogle({ idToken: id_token });
    return res.status(200).json({ user, token });
  } catch (err) {
    if (err instanceof AuthError) {
      const payload = { error: err.message };
      if (err.errorCode) payload.errorCode = err.errorCode;
      return res.status(err.statusCode).json(payload);
    }
    console.error("[authController.googleAuth]", err);
    return res.status(500).json({ error: "internal server error" });
  }
}

export async function me(req, res) {
  return res.status(200).json({ user: req.user });
}

export async function logout(req, res) {
  return res.status(200).json({ message: "logged out successfully" });
}

export async function updateMe(req, res) {
  try {
    const { name, current_password, new_password } = req.body || {};
    const user = await updateUserSelf({
      userId: req.user.id,
      name,
      currentPassword: current_password,
      newPassword: new_password,
    });
    return res.status(200).json({ user });
  } catch (err) {
    if (err instanceof AuthError) {
      return res.status(err.statusCode).json({ error: err.message });
    }
    console.error("[authController.updateMe]", err);
    return res.status(500).json({ error: "internal server error" });
  }
}
