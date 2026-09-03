import os
import urllib.request
import urllib.error
import json
import hmac
import hashlib
from dotenv import load_dotenv

load_dotenv("backend/.env")
load_dotenv(".env")

BASE_URL = os.getenv("API_BASE_URL", "http://127.0.0.1:8000")
key_secret = os.getenv("RAZORPAY_KEY_SECRET", "test_secret")

def req_json(url, data=None, headers=None):
    if headers is None: 
        headers = {}
    if data:
        encoded = json.dumps(data).encode('utf-8')
        headers['Content-Type'] = 'application/json'
    else:
        encoded = None
    req = urllib.request.Request(url, data=encoded, headers=headers)
    try:
        with urllib.request.urlopen(req) as res:
            return json.loads(res.read().decode('utf-8'))
    except urllib.error.HTTPError as e:
        error_body = e.read().decode('utf-8')
        print(f"HTTP ERROR ({e.code}) for {url}: {error_body}")
        raise e

try:
    print("=== 1. RAZORPAY INTEGRATION STATUS CHECK ===")
    rzp_h = req_json(f"{BASE_URL}/api/integrations/razorpay/status")
    print(json.dumps(rzp_h, indent=2))

    print("\n=== 2. USER LOGIN & TOKEN ===")
    auth = req_json(f"{BASE_URL}/api/auth/login", {"email": "test@demo.com", "password": "testpassword123"})
    token = auth.get("access_token")
    headers = {"Authorization": f"Bearer {token}"}
    print("Login Successful!")

    print("\n=== 3. FETCH ELIGIBLE RECOVERY CASE ===")
    cases_res = req_json(f"{BASE_URL}/api/recovery/cases?limit=100", headers=headers)
    items = cases_res.get("items", [])

    eligible_cases = [
        c for c in items 
        if c.get("status") not in ["recovered", "stopped"] 
        and c.get("amount", 0) <= 10000.0 
        and c.get("retry_count", 0) < 3
    ]

    if not eligible_cases:
        print("No eligible case with retry_count < 3, generating fresh demo dataset...")
        req_json(f"{BASE_URL}/api/demo/generate-data", data={}, headers=headers)
        cases_res = req_json(f"{BASE_URL}/api/recovery/cases?limit=100", headers=headers)
        items = cases_res.get("items", [])
        eligible_cases = [
            c for c in items 
            if c.get("status") not in ["recovered", "stopped"] 
            and c.get("amount", 0) <= 10000.0 
            and c.get("retry_count", 0) < 3
        ]

    if not eligible_cases:
        raise Exception("Could not find or generate any eligible recovery cases.")

    test_case = eligible_cases[0]
    case_id = test_case["id"]
    print(f"Targeting Eligible Case #{case_id[:8]} - Amount: INR {test_case['amount']} - Status: {test_case['status']} - Retries: {test_case.get('retry_count', 0)}")

    print("\n=== 4. TRIGGER RECOVERY PAYMENT ORDER CREATION (POLICY ENGINE CHECK) ===")
    order_res = req_json(f"{BASE_URL}/api/payments/order", {
        "case_id": case_id,
        "amount": test_case["amount"]
    }, headers=headers)
    print("Order Creation Result:")
    print(json.dumps(order_res, indent=2))

    order_id = order_res.get("order_id") or order_res.get("id")
    payment_id = "pay_test_buildathon_101"

    msg = f"{order_id}|{payment_id}"
    real_signature = hmac.new(key_secret.encode('utf-8'), msg.encode('utf-8'), hashlib.sha256).hexdigest()

    print("\n=== 5. EXECUTE SERVER-SIDE PAYMENT SIGNATURE VERIFICATION ===")
    verify_res = req_json(f"{BASE_URL}/api/payments/verify", {
        "razorpay_order_id": order_id,
        "razorpay_payment_id": payment_id,
        "razorpay_signature": real_signature,
        "case_id": case_id
    }, headers=headers)
    print("Verification Result:")
    print(json.dumps(verify_res, indent=2))

    print("\n=== 6. VERIFY RECOVERED CASE STATUS IN MONGO DB ===")
    updated_case = req_json(f"{BASE_URL}/api/recovery/cases/{case_id}", headers=headers)
    case_info = updated_case.get("case", updated_case)
    print(f"Updated Case Status: {case_info.get('status')} - Recovered Amount: INR {case_info.get('recovered_amount')}")

    print("\n=== 7. VERIFY ANALYTICS API RESPONSE ===")
    analytics_res = req_json(f"{BASE_URL}/api/analytics/", headers=headers)
    print(f"Analytics Revenue Trend Points: {len(analytics_res.get('revenue_trend', []))}")
    print(f"Time to Recovery Avg: {analytics_res.get('time_to_recovery', {}).get('avg')}")
    print(f"Time to Recovery Median: {analytics_res.get('time_to_recovery', {}).get('median')}")
    print(f"Intervention Channels: {len(analytics_res.get('recovery_by_intervention', []))}")

except Exception as e:
    print(f"Script execution failed: {e}")