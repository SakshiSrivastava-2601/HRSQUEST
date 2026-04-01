import os
from datetime import datetime, timedelta, timezone
from jose import jwt
from jose.exceptions import JWTError
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer

# --- JWT Configuration ---
# Never ship a hardcoded fallback secret. Require env/config to provide it.
SECRET_KEY = os.getenv("HRSQUEST_JWT_SECRET", "").strip()
if not SECRET_KEY:
    raise RuntimeError(
        "Missing required env var HRSQUEST_JWT_SECRET. "
        "Set it (or add [auth] jwt_secret in config.ini) before starting the server."
    )
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("HRSQUEST_ACCESS_TOKEN_EXPIRE_MINUTES", "30"))
REFRESH_TOKEN_EXPIRE_DAYS = int(os.getenv("HRSQUEST_REFRESH_TOKEN_EXPIRE_DAYS", "30"))
TOKEN_ISSUER = "hrsquest-backend"

# --- JWT Functions ---


def _create_token(*, data: dict, token_type: str, expiry: timedelta):
    """Generates a signed JWT with issuer + token_type."""
    to_encode = data.copy()
    now = datetime.now(timezone.utc)
    to_encode.update(
        {
            "iat": int(now.timestamp()),
            "iss": TOKEN_ISSUER,
            "token_type": token_type,
        }
    )
    expire = now + expiry
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def create_access_token(data: dict, EXPIRY: int = ACCESS_TOKEN_EXPIRE_MINUTES):
    """Generates a new access JWT."""
    minutes = int(EXPIRY or ACCESS_TOKEN_EXPIRE_MINUTES)
    return _create_token(data=data, token_type="access", expiry=timedelta(minutes=minutes))


def create_refresh_token(data: dict, days: int = REFRESH_TOKEN_EXPIRE_DAYS):
    """Generates a new refresh JWT."""
    d = int(days or REFRESH_TOKEN_EXPIRE_DAYS)
    return _create_token(data=data, token_type="refresh", expiry=timedelta(days=d))


def _decode_token(token: str):
    """Decodes a JWT and returns the payload data."""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        if payload.get("iss") and payload["iss"] != TOKEN_ISSUER:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token issuer",
            )
        return payload
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could Not Validate Token",
        )

def decode_access_token(token: str):
    payload = _decode_token(token)
    if payload.get("token_type") != "access":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token type")
    return payload


def decode_refresh_token(token: str):
    payload = _decode_token(token)
    if payload.get("token_type") != "refresh":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token type")
    return payload


bearer_scheme = HTTPBearer(auto_error=False)

def get_current_user(token: str = Depends(bearer_scheme)):
    "Returns details about the current student like username,email etc. after decoding the bearer token"
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token not Found",
        )
    result = decode_access_token(token.credentials)
    return result
