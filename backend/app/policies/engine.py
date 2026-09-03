from typing import Dict, Any, List
from datetime import datetime, timezone
from app.models.policy import Policy
from app.models.recovery import RecoveryCase

class PolicyResult:
    def __init__(self, allowed: bool, checks: List[Dict[str, Any]], blocked_reason: str = None):
        self.allowed = allowed
        self.checks = checks
        self.blocked_reason = blocked_reason
        
    def dict(self):
        return {
            "allowed": self.allowed,
            "checks": self.checks,
            "blocked_reason": self.blocked_reason
        }

class PolicyEngine:
    @staticmethod
    def check_retry_allowed(case: RecoveryCase, policy: Policy) -> PolicyResult:
        if not policy.auto_retry_enabled:
            return PolicyResult(False, [{"rule": "auto_retry", "passed": False}], "Auto retry is disabled by policy")
        if case.retry_count >= policy.max_retries:
            return PolicyResult(False, [{"rule": "max_retries", "passed": False}], f"Max retries ({policy.max_retries}) exceeded")
        return PolicyResult(True, [{"rule": "retry_allowed", "passed": True}])

    @staticmethod
    def check_amount_threshold(case: RecoveryCase, policy: Policy) -> PolicyResult:
        if case.amount > policy.manual_approval_threshold:
            return PolicyResult(False, [{"rule": "manual_approval_threshold", "passed": False}], "Amount exceeds manual approval threshold")
        if case.amount > policy.high_value_threshold:
            return PolicyResult(True, [{"rule": "high_value_threshold", "passed": True, "flag": "high_value"}])
        return PolicyResult(True, [{"rule": "amount_threshold", "passed": True}])

    @staticmethod
    def check_recovery_window(case: RecoveryCase, policy: Policy) -> PolicyResult:
        window_end = case.recovery_window_end
        if window_end:
            now = datetime.now(timezone.utc)
            if window_end.tzinfo is None:
                now = datetime.utcnow()
            if now > window_end:
                return PolicyResult(False, [{"rule": "recovery_window", "passed": False}], "Recovery window expired")
        return PolicyResult(True, [{"rule": "recovery_window", "passed": True}])

    @staticmethod
    def check_discount_limit(discount: float, policy: Policy) -> PolicyResult:
        if discount > policy.max_discount_percent:
            return PolicyResult(False, [{"rule": "discount_limit", "passed": False}], "Discount exceeds maximum allowed")
        return PolicyResult(True, [{"rule": "discount_limit", "passed": True}])

    @staticmethod
    def check_all_policies(case: RecoveryCase, policy: Policy) -> PolicyResult:
        checks = []
        
        retry_res = PolicyEngine.check_retry_allowed(case, policy)
        checks.extend(retry_res.checks)
        if not retry_res.allowed:
            return PolicyResult(False, checks, retry_res.blocked_reason)
            
        amount_res = PolicyEngine.check_amount_threshold(case, policy)
        checks.extend(amount_res.checks)
        if not amount_res.allowed:
            return PolicyResult(False, checks, amount_res.blocked_reason)
            
        window_res = PolicyEngine.check_recovery_window(case, policy)
        checks.extend(window_res.checks)
        if not window_res.allowed:
            return PolicyResult(False, checks, window_res.blocked_reason)
            
        return PolicyResult(True, checks)