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
