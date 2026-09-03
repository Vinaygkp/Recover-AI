from fastapi import APIRouter, Request, HTTPException, status, Depends
from datetime import datetime
import json
import uuid
from app.config import settings
from app.db.mongodb import get_database
from app.services.razorpay import RazorpayService

router = APIRouter()

@router.post("/razorpay")
async def razorpay_webhook(request: Request, db = Depends(get_database)):
    payload = await request.body()
    signature = request.headers.get("X-Razorpay-Signature")
    event_id = request.headers.get("X-Razorpay-Event-Id")
    
    if not signature:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="Missing X-Razorpay-Signature header"
        )
        
    razorpay_service = RazorpayService()
    secret = getattr(settings, 'RAZORPAY_WEBHOOK_SECRET', None) or getattr(settings, 'RAZORPAY_KEY_SECRET', None) or "test_secret"
    
    # 1. Verify HMAC SHA256 Signature on RAW Request Body
    if razorpay_service.is_configured() and not razorpay_service.verify_webhook_signature(payload.decode('utf-8'), signature, secret):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="Invalid webhook signature"
        )
        
    try:
        data = json.loads(payload.decode('utf-8'))
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="Invalid JSON payload"
        )
        
    event_type = data.get("event", "unknown")
    event_id = event_id or data.get("event_id") or str(uuid.uuid4())
    
    # 2. Idempotency Check: Prevent duplicate webhook processing
    existing = await db["webhook_events"].find_one({"event_id": event_id})
    if existing:
        return {"status": "already_processed", "event_id": event_id}
        
    # Store event ID to guarantee idempotency
    await db["webhook_events"].insert_one({
        "event_id": event_id,
        "event_type": event_type,
        "received_at": datetime.utcnow()
    })
    
    # Extract payment / order payload safely
    payload_entity = data.get("payload", {})
    payment_entity = payload_entity.get("payment", {}).get("entity", {})
    order_entity = payload_entity.get("order", {}).get("entity", {})
    
    order_id = payment_entity.get("order_id") or order_entity.get("id")
    payment_id = payment_entity.get("id")
    amount = float(payment_entity.get("amount", 0)) / 100.0 if payment_entity.get("amount") else 0.0

    # Handle Event Types
    if event_type in ["payment.captured", "payment.authorized", "order.paid"]:
        # Mark transaction and recovery case as recovered
        if order_id:
            await db["transactions"].update_one(
                {"order_id": order_id},
                {"$set": {"status": "success", "razorpay_payment_id": payment_id, "updated_at": datetime.utcnow()}}
            )
            case = await db["recovery_cases"].find_one({"transaction_id": order_id})
            if case:
                case_id_str = str(case.get("id") or case.get("_id"))
                await db["recovery_cases"].update_one(
                    {"_id": case["_id"] if "_id" in case else {"$in": []}},
                    {"$set": {
                        "status": "recovered",
                        "recovered_amount": case.get("amount", amount),
                        "recovered_at": datetime.utcnow(),
                        "updated_at": datetime.utcnow()
                    }}
                )
                await db["audit_logs"].insert_one({
                    "id": str(uuid.uuid4()),
                    "merchant_id": case.get("merchant_id"),
                    "case_id": case_id_str,
                    "event_type": "webhook_payment_success",
                    "actor": "razorpay",
                    "description": f"Webhook {event_type} confirmed payment for order {order_id}",
                    "timestamp": datetime.utcnow()
                })
    elif event_type == "payment.failed":
        if order_id:
            await db["transactions"].update_one(
                {"order_id": order_id},
                {"$set": {"status": "failed", "failure_reason": payment_entity.get("error_description", "card_declined"), "updated_at": datetime.utcnow()}}
            )

    return {"status": "processed", "event_id": event_id, "event_type": event_type}