from functools import lru_cache
from pathlib import Path
from typing import Literal

from pydantic_settings import BaseSettings, SettingsConfigDict

_parents = Path(__file__).resolve().parents
ROOT_ENV = (_parents[4] / ".env") if len(_parents) > 4 else Path(".env")


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    model_config = SettingsConfigDict(
        env_file=str(ROOT_ENV) if ROOT_ENV.exists() else None,
        env_file_encoding="utf-8",
        extra="ignore",
    )

    app_env: Literal["development", "test", "production"] = "development"
    app_name: str = "Mis Dos Marías Document Manager API"
    timezone: str = "America/Lima"

    database_url: str = (
        "postgresql+psycopg://transportdocs:cambia_esta_clave_local@localhost:5433/mis_dos_marias"
    )

    s3_endpoint_url: str = "http://localhost:9000"
    s3_region: str = "us-east-1"
    s3_access_key: str = "minioadmin"
    s3_secret_key: str = "cambia_esta_clave_minio"
    s3_bucket_name: str = "misdosmarias-docs"
    s3_use_ssl: bool = False
    s3_auto_create_bucket: bool = True

    session_secret_key: str = "dev-only-change-before-production-64-chars-minimum"
    session_cookie_name: str = "mdm_session"
    session_ttl_hours: int = 24
    session_cookie_secure: bool = False
    frontend_origins: str = "http://localhost:8443,http://127.0.0.1:8443"

    initial_org_name: str = "MIS DOS MARÍAS E.I.R.L."
    initial_manager_name: str = "Gerente General"
    initial_manager_email: str = "gerencia@misdosmarias.pe"
    initial_manager_password: str = ""

    @property
    def cors_origins(self) -> list[str]:
        """Parse comma-separated allowed frontend origins."""
        return [origin.strip() for origin in self.frontend_origins.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    """Return cached application settings instance."""
    return Settings()
