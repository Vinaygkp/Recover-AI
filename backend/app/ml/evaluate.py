from sklearn.metrics import precision_score, recall_score, f1_score, roc_auc_score, confusion_matrix
import numpy as np

def evaluate_model(model, test_data) -> dict:
    if not test_data or not isinstance(test_data, dict) or 'X' not in test_data or 'y' not in test_data:
        return {}
        
    X_test = test_data['X']
    y_test = test_data['y']
    
    if len(X_test) == 0 or len(y_test) == 0:
        return {}
    
    try:
        preds = model.predict(X_test)
        
        # Safely get probabilities for ROC-AUC
        if hasattr(model, "predict_proba") and len(set(y_test)) > 1:
            probs_raw = model.predict_proba(X_test)
            probs = probs_raw[:, 1] if probs_raw.ndim > 1 and probs_raw.shape[1] > 1 else preds
        else:
            probs = preds
            
        res = {
            "precision": float(precision_score(y_test, preds, zero_division=0)),
            "recall": float(recall_score(y_test, preds, zero_division=0)),
            "f1": float(f1_score(y_test, preds, zero_division=0)),
            "confusion_matrix": confusion_matrix(y_test, preds).tolist()
        }
        
        if len(set(y_test)) > 1:
            try:
                res["roc_auc"] = float(roc_auc_score(y_test, probs))
            except Exception:
                res["roc_auc"] = 0.5
        else:
            res["roc_auc"] = 0.5
            
        return res
        
    except Exception as e:
        print(f"Error during model evaluation: {e}")
        return {}