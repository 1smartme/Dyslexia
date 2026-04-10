const isNonEmptyString = (value) => typeof value === "string" && value.trim().length > 0;
const isFiniteNumber = (value) => typeof value === "number" && Number.isFinite(value);

const validateDyslexiaPayload = (req, res, next) => {
  const payload = req.body;

  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return res.status(400).json({
      error: "Invalid request body",
      details: ["Request body must be a JSON object"],
      code: "VALIDATION_ERROR",
    });
  }

  const errors = [];

  if (!isNonEmptyString(payload.session_id)) {
    errors.push("session_id is required and must be a non-empty string");
  }
  if (!isNonEmptyString(payload.user_id)) {
    errors.push("user_id is required and must be a non-empty string");
  }
  if (!isNonEmptyString(payload.game_type)) {
    errors.push("game_type is required and must be a non-empty string");
  }
  if (!isNonEmptyString(payload.difficulty)) {
    errors.push("difficulty is required and must be a non-empty string");
  }
  if (!isFiniteNumber(payload.score) || payload.score < 0) {
    errors.push("score is required and must be a non-negative number");
  }
  if (!isFiniteNumber(payload.total) || payload.total <= 0) {
    errors.push("total is required and must be a number greater than 0");
  }
  if (!isFiniteNumber(payload.accuracy) || payload.accuracy < 0 || payload.accuracy > 1) {
    errors.push("accuracy is required and must be a number between 0 and 1");
  }

  const expectedAccuracy =
    isFiniteNumber(payload.score) && isFiniteNumber(payload.total) && payload.total > 0
      ? payload.score / payload.total
      : null;

  if (expectedAccuracy !== null && Math.abs(payload.accuracy - expectedAccuracy) > 1e-6) {
    errors.push("accuracy must equal score / total");
  }

  if (
    !payload.fixation_stats ||
    typeof payload.fixation_stats !== "object" ||
    Array.isArray(payload.fixation_stats)
  ) {
    errors.push("fixation_stats is required and must be an object");
  } else if (
    !isFiniteNumber(payload.fixation_stats.mean_duration) ||
    payload.fixation_stats.mean_duration < 0
  ) {
    errors.push("fixation_stats.mean_duration is required and must be a non-negative number");
  }

  if (
    !payload.regressions ||
    typeof payload.regressions !== "object" ||
    Array.isArray(payload.regressions)
  ) {
    errors.push("regressions is required and must be an object");
  } else if (!Number.isInteger(payload.regressions.count) || payload.regressions.count < 0) {
    errors.push("regressions.count is required and must be a non-negative integer");
  }

  if (!isFiniteNumber(payload.reading_speed_wpm) || payload.reading_speed_wpm < 0) {
    errors.push("reading_speed_wpm is required and must be a non-negative number");
  }

  if (errors.length > 0) {
    return res.status(400).json({
      error: "Invalid request body",
      details: errors,
      code: "VALIDATION_ERROR",
    });
  }

  return next();
};

module.exports = validateDyslexiaPayload;

