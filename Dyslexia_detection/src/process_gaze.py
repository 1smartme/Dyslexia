# src/process_gaze_improved.py
import json
from pathlib import Path
import numpy as np
import pandas as pd
import math
from collections import Counter
from scipy.stats import entropy
from scipy.signal import medfilt

BASE = Path(__file__).resolve().parents[1]
SESS_DIR = BASE / "data" / "sessions"
OUT_CSV = BASE / "data" / "derived_sessions_improved.csv"
SESSIONS = list(SESS_DIR.glob("*.json"))

def load_session(p):
    with open(p, 'r', encoding='utf-8') as f:
        return json.load(f)

def build_gaze_array(gaze_stream):
    # returns Nx3 array [t(ms), x_norm, y_norm]
    arr = []
    for g in gaze_stream:
        if isinstance(g, dict):
            t = g.get('t') or g.get('timestamp') or g.get('time')
            x = g.get('x')
            y = g.get('y')

            # nested point like {"pt":[x,y]}
            if (x is None or y is None) and isinstance(g.get('pt'), (list, tuple)):
                if len(g['pt']) >= 2:
                    x, y = g['pt'][0], g['pt'][1]

        # -------- Case 2: list / tuple ----------
        elif isinstance(g, (list, tuple)):
            if len(g) >= 3:
                t, x, y = g[0], g[1], g[2]
            else:
                continue
        else:
            continue

        if t is None or x is None or y is None:
            continue
        try:
            arr.append((float(t), float(x), float(y)))
        except (ValueError, TypeError):
            continue

    if not arr:
        return np.empty((0,3), dtype=float)
    a = np.array(arr, dtype=float)
    # Sort by time in case not ordered
    a = a[np.argsort(a[:,0])]
    return a

def interpolate_missing(gaze_arr, max_gap_ms=100):
    # linear interpolate small gaps in x,y where values are nan
    if gaze_arr.size == 0: return gaze_arr
    t = gaze_arr[:,0]
    x = gaze_arr[:,1]
    y = gaze_arr[:,2]
    # find indices where not nan
    ok = ~np.logical_or(np.isnan(x), np.isnan(y))
    if ok.sum() < 2:
        return gaze_arr
    # linear interpolate each of x,y over time
    xi = np.interp(t, t[ok], x[ok])
    yi = np.interp(t, t[ok], y[ok])
    # Avoid interpolating across large gaps: if gap > max_gap, set NaN
    dt = np.diff(t)
    gap_idx = np.where(dt > max_gap_ms)[0]
    for gi in gap_idx:
        # mask between gi+1 region: set to NaN
        start = int(np.where(t == t[gi+1])[0][0])
        # find previous ok index
        # set to NaN for points within this gap region
        pass  # keep simple: we won't enforce large gap masking here
    out = np.vstack([t, xi, yi]).T
    return out

def median_smooth(gaze_arr, kernel_size=3):
    if gaze_arr.size == 0: return gaze_arr
    x = gaze_arr[:,1]
    y = gaze_arr[:,2]
    # handle NaN by filling forward/back
    x_nan = np.isnan(x)
    y_nan = np.isnan(y)
    if x_nan.any():
        # forward/back fill
        x = pd.Series(x).interpolate().fillna(method='bfill').fillna(method='ffill').values
    if y_nan.any():
        y = pd.Series(y).interpolate().fillna(method='bfill').fillna(method='ffill').values
    x_s = medfilt(x, kernel_size=kernel_size)
    y_s = medfilt(y, kernel_size=kernel_size)
    out = gaze_arr.copy()
    out[:,1] = x_s
    out[:,2] = y_s
    return out

def compute_instant_velocity(gaze_arr):
    # velocity in normalized units per second (approx)
    if gaze_arr.shape[0] < 2:
        return np.array([])
    t = gaze_arr[:,0] / 1000.0  # seconds
    x = gaze_arr[:,1]; y = gaze_arr[:,2]
    dt = np.diff(t)
    dx = np.diff(x); dy = np.diff(y)
    dist = np.hypot(dx, dy)
    # avoid division by zero
    vel = dist / np.where(dt==0, 1e-6, dt)
    # return len N-1 velocities aligned to second sample onward
    return vel, dt

def ivt_events(gaze_arr, velocity_threshold=60.0):
    # I-VT: samples with velocity > threshold are saccades, else fixations
    # threshold units: normalized units per second — calibrate per device
    vel, dt = compute_instant_velocity(gaze_arr)
    if vel.size == 0:
        return [], []
    is_sacc = vel > velocity_threshold
    # Map velocities to sample indices: vel[i] corresponds to transition i->i+1
    # Build contiguous saccade windows
    saccades = []
    fixation_indices = []
    N = gaze_arr.shape[0]
    i = 0
    # We'll build fixations using saccade boundaries
    sidx = np.where(is_sacc)[0]
    if sidx.size == 0:
        # All fixation
        fix_start = gaze_arr[0,0]; fix_end = gaze_arr[-1,0]
        fixation_indices.append((0, N-1))
    else:
        # Partition into segments between saccades
        # find consecutive saccade blocks
        blocks = np.split(sidx, np.where(np.diff(sidx) != 1)[0]+1)
        prev_end = -1
        for b in blocks:
            bstart = b[0]; bend = b[-1]
            # fixation before this saccade block: prev_end+1 .. bstart
            fix_s = prev_end+1
            fix_e = bstart
            if fix_e >= fix_s:
                fixation_indices.append((fix_s, fix_e))
            # saccade block indices correspond to transitions; convert to sample start/end
            s0 = bstart
            s1 = bend + 1
            # saccade start time = gaze_arr[s0,0], end = gaze_arr[s1,0]
            amp = np.hypot(gaze_arr[s1,1]-gaze_arr[s0,1], gaze_arr[s1,2]-gaze_arr[s0,2])
            duration = gaze_arr[s1,0] - gaze_arr[s0,0]
            vel_mean = vel[b].mean() if b.size>0 else 0.0
            saccades.append((gaze_arr[s0,0], gaze_arr[s1,0], amp, vel_mean, duration))
            prev_end = s1
        # final fixation after last saccade
        if prev_end < N-1:
            fixation_indices.append((prev_end+1, N-1))
    return fixation_indices, saccades

def idt_fixations(gaze_arr, dispersion_threshold=0.03, min_duration_ms=80):
    # I-DT algorithm for fixations (dispersion based)
    fixations = []
    N = gaze_arr.shape[0]
    i = 0
    while i < N:
        j = i
        # grow window until dispersion > threshold
        while j < N:
            window = gaze_arr[i:j+1,1:3]
            if window.shape[0] < 2:
                j += 1
                continue
            xs = window[:,0]; ys = window[:,1]
            disp = (xs.max()-xs.min()) + (ys.max()-ys.min())
            if disp <= dispersion_threshold:
                j += 1
            else:
                break
        # window i..j-1
        if j-1 >= i:
            start_t = gaze_arr[i,0]
            end_t = gaze_arr[j-1,0]
            dur = end_t - start_t
            if dur >= min_duration_ms:
                x_mean = gaze_arr[i:j,1].mean()
                y_mean = gaze_arr[i:j,2].mean()
                fixations.append((start_t, end_t, x_mean, y_mean, dur))
            i = j
        else:
            i += 1
    return fixations

def detect_regressions(fixations, direction="ltr"):
    # regressions: backward movements in x (for LTR languages)
    regressions = 0
    times = []
    for i in range(1, len(fixations)):
        prev = fixations[i-1]; cur = fixations[i]
        if cur[2] < prev[2]:
            regressions += 1
            times.append(cur[0])
    return regressions, times

def scanpath_entropy(gaze_arr, grid_n=8):
    if gaze_arr.shape[0]==0: return 0.0
    xs = gaze_arr[:,1]; ys = gaze_arr[:,2]
    ix = np.floor(xs * grid_n).astype(int)
    iy = np.floor(ys * grid_n).astype(int)
    ix = np.clip(ix,0,grid_n-1); iy = np.clip(iy,0,grid_n-1)
    cells = ix * grid_n + iy
    counts = Counter(cells.tolist())
    probs = np.array(list(counts.values())) / sum(counts.values())
    return float(entropy(probs, base=2))

def derive_features_from_session(sess):
    gs = sess.get("gaze_stream", [])
    gaze_arr = build_gaze_array(gs)
    if gaze_arr.shape[0] < 3:
        return None
    gaze_arr = interpolate_missing(gaze_arr)
    gaze_arr = median_smooth(gaze_arr, kernel_size=3)
    # I-VT
    fix_idx, saccades = ivt_events(gaze_arr, velocity_threshold=60.0)
    # Convert fixation indices to centroids list
    fixs = []
    for (s,e) in fix_idx:
        start_t = gaze_arr[s,0]; end_t = gaze_arr[e,0]
        dur = end_t - start_t
        x_mean = gaze_arr[s:e+1,1].mean()
        y_mean = gaze_arr[s:e+1,2].mean()
        fixs.append((start_t,end_t,x_mean,y_mean,dur))
    # Compute derived stats
    n_samples = gaze_arr.shape[0]
    n_fix = len(fixs)
    n_sacc = len(saccades)
    fix_durs = [f[4] for f in fixs] if fixs else []
    sacc_amps = [s[2] for s in saccades] if saccades else []
    sacc_vels = [s[3] for s in saccades] if saccades else []
    regressions, reg_times = detect_regressions(fixs)
    entropy_bits = scanpath_entropy(gaze_arr, grid_n=8)
    # reading/time/trials
    trials = sess.get("trials", [])
    total_reading_time = None; reading_speed = None; accuracy = None; errors = None
    tts = sess.get("task_timestamps", [])
    starts = [x['t'] for x in tts if x.get('event')=='start']
    ends = [x['t'] for x in tts if x.get('event')=='end']
    if starts and ends:
        total_reading_time = max(ends) - min(starts)
        # compute words
        wcount = sum(len((tr.get('sentence') or "").split()) for tr in trials)
        if total_reading_time > 0:
            reading_speed = (wcount / (total_reading_time/1000.0)) * 60.0
    if trials:
        total_q=0; correct=0; errs=0
        for tr in trials:
            total_q+=1
            ans = (tr.get('user_answer') or "").strip().lower()
            corr = (tr.get('correct') or "").strip().lower()
            if corr:
                if ans == corr: correct+=1
                else: errs+=1
        accuracy = correct/total_q if total_q>0 else None
        errors = errs
    out = {
        "session_id": sess.get("session_id"),
        "n_gaze_samples": int(n_samples),
        "n_fixations": int(n_fix),
        "fixation_mean_dur": float(np.mean(fix_durs)) if fix_durs else 0.0,
        "fixation_median_dur": float(np.median(fix_durs)) if fix_durs else 0.0,
        "fixation_std_dur": float(np.std(fix_durs)) if fix_durs else 0.0,
        "n_saccades": int(n_sacc),
        "saccade_mean_amp": float(np.mean(sacc_amps)) if sacc_amps else 0.0,
        "saccade_std_amp": float(np.std(sacc_amps)) if sacc_amps else 0.0,
        "saccade_mean_vel": float(np.mean(sacc_vels)) if sacc_vels else 0.0,
        "regressions_count": int(regressions),
        "scanpath_entropy": float(entropy_bits),
        "reading_speed_wpm": float(reading_speed) if reading_speed is not None else None,
        "total_reading_time_ms": int(total_reading_time) if total_reading_time is not None else None,
        "accuracy": float(accuracy) if accuracy is not None else None,
        "errors_count": int(errors) if errors is not None else None,
        "stt_confidence": float(sess.get("trials",[{}])[0].get("stt_confidence", 0.0)) if sess.get("trials") else None,
        # meta
        "screen_w": sess.get("meta",{}).get("screen_w"),
        "screen_h": sess.get("meta",{}).get("screen_h"),
        "device_agent": sess.get("meta",{}).get("user_agent")
    }
    return out

def process_all_sessions():
    rows=[]
    for p in SESSIONS:
        sess = load_session(p)
        feat = derive_features_from_session(sess)
        if feat:
            rows.append(feat)
    df_out = pd.DataFrame(rows)
    OUT_CSV.parent.mkdir(parents=True, exist_ok=True)
    df_out.to_csv(OUT_CSV, index=False)
    print("Wrote derived sessions to:", OUT_CSV)
    return df_out

if __name__ == "__main__":
    process_all_sessions()
