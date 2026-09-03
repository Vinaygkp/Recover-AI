from fastapi import APIRouter, Depends, Query, HTTPException
from typing import Optional
from bson import ObjectId
from app.db.mongodb import get_database
from app.middleware.auth import get_optional_current_user
from app.services.synthetic import generate_demo_data

router = APIRouter()

@router.get("")
@router.get("/")
async def list_transactions(
    status: Optional[str] = None,
    customer_id: Optional[str] = None,
    limit: int = Query(50, le=100),
    skip: int = 0,
    user: Optional[dict] = Depends(get_optional_current_user),
    db = Depends(get_database)
):
    user_dict = user or {"id": "demo_user", "email": "merchant@recover.ai", "merchant_id": "demo_merchant_1"}
    merchant_id = user_dict.get("merchant_id", "demo_merchant_1")
    
    # Auto-seed if 0 transactions exist for this merchant
    tx_count = await db["transactions"].count_documents({"merchant_id": merchant_id})
    if tx_count == 0:
        try:
            await generate_demo_data(merchant_id, db)
        except Exception:
            pass

    query = {"merchant_id": merchant_id}
    if status:
        query["status"] = status
    if customer_id:
        query["customer_id"] = customer_id
        
    cursor = db["transactions"].find(query).sort("created_at", -1).skip(skip).limit(limit)
    transactions_raw = await cursor.to_list(length=limit)
    total = await db["transactions"].count_documents(query)
    
    if total == 0:
        fallback_query = {}
        if status: fallback_query["status"] = status
        if customer_id: fallback_query["customer_id"] = customer_id
        cursor = db["transactions"].find(fallback_query).sort("created_at", -1).skip(skip).limit(limit)
        transactions_raw = await cursor.to_list(length=limit)
        total = await db["transactions"].count_documents(fallback_query)

    transactions = []
    for tx in transactions_raw:
        mongo_id = str(tx.pop("_id")) if "_id" in tx else "tx_id"
        tx_id = tx.get("id") or mongo_id
        tx["id"] = tx_id
        transactions.append(tx)
    
    return {"total": total, "items": transactions}

@router.get("/{id}")
async def get_transaction(
    id: str, 
    user: Optional[dict] = Depends(get_optional_current_user), 
    db = Depends(get_database)
):
    tx = await db["transactions"].find_one({"id": id})
    if not tx:
        try:
            tx = await db["transactions"].find_one({"_id": ObjectId(id)})
        except Exception:
            pass
            
    if not tx:
        raise HTTPException(status_code=404, detail="Transaction not found")
        
    mongo_id = str(tx.pop("_id")) if "_id" in tx else id
    tx_id = tx.get("id") or mongo_id
    tx["id"] = tx_id

    # Fetch associated recovery case & timeline if exists
    case = await db["recovery_cases"].find_one({"$or": [{"transaction_id": tx_id}, {"transaction_id": mongo_id}]})
    timeline = []
    if case:
        case_id = str(case["_id"]) if "_id" in case else case.get("id")
        if "_id" in case:
            case["id"] = str(case.pop("_id"))
        tx["recovery_case"] = case
        
        if case_id:
            logs = await db["audit_logs"].find({"case_id": case_id}).sort("timestamp", -1).to_list(100)
            for log in logs:
                if "_id" in log: 
                    log["id"] = str(log.pop("_id"))
                timeline.append(log)
        tx["audit_timeline"] = timeline
        
    return tx