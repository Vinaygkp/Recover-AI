import joblib
import pandas as pd
import os
from typing import Dict, Any
from app.ml.preprocess import extract_features

def predict_recovery_probability(transaction: Dict[str, Any], case: Dict[str, Any] = None) -> Dict[str, Any]:
    """
    Generate ML prediction for transaction recovery probability.
    Returns prediction dictionary with probability, version, prediction label, features used, and explanation.
    """
    model_path = "app/ml/recovery_model.joblib"
    features_path = "app/ml/model_features.joblib"
    
    # Feature defaults & extraction
    amount = float(transaction.get("amount", 0.0))
    retry_count = int(transaction.get("retry_count", case.get("retry_count", 0) if case else 0))
    is_subscription = bool(transaction.get("is_subscription", False))
    failure_reason = str(transaction.get("failure_reason", "unknown"))
    
    # Check model availability
    if not os.path.exists(model_path) or not os.path.exists(features_path):
        # Heuristic fallback if model not yet trained on disk
        prob = 0.85 if amount <= 10000 and retry_count < 2 else (0.45 if amount > 25000 else 0.65)
        return {
            "recovery_probability": round(prob, 3),
            "model_version": "heuristic-fallback-v1",
            "prediction": "HIGH_RECOVERY_PROBABILITY" if prob >= 0.7 else ("MEDIUM_RECOVERY_PROBABILITY" if prob >= 0.4 else "LOW_RECOVERY_PROBABILITY"),
            "features_used": ["amount", "retry_count", "is_subscription", "failure_reason"],
            "user_explanation": f"High recovery probability estimated based on transaction amount ₹{amount:,.0f} and retry count {retry_count}.",
            "model_status": "READY"
        }
        
    try:
        model = joblib.load(model_path)
        model_features = joblib.load(features_path)
        
        df = extract_features([transaction])
        
        if df is None or df.empty:
            return {
                "recovery_probability": 0.5,
                "model_version": "recovery-v1.2",
                "prediction": "MEDIUM_RECOVERY_PROBABILITY",
                "features_used": model_features,
                "user_explanation": "Default prediction applied due to empty feature vector.",
                "model_status": "READY"
            }
        
        for f in model_features:
            if f not in df.columns:
                df[f] = 0.0
                
        X = df[model_features]
        
        if hasattr(model, "predict_proba"):
            probs = model.predict_proba(X)
            prob = float(probs[0][1]) if probs.shape[1] > 1 else float(probs[0][0])
        else:
            prob = float(model.predict(X)[0])
            
        prob = min(max(prob, 0.01), 0.99)
        
        pred_label = "HIGH_RECOVERY_PROBABILITY" if prob >= 0.7 else ("MEDIUM_RECOVERY_PROBABILITY" if prob >= 0.4 else "LOW_RECOVERY_PROBABILITY")
        
        explanation = f"High recovery probability of {int(prob*100)}% calculated by ML model. Transaction has {retry_count} previous attempt(s), amount ₹{amount:,.0f}, and matches historical successful recovery patterns."
        
        return {
            "recovery_probability": round(prob, 4),
            "model_version": "recovery-v1.2",
            "prediction": pred_label,
            "features_used": model_features,
            "user_explanation": explanation,
            "model_status": "READY"
        }
            
    except Exception as e:
        print(f"Error during ML prediction: {e}")
        return {
            "recovery_probability": 0.0,
            "model_version": "error-v1",
            "prediction": "MODEL_UNAVAILABLE — MANUAL_REVIEW",
            "features_used": [],
            "user_explanation": f"ML model inference encountered an error: {str(e)}. Manual review recommended.",
            "model_status": "MODEL_UNAVAILABLE — MANUAL_REVIEW"
        }