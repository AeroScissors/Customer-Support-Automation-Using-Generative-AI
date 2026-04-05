from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from app.core.auth.jwt import decode_access_token

# -------------------------------------------------------------------
# DEV MODE SWITCH
# -------------------------------------------------------------------
DEV_MODE = True  # 🔥 Set False when you want real auth back


# -------------------------------------------------------------------
# HTTP Bearer scheme
# (expects: Authorization: Bearer <token>)
# -------------------------------------------------------------------
security = HTTPBearer(auto_error=False)


# -------------------------------------------------------------------
# CURRENT USER DEPENDENCY
# -------------------------------------------------------------------
def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
):
    """
    Validate JWT and return current user context.

    DEV MODE:
    - Skips JWT entirely
    - Always returns a valid admin user

    REAL MODE:
    - Validates JWT
    - Returns decoded user context
    """

    # ✅ DEV MODE BYPASS
    if DEV_MODE:
        return {
            "user_id": "dev_user",
            "role": "admin",
            "payload": {
                "sub": "dev_user",
                "role": "admin",
            },
        }

    # 🔐 REAL AUTH MODE
    if not credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing authentication token",
        )

    token = credentials.credentials

    try:
        payload = decode_access_token(token)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        )

    user_id = payload.get("sub")
    role = payload.get("role")

    if not user_id or not role:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication token",
        )

    return {
        "user_id": user_id,
        "role": role,
        "payload": payload,
    }


# -------------------------------------------------------------------
# ROLE GUARDS
# -------------------------------------------------------------------
def require_admin(
    current_user: dict = Depends(get_current_user),
):
    """
    Admin-only guard.
    """

    # ✅ DEV MODE AUTO-ALLOW
    if DEV_MODE:
        return {
            "user_id": "dev_admin",
            "role": "admin",
            "payload": {},
        }

    if current_user["role"] != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required",
        )

    return current_user


def require_agent(
    current_user: dict = Depends(get_current_user),
):
    """
    Agent-only guard.
    """

    # ✅ DEV MODE AUTO-ALLOW
    if DEV_MODE:
        return {
            "user_id": "dev_agent",
            "role": "agent",
            "payload": {},
        }

    if current_user["role"] != "agent":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Agent access required",
        )

    return current_user
