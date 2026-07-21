// reset-secret.cjs — Reset device_secret MC-0003 untuk testing simulator
const { Pool }  = require("pg");
const bcrypt    = require("bcrypt");
const crypto    = require("crypto");

const pool = new Pool({
  connectionString: "postgres://postgres:arkanharis@localhost:5432/maceration_iot",
});

async function main() {
  const deviceCode = process.argv[2] || "MC-0003";
  const newSecret  = crypto.randomBytes(16).toString("hex");
  const hash       = await bcrypt.hash(newSecret, 10);

  await pool.query(
    "UPDATE devices SET device_secret_hash = $1 WHERE device_code = $2",
    [hash, deviceCode]
  );

  console.log("─".repeat(40));
  console.log("device_code  :", deviceCode);
  console.log("device_secret:", newSecret);
  console.log("─".repeat(40));
  console.log("Gunakan nilai di atas untuk menjalankan simulator:");
  console.log(`  DEVICE_CODE=${deviceCode} DEVICE_SECRET=${newSecret} node tools/device-simulator.mjs`);

  await pool.end();
}

main().catch((e) => { console.error(e.message); process.exit(1); });
