from datetime import datetime, timezone

from fastapi import Depends, HTTPException, Request, status
from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from app.core.config import Settings, get_settings
from app.core.database import get_db
from app.core.security import hash_session_token, verify_csrf_origin
from app.core.storage import StorageBackend, get_storage_client
from app.models.entities import User, UserSession


def _ensure_aware_utc(dt: datetime) -> datetime:
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt


def get_current_session(
    request: Request,
    db: Session = Depends(get_db),
    settings: Settings = Depends(get_settings),
) -> UserSession:
    """Resolve and validate the active HttpOnly session from request cookies."""
    verify_csrf_origin(request, settings)

    raw_token = request.cookies.get(settings.session_cookie_name)
    if not raw_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Sesión no iniciada.",
        )

    token_hash = hash_session_token(raw_token, settings.session_secret_key)
    stmt = (
        select(UserSession)
        .options(joinedload(UserSession.user).joinedload(User.organization))
        .where(UserSession.token_hash == token_hash)
    )
    session_row = db.scalar(stmt)
    if session_row is None or session_row.revoked_at is not None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Sesión inválida o cerrada.",
        )

    if _ensure_aware_utc(session_row.expires_at) <= datetime.now(timezone.utc):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="La sesión ha expirado.",
        )

    if not session_row.user or not session_row.user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuario inactivo o no autorizado.",
        )

    return session_row


def get_current_user(session_row: UserSession = Depends(get_current_session)) -> User:
    """Return the authenticated User associated with the active session."""
    return session_row.user


def get_storage(settings: Settings = Depends(get_settings)) -> StorageBackend:
    """Return configured private storage backend dependency."""
    return get_storage_client(settings)
