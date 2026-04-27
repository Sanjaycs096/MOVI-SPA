from datetime import datetime, timedelta
import bcrypt
from jose import jwt
from .config import settings

def hash_secret(value: str) -> str:
    """Hash a password/secret using bcrypt directly."""
    password_bytes = value.encode("utf-8")[:72]
    return bcrypt.hashpw(password_bytes, bcrypt.gensalt()).decode("utf-8")

def verify_secret(value: str, hashed_value: str) -> bool:
    """Verify a password/secret against its bcrypt hash."""
    try:
        password_bytes = value.encode("utf-8")[:72]
        return bcrypt.checkpw(password_bytes, hashed_value.encode("utf-8"))
    except Exception:
        return False

def create_access_token(subject: str) -> str:
    expire = datetime.utcnow() + timedelta(minutes=settings.jwt_exp_minutes)
    payload = {"sub": subject, "exp": expire}
    return jwt.encode(
        payload,
        settings.jwt_secret,
        algorithm=settings.jwt_algorithm,
    )
