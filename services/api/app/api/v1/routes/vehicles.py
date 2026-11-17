from pathlib import Path
from typing import Annotated

from fastapi import (
    APIRouter,
    Depends,
    File,
    Form,
    HTTPException,
    Response,
    UploadFile,
    status,
)
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_storage
from app.core.database import get_db
from app.core.storage import StorageBackend, build_storage_key, validate_upload_file
from app.models.entities import AuditLog, Folder, User, Vehicle, VehiclePhoto
from app.schemas.auth import MessageResponse
from app.schemas.vehicles import (
    VehicleCreate,
    VehicleOut,
    VehiclePhotoOut,
    VehicleUpdate,
)

router = APIRouter(prefix="/vehicles", tags=["vehicles"])

ALLOWED_PHOTO_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}
DOSSIER_COLORS = ["emerald", "teal", "blue", "amber", "violet"]


def _get_org_vehicle(db: Session, organization_id: int, vehicle_id: int) -> Vehicle:
    vehicle = db.scalar(
        select(Vehicle).where(
            Vehicle.id == vehicle_id,
            Vehicle.organization_id == organization_id,
        )
    )
    if vehicle is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Unidad vehicular no encontrada.",
        )
    return vehicle


def _serialize_photo(photo: VehiclePhoto) -> VehiclePhotoOut:
    return VehiclePhotoOut(
        id=photo.id,
        vehicle_id=photo.vehicle_id,
        description=photo.description,
        is_cover=photo.is_cover,
        url=f"/api/v1/vehicles/{photo.vehicle_id}/photos/{photo.id}/file",
        created_at=photo.created_at,
    )


def _serialize_vehicle(db: Session, vehicle: Vehicle) -> VehicleOut:
    photos = list(
        db.scalars(
            select(VehiclePhoto)
            .where(VehiclePhoto.vehicle_id == vehicle.id)
            .order_by(VehiclePhoto.is_cover.desc(), VehiclePhoto.created_at.asc())
        )
    )
    return VehicleOut(
        id=vehicle.id,
        organization_id=vehicle.organization_id,
        folder_id=vehicle.folder_id,
        plate=vehicle.plate,
        internal_code=vehicle.internal_code,
        brand=vehicle.brand,
        model=vehicle.model,
        year=vehicle.year,
        capacity=vehicle.capacity,
        vehicle_type=vehicle.vehicle_type,
        status=vehicle.status,
        notes=vehicle.notes,
        created_at=vehicle.created_at,
        photos=[_serialize_photo(p) for p in photos],
    )


def _ensure_unidades_root(db: Session, organization_id: int) -> Folder:
    root = db.scalar(
        select(Folder).where(
            Folder.organization_id == organization_id,
            Folder.parent_id.is_(None),
            func.lower(Folder.name) == "unidades",
            Folder.deleted_at.is_(None),
        )
    )
    if root is None:
        root = Folder(
            organization_id=organization_id,
            parent_id=None,
            name="Unidades",
            color="emerald",
            description="Expedientes por unidad de transporte",
        )
        db.add(root)
        db.flush()
    return root


@router.get("", response_model=list[VehicleOut])
def list_vehicles(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[VehicleOut]:
    """List all vehicles belonging to the organization."""
    rows = list(
        db.scalars(
            select(Vehicle)
            .where(Vehicle.organization_id == current_user.organization_id)
            .order_by(Vehicle.created_at.desc())
        )
    )
    return [_serialize_vehicle(db, v) for v in rows]


@router.post("", response_model=VehicleOut, status_code=status.HTTP_201_CREATED)
def create_vehicle(
    payload: VehicleCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> VehicleOut:
    """Register a vehicle and automatically build its dossier folder tree."""
    clean_plate = payload.plate.strip().upper()
    clean_code = payload.internal_code.strip().upper()

    duplicate = db.scalar(
        select(Vehicle).where(
            Vehicle.organization_id == current_user.organization_id,
            Vehicle.plate == clean_plate,
        )
    )
    if duplicate is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"La placa {clean_plate} ya está registrada.",
        )

    unidades_root = _ensure_unidades_root(db, current_user.organization_id)
    vehicle_folder = Folder(
        organization_id=current_user.organization_id,
        parent_id=unidades_root.id,
        name=clean_plate,
        color="emerald",
        description=f"Expediente de unidad {clean_code}",
    )
    db.add(vehicle_folder)
    db.flush()

    seen_categories: set[str] = set()
    for idx, raw_cat in enumerate(payload.template_categories):
        cat_name = raw_cat.strip()
        if not cat_name or cat_name.lower() in seen_categories:
            continue
        seen_categories.add(cat_name.lower())
        db.add(
            Folder(
                organization_id=current_user.organization_id,
                parent_id=vehicle_folder.id,
                name=cat_name,
                color=DOSSIER_COLORS[idx % len(DOSSIER_COLORS)],
            )
        )

    vehicle = Vehicle(
        organization_id=current_user.organization_id,
        folder_id=vehicle_folder.id,
        plate=clean_plate,
        internal_code=clean_code,
        brand=payload.brand.strip(),
        model=payload.model.strip(),
        year=payload.year,
        capacity=payload.capacity,
        vehicle_type=payload.vehicle_type.strip() or "Bus de personal",
        status=payload.status.strip() or "Operativa",
        notes=payload.notes,
    )
    db.add(vehicle)
    db.flush()

    db.add(
        AuditLog(
            organization_id=current_user.organization_id,
            actor_user_id=current_user.id,
            action="vehicle.create",
            entity_type="vehicle",
            entity_id=vehicle.id,
        )
    )
    db.commit()
    db.refresh(vehicle)
    return _serialize_vehicle(db, vehicle)


@router.get("/{vehicle_id}", response_model=VehicleOut)
def get_vehicle(
    vehicle_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> VehicleOut:
    """Retrieve a single vehicle with its photos."""
    vehicle = _get_org_vehicle(db, current_user.organization_id, vehicle_id)
    return _serialize_vehicle(db, vehicle)


@router.patch("/{vehicle_id}", response_model=VehicleOut)
def update_vehicle(
    vehicle_id: int,
    payload: VehicleUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> VehicleOut:
    """Update unit attributes, sync dossier folder name if plate changes, or set cover photo."""
    vehicle = _get_org_vehicle(db, current_user.organization_id, vehicle_id)

    if payload.plate is not None:
        next_plate = payload.plate.strip().upper()
        if next_plate != vehicle.plate:
            conflict = db.scalar(
                select(Vehicle).where(
                    Vehicle.organization_id == current_user.organization_id,
                    Vehicle.plate == next_plate,
                    Vehicle.id != vehicle.id,
                )
            )
            if conflict is not None:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail=f"La placa {next_plate} ya está registrada.",
                )
            vehicle.plate = next_plate
            if vehicle.folder_id is not None:
                dossier_folder = db.scalar(
                    select(Folder).where(Folder.id == vehicle.folder_id)
                )
                if dossier_folder is not None:
                    dossier_folder.name = next_plate

    if payload.internal_code is not None:
        vehicle.internal_code = payload.internal_code.strip().upper()
    if payload.brand is not None:
        vehicle.brand = payload.brand.strip()
    if payload.model is not None:
        vehicle.model = payload.model.strip()
    if payload.year is not None:
        vehicle.year = payload.year
    if payload.capacity is not None:
        vehicle.capacity = payload.capacity
    if payload.vehicle_type is not None:
        vehicle.vehicle_type = payload.vehicle_type.strip()
    if payload.status is not None:
        vehicle.status = payload.status.strip()
    if payload.notes is not None:
        vehicle.notes = payload.notes

    if payload.cover_photo_id is not None:
        photos = list(
            db.scalars(select(VehiclePhoto).where(VehiclePhoto.vehicle_id == vehicle.id))
        )
        if not any(p.id == payload.cover_photo_id for p in photos):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Fotografía no encontrada para esta unidad.",
            )
        for photo in photos:
            photo.is_cover = photo.id == payload.cover_photo_id

    db.add(
        AuditLog(
            organization_id=current_user.organization_id,
            actor_user_id=current_user.id,
            action="vehicle.update",
            entity_type="vehicle",
            entity_id=vehicle.id,
        )
    )
    db.commit()
    db.refresh(vehicle)
    return _serialize_vehicle(db, vehicle)


@router.delete("/{vehicle_id}", response_model=MessageResponse)
def delete_vehicle(
    vehicle_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    storage: StorageBackend = Depends(get_storage),
) -> MessageResponse:
    """Delete a vehicle record and remove its private photos."""
    vehicle = _get_org_vehicle(db, current_user.organization_id, vehicle_id)
    photos = list(
        db.scalars(select(VehiclePhoto).where(VehiclePhoto.vehicle_id == vehicle.id))
    )
    for photo in photos:
        storage.delete_object(photo.storage_key)

    db.delete(vehicle)
    db.add(
        AuditLog(
            organization_id=current_user.organization_id,
            actor_user_id=current_user.id,
            action="vehicle.delete",
            entity_type="vehicle",
            entity_id=vehicle_id,
        )
    )
    db.commit()
    return MessageResponse(message="Unidad eliminada correctamente.")


@router.post(
    "/{vehicle_id}/photos",
    response_model=VehiclePhotoOut,
    status_code=status.HTTP_201_CREATED,
)
async def upload_vehicle_photo(
    vehicle_id: int,
    file: Annotated[UploadFile, File(...)],
    description: Annotated[str | None, Form()] = None,
    is_cover: Annotated[bool, Form()] = False,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    storage: StorageBackend = Depends(get_storage),
) -> VehiclePhotoOut:
    """Upload a real vehicle photograph to private storage."""
    vehicle = _get_org_vehicle(db, current_user.organization_id, vehicle_id)
    raw_bytes = await file.read()
    safe_name, resolved_mime = validate_upload_file(
        file.filename or "foto.jpg", file.content_type, raw_bytes
    )
    ext = Path(safe_name).suffix.lower()
    if ext not in ALLOWED_PHOTO_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Solo se permiten fotografías JPG, PNG o WEBP.",
        )

    existing_photos = list(
        db.scalars(select(VehiclePhoto).where(VehiclePhoto.vehicle_id == vehicle.id))
    )
    should_be_cover = is_cover or len(existing_photos) == 0
    if should_be_cover:
        for existing in existing_photos:
            existing.is_cover = False

    storage_key = build_storage_key(
        current_user.organization_id, f"unidad-{vehicle.plate}", safe_name
    )
    storage.put_bytes(storage_key, raw_bytes, resolved_mime)

    photo = VehiclePhoto(
        vehicle_id=vehicle.id,
        storage_key=storage_key,
        description=description,
        is_cover=should_be_cover,
    )
    db.add(photo)
    db.flush()
    db.add(
        AuditLog(
            organization_id=current_user.organization_id,
            actor_user_id=current_user.id,
            action="vehicle.photo_upload",
            entity_type="vehicle_photo",
            entity_id=photo.id,
        )
    )
    db.commit()
    db.refresh(photo)
    return _serialize_photo(photo)


@router.get("/{vehicle_id}/photos/{photo_id}/file")
def get_vehicle_photo_file(
    vehicle_id: int,
    photo_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    storage: StorageBackend = Depends(get_storage),
) -> Response:
    """Serve an authorized vehicle photograph from private storage."""
    vehicle = _get_org_vehicle(db, current_user.organization_id, vehicle_id)
    photo = db.scalar(
        select(VehiclePhoto).where(
            VehiclePhoto.id == photo_id, VehiclePhoto.vehicle_id == vehicle.id
        )
    )
    if photo is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Fotografía no encontrada.",
        )

    try:
        data = storage.get_bytes(photo.storage_key)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Imagen no disponible en almacenamiento privado.",
        ) from exc

    ext = Path(photo.storage_key).suffix.lower()
    mime = (
        "image/png"
        if ext == ".png"
        else "image/webp"
        if ext == ".webp"
        else "image/jpeg"
    )
    return Response(
        content=data,
        media_type=mime,
        headers={
            "X-Content-Type-Options": "nosniff",
            "Cache-Control": "private, max-age=300",
        },
    )


@router.patch("/{vehicle_id}/photos/{photo_id}/cover", response_model=VehicleOut)
def set_cover_photo(
    vehicle_id: int,
    photo_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> VehicleOut:
    """Set a specific vehicle photo as cover."""
    vehicle = _get_org_vehicle(db, current_user.organization_id, vehicle_id)
    photos = list(
        db.scalars(select(VehiclePhoto).where(VehiclePhoto.vehicle_id == vehicle.id))
    )
    if not any(p.id == photo_id for p in photos):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Fotografía no encontrada.",
        )
    for photo in photos:
        photo.is_cover = photo.id == photo_id
    db.commit()
    return _serialize_vehicle(db, vehicle)


@router.delete("/{vehicle_id}/photos/{photo_id}", response_model=VehicleOut)
def delete_vehicle_photo(
    vehicle_id: int,
    photo_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    storage: StorageBackend = Depends(get_storage),
) -> VehicleOut:
    """Delete a vehicle photo and promote the next photo if cover was deleted."""
    vehicle = _get_org_vehicle(db, current_user.organization_id, vehicle_id)
    photo = db.scalar(
        select(VehiclePhoto).where(
            VehiclePhoto.id == photo_id, VehiclePhoto.vehicle_id == vehicle.id
        )
    )
    if photo is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Fotografía no encontrada.",
        )

    was_cover = photo.is_cover
    storage.delete_object(photo.storage_key)
    db.delete(photo)
    db.flush()

    if was_cover:
        next_photo = db.scalar(
            select(VehiclePhoto)
            .where(VehiclePhoto.vehicle_id == vehicle.id)
            .order_by(VehiclePhoto.created_at.asc())
        )
        if next_photo is not None:
            next_photo.is_cover = True

    db.commit()
    return _serialize_vehicle(db, vehicle)
