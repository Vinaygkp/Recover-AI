import bcrypt
from datetime import datetime, timedelta, timezone
from jose import jwt, JWTError
from typing import Union, Dict, Any
from app.config import settings

def hash_password(password: str) -> str:
    # Bcrypt requires bytes and handles the 72-byte limit restriction safely
    pwd_bytes = password.encode('utf-8')[:72]
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(pwd_bytes, salt)
    return hashed.decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    pwd_bytes = plain_password.encode('utf-8')[:72]
    hashed_bytes = hashed_password.encode('utf-8')
    try:
        return bcrypt.checkpw(pwd_bytes, hashed_bytes)
    except Exception:
        return False

def create_access_token(data: Dict[str, Any], expires_delta: Union[timedelta, None] = None) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (
        expires_delta if expires_delta else timedelta(hours=getattr(settings, 'JWT_EXPIRY_HOURS', 24))
    )
    to_encode.update({"exp": expire})
    
    secret = getattr(settings, 'JWT_SECRET', 'secret')
    algorithm = getattr(settings, 'JWT_ALGORITHM', 'HS256')
    
    return jwt.encode(to_encode, secret, algorithm=algorithm)

def decode_token(token: str) -> Dict[str, Any]:
    try:
        secret = getattr(settings, 'JWT_SECRET', 'secret')
        algorithm = getattr(settings, 'JWT_ALGORITHM', 'HS256')
        payload = jwt.decode(token, secret, algorithms=[algorithm])
        return payload if isinstance(payload, dict) else {}
    except JWTError:
        return {}