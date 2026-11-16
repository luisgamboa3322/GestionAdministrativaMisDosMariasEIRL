from datetime import date, datetime, timezone
from typing import Annotated

from fastapi import (
    APIRouter,
    Depends,
    File,
    Form,
    HTTPException,
    Query,
    Response,
    UploadFile,
    status,
)
from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from app.api.deps import get_current_user, get_storage
from app.core.database import get_db
from app.core.storage import (
    StorageBackend,
    build_storage_key,
    compute_sha256,
    validate_upload_file,
)
from app.models.entities import (
    AuditLog,
    Company,
    Document,
    DocumentType,
    DocumentVersion,
    Folder,
    User,
    Vehicle,
    Worker,
)
from app.schemas.auth import MessageResponse
from app.schemas.documents import DocumentOut, DocumentUpdate, DocumentVersionOut

router = APIRouter(prefix="/documents", tags=["documents"])

SAFE_INLINE_MIMES = {
    "application/pdf",
    "image/png",
    "image/jpeg",
    "image/webp",
    "text/plain",
}


def _resolve_document_type(
    db: Session, organization_id: int, category_name: str
) -> DocumentType:
    clean = category_name.strip() or "Otros"
    doc_type = db.scalar(
        select(DocumentType).where(
            DocumentType.organization_id == organization_id,
            DocumentType.name == clean,
        )
    )
    if doc_type is None:
        doc_type = DocumentType(
            organization_id=organization_id,
            name=clean,
            scope="General",
            requires_expiration=clean in {"SOAT", "STR", "Pólizas", "GPS", "Revisión técnica"},
        )
        db.add(doc_type)
        db.flush()
    return doc_type


def _serialize_document(
    doc: Document, category_map: dict[int, str]
) -> DocumentOut:
    ordered_versions = sorted(doc.versions, key=lambda v: v.version_number, reverse=True)
    current = next((v for v in ordered_versions if v.is_current), ordered_versions[0] if ordered_versions else None)
    category_name = category_map.get(doc.document_type_id or -1, "Otros")
    return DocumentOut(
        id=doc.id,
        organization_id=doc.organization_id,
        folder_id=doc.folder_id,
        category=category_name,
        name=doc.name,
        description=doc.description,
        related_vehicle_id=doc.related_vehicle_id,
        related_worker_id=doc.related_worker_id,
        related_company_id=doc.related_company_id,
        tags=doc.tags,
        is_favorite=doc.is_favorite,
        is_inbox=doc.is_inbox,
        inbox_source=doc.inbox_source,
        issued_at=doc.issued_at,
        expires_at=doc.expires_at,
        created_at=doc.created_at,
        deleted_at=doc.deleted_at,
        current_version=DocumentVersionOut.model_validate(current) if current else None,
        versions=[DocumentVersionOut.model_validate(v) for v in ordered_versions],
    )


def _get_org_document(db: Session, organization_id: int, document_id: int) -> Document:
    stmt = (
        select(Document)
        .options(joinedload(Document.versions))
        .where(Document.id == document_id, Document.organization_id == organization_id)
        .execution_options(populate_existing=True)
    )
    doc = db.scalar(stmt)
    if doc is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Documento no encontrado.",
        )
    return doc


def _category_map(db: Session, organization_id: int) -> dict[int, str]:
    rows = db.scalars(
        select(DocumentType).where(DocumentType.organization_id == organization_id)
    )
    return {row.id: row.name for row in rows}


def _validate_relations(
    db: Session,
    organization_id: int,
    *,
    folder_id: int | None = None,
    vehicle_id: int | None = None,
    worker_id: int | None = None,
    company_id: int | None = None,
) -> None:
    if folder_id is not None:
        folder = db.scalar(
            select(Folder).where(
                Folder.id == folder_id,
                Folder.organization_id == organization_id,
                Folder.deleted_at.is_(None),
            )
        )
        if folder is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Carpeta de destino no encontrada.",
            )
    if vehicle_id is not None:
        vehicle = db.scalar(
            select(Vehicle).where(
                Vehicle.id == vehicle_id, Vehicle.organization_id == organization_id
            )
        )
        if vehicle is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Unidad vehicular no encontrada.",
            )
    if worker_id is not None:
        worker = db.scalar(
            select(Worker).where(
                Worker.id == worker_id, Worker.organization_id == organization_id
            )
        )
        if worker is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Trabajador no encontrado.",
            )
    if company_id is not None:
        company = db.scalar(
            select(Company).where(
                Company.id == company_id, Company.organization_id == organization_id
            )
        )
        if company is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Empresa o proveedor no encontrado.",
            )


@router.get("", response_model=list[DocumentOut])
def list_documents(
    folder_id: int | None = Query(default=None),
    inbox_only: bool | None = Query(default=None),
    favorite_only: bool | None = Query(default=None),
    include_deleted: bool = Query(default=False),
    category: str | None = Query(default=None),
    q: str | None = Query(default=None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[DocumentOut]:
    """List documents with optional folder, inbox, favorite, category, and metadata search filters."""
    stmt = (
        select(Document)
        .options(joinedload(Document.versions))
        .where(Document.organization_id == current_user.organization_id)
    )
    if not include_deleted:
        stmt = stmt.where(Document.deleted_at.is_(None))
    if folder_id is not None:
        stmt = stmt.where(Document.folder_id == folder_id)
    if inbox_only is not None:
        stmt = stmt.where(Document.is_inbox.is_(inbox_only))
    if favorite_only:
        stmt = stmt.where(Document.is_favorite.is_(True))

    stmt = stmt.order_by(Document.created_at.desc())
    docs = list(db.scalars(stmt).unique())
    cat_map = _category_map(db, current_user.organization_id)

    results = [_serialize_document(doc, cat_map) for doc in docs]
    if category:
        target_cat = category.strip().lower()
        results = [item for item in results if item.category.lower() == target_cat]
    if q:
        needle = q.strip().lower()
        results = [
            item
            for item in results
            if needle in item.name.lower()
            or needle in item.category.lower()
            or (item.tags and needle in item.tags.lower())
            or (item.description and needle in item.description.lower())
        ]
    return results


@router.post("/upload", response_model=DocumentOut, status_code=status.HTTP_201_CREATED)
async def upload_document(
    file: Annotated[UploadFile, File(...)],
    name: Annotated[str | None, Form()] = None,
    folder_id: Annotated[int | None, Form()] = None,
    category: Annotated[str, Form()] = "Otros",
    description: Annotated[str | None, Form()] = None,
    related_vehicle_id: Annotated[int | None, Form()] = None,
    related_worker_id: Annotated[int | None, Form()] = None,
    related_company_id: Annotated[int | None, Form()] = None,
    tags: Annotated[str | None, Form()] = None,
    is_inbox: Annotated[bool, Form()] = False,
    inbox_source: Annotated[str | None, Form()] = None,
    issued_at: Annotated[date | None, Form()] = None,
    expires_at: Annotated[date | None, Form()] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    storage: StorageBackend = Depends(get_storage),
) -> DocumentOut:
    """Validate and upload a document binary to private storage with metadata."""
    _validate_relations(
        db,
        current_user.organization_id,
        folder_id=folder_id,
        vehicle_id=related_vehicle_id,
        worker_id=related_worker_id,
        company_id=related_company_id,
    )

    raw_bytes = await file.read()
    safe_name, resolved_mime = validate_upload_file(
        file.filename or "documento", file.content_type, raw_bytes
    )
    doc_type = _resolve_document_type(db, current_user.organization_id, category)
    storage_key = build_storage_key(current_user.organization_id, doc_type.name, safe_name)

    storage.put_bytes(storage_key, raw_bytes, resolved_mime)

    doc = Document(
        organization_id=current_user.organization_id,
        folder_id=None if is_inbox else folder_id,
        document_type_id=doc_type.id,
        name=(name or safe_name).strip(),
        description=description,
        related_vehicle_id=related_vehicle_id,
        related_worker_id=related_worker_id,
        related_company_id=related_company_id,
        tags=tags,
        is_inbox=is_inbox,
        inbox_source=inbox_source,
        issued_at=issued_at,
        expires_at=expires_at,
    )
    db.add(doc)
    db.flush()

    version = DocumentVersion(
        document_id=doc.id,
        version_number=1,
        storage_key=storage_key,
        original_filename=safe_name,
        mime_type=resolved_mime,
        byte_size=len(raw_bytes),
        checksum=compute_sha256(raw_bytes),
        is_current=True,
    )
    db.add(version)
    db.add(
        AuditLog(
            organization_id=current_user.organization_id,
            actor_user_id=current_user.id,
            action="document.upload",
            entity_type="document",
            entity_id=doc.id,
        )
    )
    db.commit()

    refreshed = _get_org_document(db, current_user.organization_id, doc.id)
    return _serialize_document(refreshed, _category_map(db, current_user.organization_id))


@router.get("/{document_id}", response_model=DocumentOut)
def get_document(
    document_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> DocumentOut:
    """Fetch document metadata and version history."""
    doc = _get_org_document(db, current_user.organization_id, document_id)
    return _serialize_document(doc, _category_map(db, current_user.organization_id))


@router.patch("/{document_id}", response_model=DocumentOut)
def update_document(
    document_id: int,
    payload: DocumentUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> DocumentOut:
    """Update document metadata, move between folders, or classify from inbox."""
    doc = _get_org_document(db, current_user.organization_id, document_id)
    if doc.deleted_at is not None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Restaura el documento antes de editarlo.",
        )

    _validate_relations(
        db,
        current_user.organization_id,
        folder_id=payload.folder_id if not payload.move_to_root else None,
        vehicle_id=payload.related_vehicle_id,
        worker_id=payload.related_worker_id,
        company_id=payload.related_company_id,
    )

    if payload.name is not None:
        clean = payload.name.strip()
        if not clean:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="El nombre del documento no puede estar vacío.",
            )
        doc.name = clean

    if payload.move_to_root:
        doc.folder_id = None
    elif payload.folder_id is not None:
        doc.folder_id = payload.folder_id

    if payload.category is not None:
        doc_type = _resolve_document_type(db, current_user.organization_id, payload.category)
        doc.document_type_id = doc_type.id

    if payload.description is not None:
        doc.description = payload.description
    if payload.related_vehicle_id is not None:
        doc.related_vehicle_id = payload.related_vehicle_id
    if payload.related_worker_id is not None:
        doc.related_worker_id = payload.related_worker_id
    if payload.related_company_id is not None:
        doc.related_company_id = payload.related_company_id
    if payload.tags is not None:
        doc.tags = payload.tags
    if payload.is_favorite is not None:
        doc.is_favorite = payload.is_favorite
    if payload.is_inbox is not None:
        doc.is_inbox = payload.is_inbox
    if payload.issued_at is not None:
        doc.issued_at = payload.issued_at
    if payload.expires_at is not None:
        doc.expires_at = payload.expires_at

    db.add(
        AuditLog(
            organization_id=current_user.organization_id,
            actor_user_id=current_user.id,
            action="document.update",
            entity_type="document",
            entity_id=doc.id,
        )
    )
    db.commit()

    refreshed = _get_org_document(db, current_user.organization_id, doc.id)
    return _serialize_document(refreshed, _category_map(db, current_user.organization_id))


@router.delete("/{document_id}", response_model=MessageResponse)
def delete_document(
    document_id: int,
    permanent: bool = Query(default=False),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    storage: StorageBackend = Depends(get_storage),
) -> MessageResponse:
    """Move a document to trash or delete it permanently with its stored versions."""
    doc = _get_org_document(db, current_user.organization_id, document_id)
    if permanent:
        for version in doc.versions:
            storage.delete_object(version.storage_key)
        db.delete(doc)
        action = "document.delete_permanent"
        msg = "Documento eliminado definitivamente."
    else:
        doc.deleted_at = datetime.now(timezone.utc)
        action = "document.trash"
        msg = "Documento movido a la papelera."

    db.add(
        AuditLog(
            organization_id=current_user.organization_id,
            actor_user_id=current_user.id,
            action=action,
            entity_type="document",
            entity_id=document_id,
        )
    )
    db.commit()
    return MessageResponse(message=msg)


@router.post("/{document_id}/restore", response_model=DocumentOut)
def restore_document(
    document_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> DocumentOut:
    """Restore a soft-deleted document from trash."""
    doc = _get_org_document(db, current_user.organization_id, document_id)
    doc.deleted_at = None
    db.add(
        AuditLog(
            organization_id=current_user.organization_id,
            actor_user_id=current_user.id,
            action="document.restore",
            entity_type="document",
            entity_id=doc.id,
        )
    )
    db.commit()
    refreshed = _get_org_document(db, current_user.organization_id, doc.id)
    return _serialize_document(refreshed, _category_map(db, current_user.organization_id))


@router.get("/{document_id}/download")
def download_document(
    document_id: int,
    version_id: int | None = Query(default=None),
    inline: bool = Query(default=False),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    storage: StorageBackend = Depends(get_storage),
) -> Response:
    """Stream an authorized document version from private storage."""
    doc = _get_org_document(db, current_user.organization_id, document_id)
    if doc.deleted_at is not None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="El documento está en la papelera.",
        )

    if version_id is not None:
        version = next((v for v in doc.versions if v.id == version_id), None)
    else:
        ordered = sorted(doc.versions, key=lambda v: v.version_number, reverse=True)
        version = next((v for v in ordered if v.is_current), ordered[0] if ordered else None)

    if version is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Versión del archivo no encontrada.",
        )

    try:
        content = storage.get_bytes(version.storage_key)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Archivo binario no encontrado en el almacenamiento privado.",
        ) from exc

    disposition = "inline" if inline and version.mime_type in SAFE_INLINE_MIMES else "attachment"
    headers = {
        "Content-Disposition": f'{disposition}; filename="{version.original_filename}"',
        "X-Content-Type-Options": "nosniff",
        "Cache-Control": "private, no-store",
    }
    return Response(content=content, media_type=version.mime_type, headers=headers)


@router.get("/{document_id}/versions", response_model=list[DocumentVersionOut])
def list_document_versions(
    document_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[DocumentVersionOut]:
    """List immutable historical versions of a document."""
    doc = _get_org_document(db, current_user.organization_id, document_id)
    ordered = sorted(doc.versions, key=lambda v: v.version_number, reverse=True)
    return [DocumentVersionOut.model_validate(v) for v in ordered]


@router.post("/{document_id}/versions", response_model=DocumentOut, status_code=status.HTTP_201_CREATED)
async def upload_document_version(
    document_id: int,
    file: Annotated[UploadFile, File(...)],
    issued_at: Annotated[date | None, Form()] = None,
    expires_at: Annotated[date | None, Form()] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    storage: StorageBackend = Depends(get_storage),
) -> DocumentOut:
    """Upload a new file version while preserving all prior versions."""
    doc = _get_org_document(db, current_user.organization_id, document_id)
    if doc.deleted_at is not None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Restaura el documento antes de subir una nueva versión.",
        )

    raw_bytes = await file.read()
    safe_name, resolved_mime = validate_upload_file(
        file.filename or "documento", file.content_type, raw_bytes
    )

    cat_map = _category_map(db, current_user.organization_id)
    category_name = cat_map.get(doc.document_type_id or -1, "Otros")
    storage_key = build_storage_key(current_user.organization_id, category_name, safe_name)
    storage.put_bytes(storage_key, raw_bytes, resolved_mime)

    next_number = max((v.version_number for v in doc.versions), default=0) + 1
    for existing in doc.versions:
        existing.is_current = False

    db.add(
        DocumentVersion(
            document_id=doc.id,
            version_number=next_number,
            storage_key=storage_key,
            original_filename=safe_name,
            mime_type=resolved_mime,
            byte_size=len(raw_bytes),
            checksum=compute_sha256(raw_bytes),
            is_current=True,
        )
    )
    if issued_at is not None:
        doc.issued_at = issued_at
    if expires_at is not None:
        doc.expires_at = expires_at

    db.add(
        AuditLog(
            organization_id=current_user.organization_id,
            actor_user_id=current_user.id,
            action="document.new_version",
            entity_type="document",
            entity_id=doc.id,
        )
    )
    db.commit()

    refreshed = _get_org_document(db, current_user.organization_id, doc.id)
    return _serialize_document(refreshed, cat_map)
