from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import os

from app.config import settings
from app.db.mongodb import connect_db, close_db, get_database
from app.api import auth, dashboard, transactions, recovery, analytics, audit, policies, customers, notifications, simulation, demo, webhooks, ml, integrations, payments, ai, promises
from app.services.razorpay import RazorpayService

@asynccontextmanager
async def lifespan(app: FastAPI):
    await connect_db()
    yield
    await close_db()

app = FastAPI(title="RECOVER AI Backend", lifespan=lifespan)

# Environment-based CORS configuration
allowed_origins = [settings.FRONTEND_URL]
if settings.APP_ENV == "development":
    allowed_origins.extend(["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:5174", "http://127.0.0.1:5174"])

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins if settings.APP_ENV != "development" else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {
        "app": "RECOVER AI Backend",
        "status": "online",
        "docs": "/docs",
        "health": "/api/health"
    }

@app.get("/api/health")
@app.get("/api/system/health")
async def health_check():
    rzp_configured = RazorpayService().is_configured()
    model_exists = os.path.exists("app/ml/recovery_model.joblib")
    openai_configured = bool(settings.OPENAI_API_KEY)
    
    return {
        "status": "ok",
        "services": {
            "mongodb": "CONNECTED",
            "ml_engine": "CONNECTED" if model_exists else "DEGRADED (Baseline)",
            "recovery_engine": "CONNECTED",
            "policy_engine": "CONNECTED",
            "promises_to_pay": "CONNECTED",
            "razorpay": "CONNECTED (Test Mode)" if rzp_configured else "NOT CONFIGURED (Demo Mode)",
            "webhook": "CONNECTED" if rzp_configured else "AVAILABLE",
            "openai_ai": "CONNECTED" if openai_configured else "NOT CONFIGURED (Fallback to Manual Review)",
            "ai_service": "CONNECTED"
        }
    }

app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(dashboard.router, prefix="/api/dashboard", tags=["dashboard"])
app.include_router(transactions.router, prefix="/api/transactions", tags=["transactions"])
app.include_router(recovery.router, prefix="/api/recovery", tags=["recovery"])
app.include_router(analytics.router, prefix="/api/analytics", tags=["analytics"])
app.include_router(audit.router, prefix="/api/audit", tags=["audit"])
app.include_router(policies.router, prefix="/api/policies", tags=["policies"])
app.include_router(customers.router, prefix="/api/customers", tags=["customers"])
app.include_router(notifications.router, prefix="/api/notifications", tags=["notifications"])
app.include_router(simulation.router, prefix="/api/simulation", tags=["simulation"])
app.include_router(demo.router, prefix="/api/demo", tags=["demo"])
app.include_router(webhooks.router, prefix="/api/webhooks", tags=["webhooks"])
app.include_router(ml.router, prefix="/api/ml", tags=["ml"])
app.include_router(integrations.router, prefix="/api/integrations", tags=["integrations"])
app.include_router(payments.router, prefix="/api/payments", tags=["payments"])
app.include_router(ai.router, prefix="/api/ai", tags=["ai"])
app.include_router(promises.router, prefix="/api/promises", tags=["promises"])

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={"success": False, "error": {"code": "internal_error", "message": str(exc)}},
    )