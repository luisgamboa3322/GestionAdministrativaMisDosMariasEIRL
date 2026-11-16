import hashlib
import hmac
import secrets
from datetime import datetime, timedelta, timezone
from urllib.parse import urlparse

from fastapi import HTTPException, Request, Response, status
from pwdlib import PasswordHash
from pwdlib.hashers.argon2 import Argon2Hasher

from app.core.config import Settings

password_hasher = PasswordHash((Argon2Hasher(),))


def hash_password(plain_password: str) -> str:
    """Hash a plain-text password using Argon2."""
    return password_hasher.hash(plain_password)


def verify_password(plain_password: str, password_hash: str) -> bool:
    """Verify a plain-text password against its stored Argon2 hash."""
    if not plain_password or not password_hash:
        return False
    return password_hasher.verify(plain_password, password_hash)


def generate_session_token() -> str:
    """Generate a high-entropy opaque session token."""
    return secrets.token_urlsafe(48)


def hash_session_token(raw_token: str, secret_key: str) -> str:
    """Compute an HMAC-SHA256 digest of a raw session token for storage."""
    return hmac.new(
        secret_key.encode("utf-8"),
        raw_token.encode("utf-8"),
        hashlib.sha256,
    ).hexdigest()


def session_expiry(ttl_hours: int) -> datetime:
    """Return UTC expiration timestamp for a newly issued session."""
    return datetime.now(timezone.utc) + timedelta(hours=ttl_hours)


def set_session_cookie(response: Response, raw_token: str, settings: Settings) -> None:
    """Attach the HttpOnly session cookie to the response."""
    response.set_cookie(
        key=settings.session_cookie_name,
        value=raw_token,
        httponly=True,
        secure=settings.session_cookie_secure,
        samesite="lax",
        max_age=settings.session_ttl_hours * 3600,
        path="/",
    )


def clear_session_cookie(response: Response, settings: Settings) -> None:
    """Expire and remove the session cookie from the client."""
    response.delete_cookie(
        key=settings.session_cookie_name,
        httponly=True,
        secure=settings.session_cookie_secure,
        samesite="lax",
        path="/",
    )


def verify_csrf_origin(request: Request, settings: Settings) -> None:
    """Validate Origin/Referer on state-changing requests authenticated by cookies."""
    if request.method in {"GET", "HEAD", "OPTIONS"}:
        return

    origin = request.headers.get("origin")
    referer = request.headers.get("referer")
    candidate = origin
    if not candidate and referer:
        parsed = urlparse(referer)
        if parsed.scheme and parsed.netloc:
            candidate = f"{parsed.scheme}://{parsed.netloc}"

    if not candidate:
        return

    allowed = set(settings.cors_origins)
    host_url = str(request.base_url).rstrip("/")
    allowed.add(host_url)

    if candidate.rstrip("/") not in allowed:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Origen de solicitud no autorizado.",
        )
