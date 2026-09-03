from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
import uuid

class Policy(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    merchant_id: str
    max_retries: int = 3
    max_discount_percent: float = 10.0
    recovery_window_days: int = 7
    high_value_threshold: float = 10000.0
    manual_approval_threshold: float = 25000.0
    escalation_limit: int = 5
    auto_retry_enabled: bool = True
    reminder_enabled: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)