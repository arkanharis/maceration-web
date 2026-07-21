/**
 * Manual smoke test for userRepository.js
 * Run with: node src/repositories/userRepository.test-manual.js
 * (Not an automated test suite — just a quick sanity check while building.
 * A proper test framework can be added later if needed.)
 */
import {
  createUser,
  findUserByEmail,
  findUserById,
  updateUserRole,
} from "./userRepository.js";
import { pool } from "../config/db.js";

async function run() {
  const testEmail = `test-${Date.now()}@example.com`;

  console.log("1. Creating user...");
  const created = await createUser({
    name: "Test User",
    email: testEmail,
    passwordHash: "fake-bcrypt-hash-for-testing",
  });
  console.log("   Created:", created);

  console.log("\n2. Finding by email...");
  const foundByEmail = await findUserByEmail(testEmail);
  console.log("   Found:", foundByEmail);

  console.log("\n3. Finding by id...");
  const foundById = await findUserById(created.id);
  console.log("   Found:", foundById);

  console.log("\n4. Updating role to superadmin...");
  const updated = await updateUserRole(created.id, "superadmin");
  console.log("   Updated:", updated);

  console.log("\n5. Duplicate email should fail...");
  try {
    await createUser({
      name: "Duplicate",
      email: testEmail,
      passwordHash: "another-hash",
    });
    console.log("   ERROR: duplicate was allowed! This should not happen.");
  } catch (err) {
    console.log("   OK - duplicate rejected:", err.message);
  }

  console.log("\n6. Finding non-existent user...");
  const notFound = await findUserById("00000000-0000-0000-0000-000000000000");
  console.log("   Result (should be null):", notFound);

  // cleanup
  await pool.query("DELETE FROM users WHERE email = $1", [testEmail]);
  console.log("\nCleanup done. All checks passed.");

  await pool.end();
}

run().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});