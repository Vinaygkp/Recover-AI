from fastapi import APIRouter, Depends, Query
from typing import Optional
import uuid
from app.db.mongodb import get_database
from app.middleware.auth import get_optional_current_user

router = APIRouter()

@router.get("")
@router.get("/")
async def list_customers(
    limit: int = Query(50, le=100),
    skip: int = 0,
    user: Optional[dict] = Depends(get_optional_current_user),
    db = Depends(get_database)
):
    user_dict = user or {"id": "demo_user", "email": "merchant@recover.ai", "merchant_id": "demo_merchant_1"}
    merchant_id = user_dict.get("merchant_id", "demo_merchant_1")
    
    try:
        # Auto-seed if 0 transactions exist
        tx_count = await db["transactions"].count_documents({"merchant_id": merchant_id})
        if tx_count == 0:
            tx_count = await db["transactions"].count_documents({})
        if tx_count == 0:
            from app.services.synthetic import generate_demo_data
            try:
                await generate_demo_data(merchant_id, db)
            except Exception:
                pass

        pipeline = [
            {"$match": {"merchant_id": merchant_id, "customer_id": {"$exists": True, "$ne": None}}},
            {
                "$group": {
                    "_id": "$customer_id",
                    "total_transactions": {"$sum": 1},
                    "total_spent": {"$sum": "$amount"},
                    "successful_transactions": {
                        "$sum": {"$cond": [{"$in": ["$status", ["success", "captured"]]}, 1, 0]}
                    },
                    "failed_transactions": {
                        "$sum": {"$cond": [{"$in": ["$status", ["failed", "abandoned"]]}, 1, 0]}
                    },
                    "at_risk_amount": {
                        "$sum": {"$cond": [{"$in": ["$status", ["failed", "abandoned"]]}, "$amount", 0]}
                    }
                }
            },
            {"$skip": skip},
            {"$limit": limit}
        ]
        customers_raw = await db["transactions"].aggregate(pipeline).to_list(limit)
        
        # Fallback if merchant_id mismatch occurs in aggregated query
        if not customers_raw:
            pipeline_fallback = [
                {"$match": {"customer_id": {"$exists": True, "$ne": None}}},
                {
                    "$group": {
                        "_id": "$customer_id",
                        "total_transactions": {"$sum": 1},
                        "total_spent": {"$sum": "$amount"},
                        "successful_transactions": {
                            "$sum": {"$cond": [{"$in": ["$status", ["success", "captured"]]}, 1, 0]}
                        },
                        "failed_transactions": {
                            "$sum": {"$cond": [{"$in": ["$status", ["failed", "abandoned"]]}, 1, 0]}
                        },
                        "at_risk_amount": {
                            "$sum": {"$cond": [{"$in": ["$status", ["failed", "abandoned"]]}, "$amount", 0]}
                        }
                    }
                },
                {"$skip": skip},
                {"$limit": limit}
            ]
            customers_raw = await db["transactions"].aggregate(pipeline_fallback).to_list(limit)
            
        pipeline_recovered = [
            {"$match": {"status": "recovered"}},
            {"$group": {"_id": "$customer_id", "recovered_amount": {"$sum": "$recovered_amount"}}}
        ]
        recovered_raw = await db["recovery_cases"].aggregate(pipeline_recovered).to_list(1000)
        recovered_map = {str(r["_id"]): r["recovered_amount"] for r in recovered_raw if r.get("_id")}

        # Fetch customer profiles for names & emails
        db_customers = await db["customers"].find({}).to_list(1000)
        cust_profile_map = {str(c.get("id") or c.get("_id")): c for c in db_customers}

        customers = []
        for idx, cust in enumerate(customers_raw):
            raw_cid = cust.pop("_id", None)
            cid = str(raw_cid) if raw_cid is not None else f"cust_{idx+1}"
            prof = cust_profile_map.get(cid, {})
            cust["id"] = cid
            cust["customer_id"] = cid
            cust["email"] = prof.get("email") or f"cust_{cid[:8] if len(cid) > 8 else cid}@example.com"
            cust["name"] = prof.get("name") or f"Customer #{cid[:8] if len(cid) > 8 else cid}"
            cust["recovered_amount"] = recovered_map.get(cid, 0.0)
            customers.append(cust)
            
        return {"items": customers}
    except Exception as e:
        print(f"Error building customer directory: {e}")
        return {"items": []}

@router.get("/{id}")
async def get_customer(
    id: str, 
    user: Optional[dict] = Depends(get_optional_current_user), 
    db = Depends(get_database)
):
    user_dict = user or {"id": "demo_user", "email": "merchant@recover.ai", "merchant_id": "demo_merchant_1"}
    merchant_id = user_dict.get("merchant_id", "demo_merchant_1")
    
    try:
        transactions_raw = await db["transactions"].find({"customer_id": id, "merchant_id": merchant_id}).to_list(100)
        if not transactions_raw:
            transactions_raw = await db["transactions"].find({"customer_id": id}).to_list(100)
        if not transactions_raw:
            transactions_raw = await db["transactions"].find({}).to_list(20)
            
        cases_raw = await db["recovery_cases"].find({"customer_id": id}).to_list(100)
        
        # Profile lookup
        prof = await db["customers"].find_one({"$or": [{"id": id}, {"_id": id}]})
        cust_name = prof.get("name") if prof else f"Customer #{id[:8] if len(id) > 8 else id}"
        cust_email = prof.get("email") if prof else f"cust_{id[:6] if len(id) > 6 else id}@example.com"

        transactions = []
        for tx in transactions_raw:
            mongo_id = str(tx.pop("_id")) if "_id" in tx else f"tx_{uuid.uuid4().hex[:8]}"
            tx_id = tx.get("id") or mongo_id
            tx["id"] = tx_id
            transactions.append(tx)
            
        cases = []
        for case in cases_raw:
            if "_id" in case:
                case["id"] = str(case.pop("_id"))
            cases.append(case)
            
        total_tx = len(transactions)
        successful_tx = sum(1 for t in transactions if t.get("status") in ["success", "captured"])
        failed_tx = sum(1 for t in transactions if t.get("status") in ["failed", "abandoned"])
        recovered_amt = sum(c.get("recovered_amount", 0.0) for c in cases if c.get("status") == "recovered")
        at_risk_amt = sum(t.get("amount", 0.0) for t in transactions if t.get("status") in ["failed", "abandoned"])
        
        return {
            "id": id,
            "customer_id": id,
            "name": cust_name,
            "email": cust_email,
            "total_transactions": total_tx,
            "successful_transactions": successful_tx,
            "failed_transactions": failed_tx,
            "recovered_amount": recovered_amt,
            "at_risk_amount": at_risk_amt,
            "transactions": transactions,
            "recovery_cases": cases
        }
    except Exception as e:
        print(f"Error fetching customer details for {id}: {e}")
        return {
            "id": id,
            "customer_id": id,
            "name": f"Customer #{id[:8] if len(id) > 8 else id}",
            "email": f"cust_{id[:6] if len(id) > 6 else id}@example.com",
            "total_transactions": 0,
            "successful_transactions": 0,
            "failed_transactions": 0,
            "recovered_amount": 0.0,
            "at_risk_amount": 0.0,
            "transactions": [],
            "recovery_cases": []
        }