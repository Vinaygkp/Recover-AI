import unittest
from datetime import datetime, timedelta
from app.ml.predict import predict_recovery_probability
from app.policies.engine import PolicyEngine
from app.recovery.stopping import should_stop_recovery
from app.services.razorpay import RazorpayService
from app.models.policy import Policy
from app.models.recovery import RecoveryCase
import hmac
import hashlib

class TestRecoveryEngine(unittest.TestCase):

    def test_ml_prediction(self):
        tx = {"amount": 4999.0, "retry_count": 0, "failure_reason": "network_error"}
        res = predict_recovery_probability(tx)
        self.assertIn("recovery_probability", res)
        self.assertIn("user_explanation", res)
        self.assertTrue(0.0 <= res["recovery_probability"] <= 1.0)

    def test_policy_engine_max_retries(self):
        policy = Policy(id="pol1", merchant_id="m1", max_retries=3)
        case_data = {
            "id": "c1", "transaction_id": "t1", "merchant_id": "m1", "customer_id": "cust1",
            "amount": 4999.0, "status": "recovery_in_progress", "priority": "medium",
            "failure_type": "payment_failure", "recovery_probability": 0.9,
            "ai_diagnosis": "Network issue", "recommended_action": "retry",
            "ai_explanation": "Good candidate", "policy_result": {},
            "retry_count": 3, "max_retries": 3,
            "recovery_window_start": datetime.utcnow(),
            "recovery_window_end": datetime.utcnow() + timedelta(days=7),
            "created_at": datetime.utcnow(), "updated_at": datetime.utcnow()
        }
        case = RecoveryCase(**case_data)
        stop_flag, stop_reason = should_stop_recovery(case, policy)
        self.assertTrue(stop_flag)
        self.assertIn("max retries", stop_reason.lower())

    def test_high_value_manual_review_threshold(self):
        policy = Policy(id="pol1", merchant_id="m1", high_value_threshold=10000.0)
        case_data = {
            "id": "c2", "transaction_id": "t2", "merchant_id": "m1", "customer_id": "cust2",
            "amount": 15000.0, "status": "detected", "priority": "high",
            "failure_type": "payment_failure", "recovery_probability": 0.85,
            "ai_diagnosis": "High value tx", "recommended_action": "retry",
            "ai_explanation": "Requires human approval", "policy_result": {},
            "retry_count": 0, "max_retries": 3,
            "recovery_window_start": datetime.utcnow(),
            "recovery_window_end": datetime.utcnow() + timedelta(days=7),
            "created_at": datetime.utcnow(), "updated_at": datetime.utcnow()
        }
        case = RecoveryCase(**case_data)
        stop_flag, stop_reason = should_stop_recovery(case, policy)
        self.assertTrue(stop_flag)
        self.assertTrue("high value" in stop_reason.lower() or "human review" in stop_reason.lower())

    def test_payment_signature_verification(self):
        rzp = RazorpayService()
        if rzp.is_configured():
            valid = rzp.verify_payment_signature("order_123", "pay_123", "invalid_sig")
            self.assertFalse(valid)

    def test_webhook_signature_verification(self):
        rzp = RazorpayService()
        secret = "test_webhook_secret"
        body = '{"event":"payment.captured"}'
        valid_sig = hmac.new(secret.encode('utf-8'), body.encode('utf-8'), hashlib.sha256).hexdigest()
        self.assertTrue(rzp.verify_webhook_signature(body, valid_sig, secret))
        self.assertFalse(rzp.verify_webhook_signature(body, "invalid_signature", secret))

if __name__ == "__main__":
    unittest.main()