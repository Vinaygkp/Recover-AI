from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone
import uuid
from app.db.mongodb import get_database
from app.middleware.auth import get_optional_current_user
from app.recovery.engine import RecoveryEngine

router = APIRouter()

# In-memory job state store for background progress polling
JOB_STORE: Dict[str, Dict[str, Any]] = {}

class SimulationRequest(BaseModel):
    batch_size: Optional[int] = 50
    case_ids: Optional[List[str]] = None
    scenario: Optional[str] = "ALL"
    environment: Optional[str] = "DEMO_MODE"

async def run_batch_job(job_id: str, merchant_id: str, case_ids: List[str], db):
    """Background worker task executing genuine RecoveryEngine workflows for batch cases."""
    JOB_STORE[job_id]["status"] = "RUNNING"
    engine = RecoveryEngine(db)
    
    total = len(case_ids)
    processed = 0
    successful = 0
    stopped = 0
    manual_reviews = 0
    failed_count = 0
    policy_blocked = 0
    recovered_amount = 0.0
    
    now = datetime.now(timezone.utc)
    
    # Audit log: BATCH_STARTED
    await db["audit_logs"].insert_one({
        "id": str(uuid.uuid4()),
        "merchant_id": merchant_id,
        "event_type": "BATCH_STARTED",
        "actor": "system",
        "description": f"Batch recovery job {job_id} initiated for {total} cases.",
        "metadata": {"job_id": job_id, "total_cases": total},
        "timestamp": now
    })
    
    for idx, cid in enumerate(case_ids):
        try:
            # Execute genuine RecoveryEngine workflow for case (NO HASHING / NO SHORTCUTS)
            res = await engine.run_case_workflow(cid)
            status = res.get("status")
            amt = float(res.get("recovered_amount", 0.0))
            
            if status == "recovered":
                successful += 1
                recovered_amount += amt
            elif status == "stopped":
                stopped += 1
            elif status == "manual_review":
                manual_reviews += 1
            elif status == "blocked":
                policy_blocked += 1
            else:
                failed_count += 1

            processed += 1
        except Exception as e:
            # Audit error, mark execution_error, DO NOT count as successful
            processed += 1
            failed_count += 1
            await db["audit_logs"].insert_one({
                "id": str(uuid.uuid4()),
                "merchant_id": merchant_id,
                "case_id": cid,
                "event_type": "EXECUTION_ERROR",
                "actor": "system",
                "description": f"Batch execution error for case {cid}: {str(e)}",
                "timestamp": datetime.now(timezone.utc)
            })
            
        progress = int((processed / total) * 100) if total > 0 else 100
        JOB_STORE[job_id].update({
            "status": "RUNNING" if processed < total else "COMPLETED",
            "progress_percentage": progress,
            "processed": processed,
            "cases_processed": processed,
            "recovery_attempts": processed,
            "successful": successful,
            "successful_recoveries": successful,
            "failed_cases": failed_count,
            "stopped": stopped,
            "stopped_cases": stopped,
            "manual_reviews": manual_reviews,
            "policy_blocked": policy_blocked,
            "recovered_amount": recovered_amount,
            "revenue_recovered": recovered_amount,
            "updated_at": datetime.now(timezone.utc).isoformat()
        })

    JOB_STORE[job_id]["status"] = "COMPLETED"
    JOB_STORE[job_id]["progress_percentage"] = 100
    
    # Audit log: BATCH_COMPLETED
    await db["audit_logs"].insert_one({
        "id": str(uuid.uuid4()),
        "merchant_id": merchant_id,
        "event_type": "BATCH_COMPLETED",
        "actor": "system",
        "description": f"Batch job {job_id} completed: {processed} cases evaluated, {successful} verified recoveries, ₹{recovered_amount:,.2f} total revenue recovered.",
        "metadata": {
            "job_id": job_id,
            "cases_processed": processed,
            "successful_recoveries": successful,
            "revenue_recovered": recovered_amount
        },
        "timestamp": datetime.now(timezone.utc)
    })

@router.post("/run")
async def run_simulation(
    req: SimulationRequest, 
    background_tasks: BackgroundTasks,
    user: Optional[dict] = Depends(get_optional_current_user), 
    db = Depends(get_database)
):
    user_dict = user or {"id": "demo_user", "email": "merchant@recover.ai", "merchant_id": "demo_merchant_1"}
    merchant_id = user_dict.get("merchant_id", "demo_merchant_1")
    limit = req.batch_size if req.batch_size and req.batch_size in [50, 100, 500, 1000] else 50
    
    case_ids = req.case_ids
    if not case_ids:
        cursor = db["recovery_cases"].find({"merchant_id": merchant_id}).limit(limit)
        cases = await cursor.to_list(limit)

        if not cases:
            cursor = db["recovery_cases"].find({}).limit(limit)
            cases = await cursor.to_list(limit)

        case_ids = []
        for c in cases:
            cid = c.get("id") or (str(c["_id"]) if "_id" in c else None)
            if cid:
                case_ids.append(cid)

    job_id = f"job_{uuid.uuid4().hex[:12]}"
    JOB_STORE[job_id] = {
        "job_id": job_id,
        "merchant_id": merchant_id,
        "status": "QUEUED",
        "total": len(case_ids),
        "progress_percentage": 0,
        "processed": 0,
        "cases_processed": 0,
        "recovery_attempts": 0,
        "successful": 0,
        "successful_recoveries": 0,
        "failed_cases": 0,
        "stopped": 0,
        "stopped_cases": 0,
        "manual_reviews": 0,
        "policy_blocked": 0,
        "recovered_amount": 0.0,
        "revenue_recovered": 0.0,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    background_tasks.add_task(run_batch_job, job_id, merchant_id, case_ids, db)

    return {
        "job_id": job_id,
        "status": "QUEUED",
        "total": len(case_ids),
        "cases_processed": 0,
        "recovery_attempts": 0,
        "successful_recoveries": 0,
        "stopped_cases": 0,
        "manual_reviews": 0,
        "revenue_recovered": 0.0,
        "progress_percentage": 0
    }

@router.get("/jobs/{job_id}")
async def get_job_status(job_id: str, user: Optional[dict] = Depends(get_optional_current_user)):
    """Poll job status and progress for asynchronous batch simulation."""
    if job_id not in JOB_STORE:
        return {
            "job_id": job_id,
            "status": "COMPLETED",
            "progress_percentage": 100,
            "cases_processed": 0,
            "recovery_attempts": 0,
            "successful_recoveries": 0,
            "stopped_cases": 0,
            "manual_reviews": 0,
            "revenue_recovered": 0.0
        }
        
    return JOB_STORE[job_id]