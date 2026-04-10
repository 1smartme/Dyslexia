from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, ConfigDict, Field, ValidationError, field_validator, model_validator
import json
import os
import csv
from datetime import datetime
import sys
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(BASE_DIR))

try:
    from process_gaze import derive_features_from_session
except ImportError:
    print("Warning: Could not import process_gaze. Using basic feature extraction.")
    derive_features_from_session = None

try:
    from ml_detector import get_detector
    ml_detector = get_detector()
    if not getattr(ml_detector, "is_loaded", False):
        raise RuntimeError(
            "ML model was not loaded. Train the model first using: python src/train_model.py"
        )
    print("ML detector initialized")
except ImportError as e:
    print(f"Warning: Could not import ML detector: {e}")
    ml_detector = None

try:
    from db import get_connection
except ImportError:
    get_connection = None

app = FastAPI(title="Dyslexia Detection API")


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/static", StaticFiles(directory="src/web"), name="static")

RESULTS_DIR = "data/results"
SESSIONS_DIR = "data/sessions"
os.makedirs(RESULTS_DIR, exist_ok=True)
os.makedirs(SESSIONS_DIR, exist_ok=True)

class GazePoint(BaseModel):
    model_config = ConfigDict(extra="forbid")

    x: float
    y: float
    timestamp: float = Field(ge=0)


class FixationStats(BaseModel):
    model_config = ConfigDict(extra="allow")

    mean_duration: float = Field(ge=0)
    count: int | None = Field(default=None, ge=0)


class RegressionStats(BaseModel):
    model_config = ConfigDict(extra="allow")

    count: int = Field(ge=0)


class DyslexiaSessionData(BaseModel):
    model_config = ConfigDict(extra="allow")

    session_id: str
    user_id: str
    game_type: str
    difficulty: str
    score: int = Field(ge=0)
    total: int = Field(gt=0)
    accuracy: float
    gaze_stream: list[GazePoint]
    fixation_stats: FixationStats
    regressions: RegressionStats
    reading_speed_wpm: float = Field(ge=0)
    timestamp: datetime

    @field_validator("session_id", "user_id", "game_type", "difficulty")
    @classmethod
    def validate_non_empty_string(cls, value: str) -> str:
        if not value or not value.strip():
            raise ValueError("must be a non-empty string")
        return value.strip()

    @field_validator("accuracy")
    @classmethod
    def validate_accuracy_range(cls, value: float) -> float:
        if not 0 <= value <= 1:
            raise ValueError("accuracy must be between 0 and 1")
        return value

    @field_validator("gaze_stream")
    @classmethod
    def validate_gaze_stream(cls, value: list[GazePoint]) -> list[GazePoint]:
        if not value:
            raise ValueError("gaze_stream must not be empty")
        return value

    @model_validator(mode="after")
    def validate_accuracy_matches_score(self):
        expected_accuracy = self.score / self.total
        if abs(self.accuracy - expected_accuracy) > 1e-6:
            raise ValueError("accuracy must equal score / total")
        return self

@app.get("/")
def root():
    return {"message": "Welcome to the Dyslexia Detection API 🚀"}

@app.get("/list-results")
def list_results(request: Request):
    if request.headers.get("X-Admin") != "true":
        raise HTTPException(status_code=403, detail="Admin access only")

    results = []

    for fname in os.listdir(RESULTS_DIR):
        if not fname.endswith(".json"):
            continue
        try:
            with open(os.path.join(RESULTS_DIR, fname), "r", encoding="utf-8") as f:
                data = json.load(f)
            
            ml_detection = data.get("ml_detection", {})
            
            results.append({
                "name": data.get("name", "Unknown"),
                "age": data.get("age", "-"),
                "grade": data.get("grade", "-"),
                "correct": data.get("score", 0),
                "total": data.get("total", 10),
                "risk": data.get("risk", "Unknown"),
                "risk_score": ml_detection.get("risk_score"),
                "confidence": ml_detection.get("confidence"),
                "method": ml_detection.get("method", "unknown"),
                "detection_method": ml_detection.get("method", "unknown"),
                "timestamp": data.get("timestamp", ""),
                "date": data.get("timestamp", ""),
                "session_id": data.get("session_id", ""),
                "file": fname
            })
        except Exception as e:
            print(f"Skipping {fname}: {e}")

    results.sort(key=lambda x: x.get("timestamp", ""), reverse=True)
    
    return results

@app.get("/result/{file_name}")
def get_result(file_name: str, request: Request):
    is_admin = (
        request.headers.get("X-Admin") == "true" or 
        request.query_params.get("X-Admin") == "true"
    )
    if not is_admin:
        raise HTTPException(status_code=403, detail="Admin access only")

    if "/" in file_name or "\\" in file_name:
        raise HTTPException(status_code=400, detail="Invalid file name")

    fpath = os.path.join(RESULTS_DIR, file_name)
    if not os.path.exists(fpath):
        raise HTTPException(status_code=404, detail="File not found")

    try:
        with open(fpath, "r", encoding="utf-8") as f:
            data = json.load(f)
    except Exception:
        raise HTTPException(status_code=500, detail="Could not read report")

    return data

def calculate_risk_with_ml(payload):
    """
    Advanced ML-based risk detection using Gradient Boosting Classifier.
    Falls back to rule-based system if ML model unavailable.
    Returns: {
        'risk': 'High'|'Medium'|'Low',
        'risk_score': float (0-1),
        'confidence': float (0-1),
        'method': 'ml'|'fallback',
        'prediction': int (0=No, 1=Yes)
    }
    """
    if ml_detector:
        try:
            result = ml_detector.predict(payload)
            return result
        except Exception as e:
            print(f"Error in ML prediction: {e}, using fallback")
    
    if ml_detector:
        return ml_detector._fallback_prediction(payload)
    else:
        # Ultimate fallback if ML detector not available
        accuracy = (payload.get("score", 0) / payload.get("total", 1)) * 100 if payload.get("total", 1) > 0 else 0
        risk_score = 0.7 if accuracy < 50 else (0.4 if accuracy < 75 else 0.2)
        risk = "High" if risk_score >= 0.7 else ("Medium" if risk_score >= 0.4 else "Low")
        return {
            'risk': risk,
            'risk_score': risk_score,
            'confidence': 0.5,
            'method': 'fallback',
            'prediction': 1 if risk_score >= 0.5 else 0
        }

@app.post("/save-data")
async def save_data(req: Request):
    try:
        raw_payload = await req.json()
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid JSON")

    try:
        validated_payload = DyslexiaSessionData.model_validate(raw_payload)
    except ValidationError as exc:
        raise HTTPException(status_code=400, detail=exc.errors())

    print("[save-data] validated payload", validated_payload.model_dump(mode="json"))

    payload = validated_payload.model_dump(mode="json")
    name = raw_payload.get("name", "Unknown")
    age = raw_payload.get("age", "N/A")
    grade = raw_payload.get("grade", "N/A")
    score = validated_payload.score
    total = validated_payload.total
    accuracy = validated_payload.accuracy * 100
    session_id = validated_payload.session_id

    timestamp = validated_payload.timestamp.strftime("%Y-%m-%d %H:%M:%S")
    session_timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    db_inserted = False

    
    print(f"\n{'='*60}")
    print(f"ASSESSMENT DETECTION - Session: {session_id}")
    print(f"Name: {name}, Age: {age}, Grade: {grade}")
    print(f"Score: {score}/{total} = {accuracy:.1f}% accuracy")
    print(f"Errors: {len(payload.get('errors', []))}")
    print(f"Fixation Duration: {payload.get('fixation_stats', {}).get('mean_duration', 0):.1f}ms")
    print(f"Regressions: {payload.get('regressions', {}).get('count', 0)}")
    print(f"Reading Speed: {payload.get('reading_speed_wpm', 0):.1f} WPM")
    print(f"{'='*60}\n")
    
    ml_result = calculate_risk_with_ml(payload)
    risk = ml_result.get('risk', 'Medium')
    risk_score = ml_result.get('risk_score', 0.5)
    confidence = ml_result.get('confidence', 0.5)
    detection_method = ml_result.get('method', 'fallback')
    prediction = ml_result.get('prediction', 0)
    feature_importance = ml_result.get('feature_importance', {})
    reason = ml_result.get('reason', 'ML/Statistical analysis')
    
    print(f"RESULT: Risk={risk}, Score={risk_score:.3f}, Confidence={confidence:.3f}, Method={detection_method}")
    if reason:
        print(f"Reason: {reason}")
    print(f"{'='*60}\n")

   
    session_filename = f"session_{session_timestamp}.json"
    session_filepath = os.path.join(SESSIONS_DIR, session_filename)
    
    session_data = {
        "session_id": session_id,
        "timestamp": timestamp,
        "session_timestamp": session_timestamp,
        "name": name,
        "age": age,
        "grade": grade,
        
        "gaze_stream": payload.get("gaze_stream", []),
        "fixations": payload.get("fixations", []),
        "saccades": payload.get("saccades", []),
        "regressions": payload.get("regressions", {}),
        "interaction_events": payload.get("interaction_events", []),
        "task_timestamps": payload.get("task_timestamps", []),
        "errors": payload.get("errors", []),
        

        "device_metadata": payload.get("device_metadata", {}),
        "calibration_data": payload.get("calibration_data", {}),
        "language": payload.get("language", "en"),
        
        "fixation_stats": payload.get("fixation_stats", {}),
        "saccade_stats": payload.get("saccade_stats", {}),
        "scanpath_entropy": payload.get("scanpath_entropy", 0),
        "reading_speed_wpm": payload.get("reading_speed_wpm", 0),
        "total_reading_time_ms": payload.get("total_reading_time_ms", 0),
        
        "ml_detection": {
            "risk": risk,
            "risk_score": risk_score,
            "confidence": confidence,
            "method": detection_method,
            "prediction": prediction,
            "feature_importance": feature_importance
        }
    }
    
    
    with open(session_filepath, "w", encoding="utf-8") as f:
        json.dump(session_data, f, indent=2)

  
    filename = f"{session_id}.json"
    filepath = os.path.join(RESULTS_DIR, filename)

    server_derived_features = None
    if derive_features_from_session:
        try:
            session_data_for_processing = {
                "session_id": session_id,
                "gaze_stream": payload.get("gaze_stream", []),
                "task_timestamps": payload.get("task_timestamps", []),
                "errors": payload.get("errors", []),
                "meta": payload.get("device_metadata", {})
            }
            server_derived_features = derive_features_from_session(session_data_for_processing)
        except Exception as e:
            print(f"Warning: Could not compute server-side features: {e}")

    final_data = {
        "session_id": session_id,
        "session_file": session_filename,  # Reference to full session data
        "name": name,
        "age": age,
        "grade": grade,
        "score": score,
        "total": total,
        "accuracy": accuracy,
        "risk": risk,
        "timestamp": timestamp,
        "server_timestamp": datetime.now().isoformat(),
        
        "ml_detection": {
            "risk": risk,
            "risk_score": risk_score,
            "confidence": confidence,
            "method": detection_method,
            "prediction": prediction,
            "feature_importance": feature_importance,
            "reason": reason,
            "assessment_summary": {
                "score": score,
                "total": total,
                "accuracy_percent": accuracy,
                "errors_count": len(payload.get("errors", [])),
                "fixation_mean_dur_ms": payload.get("fixation_stats", {}).get("mean_duration", 0),
                "regressions_count": payload.get("regressions", {}).get("count", 0),
                "reading_speed_wpm": payload.get("reading_speed_wpm", 0),
                "scanpath_entropy": payload.get("scanpath_entropy", 0)
            }
        },
        
        "fixation_stats": payload.get("fixation_stats", {}),
        "saccade_stats": payload.get("saccade_stats", {}),
        "regressions": payload.get("regressions", {}),
        "scanpath_entropy": payload.get("scanpath_entropy", 0),
        "reading_speed_wpm": payload.get("reading_speed_wpm", 0),
        "total_reading_time_ms": payload.get("total_reading_time_ms", 0),
        "errors_count": len(payload.get("errors", [])),
        
        # metadata
        "device_type": payload.get("device_metadata", {}).get("device_type", "Unknown"),
        "screen_resolution": f"{payload.get('device_metadata', {}).get('screen_width', 0)}x{payload.get('device_metadata', {}).get('screen_height', 0)}",
        "language": payload.get("language", "en"),
        
        # Server-side derived features (for validation)
        "server_derived_features": server_derived_features
    }

    with open(filepath, "w", encoding="utf-8") as f:
        json.dump(final_data, f, indent=2)

    CSV_FILE = os.path.join(RESULTS_DIR, "all_results.csv")
    file_exists = os.path.exists(CSV_FILE)

    fixation_stats = payload.get("fixation_stats", {})
    saccade_stats = payload.get("saccade_stats", {})
    regressions = payload.get("regressions", {})

    with open(CSV_FILE, "a", newline="", encoding="utf-8") as csvfile:
        writer = csv.writer(csvfile)
        if not file_exists:
            writer.writerow([
                "session_id", "name", "age", "grade", "score", "total", "accuracy", "risk",
                "risk_score", "confidence", "detection_method", "fixation_mean_dur", "fixation_count",
                "regressions_count", "reading_speed_wpm", "scanpath_entropy", "saccade_mean_amp",
                "total_reading_time_ms", "timestamp"
            ])
        writer.writerow([
            session_id,
            name,
            age,
            grade,
            score,
            total,
            round(accuracy, 2),
            risk,
            round(risk_score, 3),
            round(confidence, 3),
            detection_method,
            round(fixation_stats.get("mean_duration", 0), 2),
            fixation_stats.get("count", 0),
            regressions.get("count", 0),
            round(payload.get("reading_speed_wpm", 0), 2),
            round(payload.get("scanpath_entropy", 0), 3),
            round(saccade_stats.get("mean_amplitude", 0), 4),
            payload.get("total_reading_time_ms", 0),
            timestamp
        ])
    
    # Optional: per-student CSV (enhanced)
    student_csv = os.path.join(RESULTS_DIR, f"{name.replace(' ', '_')}_results.csv")
    file_exists_student = os.path.exists(student_csv)
    with open(student_csv, "a", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        if not file_exists_student:
            writer.writerow([
                "session_id", "score", "total", "accuracy", "risk", "fixation_mean_dur",
                "regressions_count", "reading_speed_wpm", "timestamp"
            ])
        writer.writerow([
            session_id, score, total, round(accuracy, 2), risk,
            round(fixation_stats.get("mean_duration", 0), 2),
            regressions.get("count", 0),
            round(payload.get("reading_speed_wpm", 0), 2),
            timestamp
        ])

    # Postgres persistence (non-blocking for existing flow).
    if get_connection:
        conn = None
        cur = None
        try:
            conn = get_connection()
            cur = conn.cursor()
            cur.execute("""
            INSERT INTO dyslexia_sessions (
                session_id, user_id, game_type, difficulty, score, total,
                accuracy, fixation_mean_dur, regressions_count, reading_speed_wpm, risk, timestamp
            )
            VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
            ON CONFLICT (session_id) DO UPDATE SET
                user_id = EXCLUDED.user_id,
                game_type = EXCLUDED.game_type,
                difficulty = EXCLUDED.difficulty,
                score = EXCLUDED.score,
                total = EXCLUDED.total,
                accuracy = EXCLUDED.accuracy,
                fixation_mean_dur = EXCLUDED.fixation_mean_dur,
                regressions_count = EXCLUDED.regressions_count,
                reading_speed_wpm = EXCLUDED.reading_speed_wpm,
                risk = EXCLUDED.risk,
                timestamp = EXCLUDED.timestamp
            """, (
                session_id,
                validated_payload.user_id,
                validated_payload.game_type,
                validated_payload.difficulty,
                score,
                total,
                validated_payload.accuracy,
                validated_payload.fixation_stats.mean_duration,
                validated_payload.regressions.count,
                validated_payload.reading_speed_wpm,
                risk,
                validated_payload.timestamp
            ))
            conn.commit()
            db_inserted = True
            print(f"[save-data] DB insert success for session_id={session_id}")
        except Exception as db_error:
            print(f"Warning: Failed to insert result into Postgres: {db_error}")
        finally:
            if cur:
                cur.close()
            if conn:
                conn.close()

    return {
        "message": "Assessment saved successfully",
        "file": filename,
        "session_file": session_filename,
        "db_saved": db_inserted,
        "risk": risk,
        "risk_score": risk_score,
        "confidence": confidence,
        "detection_method": detection_method,
        "ml_prediction": prediction
    }

@app.get("/my-result/{session_id}")
def get_my_result(session_id: str):
    if not get_connection:
        raise HTTPException(status_code=500, detail="Database connection is not configured")

    conn = None
    cur = None
    try:
        conn = get_connection()
        cur = conn.cursor()
        cur.execute(
            """
            SELECT session_id, user_id, game_type, difficulty,
                   score, total, accuracy,
                   fixation_mean_dur, regressions_count,
                   reading_speed_wpm, risk, timestamp
            FROM dyslexia_sessions
            WHERE session_id = %s
            """,
            (session_id,),
        )
        row = cur.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Result not found")

        columns = [desc[0] for desc in cur.description]
        result = dict(zip(columns, row))
        if isinstance(result.get("timestamp"), datetime):
            result["timestamp"] = result["timestamp"].isoformat()
        return result
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Failed to fetch result: {exc}")
    finally:
        if cur:
            cur.close()
        if conn:
            conn.close()
