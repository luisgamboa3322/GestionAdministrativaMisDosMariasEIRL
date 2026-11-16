from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class VehiclePhotoOut(BaseModel):
    """Serialized vehicle gallery photo metadata with authenticated stream URL."""

    id: int
    vehicle_id: int
    description: str | None
    is_cover: bool
    url: str
    created_at: datetime


class VehicleCreate(BaseModel):
    """Payload to register a transport unit and optional dossier template folders."""

    plate: str = Field(min_length=3, max_length=20)
    internal_code: str = Field(min_length=1, max_length=40)
    brand: str = Field(min_length=1, max_length=80)
    model: str = Field(min_length=1, max_length=80)
    year: int = Field(ge=1980, le=2035)
    capacity: int = Field(ge=1, le=200)
    vehicle_type: str = Field(default="Bus de personal", max_length=60)
    status: str = Field(default="Operativa", max_length=40)
    notes: str | None = None
    template_categories: list[str] = Field(default_factory=list)


class VehicleUpdate(BaseModel):
    """Payload to update unit metadata or active cover photo."""

    plate: str | None = Field(default=None, min_length=3, max_length=20)
    internal_code: str | None = Field(default=None, min_length=1, max_length=40)
    brand: str | None = Field(default=None, min_length=1, max_length=80)
    model: str | None = Field(default=None, min_length=1, max_length=80)
    year: int | None = Field(default=None, ge=1980, le=2035)
    capacity: int | None = Field(default=None, ge=1, le=200)
    vehicle_type: str | None = Field(default=None, max_length=60)
    status: str | None = Field(default=None, max_length=40)
    notes: str | None = None
    cover_photo_id: int | None = None


class VehicleOut(BaseModel):
    """Serialized transport unit with dossier folder ID and photos."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    organization_id: int
    folder_id: int | None
    plate: str
    internal_code: str
    brand: str
    model: str
    year: int
    capacity: int
    vehicle_type: str
    status: str
    notes: str | None
    created_at: datetime
    photos: list[VehiclePhotoOut]
