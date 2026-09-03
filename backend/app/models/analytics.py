from pydantic import BaseModel
from typing import Dict, Any
from datetime import datetime

class AnalyticsSnapshot(BaseModel):
    merchant_id: str
    revenue_at_risk: float
    revenue_recovered: float
    recovery_rate: float
    active_cases: int
    total_attempts: int
    successful_recoveries: int
    stopped_cases: int
    manual_reviews: int
    timestamp: datetime
    
class AnalyticsResponse(BaseModel):
    overview: Dict[str, Any]
    charts: Dict[str, Any]