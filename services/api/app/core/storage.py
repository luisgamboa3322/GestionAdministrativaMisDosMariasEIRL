import hashlib
import re
import uuid
from pathlib import Path, PurePosixPath
from typing import Protocol

import boto3
from botocore.client import BaseClient
from botocore.config import Config
from botocore.exceptions import ClientError
from fastapi import HTTPException, status

from app.core.config import Settings

SAFE_FILENAME_RE = re.compile(r"[^A-Za-z0-9._-]+")
MAX_UPLOAD_BYTES = 25 * 1024 * 1024  # 25 MB

ALLOWED_EXTENSIONS: dict[str, set[str]] = {
    ".pdf": {"application/pdf"},
    ".doc": {"application/msword", "application/octet-stream"},
    ".docx": {
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/zip",
        "application/octet-stream",
    },
    ".xls": {"application/vnd.ms-excel", "application/octet-stream"},
    ".xlsx": {
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "application/zip",
        "application/octet-stream",
    },
    ".jpg": {"image/jpeg"},
    ".jpeg": {"image/jpeg"},
    ".png": {"image/png"},
    ".webp": {"image/webp"},
    ".csv": {"text/csv", "text/plain", "application/csv", "application/vnd.ms-excel"},
    ".txt": {"text/plain"},
    ".zip": {"application/zip", "application/x-zip-compressed", "application/octet-stream"},
}

DANGEROUS_SIGNATURES = (
    b"MZ",  # Windows PE/EXE/DLL
    b"\x7fELF",  # Linux ELF
    b"#!",  # Script shebang
)


def sanitize_filename(filename: str) -> str:
    """Sanitize a user-supplied filename to prevent path traversal or unsafe characters."""
    base = PurePosixPath(filename.replace("\\", "/")).name
    cleaned = SAFE_FILENAME_RE.sub("_", base).strip("._")
    return cleaned or f"archivo-{uuid.uuid4().hex[:8]}"


def build_storage_key(organization_id: int, category: str, filename: str) -> str:
    """Build a collision-free private object storage key under the organization namespace."""
    safe_category = SAFE_FILENAME_RE.sub("-", category.lower()).strip("-") or "general"
    safe_name = sanitize_filename(filename)
    return f"org-{organization_id}/{safe_category}/{uuid.uuid4().hex}-{safe_name}"


def compute_sha256(data: bytes) -> str:
    """Return hex SHA-256 checksum for uploaded file content."""
    return hashlib.sha256(data).hexdigest()


def validate_upload_file(filename: str, content_type: str | None, data: bytes) -> tuple[str, str]:
    """Validate uploaded extension, byte size, and binary header signature."""
    safe_name = sanitize_filename(filename)
    ext = Path(safe_name).suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Formato no permitido ({ext or 'sin extensión'}).",
        )

    if not data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El archivo está vacío.",
        )

    if len(data) > MAX_UPLOAD_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_CONTENT_TOO_LARGE,
            detail="El archivo supera el límite máximo permitido de 25 MB.",
        )

    if any(data.startswith(sig) for sig in DANGEROUS_SIGNATURES):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Contenido de archivo ejecutable o potencialmente peligroso rechazado.",
        )

    # Validate magic bytes for binary formats to reject spoofed extensions.
    if ext == ".pdf" and not data.startswith(b"%PDF"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El contenido no corresponde a un PDF válido.",
        )
    if ext == ".png" and not data.startswith(b"\x89PNG\r\n\x1a\n"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El contenido no corresponde a una imagen PNG válida.",
        )
    if ext in {".jpg", ".jpeg"} and not data.startswith(b"\xff\xd8\xff"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El contenido no corresponde a una imagen JPEG válida.",
        )
    if ext == ".webp" and not (data.startswith(b"RIFF") and data[8:12] == b"WEBP"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El contenido no corresponde a una imagen WEBP válida.",
        )
    if ext in {".zip", ".docx", ".xlsx"} and not data.startswith((b"PK\x03\x04", b"PK\x05\x06")):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"El contenido no corresponde a un archivo {ext} válido.",
        )

    resolved_mime = (content_type or "").split(";")[0].strip().lower()
    if not resolved_mime or resolved_mime == "application/octet-stream":
        fallback_mimes = {
            ".pdf": "application/pdf",
            ".png": "image/png",
            ".jpg": "image/jpeg",
            ".jpeg": "image/jpeg",
            ".webp": "image/webp",
            ".csv": "text/csv",
            ".txt": "text/plain",
            ".zip": "application/zip",
            ".doc": "application/msword",
            ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            ".xls": "application/vnd.ms-excel",
            ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        }
        resolved_mime = fallback_mimes[ext]

    return safe_name, resolved_mime


class StorageBackend(Protocol):
    """Protocol for private binary file storage."""

    def put_bytes(self, key: str, data: bytes, content_type: str) -> None: ...
    def get_bytes(self, key: str) -> bytes: ...
    def delete_object(self, key: str) -> None: ...


class S3StorageClient:
    """Private S3-compatible object storage adapter (MinIO, Cloudflare R2, Supabase Storage)."""

    def __init__(self, settings: Settings) -> None:
        self._bucket = settings.s3_bucket_name
        self._auto_create = settings.s3_auto_create_bucket
        self._client: BaseClient = boto3.client(
            "s3",
            endpoint_url=settings.s3_endpoint_url,
            region_name=settings.s3_region,
            aws_access_key_id=settings.s3_access_key,
            aws_secret_access_key=settings.s3_secret_key,
            use_ssl=settings.s3_use_ssl,
            config=Config(signature_version="s3v4", s3={"addressing_style": "path"}),
        )

    def ensure_bucket(self) -> None:
        """Create the private bucket if auto-creation is enabled and missing."""
        if not self._auto_create:
            return
        try:
            self._client.head_bucket(Bucket=self._bucket)
        except ClientError:
            self._client.create_bucket(Bucket=self._bucket)

    def put_bytes(self, key: str, data: bytes, content_type: str) -> None:
        """Upload raw bytes to private object storage."""
        if self._auto_create:
            self.ensure_bucket()
        self._client.put_object(
            Bucket=self._bucket,
            Key=key,
            Body=data,
            ContentType=content_type,
        )

    def get_bytes(self, key: str) -> bytes:
        """Download raw bytes from private object storage."""
        obj = self._client.get_object(Bucket=self._bucket, Key=key)
        return obj["Body"].read()

    def delete_object(self, key: str) -> None:
        """Remove an object from private storage."""
        self._client.delete_object(Bucket=self._bucket, Key=key)


class LocalStorageClient:
    """Local filesystem private storage adapter used for isolated tests or local dev."""

    def __init__(self, base_dir: Path) -> None:
        self._base_dir = base_dir.resolve()
        self._base_dir.mkdir(parents=True, exist_ok=True)

    def _resolve_key(self, key: str) -> Path:
        target = (self._base_dir / key).resolve()
        if not str(target).startswith(str(self._base_dir)):
            raise ValueError("Ruta de almacenamiento inválida.")
        return target

    def put_bytes(self, key: str, data: bytes, content_type: str) -> None:
        target = self._resolve_key(key)
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_bytes(data)

    def get_bytes(self, key: str) -> bytes:
        target = self._resolve_key(key)
        if not target.exists():
            raise FileNotFoundError(key)
        return target.read_bytes()

    def delete_object(self, key: str) -> None:
        target = self._resolve_key(key)
        if target.exists():
            target.unlink()


def get_storage_client(settings: Settings) -> StorageBackend:
    """Return configured private storage backend."""
    if settings.s3_endpoint_url.startswith("local://"):
        raw_path = settings.s3_endpoint_url.removeprefix("local://")
        return LocalStorageClient(Path(raw_path or "./storage_data"))
    return S3StorageClient(settings)
