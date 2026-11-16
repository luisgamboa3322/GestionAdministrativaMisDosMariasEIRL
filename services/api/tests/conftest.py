from collections.abc import Generator
from pathlib import Path

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from app.api.deps import get_storage
from app.core.config import Settings, get_settings
from app.core.database import Base, get_db
from app.core.storage import LocalStorageClient
from app.main import app
from app.services.seed import ensure_initial_manager

TEST_MANAGER_EMAIL = "gerencia.test@example.com"
TEST_MANAGER_PASSWORD = "TestManager!2026"


@pytest.fixture()
def test_settings() -> Settings:
    """Return isolated test settings."""
    return Settings(
        app_env="test",
        database_url="sqlite:///./test_suite.db",
        session_secret_key="test-secret-key-for-unit-tests-only-64-chars-minimum-value",
        session_cookie_secure=False,
        frontend_origins="http://localhost:8443",
    )


@pytest.fixture()
def db_session(tmp_path: Path) -> Generator[Session, None, None]:
    """Create a fresh SQLite database schema for each test."""
    db_file = tmp_path / "test.db"
    engine = create_engine(
        f"sqlite:///{db_file}",
        connect_args={"check_same_thread": False},
    )
    TestingSessionLocal = sessionmaker(
        bind=engine, autoflush=False, autocommit=False, expire_on_commit=False
    )
    Base.metadata.create_all(bind=engine)
    session = TestingSessionLocal()
    try:
        ensure_initial_manager(
            session,
            org_name="MIS DOS MARÍAS E.I.R.L. TEST",
            full_name="Gerente Prueba",
            email=TEST_MANAGER_EMAIL,
            plain_password=TEST_MANAGER_PASSWORD,
        )
        yield session
    finally:
        session.close()
        engine.dispose()


@pytest.fixture()
def client(
    db_session: Session, test_settings: Settings, tmp_path: Path
) -> Generator[TestClient, None, None]:
    """Provide a FastAPI TestClient wired to the isolated test DB, settings, and storage."""
    storage = LocalStorageClient(tmp_path / "private_storage")

    def override_get_db() -> Generator[Session, None, None]:
        yield db_session

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_settings] = lambda: test_settings
    app.dependency_overrides[get_storage] = lambda: storage

    with TestClient(app) as test_client:
        yield test_client

    app.dependency_overrides.clear()
