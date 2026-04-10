async function startCamera() {
  const video = document.getElementById("camera");
  if (!video) return;
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    video.srcObject = stream;
    video.play();
  } catch (err) {
    alert("❌ Camera access denied. Please allow camera permission.");
    console.error(err);
  }
}

async function calibrateGaze() {
  return new Promise((resolve) => {
    try {
      webgazer
        .setRegression("ridge")
        .setTracker("clmtrackr")
        .begin()
        .showVideoPreview(true)
        .showPredictionPoints(true);

      // simulate 5-second calibration
      setTimeout(() => {
        webgazer.showVideoPreview(false);
        resolve(true);
      }, 5000);
    } catch (e) {
      console.error("Calibration error:", e);
      resolve(false);
    }
  });
}

function startGazeTracking(gazeArray) {
  webgazer.setGazeListener((data, timestamp) => {
    if (data) {
      gazeArray.push({
        x: data.x,
        y: data.y,
        t: timestamp,
      });
    }
  });
}
