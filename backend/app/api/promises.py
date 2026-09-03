from fastapi import APIRouter, Depends, HTTPException, Query
from typing import Optional, List
from datetime import datetime, timezone
import uuid

from app.db.mongodb import get_database
from app.middleware.auth import get_optional_current_user
from app.models.promise import PromiseToPayCreate, PromiseStatus

router = APIRouter()

@router.post("")
@router.post("/")
async def create_promise(
    req: PromiseToPayCreate,
    user: Optional[dict] = Depends(get_optional_current_user),
    db = Depends(get_database)
):
    user_dict = user or {"id": "demo_user", "email": "merchant@recover.ai", "merchant_id": "demo_merchant_1"}
    merchant_id = user_dict.get("merchant_id", "demo_merchant_1")
    
    promise_id = f"p2p_{uuid.uuid4().hex[:8]}"
    doc = {
        "id": promise_id,
        "promise_id": promise_id,
        "case_id": req.case_id,
        "merchant_id": merchant_id,
        "customer_id": req.customer_id or f"cust_{uuid.uuid4().hex[:8]}",
        "invoice_id": req.invoice_id or f"INV-{uuid.uuid4().hex[:6].upper()}",
        "customer_name": req.customer_name or "B2B Enterprise Merchant",
        "amount": req.amount,
        "promised_date": req.promised_date,
        "status": PromiseStatus.PROMISED.value,
        "payment_received_at": None,
        "escalation_status": "none",
        "notes": req.notes,
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc)
    }
    
    await db["promises_to_pay"].insert_one(doc)
    
    # Audit log
    await db["audit_logs"].insert_one({
        "id": str(uuid.uuid4()),
        "merchant_id": merchant_id,
        "case_id": req.case_id,
        "event_type": "PROMISE_CREATED",
        "actor": "user",
        "description": f"Created Promise-to-Pay for ₹{req.amount:,.2f} due on {req.promised_date.strftime('%b %d, %Y')}",
        "metadata": {"promise_id": promise_id, "amount": req.amount},
        "timestamp": datetime.now(timezone.utc)
    })
    
    # Update case status
    await db["recovery_cases"].update_one(
        {"$or": [{"id": req.case_id}]},
        {"$set": {"status": "in_progress", "updated_at": datetime.now(timezone.utc)}}
    )
    
    if "_id" in doc:
        doc["_id"] = str(doc["_id"])
    return doc

@router.get("")
@router.get("/")
async def list_promises(
    status: Optional[str] = None,
    limit: int = Query(50, le=100),
    user: Optional[dict] = Depends(get_optional_current_user),
    db = Depends(get_database)
):
    user_dict = user or {"id": "demo_user", "email": "merchant@recover.ai", "merchant_id": "demo_merchant_1"}
    merchant_id = user_dict.get("merchant_id", "demo_merchant_1")
    
    query = {"merchant_id": merchant_id}
    if status:
        query["status"] = status
        
    promises_raw = await db["promises_to_pay"].find(query).sort("promised_date", 1).limit(limit).to_list(length=limit)
    
    if not promises_raw:
        # Fallback to general list if empty
        promises_raw = await db["promises_to_pay"].find({}).sort("promised_date", 1).limit(limit).to_list(length=limit)
        
    promises = []
    for p in promises_raw:
        if "_id" in p:
            p["_id"] = str(p["_id"])
        if "id" not in p:
            p["id"] = p.get("promise_id", str(p.get("_id")))
        promises.append(p)
        
    return {"total": len(promises), "items": promises}

@router.post("/{id}/payment")
async def record_promise_payment(
    id: str,
    user: Optional[dict] = Depends(get_optional_current_user),
    db = Depends(get_database)
):
    user_dict = user or {"id": "demo_user", "email": "merchant@recover.ai", "merchant_id": "demo_merchant_1"}
    merchant_id = user_dict.get("merchant_id", "demo_merchant_1")
    
    promise = await db["promises_to_pay"].find_one({"$or": [{"id": id}, {"promise_id": id}]})
    if not promise:
        raise HTTPException(status_code=404, detail="Promise record not found")
        
    amount = promise.get("amount", 0.0)
    case_id = promise.get("case_id")
    
    # Mark PROMISE as PAID
    now = datetime.now(timezone.utc)
    filter_q = {"_id": promise["_id"]} if "_id" in promise else {"id": id}
    await db["promises_to_pay"].update_one(
        filter_q,
        {"$set": {
            "status": PromiseStatus.PAID.value,
            "payment_received_at": now,
            "updated_at": now
        }}
    )
    
    # Update associated case to RECOVERED (Verified Revenue!)
    if case_id:
        await db["recovery_cases"].update_one(
            {"$or": [{"id": case_id}]},
            {"$set": {
                "status": "recovered",
                "recovered_amount": amount,
                "recovered_at": now,
                "updated_at": now
            }}
        )
        
    # Audit Event: PROMISE_PAID & RECOVERY_COMPLETED
    await db["audit_logs"].insert_one({
        "id": str(uuid.uuid4()),
        "merchant_id": merchant_id,
        "case_id": case_id,
        "event_type": "PROMISE_PAID",
        "actor": "system",
        "description": f"Promise-to-Pay fulfilled! Verified ₹{amount:,.2f} received.",
        "metadata": {"promise_id": id, "amount": amount},
        "timestamp": now
    })
    
    return {"success": True, "status": "paid", "amount_recovered": amount}

@router.post("/{id}/miss")
async def mark_promise_missed(
    id: str,
    user: Optional[dict] = Depends(get_optional_current_user),
    db = Depends(get_database)
):
    user_dict = user or {"id": "demo_user", "email": "merchant@recover.ai", "merchant_id": "demo_merchant_1"}
    merchant_id = user_dict.get("merchant_id", "demo_merchant_1")
    
    promise = await db["promises_to_pay"].find_one({"$or": [{"id": id}, {"promise_id": id}]})
    if not promise:
        raise HTTPException(status_code=404, detail="Promise record not found")
        
    now = datetime.now(timezone.utc)
    filter_q = {"_id": promise["_id"]} if "_id" in promise else {"id": id}
    
    await db["promises_to_pay"].update_one(
        filter_q,
        {"$set": {
            "status": PromiseStatus.MISSED.value,
            "escalation_status": "escalated_to_account_manager",
            "updated_at": now
        }}
    )
    
    case_id = promise.get("case_id")
    if case_id:
        await db["recovery_cases"].update_one(
            {"$or": [{"id": case_id}]},
            {"$set": {"status": "manual_review", "updated_at": now}}
        )
        
    # Audit Event: PROMISE_MISSED
    await db["audit_logs"].insert_one({
        "id": str(uuid.uuid4()),
        "merchant_id": merchant_id,
        "case_id": case_id,
        "event_type": "PROMISE_MISSED",
        "actor": "system",
        "description": f"Promise-to-Pay date passed without payment! Auto-escalated to Account Manager.",
        "metadata": {"promise_id": id, "amount": promise.get("amount")},
        "timestamp": now
    })
    
    return {"success": True, "status": "missed", "escalation": "escalated_to_account_manager"}

@router.post("/{id}/escalate")
async def escalate_promise(
    id: str,
    user: Optional[dict] = Depends(get_optional_current_user),
    db = Depends(get_database)
):
    user_dict = user or {"id": "demo_user", "email": "merchant@recover.ai", "merchant_id": "demo_merchant_1"}
    merchant_id = user_dict.get("merchant_id", "demo_merchant_1")
    
    promise = await db["promises_to_pay"].find_one({"$or": [{"id": id}, {"promise_id": id}]})
    if not promise:
        raise HTTPException(status_code=404, detail="Promise record not found")
        
    now = datetime.now(timezone.utc)
    filter_q = {"_id": promise["_id"]} if "_id" in promise else {"id": id}
    
    await db["promises_to_pay"].update_one(
        filter_q,
        {"$set": {
            "status": PromiseStatus.ESCALATED.value,
            "escalation_status": "manual_review_required",
            "updated_at": now
        }}
    )
    
    return {"success": True, "status": "escalated"}
