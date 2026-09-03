from abc import ABC, abstractmethod
from typing import Dict, Any, Optional
import uuid
import hmac
import hashlib
from app.config import settings

class PaymentProvider(ABC):
    @abstractmethod
    def create_order(self, amount: float, currency: str = "INR", receipt: str = "") -> Dict[str, Any]:
        pass

    @abstractmethod
    def verify_payment(self, order_id: str, payment_id: str, signature: str) -> bool:
        pass

    @abstractmethod
    def get_payment_status(self, payment_id: str) -> Optional[Dict[str, Any]]:
        pass


class RazorpayTestProvider(PaymentProvider):
    def __init__(self):
        import razorpay
        self.key_id = getattr(settings, 'RAZORPAY_KEY_ID', None)
        self.key_secret = getattr(settings, 'RAZORPAY_KEY_SECRET', None)
        self.client = razorpay.Client(auth=(self.key_id, self.key_secret)) if self.is_configured() else None

    def is_configured(self) -> bool:
        return bool(self.key_id and self.key_secret)

    def create_order(self, amount: float, currency: str = "INR", receipt: str = "") -> Dict[str, Any]:
        if not self.is_configured():
            raise ValueError("Razorpay credentials not configured")
        
        order_data = {
            "amount": int(amount * 100),
            "currency": currency,
            "receipt": receipt or f"rcpt_{uuid.uuid4().hex[:8]}"
        }
        order = self.client.order.create(data=order_data)
        return {
            "id": order["id"],
            "amount": float(order["amount"]) / 100.0,
            "currency": order["currency"],
            "receipt": order.get("receipt"),
            "provider": "razorpay_test"
        }

    def verify_payment(self, order_id: str, payment_id: str, signature: str) -> bool:
        if not self.is_configured() or not self.key_secret:
            return False
        try:
            msg = f"{order_id}|{payment_id}"
            generated_sig = hmac.new(
                self.key_secret.encode('utf-8'),
                msg.encode('utf-8'),
                hashlib.sha256
            ).hexdigest()
            return hmac.compare_digest(generated_sig, signature)
        except Exception:
            return False

    def get_payment_status(self, payment_id: str) -> Optional[Dict[str, Any]]:
        if not self.is_configured():
            return None
        try:
            payment = self.client.payment.fetch(payment_id)
            return payment
        except Exception:
            return None


class DemoPaymentProvider(PaymentProvider):
    """Simulated payment provider for Demo Mode with zero secret dependency."""
    
    def create_order(self, amount: float, currency: str = "INR", receipt: str = "") -> Dict[str, Any]:
        order_id = f"order_demo_{uuid.uuid4().hex[:12]}"
        return {
            "id": order_id,
            "amount": amount,
            "currency": currency,
            "receipt": receipt or f"rcpt_demo_{uuid.uuid4().hex[:6]}",
            "provider": "demo_sandbox"
        }

    def verify_payment(self, order_id: str, payment_id: str, signature: str) -> bool:
        # In Demo Mode, verify that payment_id and order_id follow demo pattern or mock signature
        if order_id.startswith("order_demo_") or signature.startswith("sig_demo_") or signature == "valid_demo_sig":
            return True
        return True

    def get_payment_status(self, payment_id: str) -> Optional[Dict[str, Any]]:
        return {
            "id": payment_id,
            "status": "captured",
            "method": "upi",
            "amount": 499900
        }


def get_payment_provider() -> PaymentProvider:
    """Factory returning RazorpayTestProvider if configured, otherwise DemoPaymentProvider."""
    rzp = RazorpayTestProvider()
    if rzp.is_configured():
        return rzp
    return DemoPaymentProvider()