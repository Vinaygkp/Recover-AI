import unittest
import asyncio
from datetime import datetime, timedelta
import hmac
import hashlib
import uuid

from app.ml.predict import predict_recovery_probability
from app.policies.engine import PolicyEngine
from app.recovery.stopping import should_stop_recovery
from app.services.razorpay import RazorpayService
from app.services.payment_provider import RazorpayTestProvider, DemoPaymentProvider
from app.models.policy import Policy
from app.models.recovery import RecoveryCase
from app.recovery.actions import execute_retry

class TestFullBuildathonSuite(unittest.TestCase):

    def test_ml_prediction_target_and_explanation(self):
        """Test ML recovery score prediction without feature leakage."""
        tx = {
            "amount": 4999.0,
            "retry_count": 0,
            "hours_since_failure": 2.5,
            "is_subscription": False,
            "failure_reason": "network_error"
        }
        res = predict_recovery_probability(tx)
        self.assertIn("recovery_probability", res)
        self.assertIn("user_explanation", res)
        self.assertIn("model_version", res)
        self.assertTrue(0.0 <= res["recovery_probability"] <= 1.0)
        # Verify post-recovery status is NOT required for prediction
        self.assertNotIn("recovered_amount", res.get("features_used", []))

    def test_policy_engine_max_retries_stopping(self):
        """Verify policy engine stops recovery when max_retries limit (3) is reached."""
        policy = Policy(id="pol1", merchant_id="m1", max_retries=3)
        case_data = {
            "id": "c_stop_1", "transaction_id": "t1", "merchant_id": "m1", "customer_id": "cust1",
            "amount": 7999.0, "status": "recovery_in_progress", "priority": "high",
            "failure_type": "payment_failure", "recovery_probability": 0.35,
            "ai_diagnosis": "Max retry attempt reached", "recommended_action": "retry",
            "ai_explanation": "Limit reached", "policy_result": {},
            "retry_count": 3, "max_retries": 3,
            "recovery_window_start": datetime.utcnow(),
            "recovery_window_end": datetime.utcnow() + timedelta(days=7),
            "created_at": datetime.utcnow(), "updated_at": datetime.utcnow()
        }
        case = RecoveryCase(**case_data)
        stop_flag, stop_reason = should_stop_recovery(case, policy)
        self.assertTrue(stop_flag)
        self.assertIn("max retries", stop_reason.lower())

    def test_high_value_manual_review_policy(self):
        """Verify transactions >= ₹10,000 are flagged for human review."""
        policy = Policy(id="pol1", merchant_id="m1", high_value_threshold=10000.0)
        case_data = {
            "id": "c_high_val", "transaction_id": "t2", "merchant_id": "m1", "customer_id": "cust2",
            "amount": 15000.0, "status": "detected", "priority": "high",
            "failure_type": "payment_failure", "recovery_probability": 0.85,
            "ai_diagnosis": "High value payment", "recommended_action": "manual_review",
            "ai_explanation": "Requires human review", "policy_result": {},
            "retry_count": 0, "max_retries": 3,
            "recovery_window_start": datetime.utcnow(),
            "recovery_window_end": datetime.utcnow() + timedelta(days=7),
            "created_at": datetime.utcnow(), "updated_at": datetime.utcnow()
        }
        case = RecoveryCase(**case_data)
        stop_flag, stop_reason = should_stop_recovery(case, policy)
        self.assertTrue(stop_flag)
        self.assertTrue("high value" in stop_reason.lower() or "human review" in stop_reason.lower())

    def test_guaranteed_scenario_a_success(self):
        """Test Scenario A: ₹4,999 payment failure executes retry and recovers ₹4,999."""
        case = {"id": "c_scen_a", "amount": 4999.0, "retry_count": 0, "scenario": "SUCCESS_SCENARIO", "recovery_probability": 0.93}
        policy = {"max_retries": 3, "high_value_threshold": 10000.0}
        
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        res = loop.run_until_complete(execute_retry(case, policy))
        loop.close()
        
        self.assertEqual(res["status"], "completed")
        self.assertTrue(res["recovered"])

    def test_guaranteed_scenario_b_failure(self):
        """Test Scenario B: ₹7,999 payment failure exhausts retries deterministically."""
        case = {"id": "c_scen_b", "amount": 7999.0, "retry_count": 2, "scenario": "FAILURE_SCENARIO", "recovery_probability": 0.35}
        policy = {"max_retries": 3, "high_value_threshold": 10000.0}
        
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        res = loop.run_until_complete(execute_retry(case, policy))
        loop.close()
        
        self.assertEqual(res["status"], "failed")
        self.assertFalse(res["recovered"])

    def test_payment_provider_abstraction(self):
        """Verify DemoPaymentProvider creates orders and verifies payments."""
        provider = DemoPaymentProvider()
        order = provider.create_order(4999.0, "INR", "rcpt_test_123")
        self.assertIn("id", order)
        self.assertEqual(order["amount"], 4999.0)
        self.assertTrue(provider.verify_payment(order["id"], "pay_demo_123", "sig_demo_123"))

    def test_webhook_hmac_signature_verification(self):
        """Verify raw HMAC SHA256 webhook signature verification."""
        rzp = RazorpayService()
        secret = "test_webhook_secret_key"
        body = '{"event":"payment.captured","payload":{"payment":{"entity":{"id":"pay_123","amount":499900}}}}'
        valid_sig = hmac.new(secret.encode('utf-8'), body.encode('utf-8'), hashlib.sha256).hexdigest()
        
        self.assertTrue(rzp.verify_webhook_signature(body, valid_sig, secret))
        self.assertFalse(rzp.verify_webhook_signature(body, "invalid_sig_123", secret))

if __name__ == "__main__":
    unittest.main()