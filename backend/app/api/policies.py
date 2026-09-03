from fastapi import APIRouter, Depends
from typing import Dict, Any, Optional
from app.db.mongodb import get_database
from app.middleware.auth import get_optional_current_user
from datetime import datetime, timezone

router = APIRouter()

DEFAULT_POLICY = {
    "max_retries": 3,
    "max_discount_percent": 10.0,
    "recovery_window_days": 7,
    "high_value_threshold": 10000.0,
    "manual_approval_threshold": 10000.0,
    "escalation_limit": 5,
    "auto_retry_enabled": True,
    "reminder_enabled": True
}

@router.get("")
@router.get("/")
async def get_policies(
    user: Optional[dict] = Depends(get_optional_current_user), 
    db = Depends(get_database)
):
    user_dict = user or {"id": "demo_user", "email": "merchant@recover.ai", "merchant_id": "demo_merchant_1"}
    merchant_id = user_dict.get("merchant_id", "demo_merchant_1")
    
    policy = await db["policies"].find_one({"merchant_id": merchant_id})
    if not policy:
        policy = await db["policies"].find_one({})
        
    if not policy:
        res = dict(DEFAULT_POLICY)
        res["id"] = "default_policy"
        res["merchant_id"] = merchant_id
        return res
        
    # Convert MongoDB _id (ObjectId) to string to prevent JSON serialization errors
    if "_id" in policy:
        policy["id"] = str(policy.pop("_id"))
        
    # Ensure default fields exist
    for k, v in DEFAULT_POLICY.items():
        if k not in policy:
            policy[k] = v
            
    return policy

@router.put("")
@router.put("/")
async def update_policies(
    policy_data: Dict[str, Any], 
    user: Optional[dict] = Depends(get_optional_current_user), 
    db = Depends(get_database)
):
    user_dict = user or {"id": "demo_user", "email": "merchant@recover.ai", "merchant_id": "demo_merchant_1"}
    merchant_id = user_dict.get("merchant_id", "demo_merchant_1")
    
    policy_data["updated_at"] = datetime.now(timezone.utc)
    policy_data["merchant_id"] = merchant_id
    
    if "_id" in policy_data:
        del policy_data["_id"]
        
    await db["policies"].update_one(
        {"merchant_id": merchant_id},
        {"$set": policy_data},
        upsert=True
    )
    return {"success": True}