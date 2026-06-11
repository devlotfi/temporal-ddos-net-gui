import numpy as np
import pandas as pd
from fastapi import FastAPI, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sklearn.metrics import f1_score, precision_score, recall_score
from .config import *
from .model import *
from .types import *

app = FastAPI(title="TemporalDDoSNet Demo API", version="3.7")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
    allow_credentials=True,
)

@app.post("/precompute", response_model=PrecomputeResponse)
async def precompute(model: str = Query(...), day: str = Query(...)):
    if model not in MODEL_DAYS:
        raise HTTPException(400, f"Unknown model: {model}. Allowed: {MODEL_DAYS}")
    if day not in VALIDATION_DAYS:
        raise HTTPException(400, f"Unknown day: {day}. Allowed: {VALIDATION_DAYS}")
    try:
        if model == day:
            compute_scores(model, day, False)
            compute_scores(model, day, True)
        else:
            compute_scores(model, day, False)
    except Exception as e:
        raise HTTPException(500, f"Precomputation failed: {str(e)}")
    return PrecomputeResponse(
        status="ok",
        model_used=model,
        data_day=day,
        message=f"Scores precomputed for model {model} on data {day}"
    )

@app.post("/predict", response_model=PredictResponse)
async def predict(model: str = Query(...), day: str = Query(...)):
    def get_data(model: str, day: str, test: bool = False):
        precom, art = get_demo_data(model, day, test)
        df = precom["df"]
        scores = precom["scores_calibrated"]
        theta = art["theta"]
        theta_up = art["theta_up"]
        theta_down = art["theta_down"]
        k = art["k_consecutive"]
        smoothing_s = art["smoothing_window_s"]
        cooldown_s = art["cooldown_s"]

        early = compute_early_metrics(day, scores, theta, theta_up, theta_down,
                                      k, smoothing_s, cooldown_s, df)

        preds = (scores >= theta).astype(int)

        y_raw = df["y_raw_bin"].values if "y_raw_bin" in df.columns else None
        is_empty = df["is_empty"].values.astype(bool) if "is_empty" in df.columns else np.zeros(len(df), dtype=bool)

        confusion_raw = None
        precision = recall = f1 = None

        if y_raw is not None:
            if day in ["02-16-cic2018", "02-21-cic2018"]:
                if "y_raw_known" in df.columns:
                    known_mask = (df["y_raw_known"].values == 1) & (~is_empty)
                else:
                    known_mask = ~is_empty
            else:
                # CIC-2019 : labels valides != -1, et non vides
                known_mask = (y_raw != -1) & (~is_empty)

            if known_mask.any():
                y_true_filt = y_raw[known_mask]
                y_pred_filt = preds[known_mask]
                confusion_raw = safe_confusion(y_true_filt, y_pred_filt)
                if len(y_true_filt) > 0:
                    precision = float(precision_score(y_true_filt, y_pred_filt, zero_division=0))
                    recall = float(recall_score(y_true_filt, y_pred_filt, zero_division=0))
                    f1 = float(f1_score(y_true_filt, y_pred_filt, zero_division=0))

        return {
            "model_used": model,
            "data_day": day,
            "theta": theta,
            "scores_calibrated": scores.tolist(),
            "alerts": early["alerts"].tolist(),
            "metrics": {
                "seg_recall": early["seg_recall"],
                "median_delay_s": early["median_delay_s"],
                "p90_delay_s": early["p90_delay_s"],
                "fa_per_min": early["fa_per_min"],
            },
            "classification_metrics": {
                "precision": precision,
                "recall": recall,
                "f1": f1
            },
            "confusion_raw": confusion_raw,
        }

    if model == day:
        data = get_data(model, day, test=False)
        data_test = get_data(model, day, test=True)
        data["classification_metrics"] = data_test["classification_metrics"]
        data["confusion_raw"] = data_test["confusion_raw"]
        return PredictResponse(**data)
    else:
        data = get_data(model, day, test=False)
        return PredictResponse(**data)

@app.get("/timeline", response_model=TimelineResponse)
async def timeline(model: str = Query(...), day: str = Query(...)):
    precom, art = get_demo_data(model, day)
    df = precom["df"]
    timestamps = df["window_start"].astype(str).tolist()
    scores = precom["scores_calibrated"].tolist()
    smoothed = smooth(scores, SMOOTHING_WINDOW_S).tolist()

    segments = []
    for seg in get_segments_for_day(day, df):
        segments.append(TimelineSegment(
            name=seg["name"],
            start=str(seg["start_ts"]),
            end=str(seg["end_ts"])
        ))

    early = compute_early_metrics(day, precom["scores_calibrated"],
                                  art["theta"], art["theta_up"], art["theta_down"],
                                  art["k_consecutive"], art["smoothing_window_s"],
                                  art["cooldown_s"], df)
    alert_idxs = np.where(early["alerts"] == 1)[0].tolist()
    # Utiliser les scores lissés pour les alertes
    alert_data = [TimelineAlert(index=idx, timestamp=timestamps[idx], score=smoothed[idx])
                  for idx in alert_idxs]

    return TimelineResponse(
        model_used=model,
        data_day=day,
        timestamps=timestamps,
        scores=scores,
        smoothed_scores=smoothed,
        segments=segments,
        alerts=alert_data,
    )

@app.get("/alerts", response_model=AlertsResponse)
async def list_alerts(model: str = Query(...), day: str = Query(...)):
    precom, art = get_demo_data(model, day)
    df = precom["df"]
    scores = precom["scores_calibrated"]
    early = compute_early_metrics(day, scores, art["theta"], art["theta_up"],
                                  art["theta_down"], art["k_consecutive"],
                                  art["smoothing_window_s"], art["cooldown_s"], df)
    alert_idxs = np.where(early["alerts"] == 1)[0]
    timestamps = df["window_start"].values

    y_sched = get_y_sched(df)           # <-- tolérance
    has_sched = y_sched is not None
    segments = get_segments_for_day(day, df) if has_sched else []

    alerts_list = []
    for idx in alert_idxs:
        ts = pd.Timestamp(timestamps[idx])
        in_attack = (has_sched and y_sched[idx] == 1)
        segment_name = "unknown"
        if has_sched:
            for seg in segments:
                if seg["start_ts"] <= ts <= seg["end_ts"]:
                    segment_name = "DoS" if day in ["02-16-cic2018", "02-21-cic2018"] else "Attack"
                    break
        status = "true positive" if in_attack else "false positive" if has_sched else "unlabeled"
        alerts_list.append(AlertItem(
            timestamp=str(timestamps[idx]),
            score=float(scores[idx]),
            segment=segment_name,
            status=status,
        ))
    return AlertsResponse(model_used=model, data_day=day, alerts=alerts_list)

@app.get("/simulate", response_model=SimulationResponse)
async def simulate(
    model: str = Query(...),
    day: str = Query(...),
    start_ts: str = Query(...),
    end_ts: str = Query(...),
):
    precom, _ = get_demo_data(model, day)
    df = precom["df"]
    scores = precom["scores_calibrated"]

    try:
        start_dt = pd.Timestamp(start_ts)
        end_dt = pd.Timestamp(end_ts)
    except Exception as e:
        raise HTTPException(400, f"Invalid timestamp format: {e}")

    timeline_start = df["window_start"].iloc[0]
    timeline_end = df["window_start"].iloc[-1]

    if start_dt < timeline_start or end_dt > timeline_end:
        raise HTTPException(
            400,
            f"Requested range [{start_ts}, {end_ts}] is outside the available timeline "
            f"[{timeline_start}, {timeline_end}]"
        )

    start_idx = int((start_dt - timeline_start).total_seconds())
    end_idx = int((end_dt - timeline_start).total_seconds())

    if start_idx < 0 or end_idx >= len(df):
        raise HTTPException(400, "Requested range is out of bounds")

    points = []
    for idx in range(start_idx, end_idx + 1):
        ts = str(df["window_start"].iloc[idx])
        point = SimulationPoint(timestamp=ts)
        if idx >= SEQ_LEN - 1:
            point.score = float(scores[idx])
            point.context_start = str(df["window_start"].iloc[idx - SEQ_LEN + 1])
            point.context_end = str(df["window_start"].iloc[idx])
        points.append(point)

    return SimulationResponse(
        model_used=model,
        data_day=day,
        points=points,
    )

@app.get("/timeline_bounds", response_model=TimelineBoundsResponse)
async def timeline_bounds(day: str = Query(...)):
    if day not in VALIDATION_DAYS:
        raise HTTPException(400, f"Unknown day: {day}. Allowed: {VALIDATION_DAYS}")
    try:
        df = pd.read_parquet(DATA_DIR / f"df_timeline_{day}.parquet", columns=["window_start"])
    except FileNotFoundError:
        raise HTTPException(404, f"Data file for day {day} not found")
    first_ts = str(df["window_start"].min())
    last_ts = str(df["window_start"].max())
    return TimelineBoundsResponse(data_day=day, first_timestamp=first_ts, last_timestamp=last_ts)