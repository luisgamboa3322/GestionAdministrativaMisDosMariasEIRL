from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.database import get_db
from app.models.entities import (
    AuditLog,
    Company,
    Document,
    Folder,
    Invoice,
    Trip,
    User,
    Vehicle,
    Worker,
)
from app.schemas.entities import (
    CompanyCreate,
    CompanyOut,
    CompanyUpdate,
    InvoiceCreate,
    InvoiceOut,
    ManifestCreate,
    ManifestOut,
    WorkerCreate,
    WorkerOut,
    WorkerUpdate,
)

workers_router = APIRouter(prefix="/workers", tags=["workers"])
companies_router = APIRouter(prefix="/companies", tags=["companies"])
manifests_router = APIRouter(prefix="/manifests", tags=["manifests"])
invoices_router = APIRouter(prefix="/invoices", tags=["invoices"])

FOLDER_COLORS = ["blue", "amber", "emerald", "violet", "teal"]


def _ensure_root_folder(db: Session, org_id: int, name: str, color: str) -> Folder:
    root = db.scalar(
        select(Folder).where(
            Folder.organization_id == org_id,
            Folder.parent_id.is_(None),
            Folder.name == name,
            Folder.deleted_at.is_(None),
        )
    )
    if root is None:
        root = Folder(
            organization_id=org_id,
            parent_id=None,
            name=name,
            color=color,
        )
        db.add(root)
        db.flush()
    return root


def _initials(name: str) -> str:
    parts = [p for p in name.strip().split() if p]
    return "".join(p[0] for p in parts[:2]).upper() or "TR"


def _serialize_worker(worker: Worker) -> WorkerOut:
    return WorkerOut(
        id=worker.id,
        organization_id=worker.organization_id,
        folder_id=worker.folder_id,
        code=worker.code,
        name=worker.name,
        role=worker.position,
        status=worker.status,
        phone=worker.phone,
        email=worker.email,
        initials=_initials(worker.name),
        created_at=worker.created_at,
    )


def _encode_rel(mode: str, kind: str) -> str:
    prefix = "sup" if mode == "supplier" else "cmp"
    return f"{prefix}:{kind.strip()[:30]}"[:40]


def _decode_rel(value: str) -> tuple[str, str]:
    if value.startswith("sup:"):
        return "supplier", value.removeprefix("sup:") or "Otros"
    if value.startswith("cmp:"):
        return "company", value.removeprefix("cmp:") or "Otros"
    return ("supplier" if "prov" in value.lower() else "company"), value


def _serialize_company(row: Company) -> CompanyOut:
    mode, kind = _decode_rel(row.relationship_type)
    return CompanyOut(
        id=row.id,
        organization_id=row.organization_id,
        folder_id=row.folder_id,
        mode=mode,
        name=row.name,
        legal_name=row.legal_name,
        kind=kind,
        contact=row.contact_name,
        phone=row.phone,
        email=row.email,
        created_at=row.created_at,
    )


@workers_router.get("", response_model=list[WorkerOut])
def list_workers(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[WorkerOut]:
    rows = list(
        db.scalars(
            select(Worker)
            .where(Worker.organization_id == current_user.organization_id)
            .order_by(Worker.created_at.desc())
        )
    )
    return [_serialize_worker(row) for row in rows]


@workers_router.post("", response_model=WorkerOut, status_code=status.HTTP_201_CREATED)
def create_worker(
    payload: WorkerCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> WorkerOut:
    org_id = current_user.organization_id
    root = _ensure_root_folder(db, org_id, "Trabajadores", "teal")
    worker_folder = Folder(
        organization_id=org_id,
        parent_id=root.id,
        name=payload.name.strip(),
        color="teal",
    )
    db.add(worker_folder)
    db.flush()

    seen: set[str] = set()
    for idx, raw_cat in enumerate(payload.template_categories):
        cat = raw_cat.strip()
        if not cat or cat.lower() in seen:
            continue
        seen.add(cat.lower())
        db.add(
            Folder(
                organization_id=org_id,
                parent_id=worker_folder.id,
                name=cat,
                color=FOLDER_COLORS[idx % len(FOLDER_COLORS)],
            )
        )

    worker = Worker(
        organization_id=org_id,
        folder_id=worker_folder.id,
        code=payload.code.strip().upper(),
        name=payload.name.strip(),
        position=payload.role.strip(),
        status=payload.status.strip(),
        phone=payload.phone,
        email=payload.email,
    )
    db.add(worker)
    db.flush()
    db.add(
        AuditLog(
            organization_id=org_id,
            actor_user_id=current_user.id,
            action="worker.create",
            entity_type="worker",
            entity_id=worker.id,
        )
    )
    db.commit()
    db.refresh(worker)
    return _serialize_worker(worker)


@workers_router.patch("/{worker_id}", response_model=WorkerOut)
def update_worker(
    worker_id: int,
    payload: WorkerUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> WorkerOut:
    worker = db.scalar(
        select(Worker).where(
            Worker.id == worker_id,
            Worker.organization_id == current_user.organization_id,
        )
    )
    if worker is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Trabajador no encontrado.")

    if payload.code is not None:
        worker.code = payload.code.strip().upper()
    if payload.name is not None:
        worker.name = payload.name.strip()
        if worker.folder_id:
            folder = db.scalar(select(Folder).where(Folder.id == worker.folder_id))
            if folder:
                folder.name = worker.name
    if payload.role is not None:
        worker.position = payload.role.strip()
    if payload.status is not None:
        worker.status = payload.status.strip()
    if payload.phone is not None:
        worker.phone = payload.phone
    if payload.email is not None:
        worker.email = payload.email

    db.commit()
    db.refresh(worker)
    return _serialize_worker(worker)


@companies_router.get("", response_model=list[CompanyOut])
def list_companies(
    mode: str | None = Query(default=None, pattern="^(company|supplier)$"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[CompanyOut]:
    rows = list(
        db.scalars(
            select(Company)
            .where(Company.organization_id == current_user.organization_id)
            .order_by(Company.created_at.desc())
        )
    )
    items = [_serialize_company(row) for row in rows]
    if mode:
        items = [item for item in items if item.mode == mode]
    return items


@companies_router.post("", response_model=CompanyOut, status_code=status.HTTP_201_CREATED)
def create_company(
    payload: CompanyCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> CompanyOut:
    org_id = current_user.organization_id
    root_name = "Proveedores" if payload.mode == "supplier" else "Empresas contratantes"
    root_color = "amber" if payload.mode == "supplier" else "blue"
    root = _ensure_root_folder(db, org_id, root_name, root_color)

    company_folder = Folder(
        organization_id=org_id,
        parent_id=root.id,
        name=payload.name.strip(),
        color=root_color,
    )
    db.add(company_folder)
    db.flush()

    record = Company(
        organization_id=org_id,
        folder_id=company_folder.id,
        name=payload.name.strip(),
        legal_name=payload.legal_name.strip(),
        relationship_type=_encode_rel(payload.mode, payload.kind),
        contact_name=payload.contact,
        phone=payload.phone,
        email=payload.email,
    )
    db.add(record)
    db.flush()
    db.add(
        AuditLog(
            organization_id=org_id,
            actor_user_id=current_user.id,
            action="company.create",
            entity_type="company",
            entity_id=record.id,
        )
    )
    db.commit()
    db.refresh(record)
    return _serialize_company(record)


@companies_router.patch("/{company_id}", response_model=CompanyOut)
def update_company(
    company_id: int,
    payload: CompanyUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> CompanyOut:
    record = db.scalar(
        select(Company).where(
            Company.id == company_id,
            Company.organization_id == current_user.organization_id,
        )
    )
    if record is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Registro no encontrado.")

    mode, current_kind = _decode_rel(record.relationship_type)
    if payload.name is not None:
        record.name = payload.name.strip()
        if record.folder_id:
            folder = db.scalar(select(Folder).where(Folder.id == record.folder_id))
            if folder:
                folder.name = record.name
    if payload.legal_name is not None:
        record.legal_name = payload.legal_name.strip()
    if payload.kind is not None:
        record.relationship_type = _encode_rel(mode, payload.kind)
    else:
        record.relationship_type = _encode_rel(mode, current_kind)
    if payload.contact is not None:
        record.contact_name = payload.contact
    if payload.phone is not None:
        record.phone = payload.phone
    if payload.email is not None:
        record.email = payload.email

    db.commit()
    db.refresh(record)
    return _serialize_company(record)


@manifests_router.get("", response_model=list[ManifestOut])
def list_manifests(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[ManifestOut]:
    org_id = current_user.organization_id
    vehicles = {
        v.id: v.plate for v in db.scalars(select(Vehicle).where(Vehicle.organization_id == org_id))
    }
    companies = {
        c.id: c.name for c in db.scalars(select(Company).where(Company.organization_id == org_id))
    }
    docs = {
        d.id: d.name for d in db.scalars(select(Document).where(Document.organization_id == org_id))
    }
    rows = list(
        db.scalars(
            select(Trip).where(Trip.organization_id == org_id).order_by(Trip.service_date.desc())
        )
    )
    return [
        ManifestOut(
            id=row.id,
            organization_id=row.organization_id,
            number=row.manifest_number,
            date=row.service_date,
            vehicle=vehicles.get(row.vehicle_id or -1, "Sin unidad"),
            company=companies.get(row.company_id or -1, "General"),
            service=row.service_name,
            period=row.period_label,
            file_name=docs.get(row.document_id or -1, f"{row.manifest_number}.pdf"),
            document_id=row.document_id,
            created_at=row.created_at,
        )
        for row in rows
    ]


@manifests_router.post("", response_model=ManifestOut, status_code=status.HTTP_201_CREATED)
def create_manifest(
    payload: ManifestCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> ManifestOut:
    org_id = current_user.organization_id
    vehicle = (
        db.scalar(
            select(Vehicle).where(
                Vehicle.organization_id == org_id,
                Vehicle.plate == payload.vehicle_plate.strip().upper(),
            )
        )
        if payload.vehicle_plate
        else None
    )
    company = (
        db.scalar(
            select(Company).where(
                Company.organization_id == org_id,
                Company.name == payload.company_name.strip(),
            )
        )
        if payload.company_name
        else None
    )
    row = Trip(
        organization_id=org_id,
        vehicle_id=vehicle.id if vehicle else None,
        company_id=company.id if company else None,
        document_id=payload.document_id,
        manifest_number=payload.number.strip().upper(),
        service_name=payload.service.strip(),
        period_label=payload.period.strip(),
        service_date=payload.service_date,
    )
    db.add(row)
    db.flush()
    db.add(
        AuditLog(
            organization_id=org_id,
            actor_user_id=current_user.id,
            action="manifest.create",
            entity_type="trip",
            entity_id=row.id,
        )
    )
    db.commit()
    db.refresh(row)
    return ManifestOut(
        id=row.id,
        organization_id=row.organization_id,
        number=row.manifest_number,
        date=row.service_date,
        vehicle=vehicle.plate if vehicle else (payload.vehicle_plate or "Sin unidad"),
        company=company.name if company else (payload.company_name or "General"),
        service=row.service_name,
        period=row.period_label,
        file_name=payload.file_name or f"{row.manifest_number}.pdf",
        document_id=row.document_id,
        created_at=row.created_at,
    )


@invoices_router.get("", response_model=list[InvoiceOut])
def list_invoices(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[InvoiceOut]:
    org_id = current_user.organization_id
    companies = {
        c.id: c.legal_name
        for c in db.scalars(select(Company).where(Company.organization_id == org_id))
    }
    docs = {
        d.id: d.name for d in db.scalars(select(Document).where(Document.organization_id == org_id))
    }
    rows = list(
        db.scalars(
            select(Invoice)
            .where(Invoice.organization_id == org_id)
            .order_by(Invoice.issued_date.desc())
        )
    )
    return [
        InvoiceOut(
            id=row.id,
            organization_id=row.organization_id,
            number=row.invoice_number,
            company=companies.get(row.company_id or -1, "Empresa"),
            date=row.issued_date,
            amount=float(row.amount),
            currency=row.currency,
            status=row.status,
            file_name=docs.get(row.document_id or -1, f"{row.invoice_number}.pdf"),
            document_id=row.document_id,
            created_at=row.created_at,
        )
        for row in rows
    ]


@invoices_router.post("", response_model=InvoiceOut, status_code=status.HTTP_201_CREATED)
def create_invoice(
    payload: InvoiceCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> InvoiceOut:
    org_id = current_user.organization_id
    company = db.scalar(
        select(Company).where(
            Company.organization_id == org_id,
            (Company.legal_name == payload.company_name.strip())
            | (Company.name == payload.company_name.strip()),
        )
    )
    row = Invoice(
        organization_id=org_id,
        company_id=company.id if company else None,
        document_id=payload.document_id,
        invoice_number=payload.number.strip().upper(),
        issued_date=payload.issued_date,
        amount=payload.amount,
        currency=payload.currency,
        status=payload.status.strip(),
    )
    db.add(row)
    db.flush()
    db.add(
        AuditLog(
            organization_id=org_id,
            actor_user_id=current_user.id,
            action="invoice.create",
            entity_type="invoice",
            entity_id=row.id,
        )
    )
    db.commit()
    db.refresh(row)
    return InvoiceOut(
        id=row.id,
        organization_id=row.organization_id,
        number=row.invoice_number,
        company=company.legal_name if company else payload.company_name.strip(),
        date=row.issued_date,
        amount=float(row.amount),
        currency=row.currency,
        status=row.status,
        file_name=payload.file_name or f"{row.invoice_number}.pdf",
        document_id=row.document_id,
        created_at=row.created_at,
    )
