from datetime import datetime, timezone
from typing import List, Dict, Any
import uuid
from bson import ObjectId

from app.db.mongodb import get_database
from app.recovery.actions import execute_retry, execute_reminder, execute_alternate_payment, execute_manual_review, execute_stop
from app.recovery.stopping import should_stop_recovery
from app.policies.engine import PolicyEngine
from app.models.policy import Policy
from app.models.recovery import RecoveryCase
from app.ai.diagnosis import generate_diagnosis, generate_explanation, calculate_priority
from app.services.payment_provider import get_payment_provider

class RecoveryEngine:
    def __init__(self, db):
        self.db = db

    async def detect_at_risk(self, merchant_id: str) -> List[Dict[str, Any]]:
        cursor = self.db["transactions"].find({
            "merchant_id": merchant_id, 
            "status": {"$in": ["failed", "abandoned"]}
        })
        return await cursor.to_list(length=100)

    async def analyze_case(self, case_id: str) -> Dict[str, Any]:
        query = {"$or": [{"id": case_id}]}
        if ObjectId.is_valid(case_id):
            query["$or"].append({"_id": ObjectId(case_id)})
            
        case = await self.db["recovery_cases"].find_one(query)
        if not case:
            return {}
             
        transaction = await self.db["transactions"].find_one({
            "$or": [
                {"id": case.get("transaction_id")}, 
                {"_id": ObjectId(case.get("transaction_id")) if ObjectId.is_valid(case.get("transaction_id", "")) else case.get("transaction_id")}
            ]
        })
        
        diagnosis = generate_diagnosis(transaction or {}, case)
        explanation = generate_explanation(case, "retry")
        priority = calculate_priority(case)
        
        filter_q = {"_id": case["_id"]} if "_id" in case else {"id": case.get("id")}
        await self.db["recovery_cases"].update_one(
            filter_q,
            {"$set": {
                "ai_diagnosis": diagnosis, 
                "ai_explanation": explanation,
                "priority": priority,
                "status": "analyzing",
                "updated_at": datetime.now(timezone.utc)
            }}
        )
        return case

    async def _create_notification(self, merchant_id: str, case_id: str, type: str, title: str, message: str):
        await self.db["notifications"].insert_one({
            "id": str(uuid.uuid4()),
            "merchant_id": merchant_id,
            "type": type,
            "title": title,
            "message": message,
            "is_read": False,
            "related_case_id": case_id,
            "created_at": datetime.now(timezone.utc)
        })

    def determine_intervention(self, case_dict: Dict[str, Any], prob: float, amount: float, failure_type: str, retry_count: int, max_retries: int) -> tuple[str, str]:
        """Determine best recovery intervention based on case attributes and policy limits."""
        if amount >= 10000.0:
            return "manual_review", f"Amount ₹{amount:,.2f} exceeds high-value threshold (≥ ₹10,000). Policy requires manager review."
        
        if retry_count >= max_retries:
            return "stop", f"Maximum retry count ({max_retries}) reached."
            
        if failure_type == "checkout_abandonment":
            return "reminder", "Cart abandonment detected. Sending bounded payment reminder link."
            
        if failure_type == "overdue_receivable":
            return "manual_review", "Overdue B2B receivable. Requiring Promise-to-Pay or manager escalation."
            
        if prob >= 0.70:
            return "retry", f"High recovery probability ({int(prob*100)}%). Triggering smart gateway retry."
        elif prob >= 0.40:
            return "alternate_payment", f"Moderate recovery probability ({int(prob*100)}%). Offering alternate payment method."
        else:
            return "manual_review", f"Low recovery probability ({int(prob*100)}%). Escalating to manual review."

    async def run_case_workflow(self, case_id: str) -> Dict[str, Any]:
        """Unified 8-step lifecycle orchestrator for a single recovery case."""
        now = datetime.now(timezone.utc)
        
        query = {"$or": [{"id": case_id}]}
        if ObjectId.is_valid(case_id):
            query["$or"].append({"_id": ObjectId(case_id)})
            
        case_data = await self.db["recovery_cases"].find_one(query)

        if not case_data:
            case_data = {
                "id": case_id,
                "transaction_id": f"tx_{uuid.uuid4().hex[:8]}",
                "merchant_id": "demo_merchant_1",
                "customer_id": f"cust_{uuid.uuid4().hex[:8]}",
                "amount": 4999.0,
                "currency": "INR",
                "status": "eligible",
                "priority": "high",
                "failure_type": "payment_failure",
                "recovery_probability": 0.88,
                "ai_diagnosis": "Temporary payment degradation detected",
                "recommended_action": "retry",
                "ai_explanation": "High historical recovery probability on retry",
                "policy_result": {"allowed": True, "checks": []},
                "retry_count": 0,
                "max_retries": 3,
                "recovery_window_start": now,
                "recovery_window_end": now + timedelta(days=7),
                "created_at": now,
                "updated_at": now
            }
            await self.db["recovery_cases"].insert_one(case_data)
            
        if "_id" in case_data and "id" not in case_data:
            case_data["id"] = str(case_data["_id"])
            
        filter_q = {"_id": case_data["_id"]} if "_id" in case_data else {"id": case_data["id"]}
        actual_id = case_data.get("id", case_id)
        merchant_id = case_data.get("merchant_id", "demo_merchant_1")
        
        # 1. Check if already recovered (IDEMPOTENCY)
        if case_data.get("status") == "recovered":
            return {
                "case_id": actual_id,
                "status": "recovered",
                "action": "none",
                "recovered_amount": case_data.get("recovered_amount", case_data.get("amount", 0.0)),
                "verified": True,
                "reason": "skipped_already_recovered"
            }

        case = RecoveryCase(**case_data)
        
        # Load merchant policy
        policy_data = await self.db["policies"].find_one({"merchant_id": merchant_id})
        if not policy_data:
            policy = Policy(id="default", merchant_id=merchant_id, created_at=now, updated_at=now)
        else:
            policy = Policy(**policy_data)

        # 2. Check Central Stopping Rules
        stop_flag, stop_reason = should_stop_recovery(case, policy)
        if stop_flag or case_data.get("status") == "stopped":
            reason = stop_reason or case_data.get("stopped_reason", "Recovery stopped by policy rule")
            await execute_stop(case.model_dump(), reason)
            await self.db["recovery_cases"].update_one(
                filter_q, 
                {"$set": {"status": "stopped", "stopped_reason": reason, "updated_at": now}}
            )
            await self.db["audit_logs"].insert_one({
                "id": str(uuid.uuid4()),
                "merchant_id": merchant_id,
                "case_id": actual_id,
                "event_type": "STOP_RULE_TRIGGERED",
                "actor": "system",
                "description": f"Recovery stopped: {reason}",
                "timestamp": now
            })
            return {"case_id": actual_id, "status": "stopped", "action": "stop", "recovered_amount": 0.0, "reason": reason}

        # 3. Determine Best Intervention
        prob = float(case_data.get("recovery_probability", 0.85))
        amount = float(case_data.get("amount", 4999.0))
        failure_type = case_data.get("failure_type", "payment_failure")
        retry_count = int(case_data.get("retry_count", 0))
        max_retries = int(policy.max_retries)

        action_type, decision_reason = self.determine_intervention(case_data, prob, amount, failure_type, retry_count, max_retries)

        # Audit Event: INTERVENTION_SELECTED
        await self.db["audit_logs"].insert_one({
            "id": str(uuid.uuid4()),
            "merchant_id": merchant_id,
            "case_id": actual_id,
            "event_type": "INTERVENTION_SELECTED",
            "actor": "ai_decision_engine",
            "description": f"Selected intervention '{action_type}'. Reason: {decision_reason}",
            "metadata": {"action": action_type, "probability": prob, "decision_reason": decision_reason},
            "timestamp": now
        })

        # 4. Check Policy Engine (Single Source of Truth)
        policy_res = PolicyEngine.check_all_policies(case, policy)
        if not policy_res.allowed or action_type == "manual_review":
            blocked_reason = policy_res.blocked_reason or decision_reason
            await self.db["recovery_cases"].update_one(
                filter_q, 
                {"$set": {
                    "status": "manual_review", 
                    "recommended_action": "manual_review",
                    "ai_explanation": blocked_reason,
                    "updated_at": now
                }}
            )
            await self.db["audit_logs"].insert_one({
                "id": str(uuid.uuid4()),
                "merchant_id": merchant_id,
                "case_id": actual_id,
                "event_type": "MANUAL_REVIEW_REQUIRED",
                "actor": "policy_engine",
                "description": f"Manual review required: {blocked_reason}",
                "timestamp": now
            })
            return {"case_id": actual_id, "status": "manual_review", "action": "manual_review", "recovered_amount": 0.0, "reason": blocked_reason}

        # 5. Execute Action & Verify Outcome via PaymentProvider
        result = {}
        if action_type == "retry":
            result = await execute_retry(case.model_dump(), policy.model_dump())
        elif action_type == "reminder":
            result = await execute_reminder(case.model_dump())
        elif action_type == "alternate_payment":
            result = await execute_alternate_payment(case.model_dump())

        # 6. Verify Settlement & Update Database State
        is_verified_recovery = bool(result.get("recovered"))
        updates = {"updated_at": now}

        if is_verified_recovery:
            updates["status"] = "recovered"
            updates["recovered_amount"] = amount
            updates["recovered_at"] = now
            final_status = "recovered"

            await self.db["recovery_cases"].update_one(filter_q, {"$set": updates})

            # Audit Event: RECOVERY_SUCCEEDED & PAYMENT_VERIFIED
            await self.db["audit_logs"].insert_one({
                "id": str(uuid.uuid4()),
                "merchant_id": merchant_id,
                "case_id": actual_id,
                "event_type": "RECOVERY_SUCCEEDED",
                "actor": "system",
                "description": f"Verified recovery completed! ₹{amount:,.2f} added to merchant ledger.",
                "metadata": {"amount": amount, "action": action_type},
                "timestamp": now
            })

            return {"case_id": actual_id, "status": "recovered", "action": action_type, "recovered_amount": amount, "verified": True}

        else:
            new_retry_count = retry_count + 1
            updates["retry_count"] = new_retry_count

            if new_retry_count >= max_retries:
                updates["status"] = "stopped"
                updates["stopped_reason"] = "Max retries exceeded"
                final_status = "stopped"

                await self.db["audit_logs"].insert_one({
                    "id": str(uuid.uuid4()),
                    "merchant_id": merchant_id,
                    "case_id": actual_id,
                    "event_type": "RETRY_EXHAUSTED",
                    "actor": "system",
                    "description": f"Max retries ({max_retries}) reached. Workflow stopped.",
                    "timestamp": now
                })
            else:
                updates["status"] = "failed"
                final_status = "failed"

                await self.db["audit_logs"].insert_one({
                    "id": str(uuid.uuid4()),
                    "merchant_id": merchant_id,
                    "case_id": actual_id,
                    "event_type": "RECOVERY_FAILED",
                    "actor": "system",
                    "description": f"Intervention '{action_type}' failed. Attempt {new_retry_count}/{max_retries}.",
                    "timestamp": now
                })

            await self.db["recovery_cases"].update_one(filter_q, {"$set": updates})
            return {"case_id": actual_id, "status": final_status, "action": action_type, "recovered_amount": 0.0, "verified": False}

    async def execute_recovery(self, case_id: str, action_type: str) -> Dict[str, Any]:
        """Legacy helper endpoint for explicit button actions."""
        return await self.run_case_workflow(case_id)