from datetime import date, datetime
from zoneinfo import ZoneInfo

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.database import get_db
from app.models.entities import Company, Document, DocumentType, User, Vehicle, Worker
from app.schemas.operations import ExpirationItemOut, ExpirationsSummaryOut

router = APIRouter(prefix="/expirations", tags=["expirations"])

LIMA_TZ = ZoneInfo("America/Lima")


def lima_today() -> date:
    """Return the current calendar date in America/Lima timezone."""
    return datetime.now(LIMA_TZ).date()


def evaluate_expiration_status(expires_at: date | None, today: date, window_days: int) -> tuple[int | None, str]:
    """Compute days remaining and status for a document expiration date."""
    if expires_at is None:
        return None, "Sin fecha"
    days = (expires_at - today).days
    if days < 0:
        return days, "Vencido"
    if days <= window_days:
        return days, "Por vencer"
    return days, "Vigente"


@router.get("", response_model=ExpirationsSummaryOut)
def get_expirations(
    window_days: int = Query(default=30, ge=1, le=365),
    status_filter: str | None = Query(default=None),
    q: str | None = Query(default=None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> ExpirationsSummaryOut:
    """List document expiration states calculated in America/Lima timezone."""
    today = lima_today()
    org_id = current_user.organization_id

    docs = list(
        db.scalars(
            select(Document)
            .where(Document.organization_id == org_id, Document.deleted_at.is_(None))
            .order_by(Document.expires_at.asc().nulls_last(), Document.created_at.desc())
        )
    )
    cat_map = {
        row.id: row.name
        for row in db.scalars(select(DocumentType).where(DocumentType.organization_id == org_id))
    }
    vehicle_map = {
        row.id: row.plate
        for row in db.scalars(select(Vehicle).where(Vehicle.organization_id == org_id))
    }
    worker_map = {
        row.id: row.name
        for row in db.scalars(select(Worker).where(Worker.organization_id == org_id))
    }
    company_map = {
        row.id: row.name
        for row in db.scalars(select(Company).where(Company.organization_id == org_id))
    }

    valid_count = 0
    expiring_soon_count = 0
    expired_count = 0
    no_expiration_count = 0
    items: list[ExpirationItemOut] = []

    needle = q.strip().lower() if q else ""

    for doc in docs:
        days, status_label = evaluate_expiration_status(doc.expires_at, today, window_days)
        if status_label == "Vigente":
            valid_count += 1
        elif status_label == "Por vencer":
            expiring_soon_count += 1
        elif status_label == "Vencido":
            expired_count += 1
        else:
            no_expiration_count += 1

        category = cat_map.get(doc.document_type_id or -1, "Otros")
        related_label = (
            vehicle_map.get(doc.related_vehicle_id or -1)
            or worker_map.get(doc.related_worker_id or -1)
            or company_map.get(doc.related_company_id or -1)
            or "General"
        )

        if status_filter and status_filter != "Todos" and status_label != status_filter:
            continue
        if needle:
            haystack = f"{doc.name} {category} {related_label}".lower()
            if needle not in haystack:
                continue

        items.append(
            ExpirationItemOut(
                document_id=doc.id,
                name=doc.name,
                category=category,
                related_label=related_label,
                issued_at=doc.issued_at,
                expires_at=doc.expires_at,
                days_remaining=days,
                status=status_label,
            )
        )

    return ExpirationsSummaryOut(
        reference_date=today,
        valid_count=valid_count,
        expiring_soon_count=expiring_soon_count,
        expired_count=expired_count,
        no_expiration_count=no_expiration_count,
        items=items,
    )
