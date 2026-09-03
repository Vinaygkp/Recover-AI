from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
import uuid
from bson import ObjectId

from app.db.mongodb import get_database
from app.middleware.auth import get_current_user, get_optional_current_user
from app.services.openai_service import analyze_recovery_case, generate_copilot_response, get_openai_health
from app.ml.predict import predict_recovery_probability
from app.policies.engine import PolicyEngine
from app.models.policy import Policy
from app.recovery.stopping import should_stop_recovery

router = APIRouter()

class AIAnalyzeRequest(BaseModel):
    case_id: str

class AICopilotRequest(BaseModel):
    message: str
    case_id: Optional[str] = None

@router.get("/health")
async def check_ai_health():
    """Check live OpenAI API reachability and status."""
    return await get_openai_health()

@router.post("/copilot")
async def copilot_chat(
    req: AICopilotRequest,
    user: Optional[dict] = Depends(get_optional_current_user),
    db = Depends(get_database)
):
    user_dict = user or {"id": "guest_user", "email": "guest@recover.ai", "merchant_id": "demo_merchant_1"}
    merchant_id = user_dict.get("merchant_id", "demo_merchant_1")
    user_email = user_dict.get("email", "guest@recover.ai")
    
    # Audit log: AI_COPILOT_REQUESTED
    await db["audit_logs"].insert_one({
        "id": str(uuid.uuid4()),
        "merchant_id": merchant_id,
        "case_id": req.case_id,
        "event_type": "AI_COPILOT_REQUESTED",
        "actor": user_email,
        "description": f"Merchant prompt: '{req.message[:80]}...'",
        "timestamp": datetime.utcnow()
    })

    case_context = None
    ml_pred = None
    recovery_history = None
    
    if req.case_id:
        case = await db["recovery_cases"].find_one({"id": req.case_id})
        if case:
            if "_id" in case:
                case["id"] = str(case.pop("_id"))
            case_context = case
            tx = await db["transactions"].find_one({"id": case.get("transaction_id")})
            ml_pred = predict_recovery_probability(tx if tx else case)
            history_raw = await db["audit_logs"].find({"case_id": req.case_id}).to_list(10)
            recovery_history = [h.get("event_type") for h in history_raw]

    # Generate Copilot AI response
    res = await generate_copilot_response(req.message, case_context, ml_pred, recovery_history)
    
    # Audit log: AI_COPILOT_COMPLETED / FAILED & AI_RECOMMENDATION_CREATED
    evt_type = "AI_COPILOT_COMPLETED" if res.get("status") == "AVAILABLE" else "AI_COPILOT_FAILED"
    await db["audit_logs"].insert_one({
        "id": str(uuid.uuid4()),
        "merchant_id": merchant_id,
        "case_id": req.case_id,
        "event_type": evt_type,
        "actor": "openai_copilot",
        "description": f"Copilot action recommended: {res.get('action')}",
        "metadata": {"action": res.get("action"), "status": res.get("status")},
        "timestamp": datetime.utcnow()
    })
    
    await db["audit_logs"].insert_one({
        "id": str(uuid.uuid4()),
        "merchant_id": merchant_id,
        "case_id": req.case_id,
        "event_type": "AI_RECOMMENDATION_CREATED",
        "actor": "openai_copilot",
        "description": f"Copilot recommended {res.get('action')}. Reason: {res.get('recommendation')}",
        "timestamp": datetime.utcnow()
    })

    return {
        "success": True,
        "message": req.message,
        "response": res,
        "case_id": req.case_id
    }

@router.post("/analyze-recovery")
async def analyze_recovery_with_ai(
    req: AIAnalyzeRequest,
    user: dict = Depends(get_current_user),
    db = Depends(get_database)
):
    merchant_id = user.get("merchant_id")
    case_id = req.case_id
    
    case = await db["recovery_cases"].find_one({"id": case_id, "merchant_id": merchant_id})
    if not case:
        try:
            case = await db["recovery_cases"].find_one({"_id": ObjectId(case_id), "merchant_id": merchant_id})
        except Exception:
            pass
            
    if not case:
        raise HTTPException(status_code=404, detail="Recovery case not found")
        
    await db["audit_logs"].insert_one({
        "id": str(uuid.uuid4()),
        "merchant_id": merchant_id,
        "case_id": case_id,
        "event_type": "AI_ANALYSIS_REQUESTED",
        "actor": "user",
        "description": f"AI reasoning requested for recovery case {case_id}",
        "timestamp": datetime.utcnow()
    })

    tx = await db["transactions"].find_one({"id": case.get("transaction_id")})
    ml_pred = predict_recovery_probability(tx if tx else case)

    ai_res = await analyze_recovery_case(case, ml_pred)
    
    policy_doc = await db["policies"].find_one({"merchant_id": merchant_id})
    policy = Policy(**policy_doc) if policy_doc else Policy(merchant_id=merchant_id)
    
    engine = PolicyEngine()
    policy_check = engine.check_all_policies(case, policy)
    
    from app.models.recovery import RecoveryCase
    try:
        case_obj = RecoveryCase(**case)
        stop_flag, stop_reason = should_stop_recovery(case_obj, policy)
    except Exception:
        stop_flag, stop_reason = False, ""

    if stop_flag:
        policy_decision = {
            "allowed": False,
            "status": "STOPPED" if "max retries" in stop_reason.lower() else "HUMAN_REVIEW",
            "reason": stop_reason,
            "checks": policy_check.checks
        }
    else:
        policy_decision = {
            "allowed": policy_check.allowed,
            "status": "APPROVED" if policy_check.allowed else "BLOCKED",
            "reason": policy_check.blocked_reason or "All policy guardrails passed",
            "checks": policy_check.checks
        }

    ai_record = {
        "ai_analysis_id": str(uuid.uuid4()),
        "case_id": case_id,
        "model_version": ai_res.get("model_version", "gpt-4o-mini"),
        "diagnosis": ai_res.get("diagnosis"),
        "root_cause": ai_res.get("root_cause"),
        "recommended_action": ai_res.get("recommended_action"),
        "priority": ai_res.get("priority"),
        "confidence": ai_res.get("confidence"),
        "reason": ai_res.get("reason"),
        "status": ai_res.get("status"),
        "created_at": datetime.utcnow()
    }

    await db["recovery_cases"].update_one(
        {"id": case_id},
        {"$set": {
            "ai_diagnosis": ai_res.get("diagnosis"),
            "ai_root_cause": ai_res.get("root_cause"),
            "ai_recommended_action": ai_res.get("recommended_action"),
            "ai_confidence": ai_res.get("confidence"),
            "ai_explanation": ai_res.get("reason"),
            "ai_analysis": ai_record,
            "updated_at": datetime.utcnow()
        }}
    )

    evt_status = "AI_ANALYSIS_COMPLETED" if ai_res.get("status") == "AVAILABLE" else "AI_ANALYSIS_FAILED"
    await db["audit_logs"].insert_one({
        "id": str(uuid.uuid4()),
        "merchant_id": merchant_id,
        "case_id": case_id,
        "event_type": evt_status,
        "actor": "openai_ai",
        "description": f"AI diagnosis completed: {ai_res.get('root_cause')} - Recommended Action: {ai_res.get('recommended_action')}",
        "metadata": {
            "model_version": ai_res.get("model_version"),
            "recommendation": ai_res.get("recommended_action"),
            "status": ai_res.get("status")
        },
        "timestamp": datetime.utcnow()
    })
    
    await db["audit_logs"].insert_one({
        "id": str(uuid.uuid4()),
        "merchant_id": merchant_id,
        "case_id": case_id,
        "event_type": "AI_RECOMMENDATION_CREATED",
        "actor": "openai_ai",
        "description": f"AI recommended {ai_res.get('recommended_action')}. Policy Decision: {policy_decision['status']}",
        "timestamp": datetime.utcnow()
    })

    return {
        "success": True,
        "case_id": case_id,
        "ai_analysis": ai_record,
        "ml_prediction": ml_pred,
        "policy_decision": policy_decision
    }