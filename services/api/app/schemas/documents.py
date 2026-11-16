from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, Field


class FolderCreate(BaseModel):
    """Payload to create a new folder or subfolder."""

    name: str = Field(min_length=1, max_length=160)
    parent_id: int | None = None
    color: str = Field(default="emerald", max_length=32)
    description: str | None = None


class FolderUpdate(BaseModel):
    """Payload to rename, recolor, or move a folder."""

    name: str | None = Field(default=None, min_length=1, max_length=160)
    parent_id: int | None = None
    move_to_root: bool = False
    color: str | None = Field(default=None, max_length=32)
    description: str | None = None


class FolderOut(BaseModel):
    """Serialized folder record."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    organization_id: int
    parent_id: int | None
    name: str
    color: str
    description: str | None
    created_at: datetime
    deleted_at: datetime | None


class DocumentVersionOut(BaseModel):
    """Serialized immutable file version metadata."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    document_id: int
    version_number: int
    original_filename: str
    mime_type: str
    byte_size: int
    checksum: str
    is_current: bool
    uploaded_at: datetime


class DocumentUpdate(BaseModel):
    """Payload to edit document metadata, move folder, or organize from inbox."""

    name: str | None = Field(default=None, min_length=1, max_length=255)
    folder_id: int | None = None
    move_to_root: bool = False
    category: str | None = Field(default=None, max_length=100)
    description: str | None = None
    related_vehicle_id: int | None = None
    related_worker_id: int | None = None
    related_company_id: int | None = None
    tags: str | None = Field(default=None, max_length=500)
    is_favorite: bool | None = None
    is_inbox: bool | None = None
    issued_at: date | None = None
    expires_at: date | None = None


class DocumentOut(BaseModel):
    """Serialized document metadata including version summary."""

    id: int
    organization_id: int
    folder_id: int | None
    category: str
    name: str
    description: str | None
    related_vehicle_id: int | None
    related_worker_id: int | None
    related_company_id: int | None
    tags: str | None
    is_favorite: bool
    is_inbox: bool
    inbox_source: str | None
    issued_at: date | None
    expires_at: date | None
    created_at: datetime
    deleted_at: datetime | None
    current_version: DocumentVersionOut | None
    versions: list[DocumentVersionOut]
