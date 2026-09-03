from fastapi import APIRouter, Depends
from typing import Dict, Any, Optional
from app.db.mongodb import get_database
from app.middleware.auth import get_optional_current_user
from app.services.synthetic import generate_demo_data

router = APIRouter()

@router.get("/overview")
async def get_dashboard_overview(
    user: Optional[dict] = Depends(get_optional_current_user), 
    db = Depends(get_database)
) -> Dict[str, Any]:
    user_dict = user or {"id": "demo_user", "email": "merchant@recover.ai", "merchant_id": "demo_merchant_1"}
    merchant_id = user_dict.get("merchant_id", "demo_merchant_1")
    
    # Auto-seed demo dataset if 0 transactions exist in MongoDB
    tx_count = await db["transactions"].count_documents({"merchant_id": merchant_id})
    if tx_count == 0:
        tx_count = await db["transactions"].count_documents({})
    if tx_count == 0:
        try:
            await generate_demo_data(merchant_id, db)
        except Exception:
            pass

    # 1. Revenue at Risk (Strict sum of unrecovered risk cases)
    pipeline_risk = [
        {"$match": {"status": {"$in": ["detected", "analyzing", "eligible", "recovery_in_progress", "failed", "stopped", "manual_review"]}}},
        {"$group": {"_id": None, "total": {"$sum": "$amount"}}}
    ]
    res_risk = await db["recovery_cases"].aggregate(pipeline_risk).to_list(1)
    revenue_at_risk = float(res_risk[0]["total"]) if res_risk and res_risk[0].get("total") else 0.0

    # 2. Revenue Recovered (Strict sum of verified recovered cases)
    pipeline_recovered = [
        {"$match": {"status": "recovered"}},
        {"$group": {"_id": None, "total": {"$sum": "$recovered_amount"}, "count": {"$sum": 1}}}
    ]
    res_rec = await db["recovery_cases"].aggregate(pipeline_recovered).to_list(1)
    revenue_recovered = float(res_rec[0]["total"]) if res_rec and res_rec[0].get("total") else 0.0

    recovery_rate = (revenue_recovered / revenue_at_risk * 100) if revenue_at_risk > 0 else 0.0
    
    active_cases = await db["recovery_cases"].count_documents({
        "status": {"$in": ["detected", "analyzing", "eligible", "recovery_in_progress"]}
    })
    
    successful_recoveries = await db["recovery_cases"].count_documents({"status": "recovered"})
    failed_cases = await db["recovery_cases"].count_documents({"status": "failed"})
    stopped_cases = await db["recovery_cases"].count_documents({"status": "stopped"})
    manual_reviews = await db["recovery_cases"].count_documents({"status": "manual_review"})

    # Unique customers recovered
    pipeline_cust = [
        {"$match": {"status": "recovered"}},
        {"$group": {"_id": "$customer_id"}}
    ]
    cust_rec_raw = await db["recovery_cases"].aggregate(pipeline_cust).to_list(1000)
    customers_recovered = len(cust_rec_raw)

    # Average recovery time
    pipeline_time = [
        {"$match": {"status": "recovered", "recovered_at": {"$ne": None}, "created_at": {"$ne": None}}},
        {"$project": {"time_diff_minutes": {"$divide": [{"$subtract": ["$recovered_at", "$created_at"]}, 60000]}}},
        {"$group": {"_id": None, "avg": {"$avg": "$time_diff_minutes"}}}
    ]
    time_res = await db["recovery_cases"].aggregate(pipeline_time).to_list(1)
    if time_res and time_res[0].get("avg") is not None:
        avg_m = time_res[0]["avg"]
        avg_recovery_time = f"{round(avg_m/60, 1)}h" if avg_m >= 60 else f"{round(avg_m, 0)}m"
    else:
        avg_recovery_time = "N/A"

    # Charts data
    pipeline_trend = [
        {"$group": {
            "_id": {"$dateToString": {"format": "%Y-%m-%d", "date": "$created_at"}},
            "at_risk": {"$sum": "$amount"},
            "recovered": {"$sum": "$recovered_amount"}
        }},
        {"$sort": {"_id": 1}}
    ]
    trend_raw = await db["recovery_cases"].aggregate(pipeline_trend).to_list(30)

    revenue_over_time = [
        {
            "date": item["_id"], 
            "at_risk": float(item.get("at_risk", 0.0)), 
            "recovered": float(item.get("recovered", 0.0))
        } 
        for item in trend_raw if item.get("_id")
    ]

    pipeline_failure = [
        {"$group": {"_id": "$failure_type", "count": {"$sum": 1}, "amount": {"$sum": "$amount"}}}
    ]
    failure_dist_raw = await db["recovery_cases"].aggregate(pipeline_failure).to_list(10)

    failure_distribution = [
        {
            "type": item["_id"],
            "name": (item["_id"] or "General Failure").replace("_", " ").title(),
            "count": int(item.get("count", 0)),
            "value": int(item.get("count", 0)),
            "amount": float(item.get("amount", 0.0))
        } 
        for item in failure_dist_raw if item.get("_id")
    ]

    pipeline_attempted = [{"$match": {"retry_count": {"$gt": 0}}}, {"$group": {"_id": None, "total": {"$sum": "$amount"}}}]
    res_attempted = await db["recovery_cases"].aggregate(pipeline_attempted).to_list(1)
    revenue_attempted = float(res_attempted[0]["total"]) if res_attempted and res_attempted[0].get("total") else 0.0

    recovery_funnel = {
        "revenue_at_risk": revenue_at_risk,
        "eligible": revenue_at_risk,
        "attempted": revenue_attempted,
        "recovered": revenue_recovered
    }

    recent_cases_raw = await db["recovery_cases"].find({}).sort("created_at", -1).limit(6).to_list(6)
    recent_cases = []
    for c in recent_cases_raw:
        if "_id" in c:
            c["id"] = str(c.pop("_id"))
        recent_cases.append(c)

    charts = {
        "revenue_over_time": revenue_over_time,
        "failure_distribution": failure_distribution,
        "recovery_funnel": recovery_funnel
    }

    return {
        "revenue_at_risk": revenue_at_risk,
        "revenue_recovered": revenue_recovered,
        "recovery_rate": round(recovery_rate, 2),
        "active_cases": active_cases,
        "total_attempts": successful_recoveries + failed_cases + stopped_cases + manual_reviews,
        "successful_recoveries": successful_recoveries,
        "failed_cases": failed_cases,
        "stopped_cases": stopped_cases,
        "manual_reviews": manual_reviews,
        "customers_recovered": customers_recovered,
        "avg_recovery_time": avg_recovery_time,
        "recent_cases": recent_cases,
        "charts": charts
    }