from pydantic import BaseModel, Field
from typing import Optional, Dict, Any
from datetime import datetime
from enum import Enum
import uuid

class RecoveryStatus(str, Enum):
    detected = "detected"
    analyzing = "analyzing"
    eligible = "eligible"
    recovery_in_progress = "recovery_in_progress"
    recovered = "recovered"
    failed = "failed"
    stopped = "stopped"
    manual_review = "manual_review"
    expired = "expired"

class RecoveryPriority(str, Enum):
    critical = "critical"
    high = "high"
    medium = "medium"
    low = "low"

class FailureType(str, Enum):
    payment_failure = "payment_failure"
    checkout_abandonment = "checkout_abandonment"
    subscription_failure = "subscription_failure"
    overdue_receivable = "overdue_receivable"
    payment_degradation = "payment_degradation"

class RecommendedAction(str, Enum):
    retry = "retry"
    reminder = "reminder"
    alternate_payment = "alternate_payment"
    manual_review = "manual_review"
    no_action = "no_action"

class RecoveryCase(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    transaction_id: str
    merchant_id: str
    customer_id: str
    amount: float
    currency: str = "INR"
    status: RecoveryStatus
    priority: RecoveryPriority
    failure_type: FailureType
    recovery_probability: float
    ai_diagnosis: str
    recommended_action: RecommendedAction
    ai_explanation: str
    policy_result: Dict[str, Any]
    retry_count: int
    max_retries: int
    recovery_window_start: datetime
    recovery_window_end: datetime
    recovered_amount: float = 0.0
    recovered_at: Optional[datetime] = None
    stopped_reason: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class ActionType(str, Enum):
    retry = "retry"
    reminder = "reminder"
    alternate_payment = "alternate_payment"
    manual_review = "manual_review"
    stop = "stop"
    escalate = "escalate"

class ActionStatus(str, Enum):
    initiated = "initiated"
    in_progress = "in_progress"
    completed = "completed"
    failed = "failed"
    blocked = "blocked"

class Actor(str, Enum):
    ai = "ai"
    system = "system"
    merchant = "merchant"

class RecoveryAction(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    case_id: str
    merchant_id: str
    action_type: ActionType
    status: ActionStatus
    result: Optional[Dict[str, Any]] = None
    policy_check: Dict[str, Any]
    created_at: datetime = Field(default_factory=datetime.utcnow)
    completed_at: Optional[datetime] = None
    actor: Actor