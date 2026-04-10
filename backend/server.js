const express = require("express");
const cors = require("cors");
const axios = require("axios");
const { Pool } = require("pg");
const validateDyslexiaPayload = require("./middleware/validateDyslexiaPayload");
require("dotenv").config();

const app = express();
const ML_API_URL = process.env.ML_API_URL || "http://localhost:8000";
const ML_TIMEOUT_MS = Number(process.env.ML_TIMEOUT_MS || 10000);
const pgPool = new Pool({
  host: process.env.POSTGRES_HOST || "localhost",
  port: Number(process.env.POSTGRES_PORT || 5432),
  user: process.env.POSTGRES_USER || "postgres",
  password: process.env.POSTGRES_PASSWORD || "yourpassword",
  database: process.env.POSTGRES_DB || "dyslexia_db",
});

const buildErrorResponse = (error, details, code) => ({
  error,
  details,
  code,
});

app.use(cors());
app.use(express.json());

app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/scores", require("./routes/scoreRoutes"));
app.use("/api/progress", require("./routes/progressRoutes"));

app.post("/api/dyslexia/analyze", validateDyslexiaPayload, async (req, res) => {
  const requestId = `dys-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
  const startedAt = Date.now();
  console.info(`[${requestId}] received payload`, req.body);

  try {
    const mlResponse = await axios.post(`${ML_API_URL}/save-data`, req.body, {
      headers: { "Content-Type": "application/json" },
      timeout: ML_TIMEOUT_MS,
    });
    const latencyMs = Date.now() - startedAt;
    console.info(`[${requestId}] /api/dyslexia/analyze 200 ${latencyMs}ms`);
    console.info(`[${requestId}] forwarded to ${ML_API_URL}/save-data`, mlResponse.data);
    if (mlResponse?.data?.db_saved) {
      console.info(`[${requestId}] Saved to DB`);
    }

    return res.status(200).json(mlResponse.data);
  } catch (error) {
    const latencyMs = Date.now() - startedAt;

    if (error.response) {
      console.error(
        `[${requestId}] /api/dyslexia/analyze ${error.response.status} ${latencyMs}ms upstream_error`
      );
      return res.status(error.response.status).json({
        ...buildErrorResponse(
          "ML backend request failed",
          error.response.data,
          "ML_BACKEND_ERROR"
        ),
      });
    }

    if (error.code === "ECONNABORTED") {
      console.error(`[${requestId}] /api/dyslexia/analyze 504 ${latencyMs}ms timeout`);
      return res.status(504).json(
        buildErrorResponse(
          "ML backend timeout",
          `Timed out after ${ML_TIMEOUT_MS}ms`,
          "ML_TIMEOUT"
        )
      );
    }

    if (error.request || error.code === "ECONNREFUSED") {
      console.error(`[${requestId}] /api/dyslexia/analyze 502 ${latencyMs}ms unreachable`);
      return res.status(502).json({
        ...buildErrorResponse("ML backend unreachable", error.message, "ML_UNREACHABLE"),
      });
    }

    console.error(`[${requestId}] /api/dyslexia/analyze 500 ${latencyMs}ms internal_error`);
    return res.status(500).json({
      ...buildErrorResponse(
        "Failed to process dyslexia analysis request",
        error.message,
        "INTERNAL_ERROR"
      ),
    });
  }
});

app.get("/api/dyslexia/health", async (_req, res) => {
  try {
    const response = await axios.get(`${ML_API_URL}/`, { timeout: 3000 });
    return res.status(200).json({
      ok: true,
      mlUrl: ML_API_URL,
      mlStatus: response.status,
    });
  } catch (error) {
    return res.status(503).json({
      ok: false,
      mlUrl: ML_API_URL,
      error: "ML health check failed",
      details: error.message,
      code: "ML_HEALTHCHECK_FAILED",
    });
  }
});

app.get("/api/dyslexia/sessions/:userId", async (req, res) => {
  const { userId } = req.params;
  if (!userId || !String(userId).trim()) {
    return res.status(400).json(
      buildErrorResponse("Invalid user ID", "userId is required", "VALIDATION_ERROR")
    );
  }

  try {
    const query = `
      SELECT *
      FROM dyslexia_sessions
      WHERE user_id = $1
      ORDER BY "timestamp" DESC
    `;
    const result = await pgPool.query(query, [userId]);
    const sessions = result.rows || [];
    return res.status(200).json({
      latest: sessions[0] || null,
      sessions,
    });
  } catch (error) {
    console.error("[/api/dyslexia/sessions/:userId] query error:", error.message);
    return res.status(500).json(
      buildErrorResponse("Failed to fetch dyslexia session", error.message, "DB_ERROR")
    );
  }
});

app.listen(5000, () => {
  console.log("Server running on http://localhost:5000");
});
