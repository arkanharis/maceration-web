import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const { Pool } = pg;

const isProduction =
  process.env.NODE_ENV === "production" ||
  process.env.DATABASE_URL?.includes("render.com") ||
  process.env.DATABASE_URL?.includes("sslmode=require");

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: isProduction ? { rejectUnauthorized: false } : false,
});

pool.on("error", (err) => {
  console.error("Unexpected PostgreSQL client error", err);
});

export default pool;
