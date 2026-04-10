import requests
import random
import uuid

# ---------------------------------
# Configuration
# ---------------------------------
API_URL = "http://127.0.0.1:8000/save-data"
RESULT_URL = "http://127.0.0.1:8000/my-result"

# Simulate gaze data (x, y, timestamp)
def generate_fake_gaze_stream(num_points=50):
    gaze_stream = []
    ts = 0.0
    x, y = 100, 200  # starting position

    for _ in range(num_points):
        # Random small movement
        x += random.uniform(-5, 5)
        y += random.uniform(-5, 5)
        ts += random.uniform(0.05, 0.15)  # time increment in seconds
        gaze_stream.append([x, y, ts])

    return gaze_stream

# ---------------------------------
# Simulate student/session info
# ---------------------------------
session_id = f"smoke_{uuid.uuid4().hex[:12]}"
payload = {
    "session_id": session_id,
    "gaze_stream": generate_fake_gaze_stream(50),
    "name": "Smoke Test",
    "age": 10,
    "grade": 5,
    "score": 2,
    "total": 4,
    "errors": [{"question_id": 1}, {"question_id": 2}],
    "fixation_stats": {"mean_duration": 180.0, "count": 10},
    "saccade_stats": {"mean_amplitude": 0.03, "mean_velocity": 0.9},
    "regressions": {"count": 1},
    "scanpath_entropy": 2.1,
    "reading_speed_wpm": 130.0,
    "total_reading_time_ms": 8500,
    "task_timestamps": [{"event": "start", "t": 1}, {"event": "end", "t": 8501}],
    "interaction_events": [],
    "language": "en",
    "device_metadata": {"device_type": "Desktop", "screen_width": 1920, "screen_height": 1080},
    "calibration_data": {"calibration_quality": 0.95}
}

# ---------------------------------
# Send request to FastAPI server
# ---------------------------------
response = requests.post(API_URL, json=payload)

# Print results
if response.status_code == 200:
    print("Server response:")
    print(response.json())
    result_response = requests.get(f"{RESULT_URL}/{session_id}")
    if result_response.status_code == 200:
        print("Smoke check: result retrieval succeeded")
    else:
        print("Smoke check failed:", result_response.status_code, result_response.text)
else:
    print("Request failed:", response.status_code, response.text)
