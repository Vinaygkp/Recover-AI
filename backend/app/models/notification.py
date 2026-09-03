from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from enum import Enum

class NotificationType(str, Enum):
    high_value_case = "high_value_case"
    recovery_success = "recovery_success"
    recovery_stopped = "recovery_stopped"
    manual_approval = "manual_approval"
    policy_violation = "policy_violation"
    failure_spike = "failure_spike"

class Notification(BaseModel):
    id: str
    merchant_id: str
    type: NotificationType
    title: str
    message: str
    is_read: bool = False
    related_case_id: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)