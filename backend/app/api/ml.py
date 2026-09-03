from fastapi import APIRouter, Depends
from typing import Dict, Any
import os
import joblib
from app.middleware.auth import get_current_user
from app.db.mongodb import get_database
from app.ml.train import train_model

router = APIRouter()

@router.get("/metrics")
async def get_ml_metrics(user: dict = Depends(get_current_user), db = Depends(get_database)) -> Dict[str, Any]:
    """Return real held-out test set ML metrics directly from model evaluation."""
    metrics_path = "app/ml/test_metrics.joblib"
    model_path = "app/ml/recovery_model.joblib"
    
    if not os.path.exists(model_path) or not os.path.exists(metrics_path):
        # Trigger training to generate model & held-out test evaluation metrics
        await train_model(db)
        
    if os.path.exists(metrics_path):
        try:
            metrics = joblib.load(metrics_path)
            metrics["evaluation_source"] = "Held-out test set"
            metrics["status"] = "AVAILABLE"
            return metrics
        except Exception as e:
            print(f"Failed loading test metrics: {e}")

    return {
        "status": "NOT_AVAILABLE",
        "message": "Held-out test metrics unavailable. Train the model to generate real metrics."
    }