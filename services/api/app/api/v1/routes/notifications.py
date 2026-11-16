from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.api.v1.routes.expirations import lima_today
from app.core.database import get_db
from app.models.entities import Document, Notification, User
from app.schemas.settings import NotificationCheckOut, NotificationOut

router = APIRouter(prefix="/notifications", tags=["notifications"])

REMINDER_THRESHOLDS = (30, 15, 7, 1)


def generate_expiration_notifications(db: Session, organization_id: int) -> int:
    """Idempotently generate internal reminders for expiring and expired documents."""
    today = lima_today()
    now = datetime.now(timezone.utc)
    docs = list(
        db.scalars(
            select(Document).where(
                Document.organization_id == organization_id,
                Document.deleted_at.is_(None),
                Document.expires_at.is_not(None),
            )
        )
    )

    existing_keys = {
        (row.document_id, row.notification_type)
        for row in db.scalars(
            select(Notification).where(Notification.organization_id == organization_id)
        )
    }

    created = 0
    for doc in docs:
        if doc.expires_at is None:
            continue
        days_left = (doc.expires_at - today).days
        if days_left < 0:
            notif_type = f"expired:{doc.expires_at.isoformat()}"
            msg = f"Documento vencido: {doc.name} (venció el {doc.expires_at.isoformat()})."
        else:
            matching_threshold = next((t for t in sorted(REMINDER_THRESHOLDS) if days_left <= t), None)
            if matching_threshold is None:
                continue
            notif_type = f"due_{matching_threshold}d:{doc.expires_at.isoformat()}"
            msg = f"Próximo a vencer ({days_left} días): {doc.name}."

        if (doc.id, notif_type) in existing_keys:
            continue

        db.add(
            Notification(
                organization_id=organization_id,
                document_id=doc.id,
                notification_type=notif_type[:60],
                message=msg[:255],
                scheduled_for=now,
                delivered_at=None,
            )
        )
        existing_keys.add((doc.id, notif_type))
        created += 1

    if created:
        db.commit()
    return created


@router.get("", response_model=list[NotificationOut])
def list_notifications(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[NotificationOut]:
    """List internal alerts and expiration notifications."""
    rows = list(
        db.scalars(
            select(Notification)
            .where(Notification.organization_id == current_user.organization_id)
            .order_by(Notification.scheduled_for.desc())
        )
    )
    return [
        NotificationOut(
            id=row.id,
            document_id=row.document_id,
            notification_type=row.notification_type,
            message=row.message,
            scheduled_for=row.scheduled_for,
            delivered_at=row.delivered_at,
        )
        for row in rows
    ]


@router.post("/check", response_model=NotificationCheckOut)
def run_notification_check(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> NotificationCheckOut:
    """Idempotently check document expirations and generate pending notifications."""
    created = generate_expiration_notifications(db, current_user.organization_id)
    unread = len(
        list(
            db.scalars(
                select(Notification).where(
                    Notification.organization_id == current_user.organization_id,
                    Notification.delivered_at.is_(None),
                )
            )
        )
    )
    return NotificationCheckOut(created_count=created, total_unread=unread)


@router.patch("/{notification_id}/read", response_model=NotificationOut)
def mark_notification_read(
    notification_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> NotificationOut:
    """Mark an internal notification as read/delivered."""
    row = db.scalar(
        select(Notification).where(
            Notification.id == notification_id,
            Notification.organization_id == current_user.organization_id,
        )
    )
    if row is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Notificación no encontrada."
        )
    row.delivered_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(row)
    return NotificationOut(
        id=row.id,
        document_id=row.document_id,
        notification_type=row.notification_type,
        message=row.message,
        scheduled_for=row.scheduled_for,
        delivered_at=row.delivered_at,
    )
