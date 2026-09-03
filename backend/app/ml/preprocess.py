import pandas as pd
from typing import Dict, Any, List

def extract_features(transaction_data: List[Dict[str, Any]]) -> pd.DataFrame:
    if not transaction_data:
        return pd.DataFrame()
        
    df = pd.DataFrame(transaction_data)
    if df.empty:
        return df
        
    # amount_normalized
    if 'amount' in df.columns:
        df['amount'] = pd.to_numeric(df['amount'], errors='coerce').fillna(0.0)
        std_val = df['amount'].std()
        if pd.isna(std_val) or std_val == 0:
            df['amount_normalized'] = 0.0
        else:
            df['amount_normalized'] = (df['amount'] - df['amount'].mean()) / (std_val + 1e-5)
    
    # hours_since_failure
    if 'created_at' in df.columns:
        df['created_at'] = pd.to_datetime(df['created_at'], errors='coerce')
        now = pd.Timestamp.now(tz='UTC')
        
        # Localize or convert to UTC safely
        if df['created_at'].dt.tz is None:
            df['created_at'] = df['created_at'].dt.tz_localize('UTC', ambiguous='NaT', nonexistent='shift_forward')
        else:
            df['created_at'] = df['created_at'].dt.tz_convert('UTC')
            
        df['hours_since_failure'] = (now - df['created_at']).dt.total_seconds() / 3600.0
        df['hours_since_failure'] = df['hours_since_failure'].fillna(0.0)
        
        df['hour_of_day'] = df['created_at'].dt.hour.fillna(0).astype(int)
        df['day_of_week'] = df['created_at'].dt.dayofweek.fillna(0).astype(int)
    
    # Fill defaults for missing numeric features
    cols_to_fill = ['retry_count', 'customer_tx_count', 'customer_success_rate']
    for col in cols_to_fill:
        if col not in df.columns:
            df[col] = 0.0
        else:
            df[col] = pd.to_numeric(df[col], errors='coerce').fillna(0.0)

    if 'is_subscription' not in df.columns:
        df['is_subscription'] = False
    else:
        df['is_subscription'] = df['is_subscription'].fillna(False).astype(bool)
        
    # Encoded categorical features
    categorical_cols = ['failure_reason', 'checkout_stage', 'payment_method']
    for col in categorical_cols:
        if col in df.columns:
            df[col] = df[col].astype(str).fillna('unknown')
            df[f'{col}_encoded'] = df[col].astype('category').cat.codes
        else:
            df[f'{col}_encoded'] = -1
            
    return df