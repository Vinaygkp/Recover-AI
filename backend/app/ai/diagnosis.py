from typing import Dict, Any

def generate_diagnosis(transaction: Dict[str, Any], case: Dict[str, Any]) -> str:
    failure = transaction.get("failure_reason", "unknown")
    amount = transaction.get("amount", 0)
    
    if failure == "insufficient_funds":
        return f"Customer attempted a transaction of ₹{amount} but had insufficient funds. Recommended to wait for salary cycle or offer lower tier."
    elif failure == "authentication_failed":
        return "Authentication failed, likely due to incorrect OTP. High probability of recovery via immediate reminder."
    elif failure == "network_error":
        return "Bank network error. This is a transient issue. Auto-retry is highly recommended."
    elif failure == "expired_card":
        return "Card has expired. Customer needs to update payment method."
    else:
        return f"Transaction failed due to {failure}. Requires standard recovery protocol."

def generate_explanation(case: Dict[str, Any], action: str) -> str:
    if action == "retry":
        return "Retry recommended because the failure appears to be a transient network issue."
    elif action == "reminder":
        return "Reminder recommended due to user abandonment at checkout stage."
    elif action == "alternate_payment":
        return "Alternate payment recommended due to repeated card declines."
    elif action == "manual_review":
        return "Manual review recommended due to high transaction value."
    return "No action recommended at this time."

def calculate_priority(case: Dict[str, Any]) -> str:
    amount = case.get("amount", 0)
    if amount > 10000:
        return "critical"
    elif amount > 5000:
        return "high"
    elif amount > 1000:
        return "medium"
    return "low"