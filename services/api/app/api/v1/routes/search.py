from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.database import get_db
from app.models.entities import Audit, Company, Document, DocumentType, Folder, User, Vehicle, Worker
from app.schemas.operations import GlobalSearchOut, SearchResultItemOut

router = APIRouter(prefix="/search", tags=["search"])


@router.get("", response_model=GlobalSearchOut)
def global_search(
    q: str = Query(default="", max_length=160),
    limit: int = Query(default=20, ge=1, le=50),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> GlobalSearchOut:
    """Search organization metadata across documents, folders, fleet, workers, companies, and audits."""
    needle = q.strip().lower()
    org_id = current_user.organization_id

    if not needle:
        return GlobalSearchOut(
            query=q,
            total=0,
            documents=[],
            folders=[],
            vehicles=[],
            workers=[],
            companies=[],
            audits=[],
        )

    cat_map = {
        row.id: row.name
        for row in db.scalars(select(DocumentType).where(DocumentType.organization_id == org_id))
    }
    vehicle_map = {
        row.id: row.plate
        for row in db.scalars(select(Vehicle).where(Vehicle.organization_id == org_id))
    }

    doc_results: list[SearchResultItemOut] = []
    for doc in db.scalars(
        select(Document)
        .where(Document.organization_id == org_id, Document.deleted_at.is_(None))
        .order_by(Document.created_at.desc())
    ):
        category = cat_map.get(doc.document_type_id or -1, "Otros")
        plate = vehicle_map.get(doc.related_vehicle_id or -1, "")
        haystack = f"{doc.name} {category} {plate} {doc.tags or ''} {doc.description or ''}".lower()
        if needle in haystack:
            doc_results.append(
                SearchResultItemOut(
                    entity_type="document",
                    entity_id=doc.id,
                    title=doc.name,
                    subtitle=f"{category}{f' · {plate}' if plate else ''}",
                    category=category,
                )
            )
            if len(doc_results) >= limit:
                break

    folder_results: list[SearchResultItemOut] = []
    for folder in db.scalars(
        select(Folder).where(Folder.organization_id == org_id, Folder.deleted_at.is_(None))
    ):
        if needle in f"{folder.name} {folder.description or ''}".lower():
            folder_results.append(
                SearchResultItemOut(
                    entity_type="folder",
                    entity_id=folder.id,
                    title=folder.name,
                    subtitle="Carpeta",
                )
            )
            if len(folder_results) >= limit:
                break

    vehicle_results: list[SearchResultItemOut] = []
    for vehicle in db.scalars(select(Vehicle).where(Vehicle.organization_id == org_id)):
        haystack = f"{vehicle.plate} {vehicle.internal_code} {vehicle.brand} {vehicle.model}".lower()
        if needle in haystack:
            vehicle_results.append(
                SearchResultItemOut(
                    entity_type="vehicle",
                    entity_id=vehicle.id,
                    title=vehicle.plate,
                    subtitle=f"{vehicle.internal_code} · {vehicle.brand} {vehicle.model}",
                )
            )
            if len(vehicle_results) >= limit:
                break

    worker_results: list[SearchResultItemOut] = []
    for worker in db.scalars(select(Worker).where(Worker.organization_id == org_id)):
        if needle in f"{worker.name} {worker.code} {worker.position}".lower():
            worker_results.append(
                SearchResultItemOut(
                    entity_type="worker",
                    entity_id=worker.id,
                    title=worker.name,
                    subtitle=f"{worker.code} · {worker.position}",
                )
            )
            if len(worker_results) >= limit:
                break

    company_results: list[SearchResultItemOut] = []
    for company in db.scalars(select(Company).where(Company.organization_id == org_id)):
        if needle in f"{company.name} {company.legal_name} {company.relationship_type}".lower():
            company_results.append(
                SearchResultItemOut(
                    entity_type="company",
                    entity_id=company.id,
                    title=company.name,
                    subtitle=f"{company.relationship_type} · {company.legal_name}",
                )
            )
            if len(company_results) >= limit:
                break

    audit_results: list[SearchResultItemOut] = []
    for audit in db.scalars(select(Audit).where(Audit.organization_id == org_id)):
        if needle in f"{audit.name} {audit.period_label} {audit.status}".lower():
            audit_results.append(
                SearchResultItemOut(
                    entity_type="audit",
                    entity_id=audit.id,
                    title=audit.name,
                    subtitle=f"{audit.period_label} · {audit.status}",
                )
            )
            if len(audit_results) >= limit:
                break

    total = (
        len(doc_results)
        + len(folder_results)
        + len(vehicle_results)
        + len(worker_results)
        + len(company_results)
        + len(audit_results)
    )
    return GlobalSearchOut(
        query=q,
        total=total,
        documents=doc_results,
        folders=folder_results,
        vehicles=vehicle_results,
        workers=worker_results,
        companies=company_results,
        audits=audit_results,
    )
