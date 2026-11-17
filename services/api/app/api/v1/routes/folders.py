from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.database import get_db
from app.models.entities import AuditLog, Document, Folder, User
from app.schemas.auth import MessageResponse
from app.schemas.documents import FolderCreate, FolderOut, FolderUpdate

router = APIRouter(prefix="/folders", tags=["folders"])


def _get_org_folder(db: Session, organization_id: int, folder_id: int) -> Folder:
    folder = db.scalar(
        select(Folder).where(
            Folder.id == folder_id,
            Folder.organization_id == organization_id,
        )
    )
    if folder is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Carpeta no encontrada.")
    return folder


def _collect_subtree_ids(db: Session, organization_id: int, root_id: int) -> set[int]:
    all_folders = list(
        db.scalars(select(Folder).where(Folder.organization_id == organization_id))
    )
    children_map: dict[int | None, list[int]] = {}
    for f in all_folders:
        children_map.setdefault(f.parent_id, []).append(f.id)

    ids = {root_id}
    queue = [root_id]
    while queue:
        current = queue.pop(0)
        for child_id in children_map.get(current, []):
            if child_id not in ids:
                ids.add(child_id)
                queue.append(child_id)
    return ids


@router.get("", response_model=list[FolderOut])
def list_folders(
    include_deleted: bool = Query(default=False),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[FolderOut]:
    """List folders belonging to the authenticated user's organization."""
    stmt = select(Folder).where(Folder.organization_id == current_user.organization_id)
    if not include_deleted:
        stmt = stmt.where(Folder.deleted_at.is_(None))
    stmt = stmt.order_by(Folder.name.asc())
    return [FolderOut.model_validate(row) for row in db.scalars(stmt)]


@router.post("", response_model=FolderOut, status_code=status.HTTP_201_CREATED)
def create_folder(
    payload: FolderCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> FolderOut:
    """Create a folder or nested subfolder."""
    clean_name = payload.name.strip()
    if not clean_name:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El nombre de la carpeta no puede estar vacío.",
        )

    if payload.parent_id is not None:
        parent = _get_org_folder(db, current_user.organization_id, payload.parent_id)
        if parent.deleted_at is not None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No se puede crear una subcarpeta dentro de una carpeta eliminada.",
            )

    sibling_conflict = db.scalar(
        select(Folder).where(
            Folder.organization_id == current_user.organization_id,
            Folder.parent_id == payload.parent_id,
            func.lower(Folder.name) == clean_name.lower(),
            Folder.deleted_at.is_(None),
        )
    )
    if sibling_conflict is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Ya existe una carpeta con ese nombre en esta ubicación.",
        )

    folder = Folder(
        organization_id=current_user.organization_id,
        parent_id=payload.parent_id,
        name=clean_name,
        color=payload.color.strip() or "emerald",
        description=payload.description,
    )
    db.add(folder)
    db.flush()
    db.add(
        AuditLog(
            organization_id=current_user.organization_id,
            actor_user_id=current_user.id,
            action="folder.create",
            entity_type="folder",
            entity_id=folder.id,
        )
    )
    db.commit()
    db.refresh(folder)
    return FolderOut.model_validate(folder)


@router.patch("/{folder_id}", response_model=FolderOut)
def update_folder(
    folder_id: int,
    payload: FolderUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> FolderOut:
    """Rename, recolor, or move a folder while preventing hierarchy cycles."""
    folder = _get_org_folder(db, current_user.organization_id, folder_id)
    if folder.deleted_at is not None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Restaura la carpeta antes de modificarla.",
        )

    if payload.move_to_root:
        folder.parent_id = None
    elif payload.parent_id is not None:
        subtree_ids = _collect_subtree_ids(db, current_user.organization_id, folder.id)
        if payload.parent_id in subtree_ids:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No se puede mover una carpeta dentro de sí misma o de sus subcarpetas.",
            )
        target_parent = _get_org_folder(db, current_user.organization_id, payload.parent_id)
        if target_parent.deleted_at is not None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="La carpeta de destino está en la papelera.",
            )
        folder.parent_id = payload.parent_id

    if payload.name is not None:
        clean_name = payload.name.strip()
        if not clean_name:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="El nombre de la carpeta no puede estar vacío.",
            )
        folder.name = clean_name

    if payload.color is not None:
        folder.color = payload.color.strip() or folder.color
    if payload.description is not None:
        folder.description = payload.description

    db.add(
        AuditLog(
            organization_id=current_user.organization_id,
            actor_user_id=current_user.id,
            action="folder.update",
            entity_type="folder",
            entity_id=folder.id,
        )
    )
    db.commit()
    db.refresh(folder)
    return FolderOut.model_validate(folder)


@router.delete("/{folder_id}", response_model=MessageResponse)
def delete_folder(
    folder_id: int,
    permanent: bool = Query(default=False),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> MessageResponse:
    """Move a folder subtree and contained documents to trash, or delete permanently."""
    folder = _get_org_folder(db, current_user.organization_id, folder_id)
    subtree_ids = _collect_subtree_ids(db, current_user.organization_id, folder.id)

    if permanent:
        docs = list(
            db.scalars(
                select(Document).where(
                    Document.organization_id == current_user.organization_id,
                    Document.folder_id.in_(subtree_ids),
                )
            )
        )
        for doc in docs:
            db.delete(doc)
        sub_folders = list(
            db.scalars(
                select(Folder).where(
                    Folder.organization_id == current_user.organization_id,
                    Folder.id.in_(subtree_ids),
                )
            )
        )
        for sub in sub_folders:
            db.delete(sub)
        action = "folder.delete_permanent"
        msg = "Carpeta eliminada definitivamente."
    else:
        now = datetime.now(timezone.utc)
        sub_folders = list(
            db.scalars(
                select(Folder).where(
                    Folder.organization_id == current_user.organization_id,
                    Folder.id.in_(subtree_ids),
                )
            )
        )
        for sub in sub_folders:
            if sub.deleted_at is None:
                sub.deleted_at = now
        docs = list(
            db.scalars(
                select(Document).where(
                    Document.organization_id == current_user.organization_id,
                    Document.folder_id.in_(subtree_ids),
                    Document.deleted_at.is_(None),
                )
            )
        )
        for doc in docs:
            doc.deleted_at = now
        action = "folder.trash"
        msg = "Carpeta movida a la papelera."

    db.add(
        AuditLog(
            organization_id=current_user.organization_id,
            actor_user_id=current_user.id,
            action=action,
            entity_type="folder",
            entity_id=folder_id,
        )
    )
    db.commit()
    return MessageResponse(message=msg)


@router.post("/{folder_id}/restore", response_model=FolderOut)
def restore_folder(
    folder_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> FolderOut:
    """Restore a folder and its subtree from trash."""
    folder = _get_org_folder(db, current_user.organization_id, folder_id)
    subtree_ids = _collect_subtree_ids(db, current_user.organization_id, folder.id)

    for sub in db.scalars(
        select(Folder).where(
            Folder.organization_id == current_user.organization_id,
            Folder.id.in_(subtree_ids),
        )
    ):
        sub.deleted_at = None

    for doc in db.scalars(
        select(Document).where(
            Document.organization_id == current_user.organization_id,
            Document.folder_id.in_(subtree_ids),
        )
    ):
        doc.deleted_at = None

    db.add(
        AuditLog(
            organization_id=current_user.organization_id,
            actor_user_id=current_user.id,
            action="folder.restore",
            entity_type="folder",
            entity_id=folder.id,
        )
    )
    db.commit()
    db.refresh(folder)
    return FolderOut.model_validate(folder)
