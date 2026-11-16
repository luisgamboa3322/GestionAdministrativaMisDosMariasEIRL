from datetime import date, datetime
from decimal import Decimal

from pydantic import BaseModel, Field


class WorkerCreate(BaseModel):
    """Payload to register a worker and optional dossier categories."""

    code: str = Field(min_length=1, max_length=40)
    name: str = Field(min_length=2, max_length=160)
    role: str = Field(default="Conductor", max_length=100)
    status: str = Field(default="Activo", max_length=40)
    phone: str | None = Field(default=None, max_length=40)
    email: str | None = Field(default=None, max_length=255)
    template_categories: list[str] = Field(default_factory=list)


class WorkerUpdate(BaseModel):
    """Payload to update worker details."""

    code: str | None = Field(default=None, min_length=1, max_length=40)
    name: str | None = Field(default=None, min_length=2, max_length=160)
    role: str | None = Field(default=None, max_length=100)
    status: str | None = Field(default=None, max_length=40)
    phone: str | None = Field(default=None, max_length=40)
    email: str | None = Field(default=None, max_length=255)


class WorkerOut(BaseModel):
    """Serialized worker record."""

    id: int
    organization_id: int
    folder_id: int | None
    code: str
    name: str
    role: str
    status: str
    phone: str | None
    email: str | None
    initials: str
    created_at: datetime


class CompanyCreate(BaseModel):
    """Payload to register a client company or external supplier."""

    mode: str = Field(pattern="^(company|supplier)$")
    name: str = Field(min_length=2, max_length=160)
    legal_name: str = Field(min_length=2, max_length=220)
    kind: str = Field(default="Servicios", max_length=30)
    contact: str | None = Field(default=None, max_length=150)
    phone: str | None = Field(default=None, max_length=40)
    email: str | None = Field(default=None, max_length=255)


class CompanyUpdate(BaseModel):
    """Payload to update company or supplier details."""

    name: str | None = Field(default=None, min_length=2, max_length=160)
    legal_name: str | None = Field(default=None, min_length=2, max_length=220)
    kind: str | None = Field(default=None, max_length=30)
    contact: str | None = Field(default=None, max_length=150)
    phone: str | None = Field(default=None, max_length=40)
    email: str | None = Field(default=None, max_length=255)


class CompanyOut(BaseModel):
    """Serialized company or supplier record."""

    id: int
    organization_id: int
    folder_id: int | None
    mode: str
    name: str
    legal_name: str
    kind: str
    contact: str | None
    phone: str | None
    email: str | None
    created_at: datetime


class ManifestCreate(BaseModel):
    """Payload to record a passenger trip manifest."""

    number: str = Field(min_length=1, max_length=60)
    service_date: date
    vehicle_plate: str | None = Field(default=None, max_length=20)
    company_name: str | None = Field(default=None, max_length=160)
    service: str = Field(default="Traslado de personal", max_length=160)
    period: str = Field(min_length=1, max_length=60)
    document_id: int | None = None
    file_name: str | None = Field(default=None, max_length=255)


class ManifestOut(BaseModel):
    """Serialized passenger manifest record."""

    id: int
    organization_id: int
    number: str
    date: date
    vehicle: str
    company: str
    service: str
    period: str
    file_name: str
    document_id: int | None
    created_at: datetime


class InvoiceCreate(BaseModel):
    """Payload to archive an invoice record."""

    number: str = Field(min_length=1, max_length=60)
    company_name: str = Field(min_length=1, max_length=220)
    issued_date: date
    amount: Decimal = Field(gt=0)
    currency: str = Field(default="PEN", pattern="^(PEN|USD)$")
    status: str = Field(default="Pendiente", max_length=40)
    document_id: int | None = None
    file_name: str | None = Field(default=None, max_length=255)


class InvoiceOut(BaseModel):
    """Serialized archived invoice record."""

    id: int
    organization_id: int
    number: str
    company: str
    date: date
    amount: float
    currency: str
    status: str
    file_name: str
    document_id: int | None
    created_at: datetime
