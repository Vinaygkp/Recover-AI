from fastapi import APIRouter, Depends, Query
from app.db.mongodb import get_database
from app.middleware.auth import get_optional_current_user
from typing import Optional

router = APIRouter()

@router.get("")
@router.get("/")
async def list_audit_logs(
    limit: int = Query(50, le=100),
    skip: int = 0,
    user: Optional[dict] = Depends(get_optional_current_user),
    db = Depends(get_database)
):
    user_dict = user or {"id": "demo_user", "email": "merchant@recover.ai", "merchant_id": "demo_merchant_1"}
    merchant_id = user_dict.get("merchant_id", "demo_merchant_1")
    
    query = {"merchant_id": merchant_id}
    
    cursor = db["audit_logs"].find(query).sort("timestamp", -1).skip(skip).limit(limit)
    logs_raw = await cursor.to_list(length=limit)
    total = await db["audit_logs"].count_documents(query)
    
    if total == 0:
        cursor = db["audit_logs"].find({}).sort("timestamp", -1).skip(skip).limit(limit)
        logs_raw = await cursor.to_list(length=limit)
        total = await db["audit_logs"].count_documents({})

    # Convert MongoDB _id (ObjectId) to string to prevent JSON serialization errors
    items = []
    for log in logs_raw:
        if "_id" in log:
            log["id"] = str(log.pop("_id"))
        items.append(log)
    
    return {"total": total, "items": items}