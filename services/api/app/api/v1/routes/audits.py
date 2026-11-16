import csv
import io
import unicodedata
import zipfile
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from app.api.deps import get_current_user, get_storage
from app.api.v1.routes.expirations import lima_today
from app.core.database import get_db
from app.core.storage import StorageBackend, build_storage_key, sanitize_filename
from app.models.entities import (
    Audit,
    AuditExport,
    AuditItem,
    AuditLog,
    AuditRequirement as AuditRequirementModel,
    Company,
    Document,
    DocumentType,
    User,
    Vehicle,
    Worker,
)
from app.schemas.operations import (
    AuditCreate,
    AuditEvidenceOut,
    AuditExportOut,
    AuditOut,
    AuditRequirementIn,
    AuditUpdate,
)

router = APIRouter(prefix="/audits", tags=["audits"])

CATALOG_ID_BY_LABEL = {
    "soat": "soat",
    "str": "str",
    "polizas": "polizas",
    "gps": "gps",
    "revision tecnica": "revision",
    "certificados": "certificados",
    "permisos": "permisos",
    "contratos": "contratos",
    "documentos de trabajadores": "trabajadores",
    "manifiestos": "manifiestos",
    "facturas": "facturas",
    "otros documentos": "otros",
}

REQUIREMENT_ALIASES: dict[str, list[str]] = {
    "soat": ["soat"],
    "str": ["str"],
    "polizas": ["poliza"],
    "gps": ["gps"],
    "revision": ["revision tecnica", "revision"],
    "certificados": ["certificado"],
    "permisos": ["permiso"],
    "contratos": ["contrato"],
    "otros": ["otros", "general"],
}


def _normalize(value: str) -> str:
    nfkd = unicodedata.normalize("NFD", value)
    return "".join(ch for ch in nfkd if unicodedata.category(ch) != "Mn").lower().strip()


def _requirement_id_from_label(label: str, custom: bool) -> str:
    norm = _normalize(label)
    if not custom and norm in CATALOG_ID_BY_LABEL:
        return CATALOG_ID_BY_LABEL[norm]
    slug = "".join(ch if ch.isalnum() else "-" for ch in norm).strip("-")
    return slug or "req"


def _file_matches_requirement(doc: Document, category_name: str, req: AuditRequirementIn) -> bool:
    haystack = _normalize(f"{category_name} {doc.name}")
    terms = REQUIREMENT_ALIASES.get(req.id, [_normalize(req.label)])
    return any(term in haystack for term in terms)


def _doc_audit_status(doc: Document, req: AuditRequirementIn) -> str:
    if req.custom:
        return "Pendiente de revisión"
    if doc.expires_at is None:
        return "Sin fecha de vencimiento"
    return "Vencido" if doc.expires_at < lima_today() else "Disponible"


def _get_org_audit(db: Session, organization_id: int, audit_id: int) -> Audit:
    audit = db.scalar(
        select(Audit).where(Audit.id == audit_id, Audit.organization_id == organization_id)
    )
    if audit is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Auditoría no encontrada.")
    return audit


def _save_audit_structure(
    db: Session,
    audit_id: int,
    vehicle_ids: list[int],
    worker_ids: list[int],
    requirements: list[AuditRequirementIn],
    manually_reviewed: list[str] | None = None,
    excluded_evidence: list[str] | None = None,
) -> None:
    existing_items = list(db.scalars(select(AuditItem).where(AuditItem.audit_id == audit_id)))
    for item in existing_items:
        db.delete(item)
    existing_reqs = list(
        db.scalars(
            select(AuditRequirementModel).where(AuditRequirementModel.audit_id == audit_id)
        )
    )
    for row in existing_reqs:
        db.delete(row)
    db.flush()

    for vid in dict.fromkeys(vehicle_ids):
        db.add(
            AuditRequirementModel(
                audit_id=audit_id,
                label="__veh__",
                related_entity_type="t_veh",
                related_entity_id=vid,
            )
        )
    for wid in dict.fromkeys(worker_ids):
        db.add(
            AuditRequirementModel(
                audit_id=audit_id,
                label="__wrk__",
                related_entity_type="t_wrk",
                related_entity_id=wid,
            )
        )

    first_req_row: AuditRequirementModel | None = None
    for req in requirements:
        prefix = "creq" if req.custom else "req"
        row = AuditRequirementModel(
            audit_id=audit_id,
            label=req.label.strip()[:120],
            related_entity_type=f"{prefix}:{req.scope}"[:40],
            related_entity_id=None,
        )
        db.add(row)
        db.flush()
        if first_req_row is None:
            first_req_row = row

    if first_req_row is not None:
        for ev_id in dict.fromkeys(manually_reviewed or []):
            db.add(
                AuditItem(
                    audit_id=audit_id,
                    requirement_id=first_req_row.id,
                    review_status=f"rev:{ev_id}"[:40],
                    excluded=False,
                )
            )
        for ev_id in dict.fromkeys(excluded_evidence or []):
            db.add(
                AuditItem(
                    audit_id=audit_id,
                    requirement_id=first_req_row.id,
                    review_status=f"exc:{ev_id}"[:40],
                    excluded=True,
                )
            )


def _load_audit_components(
    db: Session, audit: Audit
) -> tuple[list[int], list[int], list[AuditRequirementIn], list[str], list[str]]:
    req_rows = list(
        db.scalars(
            select(AuditRequirementModel)
            .where(AuditRequirementModel.audit_id == audit.id)
            .order_by(AuditRequirementModel.id.asc())
        )
    )
    vehicle_ids: list[int] = []
    worker_ids: list[int] = []
    requirements: list[AuditRequirementIn] = []

    for row in req_rows:
        if row.related_entity_type == "t_veh" and row.related_entity_id is not None:
            vehicle_ids.append(row.related_entity_id)
        elif row.related_entity_type == "t_wrk" and row.related_entity_id is not None:
            worker_ids.append(row.related_entity_id)
        elif row.related_entity_type.startswith(("req:", "creq:")):
            prefix, _, scope = row.related_entity_type.partition(":")
            is_custom = prefix == "creq"
            requirements.append(
                AuditRequirementIn(
                    id=_requirement_id_from_label(row.label, is_custom),
                    label=row.label,
                    scope=scope or "Unidad",
                    custom=is_custom,
                )
            )

    item_rows = list(
        db.scalars(select(AuditItem).where(AuditItem.audit_id == audit.id))
    )
    manually_reviewed: list[str] = []
    excluded_evidence: list[str] = []
    for item in item_rows:
        if item.review_status.startswith("rev:"):
            manually_reviewed.append(item.review_status.removeprefix("rev:"))
        elif item.excluded and item.review_status.startswith("exc:"):
            excluded_evidence.append(item.review_status.removeprefix("exc:"))

    return vehicle_ids, worker_ids, requirements, manually_reviewed, excluded_evidence


def _evaluate_audit_evidence(
    db: Session,
    audit: Audit,
    vehicle_ids: list[int],
    worker_ids: list[int],
    requirements: list[AuditRequirementIn],
) -> list[AuditEvidenceOut]:
    org_id = audit.organization_id
    docs = list(
        db.scalars(
            select(Document)
            .options(joinedload(Document.versions))
            .where(
                Document.organization_id == org_id,
                Document.deleted_at.is_(None),
                Document.is_inbox.is_(False),
            )
            .order_by(Document.created_at.desc())
        ).unique()
    )
    cat_map = {
        row.id: row.name
        for row in db.scalars(select(DocumentType).where(DocumentType.organization_id == org_id))
    }
    vehicles_by_id = {
        v.id: v
        for v in db.scalars(select(Vehicle).where(Vehicle.organization_id == org_id))
    }
    workers_by_id = {
        w.id: w
        for w in db.scalars(select(Worker).where(Worker.organization_id == org_id))
    }
    company = (
        db.scalar(select(Company).where(Company.id == audit.company_id))
        if audit.company_id
        else None
    )

    selected_vehicles = [vehicles_by_id[vid] for vid in vehicle_ids if vid in vehicles_by_id]
    selected_workers = [workers_by_id[wid] for wid in worker_ids if wid in workers_by_id]

    results: list[AuditEvidenceOut] = []

    def pick_current_version(doc: Document):
        ordered = sorted(doc.versions, key=lambda v: v.version_number, reverse=True)
        return next((v for v in ordered if v.is_current), ordered[0] if ordered else None)

    for req in requirements:
        if req.scope == "Unidad":
            targets: list[Vehicle | None] = selected_vehicles if selected_vehicles else [None]
            for vehicle in targets:
                found = (
                    next(
                        (
                            doc
                            for doc in docs
                            if doc.related_vehicle_id == vehicle.id
                            and _file_matches_requirement(
                                doc, cat_map.get(doc.document_type_id or -1, "Otros"), req
                            )
                        ),
                        None,
                    )
                    if vehicle
                    else None
                )
                ver = pick_current_version(found) if found else None
                results.append(
                    AuditEvidenceOut(
                        id=f"{req.id}-v-{vehicle.id if vehicle else 0}",
                        requirement_id=req.id,
                        requirement=req.label,
                        scope=req.scope,
                        target=vehicle.plate if vehicle else "Sin unidad seleccionada",
                        status=_doc_audit_status(found, req) if found else "Faltante",
                        document_id=found.id if found else None,
                        version_id=ver.id if ver else None,
                        name=found.name if found else None,
                        expiration_date=found.expires_at if found else None,
                        version=f"{ver.version_number}.0 · Actual" if ver else None,
                    )
                )
        elif req.scope == "Trabajador":
            w_targets: list[Worker | None] = selected_workers if selected_workers else [None]
            for worker in w_targets:
                found = (
                    next(
                        (
                            doc
                            for doc in docs
                            if doc.related_worker_id == worker.id
                            and (
                                req.id == "trabajadores"
                                or _file_matches_requirement(
                                    doc, cat_map.get(doc.document_type_id or -1, "Otros"), req
                                )
                            )
                        ),
                        None,
                    )
                    if worker
                    else None
                )
                ver = pick_current_version(found) if found else None
                results.append(
                    AuditEvidenceOut(
                        id=f"{req.id}-w-{worker.id if worker else 0}",
                        requirement_id=req.id,
                        requirement=req.label,
                        scope=req.scope,
                        target=worker.name if worker else "Sin trabajador seleccionado",
                        status=_doc_audit_status(found, req) if found else "Faltante",
                        document_id=found.id if found else None,
                        version_id=ver.id if ver else None,
                        name=found.name if found else None,
                        expiration_date=found.expires_at if found else None,
                        version=f"{ver.version_number}.0 · Actual" if ver else None,
                    )
                )
        else:
            found = next(
                (
                    doc
                    for doc in docs
                    if (not company or not doc.related_company_id or doc.related_company_id == company.id)
                    and _file_matches_requirement(
                        doc, cat_map.get(doc.document_type_id or -1, "Otros"), req
                    )
                ),
                None,
            )
            ver = pick_current_version(found) if found else None
            results.append(
                AuditEvidenceOut(
                    id=f"{req.id}-c-{company.id if company else 0}",
                    requirement_id=req.id,
                    requirement=req.label,
                    scope=req.scope,
                    target=company.name if company else audit.period_label,
                    status=_doc_audit_status(found, req) if found else "Faltante",
                    document_id=found.id if found else None,
                    version_id=ver.id if ver else None,
                    name=found.name if found else None,
                    expiration_date=found.expires_at if found else None,
                    version=f"{ver.version_number}.0 · Actual" if ver else None,
                )
            )

    return results


def _serialize_audit(db: Session, audit: Audit) -> AuditOut:
    vehicle_ids, worker_ids, requirements, manually_reviewed, excluded_evidence = (
        _load_audit_components(db, audit)
    )
    evidence = _evaluate_audit_evidence(db, audit, vehicle_ids, worker_ids, requirements)
    exports = list(
        db.scalars(
            select(AuditExport)
            .where(AuditExport.audit_id == audit.id)
            .order_by(AuditExport.created_at.desc())
        )
    )
    export_items = [
        AuditExportOut(
            id=exp.id,
            audit_id=exp.audit_id,
            filename=Path(exp.storage_key).name,
            included_count=len(
                [
                    e
                    for e in evidence
                    if e.document_id and e.status != "Vencido" and e.id not in excluded_evidence
                ]
            ),
            missing_count=len([e for e in evidence if e.status == "Faltante"]),
            download_url=f"/api/v1/audits/{audit.id}/exports/{exp.id}/download",
            created_at=exp.created_at,
        )
        for exp in exports
    ]
    return AuditOut(
        id=audit.id,
        organization_id=audit.organization_id,
        company_id=audit.company_id,
        name=audit.name,
        request_date=audit.requested_at,
        deadline=audit.due_at,
        period=audit.period_label,
        description=audit.description,
        notes=audit.notes,
        status=audit.status,
        vehicle_ids=vehicle_ids,
        worker_ids=worker_ids,
        requirements=requirements,
        manually_reviewed=manually_reviewed,
        excluded_evidence=excluded_evidence,
        evidence=evidence,
        exports=export_items,
        created_at=audit.created_at,
    )


@router.get("", response_model=list[AuditOut])
def list_audits(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[AuditOut]:
    """List all audits with real checklist evaluation."""
    rows = list(
        db.scalars(
            select(Audit)
            .where(Audit.organization_id == current_user.organization_id)
            .order_by(Audit.created_at.desc())
        )
    )
    return [_serialize_audit(db, row) for row in rows]


@router.post("", response_model=AuditOut, status_code=status.HTTP_201_CREATED)
def create_audit(
    payload: AuditCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> AuditOut:
    """Create a new audit dossier and evaluate initial matching documents."""
    audit = Audit(
        organization_id=current_user.organization_id,
        company_id=payload.company_id,
        name=payload.name.strip(),
        period_label=payload.period.strip(),
        description=payload.description,
        notes=payload.notes,
        requested_at=payload.request_date,
        due_at=payload.deadline,
        status=payload.status.strip() or "Activa",
    )
    db.add(audit)
    db.flush()

    _save_audit_structure(
        db,
        audit.id,
        payload.vehicle_ids,
        payload.worker_ids,
        payload.requirements,
    )
    db.add(
        AuditLog(
            organization_id=current_user.organization_id,
            actor_user_id=current_user.id,
            action="audit.create",
            entity_type="audit",
            entity_id=audit.id,
        )
    )
    db.commit()
    db.refresh(audit)
    return _serialize_audit(db, audit)


@router.get("/{audit_id}", response_model=AuditOut)
def get_audit(
    audit_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> AuditOut:
    """Fetch audit details and evaluated checklist."""
    audit = _get_org_audit(db, current_user.organization_id, audit_id)
    return _serialize_audit(db, audit)


@router.patch("/{audit_id}", response_model=AuditOut)
def update_audit(
    audit_id: int,
    payload: AuditUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> AuditOut:
    """Update audit metadata, checklist reviews, or excluded items."""
    audit = _get_org_audit(db, current_user.organization_id, audit_id)
    cur_veh, cur_wrk, cur_reqs, cur_rev, cur_exc = _load_audit_components(db, audit)

    if payload.name is not None:
        audit.name = payload.name.strip()
    if payload.status is not None:
        audit.status = payload.status.strip()
    if payload.description is not None:
        audit.description = payload.description
    if payload.notes is not None:
        audit.notes = payload.notes

    if any(
        val is not None
        for val in (
            payload.vehicle_ids,
            payload.worker_ids,
            payload.requirements,
            payload.manually_reviewed,
            payload.excluded_evidence,
        )
    ):
        _save_audit_structure(
            db,
            audit.id,
            payload.vehicle_ids if payload.vehicle_ids is not None else cur_veh,
            payload.worker_ids if payload.worker_ids is not None else cur_wrk,
            payload.requirements if payload.requirements is not None else cur_reqs,
            payload.manually_reviewed if payload.manually_reviewed is not None else cur_rev,
            payload.excluded_evidence if payload.excluded_evidence is not None else cur_exc,
        )

    db.add(
        AuditLog(
            organization_id=current_user.organization_id,
            actor_user_id=current_user.id,
            action="audit.update",
            entity_type="audit",
            entity_id=audit.id,
        )
    )
    db.commit()
    db.refresh(audit)
    return _serialize_audit(db, audit)


@router.post("/{audit_id}/exports", response_model=AuditExportOut, status_code=status.HTTP_201_CREATED)
def generate_audit_export(
    audit_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    storage: StorageBackend = Depends(get_storage),
) -> AuditExportOut:
    """Build a real organized ZIP package + CSV index from actual stored documents."""
    audit = _get_org_audit(db, current_user.organization_id, audit_id)
    vehicle_ids, worker_ids, requirements, _, excluded_evidence = _load_audit_components(
        db, audit
    )
    evidence = _evaluate_audit_evidence(db, audit, vehicle_ids, worker_ids, requirements)

    included = [
        item
        for item in evidence
        if item.document_id is not None
        and item.version_id is not None
        and item.status != "Vencido"
        and item.id not in excluded_evidence
    ]
    missing_count = len([item for item in evidence if item.status == "Faltante"])

    docs_by_id = {
        doc.id: doc
        for doc in db.scalars(
            select(Document)
            .options(joinedload(Document.versions))
            .where(Document.organization_id == current_user.organization_id)
        ).unique()
    }

    safe_root = sanitize_filename(f"AUDITORIA_{audit.name}").upper()
    zip_buffer = io.BytesIO()
    index_rows: list[list[str]] = []

    with zipfile.ZipFile(zip_buffer, mode="w", compression=zipfile.ZIP_DEFLATED) as zf:
        used_arc_paths: set[str] = set()
        for item in included:
            doc = docs_by_id.get(item.document_id or -1)
            if doc is None:
                continue
            ver = next((v for v in doc.versions if v.id == item.version_id), None)
            if ver is None:
                continue

            raw_bytes = storage.get_bytes(ver.storage_key)
            safe_file = sanitize_filename(ver.original_filename)
            safe_cat = sanitize_filename(item.requirement).upper()
            safe_target = sanitize_filename(item.target).upper()

            if item.scope == "Unidad":
                arc_dir = f"{safe_root}/UNIDADES/{safe_target}/{safe_cat}"
            elif item.scope == "Trabajador":
                arc_dir = f"{safe_root}/TRABAJADORES/{safe_target}"
            else:
                arc_dir = f"{safe_root}/EMPRESA/{safe_cat}"

            arc_path = f"{arc_dir}/{safe_file}"
            if arc_path in used_arc_paths:
                arc_path = f"{arc_dir}/{doc.id}_{safe_file}"
            used_arc_paths.add(arc_path)

            zf.writestr(arc_path, raw_bytes)
            index_rows.append(
                [
                    safe_file,
                    item.requirement,
                    item.target,
                    f"v{ver.version_number}",
                    doc.issued_at.isoformat() if doc.issued_at else "",
                    doc.expires_at.isoformat() if doc.expires_at else "Sin vencimiento",
                    item.status,
                    arc_path,
                ]
            )

        csv_stream = io.StringIO()
        writer = csv.writer(csv_stream)
        writer.writerow(
            [
                "Archivo",
                "Categoria",
                "Unidad_o_Entidad",
                "Version",
                "Fecha_Emision",
                "Fecha_Vencimiento",
                "Estado",
                "Ruta_En_Paquete",
            ]
        )
        writer.writerows(index_rows)
        zf.writestr(f"{safe_root}/00_INDICE/indice.csv", csv_stream.getvalue().encode("utf-8-sig"))

    zip_bytes = zip_buffer.getvalue()
    zip_filename = f"{safe_root}.zip"
    storage_key = build_storage_key(
        current_user.organization_id, f"auditoria-{audit.id}", zip_filename
    )
    storage.put_bytes(storage_key, zip_bytes, "application/zip")

    export_row = AuditExport(audit_id=audit.id, storage_key=storage_key)
    db.add(export_row)
    db.flush()
    db.add(
        AuditLog(
            organization_id=current_user.organization_id,
            actor_user_id=current_user.id,
            action="audit.export",
            entity_type="audit_export",
            entity_id=export_row.id,
        )
    )
    db.commit()
    db.refresh(export_row)

    return AuditExportOut(
        id=export_row.id,
        audit_id=audit.id,
        filename=zip_filename,
        included_count=len(index_rows),
        missing_count=missing_count,
        download_url=f"/api/v1/audits/{audit.id}/exports/{export_row.id}/download",
        created_at=export_row.created_at,
    )


@router.get("/{audit_id}/exports/{export_id}/download")
def download_audit_export(
    audit_id: int,
    export_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    storage: StorageBackend = Depends(get_storage),
) -> Response:
    """Download an authorized generated audit ZIP package."""
    audit = _get_org_audit(db, current_user.organization_id, audit_id)
    export_row = db.scalar(
        select(AuditExport).where(
            AuditExport.id == export_id, AuditExport.audit_id == audit.id
        )
    )
    if export_row is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Paquete de exportación no encontrado.",
        )

    try:
        zip_bytes = storage.get_bytes(export_row.storage_key)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Archivo ZIP no encontrado en almacenamiento privado.",
        ) from exc

    safe_name = sanitize_filename(f"AUDITORIA_{audit.name}.zip")
    return Response(
        content=zip_bytes,
        media_type="application/zip",
        headers={
            "Content-Disposition": f'attachment; filename="{safe_name}"',
            "X-Content-Type-Options": "nosniff",
            "Cache-Control": "private, no-store",
        },
    )
