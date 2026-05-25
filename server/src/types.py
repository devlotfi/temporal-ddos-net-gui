from pydantic import BaseModel
from typing import  List, Optional

class PrecomputeResponse(BaseModel):
    status: str
    model_used: str
    data_day: str
    message: str

class ConfusionMatrix(BaseModel):
    TP: int
    FP: int
    FN: int
    TN: int

class ClassificationMetrics(BaseModel):
    precision: Optional[float] = None
    recall: Optional[float] = None
    f1: Optional[float] = None

class EarlyMetrics(BaseModel):
    seg_recall: Optional[float] = None
    median_delay_s: Optional[float] = None
    p90_delay_s: Optional[float] = None
    fa_per_min: Optional[float] = None

class PredictResponse(BaseModel):
    model_used: str
    data_day: str
    theta: float
    scores_calibrated: List[float]
    alerts: List[int]
    metrics: EarlyMetrics
    classification_metrics: ClassificationMetrics
    confusion_raw: Optional[ConfusionMatrix] = None

class AlertItem(BaseModel):
    timestamp: str
    score: float
    segment: str
    status: str

class AlertsResponse(BaseModel):
    model_used: str
    data_day: str
    alerts: List[AlertItem]

class TimelineSegment(BaseModel):
    name: str
    start: str
    end: str

class TimelineAlert(BaseModel):
    index: int
    timestamp: str
    score: float

class TimelineResponse(BaseModel):
    model_used: str
    data_day: str
    timestamps: List[str]
    scores: List[float]
    smoothed_scores: List[float]
    segments: List[TimelineSegment]
    alerts: List[TimelineAlert]

class SimulationPoint(BaseModel):
    timestamp: str
    score: Optional[float] = None
    context_start: Optional[str] = None
    context_end: Optional[str] = None

class SimulationResponse(BaseModel):
    model_used: str
    data_day: str
    points: List[SimulationPoint]

class TimelineBoundsResponse(BaseModel):
    data_day: str
    first_timestamp: str
    last_timestamp: str