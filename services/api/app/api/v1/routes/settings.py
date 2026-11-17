from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.database import get_db
from app.models.entities import (
    AuditLog,
    DocumentTemplate,
    DocumentType,
    TemplateRequirement,
    User,
)
from app.schemas.auth import MessageResponse
from app.schemas.settings import (
    CategoryCreate,
    CategoryOut,
    TemplateCreate,
    TemplateOut,
    TemplateUpdate,
)

router = APIRouter(prefix="/settings", tags=["settings"])

LOCATION_BY_SCOPE = {
    "Vehicular": "Expediente de unidad",
    "Unidad": "Expediente de unidad",
    "Laboral": "Ficha de trabajador",
    "Trabajador": "Ficha de trabajador",
    "Operativo": "Empresas y servicios",
    "Empresa": "Empresas y servicios",
    "Administrativo": "Mis archivos",
    "General": "Mis archivos",
}


def _serialize_category(row: DocumentType) -> CategoryOut:
    return CategoryOut(
        id=row.id,
        name=row.name,
        type=row.scope,
        location=LOCATION_BY_SCOPE.get(row.scope, "Mis archivos"),
        requires_expiration=row.requires_expiration,
        description=row.description or "",
        color=row.color,
    )


def _serialize_template(db: Session, tpl: DocumentTemplate) -> TemplateOut:
    reqs = list(
        db.scalars(
            select(TemplateRequirement)
            .where(TemplateRequirement.template_id == tpl.id)
            .order_by(TemplateRequirement.id.asc())
        )
    )
    return TemplateOut(
        id=tpl.id,
        name=tpl.name,
        kind=tpl.kind,
        items=[r.label for r in reqs],
        active=tpl.is_active,
    )


@router.get("/categories", response_model=list[CategoryOut])
def list_categories(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[CategoryOut]:
    rows = list(
        db.scalars(
            select(DocumentType)
            .where(DocumentType.organization_id == current_user.organization_id)
            .order_by(DocumentType.id.asc())
        )
    )
    return [_serialize_category(row) for row in rows]


@router.post("/categories", response_model=CategoryOut, status_code=status.HTTP_201_CREATED)
def create_category(
    payload: CategoryCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> CategoryOut:
    clean_name = payload.name.strip()
    exists = db.scalar(
        select(DocumentType).where(
            DocumentType.organization_id == current_user.organization_id,
            func.lower(DocumentType.name) == clean_name.lower(),
        )
    )
    if exists is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"La categoría '{clean_name}' ya existe.",
        )

    row = DocumentType(
        organization_id=current_user.organization_id,
        name=clean_name,
        scope=payload.type.strip(),
        requires_expiration=payload.requires_expiration,
        description=payload.description,
        color=payload.color.strip() or "emerald",
    )
    db.add(row)
    db.flush()
    db.add(
        AuditLog(
            organization_id=current_user.organization_id,
            actor_user_id=current_user.id,
            action="category.create",
            entity_type="document_type",
            entity_id=row.id,
        )
    )
    db.commit()
    db.refresh(row)
    return _serialize_category(row)


@router.delete("/categories/{category_id}", response_model=MessageResponse)
def delete_category(
    category_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> MessageResponse:
    row = db.scalar(
        select(DocumentType).where(
            DocumentType.id == category_id,
            DocumentType.organization_id == current_user.organization_id,
        )
    )
    if row is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Categoría no encontrada."
        )
    db.delete(row)
    db.commit()
    return MessageResponse(message="Categoría eliminada.")


@router.get("/templates", response_model=list[TemplateOut])
def list_templates(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[TemplateOut]:
    rows = list(
        db.scalars(
            select(DocumentTemplate)
            .where(DocumentTemplate.organization_id == current_user.organization_id)
            .order_by(DocumentTemplate.id.asc())
        )
    )
    return [_serialize_template(db, row) for row in rows]


@router.post("/templates", response_model=TemplateOut, status_code=status.HTTP_201_CREATED)
def create_template(
    payload: TemplateCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> TemplateOut:
    tpl = DocumentTemplate(
        organization_id=current_user.organization_id,
        name=payload.name.strip(),
        kind=payload.kind,
        is_active=True,
    )
    db.add(tpl)
    db.flush()

    for raw_item in payload.items:
        label = raw_item.strip()
        if label:
            db.add(
                TemplateRequirement(
                    template_id=tpl.id,
                    label=label[:120],
                    is_required=True,
                )
            )

    db.add(
        AuditLog(
            organization_id=current_user.organization_id,
            actor_user_id=current_user.id,
            action="template.create",
            entity_type="document_template",
            entity_id=tpl.id,
        )
    )
    db.commit()
    db.refresh(tpl)
    return _serialize_template(db, tpl)


@router.patch("/templates/{template_id}", response_model=TemplateOut)
def update_template(
    template_id: int,
    payload: TemplateUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> TemplateOut:
    """Update a template name and/or ordered requirement items."""
    tpl = db.scalar(
        select(DocumentTemplate).where(
            DocumentTemplate.id == template_id,
            DocumentTemplate.organization_id == current_user.organization_id,
        )
    )
    if tpl is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Plantilla no encontrada."
        )

    if payload.name is not None:
        tpl.name = payload.name.strip()

    if payload.items is not None:
        existing_reqs = list(
            db.scalars(
                select(TemplateRequirement).where(TemplateRequirement.template_id == tpl.id)
            )
        )
        for req in existing_reqs:
            db.delete(req)
        db.flush()

        seen: set[str] = set()
        for raw_item in payload.items:
            label = raw_item.strip()
            if not label or label.lower() in seen:
                continue
            seen.add(label.lower())
            db.add(
                TemplateRequirement(
                    template_id=tpl.id,
                    label=label[:120],
                    is_required=True,
                )
            )

    db.add(
        AuditLog(
            organization_id=current_user.organization_id,
            actor_user_id=current_user.id,
            action="template.update",
            entity_type="document_template",
            entity_id=tpl.id,
        )
    )
    db.commit()
    db.refresh(tpl)
    return _serialize_template(db, tpl)


@router.patch("/templates/{template_id}/toggle", response_model=TemplateOut)
def toggle_template(
    template_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> TemplateOut:
    tpl = db.scalar(
        select(DocumentTemplate).where(
            DocumentTemplate.id == template_id,
            DocumentTemplate.organization_id == current_user.organization_id,
        )
    )
    if tpl is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Plantilla no encontrada."
        )
    tpl.is_active = not tpl.is_active
    db.commit()
    db.refresh(tpl)
    return _serialize_template(db, tpl)
