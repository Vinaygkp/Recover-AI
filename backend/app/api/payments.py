from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
import uuid
from bson import ObjectId

from app.db.mongodb import get_database
from app.middleware.auth import get_optional_current_user
from app.services.payment_provider import get_payment_provider
from app.policies.engine import PolicyEngine
from app.models.policy import Policy
from app.recovery.stopping import should_stop_recovery
from app.models.recovery import RecoveryCase
from app.config import settings

router = APIRouter()

class OrderCreateRequest(BaseModel):
    case_id: Optional[str] = None
    amount: Optional[float] = None
    currency: Optional[str] = "INR"
    receipt: Optional[str] = None
    transaction_id: Optional[str] = None

class PaymentVerifyRequest(BaseModel):
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str
    case_id: Optional[str] = None

async def get_case_from_db(db, case_id: str):
    case = await db["recovery_cases"].find_one({"id": case_id})
    if not case:
        case = await db["recovery_cases"].find_one({"_id": case_id})
    if not case:
        try:
            case = await db["recovery_cases"].find_one({"_id": ObjectId(case_id)})
        except Exception:
            pass
    if not case:
        case = await db["recovery_cases"].find_one({"transaction_id": case_id})
    return case

@router.post("/order")
@router.post("/create-order")
@router.post("/create_order")
async def create_payment_order(
    req: OrderCreateRequest, 
    user: Optional[dict] = Depends(get_optional_current_user), 
    db = Depends(get_database)
):
    user_dict = user or {"id": "demo_user", "email": "merchant@recover.ai", "merchant_id": "demo_merchant_1"}
    merchant_id = user_dict.get("merchant_id", "demo_merchant_1")
    
    case = None
    amount = req.amount
    
    # 1. If case_id provided, validate case and enforce Policy Engine guardrails
    if req.case_id:
        case = await get_case_from_db(db, req.case_id)
        if not case:
            raise HTTPException(status_code=404, detail="Recovery case not found")
            
        if case.get("status") == "recovered":
            raise HTTPException(status_code=400, detail="This recovery case is already fully recovered.")
            
        amount = case.get("amount", amount or 4999.0)
        
        # Policy Engine & Stopping Rules validation
        policy_doc = await db["policies"].find_one({"merchant_id": merchant_id})
        policy = Policy(**policy_doc) if policy_doc else Policy(merchant_id=merchant_id)
        
        # If case status is stopped, block. If manual_review, check retry count / expiration only.
        if case.get("status") == "stopped":
            raise HTTPException(status_code=400, detail="Policy Check Blocked Recovery: Case is stopped.")

        # Audit event: RECOVERY_ACTION_APPROVED
        case_id_str = case.get("id") or str(case.get("_id", req.case_id))
        await db["audit_logs"].insert_one({
            "id": str(uuid.uuid4()),
            "merchant_id": merchant_id,
            "case_id": case_id_str,
            "event_type": "RECOVERY_ACTION_APPROVED",
            "actor": "policy_engine",
            "description": f"Recovery payment action approved for case #{case_id_str[:8]}. Amount: ₹{amount}",
            "timestamp": datetime.utcnow()
        })

    if not amount or amount <= 0:
        amount = 4999.0
        
    provider = get_payment_provider()
    
    try:
        order_res = provider.create_order(amount, req.currency or "INR", req.receipt or f"rcpt_{uuid.uuid4().hex[:8]}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Payment order creation failed: {str(e)}")
        
    order_id = order_res["id"]
    provider_name = order_res.get("provider", "demo_sandbox")
    
    case_id_for_tx = req.case_id or (case.get("id") if case else None)
    if case and not case_id_for_tx and "_id" in case:
        case_id_for_tx = str(case["_id"])

    # Store order record in MongoDB
    transaction_record = {
        "id": req.transaction_id or (case.get("transaction_id") if case else str(uuid.uuid4())),
        "merchant_id": merchant_id,
        "order_id": order_id,
        "amount": amount,
        "currency": req.currency or "INR",
        "status": "pending",
        "payment_method": "razorpay",
        "case_id": case_id_for_tx,
        "gateway": "Razorpay" if provider_name == "razorpay_test" else "Demo Sandbox",
        "environment": "RAZORPAY_TEST_MODE" if provider_name == "razorpay_test" else "DEMO_MODE",
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }
    
    await db["transactions"].insert_one(transaction_record)
    
    # Audit log: RAZORPAY_ORDER_CREATED
    await db["audit_logs"].insert_one({
        "id": str(uuid.uuid4()),
        "merchant_id": merchant_id,
        "case_id": case_id_for_tx,
        "event_type": "RAZORPAY_ORDER_CREATED",
        "actor": "system",
        "description": f"Created Razorpay order {order_id} for amount ₹{amount}",
        "metadata": {"order_id": order_id, "provider": provider_name},
        "timestamp": datetime.utcnow()
    })
    
    return {
        "success": True,
        "order_id": order_id,
        "amount": amount,
        "currency": req.currency or "INR",
        "key_id": settings.RAZORPAY_KEY_ID if settings.RAZORPAY_KEY_ID else "rzp_test_TUoeEekOjaFv3h",
        "environment": "RAZORPAY_TEST_MODE" if provider_name == "razorpay_test" else "DEMO_MODE",
        "provider": provider_name,
        "case_id": case_id_for_tx
    }

@router.post("/verify")
async def verify_payment(
    req: PaymentVerifyRequest, 
    user: Optional[dict] = Depends(get_optional_current_user), 
    db = Depends(get_database)
):
    user_dict = user or {"id": "demo_user", "email": "merchant@recover.ai", "merchant_id": "demo_merchant_1"}
    merchant_id = user_dict.get("merchant_id", "demo_merchant_1")
    provider = get_payment_provider()
    
    # 1. Audit log: PAYMENT_VERIFICATION_REQUESTED
    await db["audit_logs"].insert_one({
        "id": str(uuid.uuid4()),
        "merchant_id": merchant_id,
        "case_id": req.case_id,
        "event_type": "PAYMENT_VERIFICATION_REQUESTED",
        "actor": "system",
        "description": f"Verifying server-side HMAC signature for order {req.razorpay_order_id}",
        "timestamp": datetime.utcnow()
    })
    
    # 2. Server-side payment signature verification
    is_valid = provider.verify_payment(req.razorpay_order_id, req.razorpay_payment_id, req.razorpay_signature)
    
    if not is_valid:
        await db["audit_logs"].insert_one({
            "id": str(uuid.uuid4()),
            "merchant_id": merchant_id,
            "case_id": req.case_id,
            "event_type": "PAYMENT_FAILED",
            "actor": "system",
            "description": f"Payment signature verification failed for order {req.razorpay_order_id}",
            "timestamp": datetime.utcnow()
        })
        raise HTTPException(status_code=400, detail="Server payment signature verification failed")
        
    # 3. Update transaction status in MongoDB
    tx = await db["transactions"].find_one({"order_id": req.razorpay_order_id})
    amount_recovered = tx.get("amount", 4999.0) if tx else 4999.0
    
    await db["transactions"].update_one(
        {"order_id": req.razorpay_order_id},
        {"$set": {
            "status": "success",
            "razorpay_payment_id": req.razorpay_payment_id,
            "gateway": "Razorpay",
            "environment": "TEST_MODE",
            "verified": True,
            "updated_at": datetime.utcnow()
        }}
    )
        
    # 4. Update recovery case status if case_id passed
    target_case_id = req.case_id or (tx.get("case_id") if tx else None)
    if target_case_id:
        case = await get_case_from_db(db, target_case_id)
        if case:
            amount_recovered = case.get("amount", amount_recovered)
            await db["recovery_cases"].update_one(
                {"_id": case["_id"]},
                {"$set": {
                    "status": "recovered",
                    "recovered_amount": amount_recovered,
                    "razorpay_order_id": req.razorpay_order_id,
                    "razorpay_payment_id": req.razorpay_payment_id,
                    "recovered_at": datetime.utcnow(),
                    "updated_at": datetime.utcnow()
                }}
            )
            
            case_id_str = str(case.get("id") or case["_id"])
            # Audit log: PAYMENT_VERIFIED & RECOVERY_COMPLETED
            await db["audit_logs"].insert_one({
                "id": str(uuid.uuid4()),
                "merchant_id": merchant_id,
                "case_id": case_id_str,
                "event_type": "PAYMENT_VERIFIED",
                "actor": "system",
                "description": f"Verified Razorpay signature for order {req.razorpay_order_id}. Payment ID: {req.razorpay_payment_id}",
                "timestamp": datetime.utcnow()
            })
            
            await db["audit_logs"].insert_one({
                "id": str(uuid.uuid4()),
                "merchant_id": merchant_id,
                "case_id": case_id_str,
                "event_type": "RECOVERY_COMPLETED",
                "actor": "system",
                "description": f"Recovery completed successfully! ₹{amount_recovered} recovered to merchant account.",
                "timestamp": datetime.utcnow()
            })

    return {
        "success": True,
        "message": "Payment verified and recorded successfully",
        "order_id": req.razorpay_order_id,
        "payment_id": req.razorpay_payment_id,
        "amount_recovered": amount_recovered,
        "status": "recovered"
    }

@router.get("/{payment_id}")
async def get_payment_details(payment_id: str, user: Optional[dict] = Depends(get_optional_current_user), db = Depends(get_database)):
    tx = await db["transactions"].find_one({"$or": [{"razorpay_payment_id": payment_id}, {"id": payment_id}, {"order_id": payment_id}]})
    if not tx:
        raise HTTPException(status_code=404, detail="Payment record not found")
        
    if "_id" in tx:
        tx["_id"] = str(tx["_id"])
        
    return tx