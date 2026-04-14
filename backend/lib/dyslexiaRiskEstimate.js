/**
 * Lightweight risk estimate from session fields when full ML / gaze is unavailable.
 * Outputs risk_score in ~[0.06, 0.94] and a binary ml_prediction (1 = elevated concern).
 */
function estimateRiskFromSession(payload) {
  const total = Math.max(1, Number(payload.total) || 1);
  const score = Math.max(0, Number(payload.score) || 0);
  const accFromParts = score / total;
  const accRaw = Number(payload.accuracy);
  const acc = Number.isFinite(accRaw)
    ? Math.min(1, Math.max(0, accRaw > 1 ? accRaw / 100 : accRaw))
    : Math.min(1, Math.max(0, accFromParts));

  const wpm = Number(payload.reading_speed_wpm);
  const regCount = Number(payload.regressions?.count ?? payload.regressions_count ?? 0);

  let risk_score = 0.22;
  risk_score += (1 - acc) * 0.48;
  if (Number.isFinite(wpm) && wpm > 0 && wpm < 95) risk_score += 0.1;
  if (regCount > Math.max(2, Math.floor(total * 0.35))) risk_score += 0.08;

  risk_score = Math.min(0.94, Math.max(0.06, risk_score));
  const risk = risk_score >= 0.62 ? "High" : risk_score >= 0.38 ? "Medium" : "Low";
  const ml_prediction = risk_score >= 0.5 ? 1 : 0;

  return { risk, risk_score, ml_prediction };
}

module.exports = { estimateRiskFromSession };
