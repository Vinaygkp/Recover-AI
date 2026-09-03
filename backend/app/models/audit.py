from pydantic import BaseModel, Field
from typing import Optional, Dict, Any
from datetime import datetime

class AuditLog(BaseModel):
    id: str
    merchant_id: str
    case_id: Optional[str] = None
    transaction_id: Optional[str] = None
    event_type: str
    actor: str
    description: str
    metadata: Optional[Dict[str, Any]] = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)