import razorpay
import hmac
import hashlib
from typing import Optional, Dict, Any
from app.config import settings

class RazorpayService:
    def __init__(self):
        self.client = None
        if self.is_configured():
            key_id = getattr(settings, 'RAZORPAY_KEY_ID', None)
            key_secret = getattr(settings, 'RAZORPAY_KEY_SECRET', None)
            self.client = razorpay.Client(auth=(key_id, key_secret))
            
    def is_configured(self) -> bool:
        key_id = getattr(settings, 'RAZORPAY_KEY_ID', None)
        key_secret = getattr(settings, 'RAZORPAY_KEY_SECRET', None)
        return bool(key_id and key_secret)
        
    def create_order(self, amount: float, currency: str = "INR", receipt: str = "") -> Optional[Dict[str, Any]]:
        if not self.is_configured() or not self.client:
            return None
            
        try:
            order_data = {
                "amount": int(amount * 100),
                "currency": currency,
                "receipt": receipt
            }
            order = self.client.order.create(data=order_data)
            return order
        except Exception as e:
            print(f"Razorpay order creation failed: {e}")
            return None

    def fetch_payment(self, payment_id: str) -> Optional[Dict[str, Any]]:
        if not self.is_configured() or not self.client:
            return None
            
        try:
            payment = self.client.payment.fetch(payment_id)
            return payment
        except Exception as e:
            print(f"Razorpay payment fetch failed: {e}")
            return None

    def verify_payment_signature(self, razorpay_order_id: str, razorpay_payment_id: str, razorpay_signature: str) -> bool:
        """Verify Razorpay payment signature server-side using HMAC SHA256."""
        key_secret = getattr(settings, 'RAZORPAY_KEY_SECRET', None)
        if not self.is_configured() or not key_secret:
            return False
            
        try:
            msg = f"{razorpay_order_id}|{razorpay_payment_id}"
            generated_sig = hmac.new(
                key_secret.encode('utf-8'),
                msg.encode('utf-8'),
                hashlib.sha256
            ).hexdigest()
            return hmac.compare_digest(generated_sig, razorpay_signature)
        except Exception as e:
            print(f"Payment signature verification failed: {e}")
            return False

    def verify_webhook_signature(self, body: str, signature: str, secret: str = None) -> bool:
        """Verify HMAC SHA256 signature for incoming Razorpay webhooks on raw body string."""
        webhook_secret = secret or getattr(settings, 'RAZORPAY_WEBHOOK_SECRET', None) or getattr(settings, 'RAZORPAY_KEY_SECRET', None)
        if not webhook_secret:
            return False
            
        try:
            generated_sig = hmac.new(
                webhook_secret.encode('utf-8'),
                body.encode('utf-8') if isinstance(body, str) else body,
                hashlib.sha256
            ).hexdigest()
            return hmac.compare_digest(generated_sig, signature)
        except Exception as e:
            print(f"Webhook signature verification failed: {e}")
            return False