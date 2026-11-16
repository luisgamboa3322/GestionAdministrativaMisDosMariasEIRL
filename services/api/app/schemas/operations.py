from datetime import date, datetime

from pydantic import BaseModel, Field


class ExpirationItemOut(BaseModel):
    """Document expiration status evaluated in America/Lima timezone."""

    document_id: int
    name: str
    category: str
    related_label: str
    issued_at: date | None
    expires_at: date | None
    days_remaining: int | None
    status: str


class ExpirationsSummaryOut(BaseModel):
    """Summary counts and filtered items for expiration control."""

    reference_date: date
    valid_count: int
    expiring_soon_count: int
    expired_count: int
    no_expiration_count: int
    items: list[ExpirationItemOut]


class SearchResultItemOut(BaseModel):
    """Unified metadata search result item."""

    entity_type: str
    entity_id: int
    title: str
    subtitle: str
    category: str | None = None


class GlobalSearchOut(BaseModel):
    """Grouped metadata search results."""

    query: str
    total: int
    documents: list[SearchResultItemOut]
    folders: list[SearchResultItemOut]
    vehicles: list[SearchResultItemOut]
    workers: list[SearchResultItemOut]
    companies: list[SearchResultItemOut]
    audits: list[SearchResultItemOut]


class AuditRequirementIn(BaseModel):
    """Configurable audit requirement entry."""

    id: str = Field(min_length=1, max_length=60)
    label: str = Field(min_length=1, max_length=120)
    scope: str = Field(default="Unidad", max_length=40)
    custom: bool = False


class AuditCreate(BaseModel):
    """Payload to create an audit dossier."""

    name: str = Field(min_length=2, max_length=200)
    company_id: int | None = None
    request_date: date
    deadline: date
    period: str = Field(min_length=1, max_length=80)
    description: str | None = None
    notes: str | None = None
    status: str = Field(default="Activa", max_length=40)
    vehicle_ids: list[int] = Field(default_factory=list)
    worker_ids: list[int] = Field(default_factory=list)
    requirements: list[AuditRequirementIn] = Field(default_factory=list)


class AuditUpdate(BaseModel):
    """Payload to update audit status, checklist review flags, or exclusions."""

    name: str | None = Field(default=None, min_length=2, max_length=200)
    status: str | None = Field(default=None, max_length=40)
    description: str | None = None
    notes: str | None = None
    vehicle_ids: list[int] | None = None
    worker_ids: list[int] | None = None
    requirements: list[AuditRequirementIn] | None = None
    manually_reviewed: list[str] | None = None
    excluded_evidence: list[str] | None = None


class AuditEvidenceOut(BaseModel):
    """Evaluated audit requirement item matched against real stored documents."""

    id: str
    requirement_id: str
    requirement: str
    scope: str
    target: str
    status: str
    document_id: int | None = None
    version_id: int | None = None
    name: str | None = None
    expiration_date: date | None = None
    version: str | None = None


class AuditExportOut(BaseModel):
    """Generated private ZIP package record."""

    id: int
    audit_id: int
    filename: str
    included_count: int
    missing_count: int
    download_url: str
    created_at: datetime


class AuditOut(BaseModel):
    """Full audit record with requirements, evaluated evidence, and exports."""

    id: int
    organization_id: int
    company_id: int | None
    name: str
    request_date: date
    deadline: date
    period: str
    description: str | None
    notes: str | None
    status: str
    vehicle_ids: list[int]
    worker_ids: list[int]
    requirements: list[AuditRequirementIn]
    manually_reviewed: list[str]
    excluded_evidence: list[str]
    evidence: list[AuditEvidenceOut]
    exports: list[AuditExportOut]
    created_at: datetime
