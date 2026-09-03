import random
import uuid
from datetime import datetime, timedelta, timezone
import inspect

async def generate_demo_data(merchant_id: str, db) -> dict:
    from app.db.mongodb import db_client, AsyncMockDatabase
    
    if db is None or inspect.isasyncgen(db):
        db = db_client.db if db_client.db is not None else AsyncMockDatabase()

    # Clear existing demo data cleanly
    await db["customers"].delete_many({"merchant_id": merchant_id})
    await db["transactions"].delete_many({"merchant_id": merchant_id})
    await db["recovery_cases"].delete_many({"merchant_id": merchant_id})
    await db["recovery_actions"].delete_many({"merchant_id": merchant_id})
    await db["audit_logs"].delete_many({"merchant_id": merchant_id})
    await db["notifications"].delete_many({"merchant_id": merchant_id})
    await db["promises_to_pay"].delete_many({"merchant_id": merchant_id})

    total_tx = 300
    success_count = int(total_tx * 0.6)
    failed_count = int(total_tx * 0.2)
    abandoned_count = int(total_tx * 0.1)
    sub_fail_count = int(total_tx * 0.05)
    overdue_count = total_tx - (success_count + failed_count + abandoned_count + sub_fail_count)
    
    now = datetime.now(timezone.utc)
    customers = []
    
    # 1. Generate Customer Profiles
    for i in range(50):
        cust_id = str(uuid.uuid4())
        customers.append({
            "id": cust_id,
            "merchant_id": merchant_id,
            "name": f"Enterprise Customer {i+1}",
            "email": f"customer_{i+1}@example.com",
            "phone": "+91987654" + str(1000 + i),
            "total_transactions": 0,
            "successful_transactions": 0,
            "failed_transactions": 0,
            "created_at": now - timedelta(days=random.randint(30, 365))
        })

    transactions = []
    statuses = (
        ["success"] * success_count +
        ["failed"] * failed_count +
        ["abandoned"] * abandoned_count +
        ["subscription_failed"] * sub_fail_count +
        ["overdue"] * overdue_count
    )
    random.shuffle(statuses)

    failure_reasons = ["insufficient_funds", "card_declined", "authentication_failed", "network_error", "bank_unavailable", "expired_card"]
    checkout_stages = ["initiated", "payment_page", "otp_sent", "otp_verified", "processing"]
    payment_methods = ["card", "upi", "netbanking", "wallet", "emi"]
    amounts = [99.0, 499.0, 999.0, 1499.0, 2499.0, 3500.0, 4999.0, 7999.0, 12500.0, 15000.0, 25000.0, 49999.0]

    for i, status in enumerate(statuses):
        cust = random.choice(customers)
        tx_id = f"tx_demo_{uuid.uuid4().hex[:12]}"
        order_id = f"order_{uuid.uuid4().hex[:14]}"
        created_at = now - timedelta(days=random.randint(0, 30), hours=random.randint(0, 23), minutes=random.randint(0, 59))
        amount = random.choice(amounts)
        payment_method = random.choice(payment_methods)

        is_sub = status == "subscription_failed" or (random.random() < 0.15)
        
        tx = {
            "id": tx_id,
            "merchant_id": merchant_id,
            "customer_id": cust["id"],
            "order_id": order_id,
            "razorpay_payment_id": f"pay_{uuid.uuid4().hex[:14]}" if status == "success" else None,
            "amount": amount,
            "currency": "INR",
            "status": "failed" if status in ["failed", "abandoned", "subscription_failed", "overdue"] else "success",
            "payment_method": payment_method,
            "failure_reason": random.choice(failure_reasons) if status != "success" else None,
            "checkout_stage": random.choice(checkout_stages) if status == "abandoned" else None,
            "retry_count": random.randint(0, 2) if status != "success" else 0,
            "is_subscription": is_sub,
            "subscription_id": f"sub_{uuid.uuid4().hex[:10]}" if is_sub else None,
            "customer_email": cust["email"],
            "customer_phone": cust["phone"],
            "created_at": created_at,
            "updated_at": created_at
        }
        transactions.append(tx)

    await db["customers"].insert_many(customers)
    await db["transactions"].insert_many(transactions)

    # 2. Prepend 5 CANONICAL DEMO CASES for Hackathon Review
    canonical_cases = [
        # Demo Case 1 — Payment Failure Recovery (₹4,999)
        {
            "id": "demo_case_1_payment_fail",
            "transaction_id": "tx_demo_case1",
            "merchant_id": merchant_id,
            "customer_id": customers[0]["id"],
            "customer_name": "Rahul Sharma",
            "amount": 4999.0,
            "currency": "INR",
            "status": "eligible",
            "priority": "high",
            "failure_type": "payment_failure",
            "recovery_probability": 0.89,
            "ai_diagnosis": "Transient payment gateway network error during OTP submission.",
            "recommended_action": "retry",
            "ai_explanation": "High recovery probability + transient network decline. Retry eligible under Policy #1.",
            "policy_result": {"allowed": True, "checks": [{"name": "max_retries", "passed": True}]},
            "retry_count": 0,
            "max_retries": 3,
            "recovery_window_start": now,
            "recovery_window_end": now + timedelta(days=7),
            "recovered_amount": 0.0,
            "created_at": now - timedelta(minutes=45),
            "updated_at": now - timedelta(minutes=45)
        },
        # Demo Case 2 — Checkout Abandonment (₹2,499)
        {
            "id": "demo_case_2_checkout_abandon",
            "transaction_id": "tx_demo_case2",
            "merchant_id": merchant_id,
            "customer_id": customers[1]["id"],
            "customer_name": "Priya Patel",
            "amount": 2499.0,
            "currency": "INR",
            "status": "eligible",
            "priority": "medium",
            "failure_type": "checkout_abandonment",
            "recovery_probability": 0.78,
            "ai_diagnosis": "Customer abandoned checkout on final payment confirmation page.",
            "recommended_action": "reminder",
            "ai_explanation": "Cart abandonment detected. Send payment link reminder via WhatsApp/SMS.",
            "policy_result": {"allowed": True, "checks": [{"name": "max_retries", "passed": True}]},
            "retry_count": 0,
            "max_retries": 3,
            "recovery_window_start": now,
            "recovery_window_end": now + timedelta(days=7),
            "recovered_amount": 0.0,
            "created_at": now - timedelta(hours=2),
            "updated_at": now - timedelta(hours=2)
        },
        # Demo Case 3 — Failed Subscription (₹1,999)
        {
            "id": "demo_case_3_sub_fail",
            "transaction_id": "tx_demo_case3",
            "merchant_id": merchant_id,
            "customer_id": customers[2]["id"],
            "customer_name": "Amit Kumar",
            "amount": 1999.0,
            "currency": "INR",
            "status": "eligible",
            "priority": "medium",
            "failure_type": "subscription_failure",
            "recovery_probability": 0.85,
            "ai_diagnosis": "Recurring card mandate renewal failed due to temporary bank unavailability.",
            "recommended_action": "retry",
            "ai_explanation": "Auto-retry mandate sequence recommended after salary cycle delay.",
            "policy_result": {"allowed": True, "checks": [{"name": "max_retries", "passed": True}]},
            "retry_count": 1,
            "max_retries": 3,
            "recovery_window_start": now,
            "recovery_window_end": now + timedelta(days=7),
            "recovered_amount": 0.0,
            "created_at": now - timedelta(hours=5),
            "updated_at": now - timedelta(hours=5)
        },
        # Demo Case 4 — B2B Receivable (₹85,000)
        {
            "id": "demo_case_4_b2b_overdue",
            "transaction_id": "tx_demo_case4",
            "merchant_id": merchant_id,
            "customer_id": customers[3]["id"],
            "customer_name": "ABC Tech Solutions Pvt Ltd",
            "amount": 85000.0,
            "currency": "INR",
            "status": "eligible",
            "priority": "critical",
            "failure_type": "overdue_receivable",
            "recovery_probability": 0.92,
            "ai_diagnosis": "B2B Invoice #INV-1042 overdue by 5 days. Promise-to-Pay workflow recommended.",
            "recommended_action": "manual_review",
            "ai_explanation": "High-value B2B receivable. Capture payment commitment date or escalate.",
            "policy_result": {"allowed": True, "checks": [{"name": "max_retries", "passed": True}]},
            "retry_count": 0,
            "max_retries": 3,
            "recovery_window_start": now,
            "recovery_window_end": now + timedelta(days=7),
            "recovered_amount": 0.0,
            "created_at": now - timedelta(days=1),
            "updated_at": now - timedelta(days=1)
        },
        # Demo Case 5 — High Value Case (₹1,00,000)
        {
            "id": "demo_case_5_high_value",
            "transaction_id": "tx_demo_case5",
            "merchant_id": merchant_id,
            "customer_id": customers[4]["id"],
            "customer_name": "Apex Global Logistics",
            "amount": 100000.0,
            "currency": "INR",
            "status": "manual_review",
            "priority": "critical",
            "failure_type": "payment_failure",
            "recovery_probability": 0.94,
            "ai_diagnosis": "Transaction amount (₹1,00,000) exceeds automated threshold (≥ ₹10,000).",
            "recommended_action": "manual_review",
            "ai_explanation": "Policy Engine blocked automated retries. Merchant Manager review required prior to payment processing.",
            "policy_result": {"allowed": False, "reason": "Amount exceeds high-value threshold (₹10,000)"},
            "retry_count": 0,
            "max_retries": 3,
            "recovery_window_start": now,
            "recovery_window_end": now + timedelta(days=7),
            "recovered_amount": 0.0,
            "created_at": now - timedelta(hours=1),
            "updated_at": now - timedelta(hours=1)
        }
    ]

    # Pre-seed one Promise-to-Pay for Demo Case 4
    await db["promises_to_pay"].insert_one({
        "id": "p2p_demo_case4",
        "promise_id": "p2p_demo_case4",
        "case_id": "demo_case_4_b2b_overdue",
        "merchant_id": merchant_id,
        "customer_id": customers[3]["id"],
        "invoice_id": "INV-1042",
        "customer_name": "ABC Tech Solutions Pvt Ltd",
        "amount": 85000.0,
        "promised_date": now + timedelta(days=3),
        "status": "promised",
        "payment_received_at": None,
        "escalation_status": "none",
        "notes": "Client promised payment settlement by 08 Sep upon invoice verification.",
        "created_at": now,
        "updated_at": now
    })

    # 3. Generate Remaining Cases
    at_risk_txs = [t for t in transactions if t["status"] == "failed"]
    recovery_cases = list(canonical_cases)
    audit_logs = []

    failure_types = ["payment_failure", "checkout_abandonment", "subscription_failure", "overdue_receivable"]

    for tx in at_risk_txs:
        case_id = f"case_{uuid.uuid4().hex[:12]}"
        prob = round(random.uniform(0.45, 0.96), 2)
        
        if tx["amount"] >= 10000:
            priority = "critical" if tx["amount"] >= 25000 else "high"
        else:
            priority = "medium" if tx["amount"] >= 2000 else "low"

        c_status = random.choice(["detected", "eligible", "recovery_in_progress", "recovered", "stopped", "manual_review"])
        f_type = random.choice(failure_types)

        case = {
            "id": case_id,
            "transaction_id": tx["id"],
            "merchant_id": merchant_id,
            "customer_id": tx["customer_id"],
            "amount": tx["amount"],
            "currency": "INR",
            "status": c_status,
            "priority": priority,
            "failure_type": f_type,
            "recovery_probability": prob,
            "ai_diagnosis": f"Failure due to {tx.get('failure_reason') or 'network timeout'}. High recovery probability detected.",
            "recommended_action": "retry" if prob > 0.7 else "alternate_payment",
            "ai_explanation": f"Automated intervention recommended based on customer score {prob}.",
            "policy_result": {"allowed": True, "checks": [{"name": "max_retries", "passed": True}]},
            "retry_count": 1 if c_status in ["recovery_in_progress", "recovered"] else 0,
            "max_retries": 3,
            "recovery_window_start": tx["created_at"],
            "recovery_window_end": tx["created_at"] + timedelta(days=7),
            "recovered_amount": tx["amount"] if c_status == "recovered" else 0.0,
            "recovered_at": tx["created_at"] + timedelta(hours=2) if c_status == "recovered" else None,
            "created_at": tx["created_at"],
            "updated_at": tx["created_at"]
        }
        recovery_cases.append(case)

        audit_logs.append({
            "id": f"aud_{uuid.uuid4().hex[:10]}",
            "merchant_id": merchant_id,
            "case_id": case_id,
            "transaction_id": tx["id"],
            "event_type": "case_detected",
            "actor": "ai_engine",
            "description": f"Recovery case {case_id} flagged with priority {priority}",
            "timestamp": tx["created_at"]
        })

    if recovery_cases:
        await db["recovery_cases"].insert_many(recovery_cases)
        await db["audit_logs"].insert_many(audit_logs)

    return {"status": "success", "transactions_generated": len(transactions), "cases_generated": len(recovery_cases)}