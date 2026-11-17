from datetime import datetime

from pydantic import BaseModel, Field


class CategoryCreate(BaseModel):
    """Payload to register a configurable document category."""

    name: str = Field(min_length=2, max_length=100)
    type: str = Field(default="General", max_length=40)
    requires_expiration: bool = False
    description: str | None = None
    color: str = Field(default="emerald", max_length=32)


class CategoryOut(BaseModel):
    """Serialized configurable category."""

    id: int
    name: str
    type: str
    location: str
    requires_expiration: bool
    description: str
    color: str


class TemplateCreate(BaseModel):
    """Payload to create a folder/checklist template."""

    name: str = Field(min_length=2, max_length=140)
    kind: str = Field(pattern="^(Unidad|Trabajador|Auditoría)$")
    items: list[str] = Field(min_length=1)


class TemplateUpdate(BaseModel):
    """Payload to update an existing template's name or checklist items."""

    name: str | None = Field(default=None, min_length=2, max_length=140)
    items: list[str] | None = Field(default=None, min_length=1)


class TemplateOut(BaseModel):
    """Serialized template configuration."""

    id: int
    name: str
    kind: str
    items: list[str]
    active: bool


class NotificationOut(BaseModel):
    """Serialized expiration/system alert notification."""

    id: int
    document_id: int | None
    notification_type: str
    message: str
    scheduled_for: datetime
    delivered_at: datetime | None


class NotificationCheckOut(BaseModel):
    """Summary returned by idempotent expiration check."""

    created_count: int
    total_unread: int
