from pathlib import Path

from alembic import command
from alembic.config import Config
from fastapi.testclient import TestClient

from app.core.storage import sanitize_filename
from tests.conftest import TEST_MANAGER_EMAIL, TEST_MANAGER_PASSWORD


def test_health_endpoint(client: TestClient) -> None:
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok", "database": "connected"}


def test_me_requires_authentication(client: TestClient) -> None:
    response = client.get("/api/v1/auth/me")
    assert response.status_code == 401


def test_login_rejects_invalid_credentials(client: TestClient) -> None:
    response = client.post(
        "/api/v1/auth/login",
        json={"email": TEST_MANAGER_EMAIL, "password": "WrongPassword123"},
    )
    assert response.status_code == 401


def test_login_me_and_logout_lifecycle(client: TestClient) -> None:
    login_resp = client.post(
        "/api/v1/auth/login",
        json={"email": TEST_MANAGER_EMAIL, "password": TEST_MANAGER_PASSWORD},
    )
    assert login_resp.status_code == 200
    body = login_resp.json()
    assert body["user"]["email"] == TEST_MANAGER_EMAIL
    assert body["user"]["role"] == "general_manager"
    assert body["organization"]["legal_name"] == "MIS DOS MARÍAS E.I.R.L. TEST"

    set_cookie_header = login_resp.headers.get("set-cookie", "")
    assert "mdm_session=" in set_cookie_header
    assert "HttpOnly" in set_cookie_header

    me_resp = client.get("/api/v1/auth/me")
    assert me_resp.status_code == 200
    assert me_resp.json()["user"]["email"] == TEST_MANAGER_EMAIL

    logout_resp = client.post("/api/v1/auth/logout")
    assert logout_resp.status_code == 200

    after_logout = client.get("/api/v1/auth/me")
    assert after_logout.status_code == 401


def test_csrf_rejects_untrusted_origin(client: TestClient) -> None:
    response = client.post(
        "/api/v1/auth/login",
        headers={"Origin": "https://evil.example.net"},
        json={"email": TEST_MANAGER_EMAIL, "password": TEST_MANAGER_PASSWORD},
    )
    assert response.status_code == 403


def test_sanitize_filename_prevents_path_traversal() -> None:
    assert sanitize_filename("../../etc/passwd") == "passwd"
    assert sanitize_filename("..\\..\\secret\\soat 2026.pdf") == "soat_2026.pdf"


def test_alembic_upgrade_head(tmp_path: Path) -> None:
    api_root = Path(__file__).resolve().parents[1]
    alembic_cfg = Config(str(api_root / "alembic.ini"))
    alembic_cfg.set_main_option("script_location", str(api_root / "alembic"))
    alembic_cfg.set_main_option("sqlalchemy.url", f"sqlite:///{tmp_path / 'alembic_check.db'}")
    command.upgrade(alembic_cfg, "head")
