from fastapi import APIRouter, Depends
from typing import Dict, Any
from app.db.mongodb import get_database
from app.config import settings
from app.services.payment_provider import RazorpayTestProvider

router = APIRouter()

@router.get("/razorpay/status")
async def get_razorpay_status(db = Depends(get_database)) -> Dict[str, Any]:
    """Return status of Razorpay integration with real API connectivity test."""
    provider = RazorpayTestProvider()
    configured = provider.is_configured()
    api_reachable = False
    
    if configured and provider.client:
        try:
            # Perform real safe API reachability test against Razorpay REST API
            provider.client.order.all({"count": 1})
            api_reachable = True
        except Exception as e:
            print(f"Razorpay API connectivity test failed: {e}")
            api_reachable = False
            
    last_webhook_at = None
    try:
        last_event = await db["webhook_events"].find_one({})
        if last_event and last_event.get("received_at"):
            last_webhook_at = str(last_event.get("received_at"))
    except Exception:
        last_webhook_at = None

    if configured and api_reachable:
        status_str = "CONNECTED"
        status_text = "RAZORPAY TEST MODE - CONNECTED"
    elif configured and not api_reachable:
        status_str = "UNAVAILABLE"
        status_text = "RAZORPAY TEST MODE - UNAVAILABLE (API Failure)"
    else:
        status_str = "NOT_CONFIGURED"
        status_text = "DEMO MODE - RAZORPAY NOT CONFIGURED"

    key_id = getattr(settings, 'RAZORPAY_KEY_ID', None)
    key_id_formatted = key_id[:8] + "..." if key_id else "NOT_SET"

    return {
        "configured": configured,
        "test_mode": True,
        "api_reachable": api_reachable,
        "status": status_str,
        "status_text": status_text,
        "webhook_configured": bool(getattr(settings, 'RAZORPAY_WEBHOOK_SECRET', None) or configured),
        "last_webhook_at": last_webhook_at,
        "key_id": key_id_formatted
    }