from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from app.api.deps import get_current_session, get_current_user
from app.core.config import Settings, get_settings
from app.core.database import get_db
from app.core.rate_limit import login_rate_limiter
from app.core.security import (
    clear_session_cookie,
    generate_session_token,
    hash_session_token,
    session_expiry,
    set_session_cookie,
    verify_csrf_origin,
    verify_password,
)
from app.models.entities import AuditLog, User, UserSession
from app.schemas.auth import (
    AuthSessionResponse,
    LoginRequest,
    MessageResponse,
    OrganizationPublic,
    UserPublic,
)

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login", response_model=AuthSessionResponse)
def login(
    payload: LoginRequest,
    request: Request,
    response: Response,
    db: Session = Depends(get_db),
    settings: Settings = Depends(get_settings),
) -> AuthSessionResponse:
    """Authenticate the General Manager and issue an HttpOnly session cookie."""
    verify_csrf_origin(request, settings)
    client_ip = request.client.host if request.client else "unknown"
    login_rate_limiter.check(client_ip)

    stmt = (
        select(User)
        .options(joinedload(User.organization))
        .where(User.email == payload.email.lower())
    )
    user = db.scalar(stmt)
    if user is None or not user.is_active or not verify_password(payload.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciales inválidas.",
        )

    raw_token = generate_session_token()
    session_row = UserSession(
        user_id=user.id,
        token_hash=hash_session_token(raw_token, settings.session_secret_key),
        user_agent=request.headers.get("user-agent", "")[:255] or None,
        ip_address=request.client.host if request.client else None,
        expires_at=session_expiry(settings.session_ttl_hours),
    )
    db.add(session_row)
    db.add(
        AuditLog(
            organization_id=user.organization_id,
            actor_user_id=user.id,
            action="auth.login",
            entity_type="user",
            entity_id=user.id,
        )
    )
    db.commit()

    set_session_cookie(response, raw_token, settings)
    return AuthSessionResponse(
        user=UserPublic.model_validate(user),
        organization=OrganizationPublic.model_validate(user.organization),
    )


@router.post("/logout", response_model=MessageResponse)
def logout(
    response: Response,
    session_row: UserSession = Depends(get_current_session),
    db: Session = Depends(get_db),
    settings: Settings = Depends(get_settings),
) -> MessageResponse:
    """Revoke the current server-side session and clear the session cookie."""
    session_row.revoked_at = datetime.now(timezone.utc)
    db.add(
        AuditLog(
            organization_id=session_row.user.organization_id,
            actor_user_id=session_row.user.id,
            action="auth.logout",
            entity_type="user",
            entity_id=session_row.user.id,
        )
    )
    db.commit()
    clear_session_cookie(response, settings)
    return MessageResponse(message="Sesión cerrada correctamente.")


@router.get("/me", response_model=AuthSessionResponse)
def get_me(current_user: User = Depends(get_current_user)) -> AuthSessionResponse:
    """Return the authenticated user and organization profile."""
    return AuthSessionResponse(
        user=UserPublic.model_validate(current_user),
        organization=OrganizationPublic.model_validate(current_user.organization),
    )
