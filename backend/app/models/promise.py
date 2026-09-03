from pydantic import BaseModel, Field
from typing import Optional, Dict, Any
from datetime import datetime
from enum import Enum

class PromiseStatus(str, Enum):
    PROMISED = "promised"
    DUE = "due"
    PAID = "paid"
    MISSED = "missed"
    ESCALATED = "escalated"

class PromiseToPayCreate(BaseModel):
    case_id: str
    customer_id: Optional[str] = None
    invoice_id: Optional[str] = None
    customer_name: Optional[str] = "B2B Merchant Customer"
    amount: float = Field(gt=0)
    promised_date: datetime
    notes: Optional[str] = None

class PromiseToPayResponse(BaseModel):
    id: str
    promise_id: str
    case_id: str
    merchant_id: str
    customer_id: Optional[str] = None
    invoice_id: Optional[str] = None
    customer_name: Optional[str] = None
    amount: float
    promised_date: datetime
    status: PromiseStatus = PromiseStatus.PROMISED
    payment_received_at: Optional[datetime] = None
    escalation_status: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    notes: Optional[str] = None
