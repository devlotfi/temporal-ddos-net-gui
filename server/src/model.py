import json

import joblib
import numpy as np
import pandas as pd
import torch
import torch.nn as nn
from fastapi import HTTPException
from sklearn.isotonic import IsotonicRegression
from .config import *

class MultiScaleCNN(nn.Module):
    def __init__(self, n_input_features, n_filters, kernel_sizes, dropout=0.1):
        super().__init__()
        self.branches = nn.ModuleList([
            nn.Sequential(
                nn.Conv1d(n_input_features, n_filters, kernel_size=k, padding=k//2),
                nn.BatchNorm1d(n_filters),
                nn.GELU(),
                nn.Dropout(dropout),
            ) for k in kernel_sizes
        ])

    def forward(self, x):
        x = x.transpose(1, 2)
        outs = [branch(x) for branch in self.branches]
        return torch.cat(outs, dim=1).transpose(1, 2)

class LearnablePositionalEncoding(nn.Module):
    def __init__(self, d_model, max_len=256, dropout=0.1):
        super().__init__()
        self.dropout = nn.Dropout(dropout)
        self.position_embedding = nn.Parameter(torch.zeros(1, max_len, d_model))
        nn.init.trunc_normal_(self.position_embedding, std=0.02)

    def forward(self, x):
        return self.dropout(x + self.position_embedding[:, :x.size(1), :])

class TemporalDDoSNet(nn.Module):
    def __init__(self, n_input_features, seq_len=30, cnn_filters=64, cnn_kernels=[3,5,7],
                 lstm_hidden=64, lstm_layers=1, lstm_dropout=0.1, d_model=128,
                 n_heads=4, n_transformer_layers=2, ff_dim=256, dropout=0.1):
        super().__init__()
        cnn_out = cnn_filters * len(cnn_kernels)
        self.multi_scale_cnn = MultiScaleCNN(n_input_features, cnn_filters, cnn_kernels, dropout)
        self.bilstm = nn.LSTM(cnn_out, lstm_hidden, num_layers=lstm_layers,
                              bidirectional=True, dropout=lstm_dropout if lstm_layers > 1 else 0.0,
                              batch_first=True)
        lstm_out = 2 * lstm_hidden
        self.lstm_projection = nn.Linear(lstm_out, d_model) if lstm_out != d_model else nn.Identity()
        self.positional_encoding = LearnablePositionalEncoding(d_model, max_len=seq_len + 4, dropout=dropout)
        encoder_layer = nn.TransformerEncoderLayer(
            d_model=d_model, nhead=n_heads, dim_feedforward=ff_dim,
            dropout=dropout, activation='gelu', batch_first=True, norm_first=True
        )
        self.transformer = nn.TransformerEncoder(
            encoder_layer, num_layers=n_transformer_layers,
            enable_nested_tensor=False
        )
        head_hidden = max(64, d_model // 2)
        self.classification_head = nn.Sequential(
            nn.LayerNorm(d_model),
            nn.Linear(d_model, head_hidden),
            nn.GELU(),
            nn.Dropout(dropout),
            nn.Linear(head_hidden, 1),
        )

    def forward(self, x):
        x = self.multi_scale_cnn(x)
        x, _ = self.bilstm(x)
        x = self.lstm_projection(x)
        x = self.positional_encoding(x)
        x = self.transformer(x)
        return self.classification_head(x.mean(dim=1)).squeeze(-1)

# ---------- Helpers ----------
def smooth(y, window=3):
    if window <= 1:
        return np.array(y)
    box = np.ones(window)/window
    return np.convolve(y, box, mode='same')

def hysteresis(smoothed, theta_up, theta_down):
    state = 0
    dec = np.zeros(len(smoothed), dtype=int)
    for i, p in enumerate(smoothed):
        if state == 0 and p >= theta_up:
            state = 1
        elif state == 1 and p < theta_down:
            state = 0
        dec[i] = state
    return dec

def apply_k_consecutive(dec, n_flows, k, cooldown_s, min_flows):
    alerts = np.zeros(len(dec), dtype=int)
    cnt = 0
    cooldown_end = -1
    for i in range(len(dec)):
        if i <= cooldown_end:
            cnt = 0
            continue
        if n_flows[i] < min_flows:
            cnt = 0
            continue
        cnt = cnt + 1 if dec[i] == 1 else 0
        if cnt >= k:
            alerts[i] = 1
            cooldown_end = i + cooldown_s
            cnt = 0
    return alerts

def compute_early_metrics(day, scores, theta, theta_up, theta_down,
                          k, smoothing_s, cooldown_s, df):
    n_flows = df["n_flows"].values.astype(float)
    smoothed = smooth(scores, smoothing_s)
    dec = hysteresis(smoothed, theta_up, theta_down)
    alerts = apply_k_consecutive(dec, n_flows, k, cooldown_s, MIN_FLOWS_TRIGGER)

    segs = ATTACK_SCHEDULE.get(day, [])
    has_sched_labels = "y_sched_bin" in df.columns
    if not segs or not has_sched_labels:
        return {
            "seg_recall": None,
            "median_delay_s": None,
            "p90_delay_s": None,
            "fa_per_min": None,
            "alerts": alerts,
        }

    start_times = pd.to_datetime(df["window_start"])
    labels = df["y_sched_bin"].values
    delays = []
    total_seg = 0
    detected_seg = 0
    for _, seg_start_str, seg_end_str in segs:
        seg_start = pd.Timestamp(seg_start_str)
        seg_end = pd.Timestamp(seg_end_str)
        mask = (start_times >= seg_start) & (start_times <= seg_end) & (labels == 1)
        if not mask.any():
            continue
        total_seg += 1
        det_idx = np.where(mask & (alerts == 1))[0]
        if len(det_idx) > 0:
            detected_seg += 1
            first_ts = start_times.iloc[det_idx[0]]
            delays.append(max(0.0, (first_ts - seg_start).total_seconds()))

    seg_recall = detected_seg / max(total_seg, 1) if total_seg > 0 else None
    median_delay = float(np.median(delays)) if delays else None
    p90_delay = float(np.percentile(delays, 90)) if delays else None
    benign_mask = labels == 0
    benign_minutes = max(benign_mask.sum() / 60, 1e-9)
    n_fa = ((alerts == 1) & benign_mask).sum()
    fa_per_min = n_fa / benign_minutes

    return {
        "seg_recall": seg_recall,
        "median_delay_s": median_delay,
        "p90_delay_s": p90_delay,
        "fa_per_min": fa_per_min,
        "alerts": alerts,
    }

def score_timeline(model, X, df, seq_len, max_gap):
    model.eval()
    device = next(model.parameters()).device
    timestamps = pd.to_datetime(df["window_start"])
    ts_values = timestamps.values.astype("datetime64[ns]")
    ts_sec = (ts_values.astype(np.int64) // 10**9).astype(np.float64)

    has_gap = np.zeros(len(X), dtype=bool)
    if len(X) > 1:
        deltas = np.diff(ts_sec)
        has_gap[1:] = (deltas > max_gap) | np.isnan(deltas)
    is_empty = df["is_empty"].values.astype(bool) if "is_empty" in df.columns else np.zeros(len(X), dtype=bool)

    valid_endpoints = []
    for i in range(seq_len - 1, len(X)):
        if np.any(has_gap[i - seq_len + 2 : i + 1]):
            continue
        valid_endpoints.append(i)
    valid_endpoints = np.array(valid_endpoints, dtype=int)

    scores_full = np.full(len(X), np.nan, dtype=np.float64)
    if len(valid_endpoints) > 0:
        batch_size = 512
        for start in range(0, len(valid_endpoints), batch_size):
            batch_idx = valid_endpoints[start : start + batch_size]
            sequences = np.zeros((len(batch_idx), seq_len, X.shape[1]), dtype=np.float32)
            for j, ep in enumerate(batch_idx):
                sequences[j] = X[ep - seq_len + 1 : ep + 1]
            with torch.no_grad():
                logits = model(torch.from_numpy(sequences).to(device))
                probs = torch.sigmoid(logits).cpu().numpy()
            scores_full[batch_idx] = probs

    last_valid = 0.5
    filled = np.full(len(X), 0.5, dtype=np.float64)
    for i in range(len(X)):
        if has_gap[i]:
            last_valid = 0.5
        if not np.isnan(scores_full[i]):
            last_valid = scores_full[i]
            filled[i] = last_valid
        elif is_empty[i]:
            filled[i] = last_valid if last_valid > 0.5 else 0.5
        else:
            filled[i] = last_valid
    return filled

# ---------- Caches ----------
artifacts_cache = {}
computed_cache = {}

def load_artifacts(model_day: str):
    if model_day in artifacts_cache:
        return
    if model_day not in MODEL_DAYS:
        raise HTTPException(400, f"Unknown model day: {model_day}. Allowed: {MODEL_DAYS}")

    short_day = ARTIFACT_DAY_MAP[model_day]
    model_path = MODELS_DIR / f"tdn_v3.7_{short_day}.pt"
    if not model_path.exists():
        raise FileNotFoundError(f"Model not found: {model_path}")

    checkpoint = torch.load(model_path, map_location="cpu")
    model = TemporalDDoSNet(
        n_input_features=N_FEATURES, seq_len=SEQ_LEN, cnn_filters=64, cnn_kernels=[3,5,7],
        lstm_hidden=64, lstm_layers=1, lstm_dropout=0.1, d_model=128,
        n_heads=4, n_transformer_layers=2, ff_dim=256, dropout=0.1,
    )
    model.load_state_dict(checkpoint["state_dict"])
    model.eval()

    scaler = joblib.load(MODELS_DIR / f"scaler_{short_day}.joblib")
    imputer = joblib.load(MODELS_DIR / f"imputer_{short_day}.joblib")
    calibrator = joblib.load(MODELS_DIR / f"calibrator_{short_day}_TDN_v3.7.joblib")

    with open(MODELS_DIR / f"inference_config_{short_day}.json") as f:
        config = json.load(f)

    artifacts_cache[model_day] = {
        "model": model,
        "scaler": scaler,
        "imputer": imputer,
        "calibrator": calibrator,
        "theta": config["theta"],
        "theta_up": config["theta_up"],
        "theta_down": config["theta_down"],
        "k_consecutive": config["k_consecutive"],
        "smoothing_window_s": config["smoothing_window_s"],
        "cooldown_s": config["cooldown_s"],
        "clip_lower": np.array(config["clip_bounds"]["lower"]),
        "clip_upper": np.array(config["clip_bounds"]["upper"]),
        "feature_names": config["feature_names"],
    }

def compute_scores(model_day: str, data_day: str):
    if data_day not in VALIDATION_DAYS:
        raise HTTPException(400, f"Unknown validation day: {data_day}. Allowed: {VALIDATION_DAYS}")
    load_artifacts(model_day)
    art = artifacts_cache[model_day]
    X = pd.read_parquet(DATA_DIR / f"X_timeline_{data_day}.parquet").values.astype(np.float32)
    df = pd.read_parquet(DATA_DIR / f"df_timeline_{data_day}.parquet")
    X_imp = art["imputer"].transform(X)
    X_clip = np.clip(X_imp, art["clip_lower"], art["clip_upper"])
    X_scaled = art["scaler"].transform(X_clip).astype(np.float32)
    X_scaled = np.nan_to_num(X_scaled, nan=0.0, posinf=0.0, neginf=0.0)
    scores = score_timeline(art["model"], X_scaled, df, SEQ_LEN, MAX_GAP_S)
    cal = art["calibrator"]
    if isinstance(cal, tuple):
        mode, cal_obj = cal
        if mode != "raw" and cal_obj is not None:
            calibrated = cal_obj.predict(scores)
        else:
            calibrated = scores
    elif isinstance(cal, IsotonicRegression):
        calibrated = cal.predict(scores)
    else:
        calibrated = scores
    computed_cache[(model_day, data_day)] = {
        "df": df,
        "scores_calibrated": np.nan_to_num(calibrated, nan=0.5),
        "model_day": model_day,
        "data_day": data_day,
    }

def get_demo_data(model_day: str, data_day: str):
    if data_day not in VALIDATION_DAYS:
        raise HTTPException(400, f"Unknown validation day: {data_day}. Allowed: {VALIDATION_DAYS}")
    key = (model_day, data_day)
    data = computed_cache.get(key)
    if data is None:
        raise HTTPException(
            404,
            f"Scores not computed yet for model={model_day} on data={data_day}. "
            f"Please call POST /precompute?model={model_day}&day={data_day} first."
        )
    art = artifacts_cache[model_day]
    return data, art

def safe_confusion(y_true_col, y_pred):
    """Retourne la matrice de confusion si la colonne existe, sinon None."""
    if y_true_col is None:
        return None
    tp = int(((y_pred==1) & (y_true_col==1)).sum())
    fp = int(((y_pred==1) & (y_true_col==0)).sum())
    fn = int(((y_pred==0) & (y_true_col==1)).sum())
    tn = int(((y_pred==0) & (y_true_col==0)).sum())
    return {"TP": tp, "FP": fp, "FN": fn, "TN": tn}