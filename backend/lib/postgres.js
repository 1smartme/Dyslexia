const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
  host: process.env.POSTGRES_HOST || process.env.DB_HOST || "localhost",
  port: Number(process.env.POSTGRES_PORT || process.env.DB_PORT || 5432),
  user: process.env.POSTGRES_USER || process.env.DB_USER || "postgres",
  password: process.env.POSTGRES_PASSWORD || process.env.DB_PASSWORD || process.env.DB_PASS || "yourpassword",
  database: process.env.POSTGRES_DB || process.env.DB_NAME || "dyslexia_db",
  max: 10,
});

module.exports = pool;
