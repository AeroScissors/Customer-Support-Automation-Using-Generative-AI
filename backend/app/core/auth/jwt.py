from datetime import datetime, timedelta
from typing import Optional, Dict

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from app.utils.config import settings

# -------------------------------------------------------------------
# CONFIG
# -------------------------------------------------------------------

ALGORITHM = "HS256"
# This tells FastAPI where to look for the token in requests 
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

# -------------------------------------------------------------------
# TOKEN CREATION
# -------------------------------------------------------------------

def create_access_token(
    *,
    subject: str,
    role: str,
    expires_delta: Optional[timedelta] = None
) -> str:
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(
            minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
        )

    payload: Dict[str, str | datetime] = {
        "sub": subject,
        "role": role,
        "exp": expire,
    }

    encoded_jwt = jwt.encode(
        payload,
        settings.JWT_SECRET_KEY,
        algorithm=ALGORITHM,
    )

    return encoded_jwt

# -------------------------------------------------------------------
# TOKEN DECODING / VALIDATION
# -------------------------------------------------------------------

def decode_access_token(token: str) -> Dict:
    try:
        print("TOKEN RECEIVED:", token)
        print("USING SECRET:", settings.JWT_SECRET_KEY)

        payload = jwt.decode(
            token,
            settings.JWT_SECRET_KEY,
            algorithms=[ALGORITHM],
        )

        print("DECODE SUCCESS:", payload)
        return payload

    except JWTError as exc:
        print("JWT ERROR:", exc)
        raise JWTError("Invalid or expired token") from exc

# -------------------------------------------------------------------
# 🔥 NEW: FASTAPI DEPENDENCIES (To fix the AttributeError)
# -------------------------------------------------------------------

async def get_current_user(token: str = Depends(oauth2_scheme)) -> Dict:
    """
    Decodes the token from the header and returns the payload.
    Used for general authenticated access.
    """
    try:
        payload = decode_access_token(token)
        return payload
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

async def get_current_admin(current_user: Dict = Depends(get_current_user)) -> Dict:
    """
    Specifically checks if the logged-in user has the 'admin' role.
    This is what faq.py is looking for.
    """
    if current_user.get("role") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only Admins are authorized to perform this action "
        )
    return current_user