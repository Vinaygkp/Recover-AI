from datetime import datetime, timezone
from typing import Tuple
from app.models.recovery import RecoveryCase, RecoveryStatus
from app.models.policy import Policy

def should_stop_recovery(case: RecoveryCase, policy: Policy) -> Tuple[bool, str]:
    # Sirf recovered aur stopped states ko hi strictly rokein, manual_review ko nahi
    if case.status in [RecoveryStatus.recovered, RecoveryStatus.stopped]:
        return True, f"Case already in {case.status} state"
        
    if case.retry_count >= policy.max_retries:
        return True, "Max retries exceeded"
        
    # Timezone-safe comparison
    current_time = datetime.now(timezone.utc)
    if case.recovery_window_end:
        window_end = case.recovery_window_end
        if window_end.tzinfo is None:
            window_end = window_end.replace(tzinfo=timezone.utc)
            
        if current_time > window_end:
            return True, "Recovery window expired"
            
    # Agar case pehle se manual_review mein nahi hai tabhi high value par review ke liye rokein
    if case.status != RecoveryStatus.manual_review:
        if case.amount >= policy.high_value_threshold or case.amount > policy.manual_approval_threshold:
            return True, "Amount exceeds high value threshold - Requires Human Review"
        
    return False, ""