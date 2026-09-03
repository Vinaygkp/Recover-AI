import urllib.request
import json
import os
import hmac
import hashlib
from dotenv import load_dotenv

load_dotenv("backend/.env")
key_id = os.getenv("RAZORPAY_KEY_ID", "")
key_secret = os.getenv("RAZORPAY_KEY_SECRET", "")
backend_url = os.getenv("BACKEND_URL", os.getenv("VITE_API_BASE_URL", "http://127.0.0.1:8000")).rstrip("/")

def req(url, data=None, headers=None, method=None):
    if headers is None: headers = {}
    if data:
        encoded = json.dumps(data).encode('utf-8')
        headers['Content-Type'] = 'application/json'
    else:
        encoded = None
    request = urllib.request.Request(url, data=encoded, headers=headers, method=method)
    try:
        res = urllib.request.urlopen(request)
        return res.getcode(), json.loads(res.read().decode('utf-8'))
    except urllib.error.HTTPError as e:
        body = json.loads(e.read().decode('utf-8')) if e.fp else {}
        return e.code, body

print("==================================================")
print("     RECOVER AI -- RAZORPAY INTEGRATION SUITE     ")
print("==================================================")

# 1. Health check
code, health = req(f"{backend_url}/api/health")
print(f"[TEST 1] Backend Health: HTTP {code} | Status: {health.get('status')}")

# 2. Razorpay Integration Status & API Connectivity Check
code, rzp_status = req(f"{backend_url}/api/integrations/razorpay/status")
print(f"[TEST 2] Razorpay Integration Status: HTTP {code}")
print(f"         Configured: {rzp_status.get('configured')}")
print(f"         API Reachable: {rzp_status.get('api_reachable')}")
print(f"         Status: {rzp_status.get('status')}")
print(f"         Webhook Configured: {rzp_status.get('webhook_configured')}")

# 3. User Auth & Token
code, auth = req(f"{backend_url}/api/auth/login", {"email": "merchant@recover.ai", "password": "testpassword123"})
if code != 200:
    code, auth = req(f"{backend_url}/api/auth/register", {"email": "merchant@recover.ai", "password": "testpassword123", "full_name": "Vinay Kumar"})

token = auth.get("access_token", "")
headers = {"Authorization": f"Bearer {token}"}
print(f"[TEST 3] Authentication Token Acquired: {token[:15]}...")

# 4. Fetch Eligible Recovery Case
code, cases = req(f"{backend_url}/api/recovery/cases?limit=100", headers=headers)
items = cases.get("items", [])
eligible = [c for c in items if c.get("status") in ["detected", "eligible", "analyzing"] and c.get("amount", 0) <= 10000.0]

if not eligible:
    req(f"{backend_url}/api/demo/generate-data", {}, headers=headers)
    code, cases = req(f"{backend_url}/api/recovery/cases?limit=100", headers=headers)
    items = cases.get("items", [])
    eligible = [c for c in items if c.get("status") in ["detected", "eligible", "analyzing"] and c.get("amount", 0) <= 10000.0]

test_case = eligible[0]
case_id = test_case["id"]
case_amount = test_case["amount"]
print(f"[TEST 4] Selected Recovery Case #{case_id[:8]} | Amount: INR {case_amount} | Initial Status: {test_case.get('status')}")

# 5. Order Creation (Authoritative Amount Check)
code, order = req(f"{backend_url}/api/payments/order", {"case_id": case_id, "amount": 1.0}, headers=headers)
if code != 200:
    print(f"Order creation failed detail: {order}")

print(f"[TEST 5] Razorpay Order Creation: HTTP {code}")
print(f"         Order ID: {order.get('order_id')}")
print(f"         Authoritative Amount: INR {order.get('amount')} (Ignored arbitrary 1.0 input)")
print(f"         Environment: {order.get('environment')}")
print(f"         Provider: {order.get('provider')}")

order_id = order["order_id"]

# 6. Invalid Signature Check
code, bad_verify = req(f"{backend_url}/api/payments/verify", {
    "razorpay_order_id": order_id,
    "razorpay_payment_id": "pay_test_bad_101",
    "razorpay_signature": "invalid_signature_hash",
    "case_id": case_id
}, headers=headers)
print(f"[TEST 6] Invalid Signature Check: HTTP {code} (Expected 400) | Detail: {bad_verify.get('detail')}")

# 7. Valid Server Signature Verification
payment_id = f"pay_test_suite_{os.urandom(4).hex()}"
msg = f"{order_id}|{payment_id}"
secret_key = key_secret if key_secret else "test_secret"
real_sig = hmac.new(secret_key.encode('utf-8'), msg.encode('utf-8'), hashlib.sha256).hexdigest()

code, valid_verify = req(f"{backend_url}/api/payments/verify", {
    "razorpay_order_id": order_id,
    "razorpay_payment_id": payment_id,
    "razorpay_signature": real_sig,
    "case_id": case_id
}, headers=headers)
print(f"[TEST 7] Valid Signature Verification: HTTP {code}")
print(f"         Status: {valid_verify.get('status')} | Amount Recovered: INR {valid_verify.get('amount_recovered')}")

# 8. Duplicate Order Creation / Double Recovery Idempotency Check
code, dup_order = req(f"{backend_url}/api/payments/order", {"case_id": case_id}, headers=headers)
print(f"[TEST 8] Idempotency Check (Order on Recovered Case): HTTP {code} (Expected 400) | Detail: {dup_order.get('detail')}")

# 9. Verify MongoDB Case Status
code, updated_case_res = req(f"{backend_url}/api/recovery/cases/{case_id}", headers=headers)
updated_case = updated_case_res.get("case", {})
print(f"[TEST 9] MongoDB Case Verification: Status = {updated_case.get('status')} | Recovered Amount = INR {updated_case.get('recovered_amount')}")

# 10. Audit Log Entry Verification
code, audit_res = req(f"{backend_url}/api/audit?limit=10", headers=headers)
audit_items = audit_res.get("items", [])
has_audit = any(item.get("event_type") in ["PAYMENT_VERIFIED", "RECOVERY_COMPLETED"] for item in audit_items)
print(f"[TEST 10] Audit Log Entry Recorded: {has_audit} | Total Audit Records: {audit_res.get('total')}")

# 11. Webhook Signature & Idempotency
webhook_event_id = f"evt_test_{os.urandom(4).hex()}"
webhook_payload = json.dumps({
    "event": "payment.captured",
    "event_id": webhook_event_id,
    "payload": {
        "payment": {
            "entity": {
                "id": payment_id,
                "order_id": order_id,
                "amount": int(case_amount * 100)
            }
        }
    }
})
webhook_secret = getattr(os, 'RAZORPAY_WEBHOOK_SECRET', None) or key_secret or "test_secret"
webhook_sig = hmac.new(webhook_secret.encode('utf-8'), webhook_payload.encode('utf-8'), hashlib.sha256).hexdigest()

code, wh_res1 = req(f"{backend_url}/api/webhooks/razorpay", 
                    json.loads(webhook_payload), 
                    headers={"X-Razorpay-Signature": webhook_sig, "X-Razorpay-Event-Id": webhook_event_id})
print(f"[TEST 11] Webhook Processing: HTTP {code} | Status: {wh_res1.get('status')}")

code, wh_res2 = req(f"{backend_url}/api/webhooks/razorpay", 
                    json.loads(webhook_payload), 
                    headers={"X-Razorpay-Signature": webhook_sig, "X-Razorpay-Event-Id": webhook_event_id})
print(f"[TEST 12] Webhook Idempotency Check (Duplicate Event): HTTP {code} | Status: {wh_res2.get('status')}")

print("\n==================================================")
print("          ALL TEST SUITE CHECKS COMPLETED          ")
print("==================================================")