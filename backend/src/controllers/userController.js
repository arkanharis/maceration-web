import { findUserById } from "../repositories/userRepository.js";

export async function getUserById(req, res) {
  try {
    const user = await findUserById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: "Pengguna tidak ditemukan." });
    }
    return res.status(200).json({ user });
  } catch (err) {
    console.error("[userController.getUserById]", err);
    return res.status(500).json({ error: "internal server error" });
  }
}
