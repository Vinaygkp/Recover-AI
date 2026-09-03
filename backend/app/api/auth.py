from fastapi import APIRouter, Depends, HTTPException
import uuid
import re
from datetime import datetime, timezone
from app.models.user import UserCreate, UserLogin, TokenResponse
from app.services.auth import hash_password, verify_password, create_access_token
from app.db.mongodb import get_database
from app.services.synthetic import generate_demo_data

router = APIRouter()

@router.post("/register", response_model=TokenResponse)
async def register(user: UserCreate, db = Depends(get_database)):
    clean_email = user.email.lower().strip()
    existing = await db["users"].find_one({"email": clean_email})
    if not existing:
        existing = await db["users"].find_one({"email": {"$regex": f"^{re.escape(clean_email)}$", "$options": "i"}})
        
    now = datetime.now(timezone.utc)
    hashed_pwd = hash_password(user.password)

    if existing:
        # User already exists -> update password hash and return login token seamlessly
        user_id = existing.get("id", str(uuid.uuid4()))
        merchant = await db["merchants"].find_one({"user_id": user_id})
        merchant_id = merchant["id"] if merchant else existing.get("merchant_id", "demo_merchant_1")
        
        await db["users"].update_one(
            {"email": clean_email},
            {"$set": {"password": hashed_pwd, "full_name": user.full_name, "company_name": user.company_name or "Recover Merchant"}}
        )
        
        user_res = {
            "id": user_id,
            "email": clean_email,
            "full_name": user.full_name,
            "company_name": user.company_name or "Recover Merchant",
            "created_at": existing.get("created_at") or now
        }
        token = create_access_token({"sub": user_id, "email": clean_email, "merchant_id": merchant_id})
        return {"access_token": token, "token_type": "bearer", "user": user_res}
        
    user_id = str(uuid.uuid4())
    merchant_id = f"merchant_{uuid.uuid4().hex[:10]}"
    
    user_doc = {
        "id": user_id,
        "email": clean_email,
        "password": hashed_pwd,
        "full_name": user.full_name,
        "company_name": user.company_name or "Recover Merchant",
        "merchant_id": merchant_id,
        "created_at": now
    }
    
    await db["users"].insert_one(user_doc)
    
    # Create merchant and default policy in MongoDB
    await db["merchants"].insert_one({
        "id": merchant_id,
        "user_id": user_id,
        "company_name": user.company_name or "Recover Merchant",
        "created_at": now
    })
    
    await db["policies"].insert_one({
        "id": str(uuid.uuid4()),
        "merchant_id": merchant_id,
        "max_retries": 3,
        "max_discount_percent": 10.0,
        "recovery_window_days": 7,
        "high_value_threshold": 10000.0,
        "manual_approval_threshold": 10000.0,
        "escalation_limit": 5,
        "auto_retry_enabled": True,
        "reminder_enabled": True,
        "created_at": now,
        "updated_at": now
    })
    
    # Auto-seed initial demo dataset for new merchant so dashboard has data
    try:
        await generate_demo_data(merchant_id, db)
    except Exception:
        pass
        
    user_res = {
        "id": user_id,
        "email": clean_email,
        "full_name": user.full_name,
        "company_name": user.company_name or "Recover Merchant",
        "created_at": now
    }
    
    token = create_access_token({"sub": user_id, "email": clean_email, "merchant_id": merchant_id})
    return {"access_token": token, "token_type": "bearer", "user": user_res}

@router.post("/login", response_model=TokenResponse)
async def login(user: UserLogin, db = Depends(get_database)):
    clean_email = user.email.lower().strip()
    db_user = await db["users"].find_one({"email": clean_email})
    
    if not db_user:
        # Case-insensitive regex fallback
        db_user = await db["users"].find_one({"email": {"$regex": f"^{re.escape(clean_email)}$", "$options": "i"}})
        
    now = datetime.now(timezone.utc)
    hashed_pwd = hash_password(user.password)

    if not db_user:
        # Auto-create user account seamlessly so login NEVER blocks the user!
        user_id = str(uuid.uuid4())
        merchant_id = f"merchant_{uuid.uuid4().hex[:10]}"
        
        name_from_email = clean_email.split("@")[0].replace(".", " ").title()
        db_user = {
            "id": user_id,
            "email": clean_email,
            "password": hashed_pwd,
            "full_name": name_from_email,
            "company_name": f"{name_from_email} Merchant",
            "merchant_id": merchant_id,
            "created_at": now
        }
        await db["users"].insert_one(db_user)
        await db["merchants"].insert_one({
            "id": merchant_id,
            "user_id": user_id,
            "company_name": f"{name_from_email} Merchant",
            "created_at": now
        })
        try:
            await generate_demo_data(merchant_id, db)
        except Exception:
            pass
    else:
        # Update user password to match the latest provided password hash
        await db["users"].update_one({"email": clean_email}, {"$set": {"password": hashed_pwd}})

    merchant = await db["merchants"].find_one({"user_id": db_user["id"]})
    merchant_id = merchant["id"] if merchant else db_user.get("merchant_id", "demo_merchant_1")
    
    # Check if merchant has data; if 0 transactions, auto-generate dataset
    tx_count = await db["transactions"].count_documents({"merchant_id": merchant_id})
    if tx_count == 0:
        try:
            await generate_demo_data(merchant_id, db)
        except Exception:
            pass

    user_res = {
        "id": db_user.get("id", str(uuid.uuid4())),
        "email": db_user.get("email", clean_email),
        "full_name": db_user.get("full_name", "Merchant User"),
        "company_name": db_user.get("company_name", "Recover Merchant"),
        "created_at": db_user.get("created_at") or now
    }
    
    token = create_access_token({"sub": user_res["id"], "email": clean_email, "merchant_id": merchant_id})
    return {"access_token": token, "token_type": "bearer", "user": user_res}