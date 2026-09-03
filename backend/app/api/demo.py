from fastapi import APIRouter, Depends, HTTPException
from typing import Optional
from app.db.mongodb import get_database
from app.middleware.auth import get_optional_current_user
from app.services.synthetic import generate_demo_data

router = APIRouter()

@router.api_route("/generate", methods=["GET", "POST"])
@router.api_route("/generate-data", methods=["GET", "POST"])
async def trigger_demo_data(user: Optional[dict] = Depends(get_optional_current_user), db = Depends(get_database)):
    user_dict = user or {"id": "demo_user", "email": "merchant@recover.ai", "merchant_id": "demo_merchant_1"}
    merchant_id = user_dict.get("merchant_id", "demo_merchant_1")
        
    try:
        stats = await generate_demo_data(str(merchant_id), db)
        return {
            "success": True,
            "message": "Demo data generated successfully!",
            "stats": stats
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))