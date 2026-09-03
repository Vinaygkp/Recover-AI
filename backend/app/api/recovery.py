from fastapi import APIRouter, Depends, Query, HTTPException
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
import uuid
from app.db.mongodb import get_database
from app.middleware.auth import get_optional_current_user
from app.recovery.engine import RecoveryEngine
from app.services.synthetic import generate_demo_data

router = APIRouter()

class ManualApprovalRequest(BaseModel):
    reason: Optional[str] = "Manual approval granted by merchant manager"

async def get_case_from_db(db, case_id: str):
    if not case_id:
        return None
    case = await db["recovery_cases"].find_one({"id": case_id})
    if not case:
        case = await db["recovery_cases"].find_one({"_id": case_id})
    if not case:
        case = await db["recovery_cases"].find_one({"transaction_id": case_id})
    if not case:
        try:
            from bson import ObjectId
            case = await db["recovery_cases"].find_one({"_id": ObjectId(case_id)})
        except Exception:
            pass
    return case

@router.get("/cases")
async def list_cases(
    status: Optional[str] = None,
    priority: Optional[str] = None,
    search: Optional[str] = None,
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
        if status in ["in_progress", "recovery_in_progress"]:
            query["status"] = {"$in": ["in_progress", "recovery_in_progress"]}
        else:
            query["status"] = status
    if priority:
        query["priority"] = priority
    if search:
        query["$or"] = [
            {"id": {"$regex": search, "$options": "i"}},
            {"transaction_id": {"$regex": search, "$options": "i"}},
            {"customer_id": {"$regex": search, "$options": "i"}},
            {"ai_diagnosis": {"$regex": search, "$options": "i"}}
        ]
        
    cursor = db["recovery_cases"].find(query).sort("created_at", -1).skip(skip).limit(limit)
    cases_raw = await cursor.to_list(length=limit)
    if not cases_raw:
        cases_raw = await db["recovery_cases"].find({}).sort("created_at", -1).skip(skip).limit(limit).to_list(length=limit)
        
    total = await db["recovery_cases"].count_documents({})

    cases = []
    for case in cases_raw:
        case_id = case.get("id") or str(case.get("_id"))
        case["id"] = case_id
        if "_id" in case:
            case["_id"] = str(case["_id"])
        cases.append(case)
    
    return {"total": total, "items": cases}

@router.get("/cases/{id}")
async def get_case(
    id: str, 
    user: Optional[dict] = Depends(get_optional_current_user), 
    db = Depends(get_database)
):
    case = await get_case_from_db(db, id)
    if not case:
        raise HTTPException(status_code=404, detail="Recovery case not found")
        
    case_id = case.get("id") or str(case.get("_id", id))
    case["id"] = case_id
    if "_id" in case:
        case["_id"] = str(case["_id"])

    audit_logs_raw = await db["audit_logs"].find({"$or": [{"case_id": case_id}, {"case_id": id}]}).sort("timestamp", -1).to_list(length=100)
    
    audit_logs = []
    for log in audit_logs_raw:
        if "_id" in log:
            log["_id"] = str(log["_id"])
        if "id" not in log:
            log["id"] = str(log["_id"])
        audit_logs.append(log)
        
    return {"case": case, "timeline": audit_logs}

@router.post("/{id}/retry")
async def retry_case(
    id: str, 
    user: Optional[dict] = Depends(get_optional_current_user), 
    db = Depends(get_database)
):
    case = await get_case_from_db(db, id)
    actual_id = case.get("id") or str(case.get("_id")) if case else id
    engine = RecoveryEngine(db)
    res = await engine.execute_recovery(actual_id, "retry")
    return {"success": True, "result": res}

@router.post("/{id}/remind")
async def remind_case(
    id: str, 
    user: Optional[dict] = Depends(get_optional_current_user), 
    db = Depends(get_database)
):
    case = await get_case_from_db(db, id)
    actual_id = case.get("id") or str(case.get("_id")) if case else id
    engine = RecoveryEngine(db)
    res = await engine.execute_recovery(actual_id, "reminder")
    return {"success": True, "result": res}

@router.post("/{id}/manual-review")
async def manual_review_case(
    id: str, 
    user: Optional[dict] = Depends(get_optional_current_user), 
    db = Depends(get_database)
):
    case = await get_case_from_db(db, id)
    actual_id = case.get("id") or str(case.get("_id")) if case else id
    engine = RecoveryEngine(db)
    res = await engine.execute_recovery(actual_id, "manual_review")
    return {"success": True, "result": res}

@router.post("/{id}/approve")
async def approve_manual_case(
    id: str, 
    req: Optional[ManualApprovalRequest] = None, 
    user: Optional[dict] = Depends(get_optional_current_user), 
    db = Depends(get_database)
):
    user_dict = user or {"id": "demo_user", "email": "merchant@recover.ai", "merchant_id": "demo_merchant_1"}
    merchant_id = user_dict.get("merchant_id", "demo_merchant_1")
    user_email = user_dict.get("email", "merchant_user")
    reason = req.reason if req and req.reason else "Approved by merchant operator"
    
    case = await get_case_from_db(db, id)
    if not case:
        raise HTTPException(status_code=404, detail="Recovery case not found")
        
    actual_id = case.get("id") or str(case.get("_id", id))
    
    filter_q = {"_id": case["_id"]} if "_id" in case else {"id": actual_id}
    await db["recovery_cases"].update_one(
        filter_q,
        {"$set": {"status": "eligible", "updated_at": datetime.utcnow()}}
    )
    
    engine = RecoveryEngine(db)
    res = await engine.execute_recovery(actual_id, "retry")
    
    await db["audit_logs"].insert_one({
        "id": str(uuid.uuid4()),
        "merchant_id": merchant_id,
        "case_id": actual_id,
        "event_type": "manual_review_approved",
        "actor": user_email,
        "description": f"Manual review approved by {user_email}. Reason: {reason}",
        "metadata": {"approved_by": user_email, "approved_at": datetime.utcnow().isoformat(), "reason": reason},
        "timestamp": datetime.utcnow()
    })
    
    return {"success": True, "status": "approved", "result": res}

@router.post("/{id}/reject")
async def reject_manual_case(
    id: str, 
    req: Optional[ManualApprovalRequest] = None, 
    user: Optional[dict] = Depends(get_optional_current_user), 
    db = Depends(get_database)
):
    user_dict = user or {"id": "demo_user", "email": "merchant@recover.ai", "merchant_id": "demo_merchant_1"}
    merchant_id = user_dict.get("merchant_id", "demo_merchant_1")
    user_email = user_dict.get("email", "merchant_user")
    reason = req.reason if req and req.reason else "Rejected by merchant operator"
    
    case = await get_case_from_db(db, id)
    if not case:
        raise HTTPException(status_code=404, detail="Recovery case not found")
        
    actual_id = case.get("id") or str(case.get("_id", id))
    filter_q = {"_id": case["_id"]} if "_id" in case else {"id": actual_id}
    
    await db["recovery_cases"].update_one(
        filter_q,
        {"$set": {"status": "stopped", "stopped_reason": f"Manual review rejected: {reason}", "updated_at": datetime.utcnow()}}
    )
    
    await db["audit_logs"].insert_one({
        "id": str(uuid.uuid4()),
        "merchant_id": merchant_id,
        "case_id": actual_id,
        "event_type": "manual_review_rejected",
        "actor": user_email,
        "description": f"Manual review rejected by {user_email}. Reason: {reason}",
        "metadata": {"rejected_by": user_email, "rejected_at": datetime.utcnow().isoformat(), "reason": reason},
        "timestamp": datetime.utcnow()
    })
    
    return {"success": True, "status": "rejected"}

@router.post("/{id}/stop")
async def stop_case(
    id: str, 
    user: Optional[dict] = Depends(get_optional_current_user), 
    db = Depends(get_database)
):
    case = await get_case_from_db(db, id)
    actual_id = case.get("id") or str(case.get("_id")) if case else id
    
    engine = RecoveryEngine(db)
    try:
        await engine.execute_recovery(actual_id, "stop")
    except Exception:
        pass
        
    if case:
        filter_q = {"_id": case["_id"]} if "_id" in case else {"id": actual_id}
        await db["recovery_cases"].update_one(
            filter_q,
            {"$set": {"status": "stopped", "stopped_reason": "Manually stopped by user"}}
        )
    
    return {"success": True}

@router.post("/{id}/message")
async def generate_recovery_message(
    id: str,
    lang: Optional[str] = "hinglish",
    user: Optional[dict] = Depends(get_optional_current_user),
    db = Depends(get_database)
):
    case = await get_case_from_db(db, id)
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
        
    amount = case.get("amount", 4999.0)
    customer_id = case.get("customer_id", "Customer")
    customer_name = case.get("customer_name") or f"Customer #{customer_id[:8]}"
    failure_type = case.get("failure_type", "payment_failure").replace("_", " ").title()
    link = f"https://recover.ai/pay/{id[:8]}"

    if lang == "hinglish":
        message = (
            f"Namaste {customer_name},\n\n"
            f"Aapka recent payment (₹{amount:,.2f}) {failure_type} ki wajah se complete nahi ho paya.\n"
            f"Aap niche diye gaye link se dobara payment try kar sakte hain:\n{link}\n\n"
            f"Agar payment already complete ho gaya hai, toh is message ko ignore karein.\n"
            f"- Recover AI Team"
        )
    else:
        message = (
            f"Hello {customer_name},\n\n"
            f"Your payment of ₹{amount:,.2f} could not be processed due to {failure_type}.\n"
            f"You can retry your payment securely using this link:\n{link}\n\n"
            f"If you have already paid, please ignore this notice.\n"
            f"- Recover AI Team"
        )

    return {
        "success": True,
        "case_id": id,
        "language": lang,
        "message": message,
        "payment_link": link
    }