from fastapi import APIRouter, Depends, Query, HTTPException
from bson import ObjectId
import uuid
from datetime import datetime, timedelta
from app.db.mongodb import get_database
from app.middleware.auth import get_optional_current_user

router = APIRouter()

@router.get("")
@router.get("/")
async def list_notifications(
    limit: int = Query(50, le=100),
    skip: int = 0,
    user: dict = Depends(get_optional_current_user),
    db = Depends(get_database)
):
    user_dict = user or {"id": "demo_user", "email": "merchant@recover.ai", "merchant_id": "demo_merchant_1"}
    merchant_id = user_dict.get("merchant_id", "demo_merchant_1")
    query = {"merchant_id": merchant_id}
    
    total = await db["notifications"].count_documents(query)
    
    # Auto-seed if 0 notifications exist for this merchant
    if total == 0:
        now = datetime.utcnow()
        demo_notifs = [
            {
                "id": f"notif_{uuid.uuid4().hex[:10]}",
                "merchant_id": merchant_id,
                "type": "high_value_case",
                "title": "High-Value Transaction Flagged",
                "message": "Payment case #case_9a4f21 (₹12,500) exceeds automated threshold. Requires review.",
                "is_read": False,
                "created_at": now - timedelta(minutes=15)
            },
            {
                "id": f"notif_{uuid.uuid4().hex[:10]}",
                "merchant_id": merchant_id,
                "type": "recovery_success",
                "title": "Payment Recovered Successfully",
                "message": "Razorpay settlement of ₹4,999 for case #case_7b82e1 confirmed in ledger.",
                "is_read": False,
                "created_at": now - timedelta(hours=2)
            },
            {
                "id": f"notif_{uuid.uuid4().hex[:10]}",
                "merchant_id": merchant_id,
                "type": "policy_violation",
                "title": "Max Retries Rule Enforced",
                "message": "Recovery halted for transaction #tx_38102 after reaching max 3 retry attempts.",
                "is_read": True,
                "created_at": now - timedelta(hours=5)
            },
            {
                "id": f"notif_{uuid.uuid4().hex[:10]}",
                "merchant_id": merchant_id,
                "type": "failure_spike",
                "title": "HDFC Bank Gateway Degradation",
                "message": "Temporary 14% degradation detected on HDFC netbanking gateway.",
                "is_read": True,
                "created_at": now - timedelta(hours=12)
            }
        ]
        try:
            await db["notifications"].insert_many(demo_notifs)
        except Exception:
            pass

    cursor = db["notifications"].find(query).sort("created_at", -1).skip(skip).limit(limit)
    logs_raw = await cursor.to_list(length=limit)
    total = await db["notifications"].count_documents(query)
    
    items = []
    for log in logs_raw:
        if "id" not in log and "_id" in log:
            log["id"] = str(log["_id"])
        elif "id" in log:
            log["id"] = str(log["id"])
            
        if "_id" in log:
            log["_id"] = str(log["_id"])
            
        items.append(log)
    
    return {"total": total, "items": items}

@router.put("/{id}/read")
async def mark_read(id: str, user: dict = Depends(get_optional_current_user), db = Depends(get_database)):
    user_dict = user or {"id": "demo_user", "email": "merchant@recover.ai", "merchant_id": "demo_merchant_1"}
    merchant_id = user_dict.get("merchant_id", "demo_merchant_1")
    
    result = await db["notifications"].update_one(
        {"$or": [{"id": id}, {"_id": id}], "merchant_id": merchant_id},
        {"$set": {"is_read": True}}
    )
    
    if hasattr(result, 'matched_count') and result.matched_count == 0:
        try:
            obj_id = ObjectId(id)
            await db["notifications"].update_one(
                {"_id": obj_id, "merchant_id": merchant_id},
                {"$set": {"is_read": True}}
            )
        except Exception:
            pass

    return {"success": True}