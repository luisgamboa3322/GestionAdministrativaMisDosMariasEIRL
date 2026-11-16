from datetime import timedelta

from fastapi.testclient import TestClient

from app.api.v1.routes.expirations import lima_today
from app.core.rate_limit import login_rate_limiter
from tests.conftest import TEST_MANAGER_EMAIL, TEST_MANAGER_PASSWORD


def _login(client: TestClient) -> None:
    login_rate_limiter.reset()
    resp = client.post(
        "/api/v1/auth/login",
        json={"email": TEST_MANAGER_EMAIL, "password": TEST_MANAGER_PASSWORD},
    )
    assert resp.status_code == 200


def test_settings_categories_and_templates_persistence(client: TestClient) -> None:
    _login(client)

    cat_resp = client.post(
        "/api/v1/settings/categories",
        json={
            "name": "Autorización MTC",
            "type": "Vehicular",
            "requires_expiration": True,
            "description": "Permiso regional vigente",
            "color": "emerald",
        },
    )
    assert cat_resp.status_code == 201
    created_cat = cat_resp.json()
    assert created_cat["location"] == "Expediente de unidad"

    cats = client.get("/api/v1/settings/categories").json()
    assert any(c["id"] == created_cat["id"] for c in cats)

    tpl_resp = client.post(
        "/api/v1/settings/templates",
        json={
            "name": "Bus Interprovincial",
            "kind": "Unidad",
            "items": ["SOAT", "STR", "Autorización MTC"],
        },
    )
    assert tpl_resp.status_code == 201
    tpl = tpl_resp.json()
    assert tpl["active"] is True

    toggled = client.patch(f"/api/v1/settings/templates/{tpl['id']}/toggle")
    assert toggled.status_code == 200
    assert toggled.json()["active"] is False

    del_resp = client.delete(f"/api/v1/settings/categories/{created_cat['id']}")
    assert del_resp.status_code == 200


def test_idempotent_expiration_notifications_and_read(client: TestClient) -> None:
    _login(client)
    today = lima_today()

    pdf = b"%PDF-1.4\n%notif\n%%EOF"
    client.post(
        "/api/v1/documents/upload",
        files={"file": ("soat-alerta.pdf", pdf, "application/pdf")},
        data={
            "name": "SOAT Próximo",
            "category": "SOAT",
            "expires_at": (today + timedelta(days=5)).isoformat(),
        },
    )

    first_check = client.post("/api/v1/notifications/check")
    assert first_check.status_code == 200
    assert first_check.json()["created_count"] == 1

    # Second run must be idempotent (0 duplicates)
    second_check = client.post("/api/v1/notifications/check")
    assert second_check.status_code == 200
    assert second_check.json()["created_count"] == 0

    items = client.get("/api/v1/notifications").json()
    assert len(items) == 1
    assert items[0]["delivered_at"] is None

    read_resp = client.patch(f"/api/v1/notifications/{items[0]['id']}/read")
    assert read_resp.status_code == 200
    assert read_resp.json()["delivered_at"] is not None


def test_login_rate_limiter_blocks_excess_attempts(client: TestClient) -> None:
    login_rate_limiter.reset()
    for _ in range(10):
        resp = client.post(
            "/api/v1/auth/login",
            json={"email": TEST_MANAGER_EMAIL, "password": "WrongPassword!"},
        )
        assert resp.status_code == 401

    blocked = client.post(
        "/api/v1/auth/login",
        json={"email": TEST_MANAGER_EMAIL, "password": TEST_MANAGER_PASSWORD},
    )
    assert blocked.status_code == 429
    login_rate_limiter.reset()
