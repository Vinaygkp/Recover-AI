from fastapi import APIRouter, Depends
from fastapi.responses import Response
import csv
import io
from typing import Optional
from app.db.mongodb import get_database
from app.middleware.auth import get_optional_current_user
from app.services.synthetic import generate_demo_data

router = APIRouter()

@router.get("")
@router.get("/")
async def get_analytics(
    user: Optional[dict] = Depends(get_optional_current_user), 
    db = Depends(get_database)
):
    user_dict = user or {"id": "demo_user", "email": "merchant@recover.ai", "merchant_id": "demo_merchant_1"}
    merchant_id = user_dict.get("merchant_id", "demo_merchant_1")
    
    # Auto-seed demo dataset if 0 transactions exist in database
    tx_count = await db["transactions"].count_documents({"merchant_id": merchant_id})
    if tx_count == 0:
        tx_count = await db["transactions"].count_documents({})
    if tx_count == 0:
        try:
            await generate_demo_data(merchant_id, db)
        except Exception:
            pass

    # 1. recovery_by_failure_type (Strictly derived from MongoDB)
    pipeline_failure = [
        {"$group": {
            "_id": "$failure_type", 
            "total_amount": {"$sum": "$amount"}, 
            "recovered_amount": {"$sum": "$recovered_amount"},
            "count": {"$sum": 1}
        }}
    ]
    recovery_by_failure_type_raw = await db["recovery_cases"].aggregate(pipeline_failure).to_list(100)

    recovery_by_failure_type = [
        {
            "name": (item["_id"] or "General Failure").replace("_", " ").title(),
            "failure_type": item["_id"] or "payment_failure",
            "total_amount": float(item.get("total_amount", 0.0)),
            "amount": float(item.get("total_amount", 0.0)),
            "recovered_amount": float(item.get("recovered_amount", 0.0)),
            "count": int(item.get("count", 0))
        } 
        for item in recovery_by_failure_type_raw if item.get("_id")
    ]

    # 2. revenue_trend (Time-series aggregated by date from MongoDB)
    pipeline_trend = [
        {"$group": {
            "_id": {"$dateToString": {"format": "%Y-%m-%d", "date": "$created_at"}},
            "at_risk": {"$sum": "$amount"},
            "recovered": {"$sum": "$recovered_amount"}
        }},
        {"$sort": {"_id": 1}}
    ]
    revenue_trend_raw = await db["recovery_cases"].aggregate(pipeline_trend).to_list(100)

    revenue_trend = [
        {
            "date": item["_id"], 
            "at_risk": float(item.get("at_risk", 0.0)),
            "amount": float(item.get("recovered", 0.0)), 
            "recovered": float(item.get("recovered", 0.0))
        } 
        for item in revenue_trend_raw if item.get("_id")
    ]

    # 3. Dynamic time_to_recovery calculation from actual case timestamps
    pipeline_time = [
        {"$match": {"status": "recovered", "recovered_at": {"$ne": None}, "created_at": {"$ne": None}}},
        {"$project": {
            "time_diff_minutes": {
                "$divide": [
                    {"$subtract": ["$recovered_at", "$created_at"]},
                    60000
                ]
            }
        }},
        {"$group": {
            "_id": None,
            "avg": {"$avg": "$time_diff_minutes"},
            "min": {"$min": "$time_diff_minutes"},
            "max": {"$max": "$time_diff_minutes"}
        }}
    ]
    time_res = await db["recovery_cases"].aggregate(pipeline_time).to_list(1)
    if time_res and time_res[0].get("avg") is not None:
        avg_m = time_res[0]["avg"]
        min_m = time_res[0]["min"]
        max_m = time_res[0]["max"]
        
        avg_str = f"{round(avg_m/60, 1)}h" if avg_m >= 60 else f"{round(avg_m, 0)}m"
        min_str = f"{round(min_m/60, 1)}h" if min_m >= 60 else f"{round(min_m, 0)}m"
        max_str = f"{round(max_m/60, 1)}h" if max_m >= 60 else f"{round(max_m, 0)}m"
        
        time_to_recovery = {
            "avg": avg_str,
            "median": avg_str,
            "fastest": min_str,
            "slowest": max_str,
            "avg_hours": round(avg_m/60, 1),
            "fastest_hours": round(min_m/60, 1),
            "slowest_hours": round(max_m/60, 1)
        }
    else:
        time_to_recovery = {
            "avg": "N/A",
            "median": "N/A",
            "fastest": "N/A",
            "slowest": "N/A",
            "avg_hours": 0.0,
            "fastest_hours": 0.0,
            "slowest_hours": 0.0
        }

    # 4. recovery_probability_distribution from actual ML scores
    pipeline_prob = [
        {"$bucket": {
            "groupBy": "$recovery_probability",
            "boundaries": [0.0, 0.3, 0.7, 1.01],
            "default": "Other",
            "output": {"count": {"$sum": 1}}
        }}
    ]
    prob_dist_raw = await db["recovery_cases"].aggregate(pipeline_prob).to_list(10)

    prob_counts = {"0-30%": 0, "30-70%": 0, "70-100%": 0}
    for b in prob_dist_raw:
        if b["_id"] == 0.0:
            prob_counts["0-30%"] = b["count"]
        elif b["_id"] == 0.3:
            prob_counts["30-70%"] = b["count"]
        elif b["_id"] == 0.7:
            prob_counts["70-100%"] = b["count"]
            
    recovery_probability_distribution = [
        {"range": r, "count": prob_counts[r]} for r in ["0-30%", "30-70%", "70-100%"]
    ]

    # 5. recovery_by_intervention
    pipeline_intervention = [
        {"$group": {"_id": "$recommended_action", "count": {"$sum": 1}, "amount": {"$sum": "$recovered_amount"}}}
    ]
    intervention_raw = await db["recovery_cases"].aggregate(pipeline_intervention).to_list(100)

    recovery_by_intervention = [
        {
            "name": (item["_id"] or "Smart Retry").replace("_", " ").title(),
            "amount": float(item.get("amount", 0.0)),
            "count": int(item.get("count", 0))
        }
        for item in intervention_raw if item.get("_id")
    ]

    # 6. Strict Mathematical Recovery Funnel
    pipeline_risk = [{"$group": {"_id": None, "total": {"$sum": "$amount"}}}]
    res_risk = await db["recovery_cases"].aggregate(pipeline_risk).to_list(1)
    revenue_at_risk = float(res_risk[0]["total"]) if res_risk and res_risk[0].get("total") else 0.0

    pipeline_eligible = [{"$match": {"status": {"$in": ["eligible", "analyzing", "recovery_in_progress", "recovered", "failed", "stopped"]}}}, {"$group": {"_id": None, "total": {"$sum": "$amount"}}}]
    res_eligible = await db["recovery_cases"].aggregate(pipeline_eligible).to_list(1)
    revenue_eligible = float(res_eligible[0]["total"]) if res_eligible and res_eligible[0].get("total") else 0.0

    pipeline_attempted = [{"$match": {"retry_count": {"$gt": 0}}}, {"$group": {"_id": None, "total": {"$sum": "$amount"}}}]
    res_attempted = await db["recovery_cases"].aggregate(pipeline_attempted).to_list(1)
    revenue_attempted = float(res_attempted[0]["total"]) if res_attempted and res_attempted[0].get("total") else 0.0

    pipeline_recovered = [{"$match": {"status": "recovered"}}, {"$group": {"_id": None, "total": {"$sum": "$recovered_amount"}}}]
    res_recovered = await db["recovery_cases"].aggregate(pipeline_recovered).to_list(1)
    revenue_recovered = float(res_recovered[0]["total"]) if res_recovered and res_recovered[0].get("total") else 0.0

    recovery_funnel = {
        "revenue_at_risk": revenue_at_risk,
        "eligible": revenue_eligible,
        "attempted": revenue_attempted,
        "recovered": revenue_recovered
    }

    return {
        "recovery_by_failure_type": recovery_by_failure_type,
        "revenue_trend": revenue_trend,
        "time_to_recovery": time_to_recovery,
        "recovery_probability_distribution": recovery_probability_distribution,
        "recovery_by_intervention": recovery_by_intervention,
        "recovery_funnel": recovery_funnel
    }

@router.get("/export")
async def export_recovery_report(user: Optional[dict] = Depends(get_optional_current_user), db = Depends(get_database)):
    user_dict = user or {"id": "demo_user", "email": "merchant@recover.ai", "merchant_id": "demo_merchant_1"}
    merchant_id = user_dict.get("merchant_id", "demo_merchant_1")
    
    cases = await db["recovery_cases"].find({"merchant_id": merchant_id}).to_list(1000)
    if not cases:
        cases = await db["recovery_cases"].find({}).to_list(1000)
    
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["Case ID", "Transaction ID", "Amount (INR)", "Failure Type", "Priority", "Status", "Recovery Probability", "Recommended Action", "Retry Count", "Recovered Amount"])
    
    for c in cases:
        writer.writerow([
            c.get("id"),
            c.get("transaction_id"),
            c.get("amount", 0.0),
            c.get("failure_type"),
            c.get("priority"),
            c.get("status"),
            f"{int(c.get('recovery_probability', 0) * 100)}%",
            c.get("recommended_action"),
            c.get("retry_count", 0),
            c.get("recovered_amount", 0.0)
        ])
        
    return Response(
        content=output.getvalue(),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=recover_ai_telemetry_report.csv"}
    )