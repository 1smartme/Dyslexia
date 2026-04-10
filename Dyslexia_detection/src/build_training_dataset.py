import os, json
import pandas as pd

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
SESSIONS_DIR = os.path.join(BASE_DIR, "../data/sessions")
OUT_CSV = os.path.join(BASE_DIR, "../data/training_from_sessions.csv")

rows = []

for file in os.listdir(SESSIONS_DIR):
    if not file.endswith(".json"):
        continue

    with open(os.path.join(SESSIONS_DIR, file), "r", encoding="utf-8") as f:
        s = json.load(f)

    try:
        errors_count = len(s.get("errors", []))
        total_q = len(s.get("task_timestamps", [])) // 2
        accuracy = (total_q - errors_count) / total_q if total_q > 0 else None
        reading_speed = s.get("reading_speed_wpm")
        fixation_stats = s.get("fixation_stats", {})
        saccade_stats = s.get("saccade_stats", {})
        regressions = s.get("regressions", {})
        calibration_data = s.get("calibration_data", {})
        device_meta = s.get("device_metadata", {})

        if accuracy is None or reading_speed is None:
            continue

        # Baseline weak label from behavioral thresholds; replace with clinical labels when available.
        presence_of_dyslexia = int(
            accuracy < 0.6 and reading_speed < 100
        )

        rows.append({
            "age": int(s["age"]),
            "grade": int(s["grade"]),
            "language": s.get("language", "en"),
            "device_type": device_meta.get("device_type", "Desktop"),
            "family_history": int(s.get("family_history", 0)),
            "calibration_quality": float(calibration_data.get("calibration_quality", 0.9)),
            "errors_count": errors_count,
            "fixation_mean_dur": fixation_stats.get("mean_duration", 0.0),
            "fixation_count": fixation_stats.get("count", 0),
            "saccade_mean_amp": saccade_stats.get("mean_amplitude", 0.0),
            "regressions_count": regressions.get("count", 0),
            "scanpath_entropy": s.get("scanpath_entropy", 0.0),
            "total_reading_time": float(s.get("total_reading_time_ms", 0)) / 1000.0,
            "presence_of_dyslexia": presence_of_dyslexia
        })

    except Exception as e:
        print(f"Skipping {file}: {e}")

df = pd.DataFrame(rows)
df.to_csv(OUT_CSV, index=False)

print("Dataset built")
print("Rows:", len(df))
print(df.head())
