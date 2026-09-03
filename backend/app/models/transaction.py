from pydantic import BaseModel, Field
from typing import Optional, Dict, Any
from datetime import datetime
from enum import Enum
import uuid

class TransactionStatus(str, Enum):
    success = "success"
    failed = "failed"
    pending = "pending"
    abandoned = "abandoned"
    refunded = "refunded"

class PaymentMethod(str, Enum):
    card = "card"
    upi = "upi"
    netbanking = "netbanking"
    wallet = "wallet"
    emi = "emi"

class FailureReason(str, Enum):
    insufficient_funds = "insufficient_funds"
    card_declined = "card_declined"
    authentication_failed = "authentication_failed"
    network_error = "network_error"
    bank_unavailable = "bank_unavailable"
    expired_card = "expired_card"
    fraud_suspected = "fraud_suspected"
    timeout = "timeout"
    unknown = "unknown"

class CheckoutStage(str, Enum):
    initiated = "initiated"
    payment_page = "payment_page"
    otp_sent = "otp_sent"
    otp_verified = "otp_verified"
    processing = "processing"
    completed = "completed"

class Transaction(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    merchant_id: str
    customer_id: str
    order_id: str
    razorpay_payment_id: Optional[str] = None
    amount: float
    currency: str = "INR"
    status: TransactionStatus
    payment_method: PaymentMethod
    failure_reason: Optional[FailureReason] = None
    checkout_stage: Optional[CheckoutStage] = None
    retry_count: int = 0
    is_subscription: bool = False
    subscription_id: Optional[str] = None
    customer_email: Optional[str] = None
    customer_phone: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    metadata: Optional[Dict[str, Any]] = None