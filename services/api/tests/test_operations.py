import io
import zipfile
from datetime import timedelta

from fastapi.testclient import TestClient

from app.api.v1.routes.expirations import lima_today
from tests.conftest import TEST_MANAGER_EMAIL, TEST_MANAGER_PASSWORD


def _login(client: TestClient) -> None:
    resp = client.post(
        "/api/v1/auth/login",
        json={"email": TEST_MANAGER_EMAIL, "password": TEST_MANAGER_PASSWORD},
    )
    assert resp.status_code == 200


def test_expirations_and_global_search(client: TestClient) -> None:
    _login(client)
    today = lima_today()

    vehicle = client.post(
        "/api/v1/vehicles",
        json={
            "plate": "B2C-500",
            "internal_code": "UN-005",
            "brand": "Mercedes-Benz",
            "model": "Sprinter",
            "year": 2024,
            "capacity": 19,
            "template_categories": ["SOAT"],
        },
    ).json()

    pdf = b"%PDF-1.4\n%test\n%%EOF"
    client.post(
        "/api/v1/documents/upload",
        files={"file": ("soat-vigente.pdf", pdf, "application/pdf")},
        data={
            "name": "SOAT Vigente B2C-500",
            "category": "SOAT",
            "related_vehicle_id": str(vehicle["id"]),
            "expires_at": (today + timedelta(days=90)).isoformat(),
        },
    )
    client.post(
        "/api/v1/documents/upload",
        files={"file": ("str-por-vencer.pdf", pdf, "application/pdf")},
        data={
            "name": "STR Por Vencer B2C-500",
            "category": "STR",
            "related_vehicle_id": str(vehicle["id"]),
            "expires_at": (today + timedelta(days=10)).isoformat(),
        },
    )
    client.post(
        "/api/v1/documents/upload",
        files={"file": ("gps-vencido.pdf", pdf, "application/pdf")},
        data={
            "name": "Certificado GPS Vencido",
            "category": "GPS",
            "related_vehicle_id": str(vehicle["id"]),
            "expires_at": (today - timedelta(days=5)).isoformat(),
        },
    )

    exp_resp = client.get("/api/v1/expirations?window_days=30")
    assert exp_resp.status_code == 200
    exp_data = exp_resp.json()
    assert exp_data["valid_count"] == 1
    assert exp_data["expiring_soon_count"] == 1
    assert exp_data["expired_count"] == 1

    search_resp = client.get("/api/v1/search?q=B2C-500")
    assert search_resp.status_code == 200
    search_data = search_resp.json()
    assert len(search_data["vehicles"]) == 1
    assert len(search_data["documents"]) >= 2


def test_audit_checklist_and_real_zip_export(client: TestClient) -> None:
    _login(client)
    today = lima_today()

    vehicle = client.post(
        "/api/v1/vehicles",
        json={
            "plate": "T3X-456",
            "internal_code": "UN-001",
            "brand": "Mercedes-Benz",
            "model": "Sprinter",
            "year": 2024,
            "capacity": 19,
            "template_categories": ["SOAT", "STR"],
        },
    ).json()

    soat_bytes = b"%PDF-1.4\n%SOAT-REAL-BYTES\n%%EOF"
    client.post(
        "/api/v1/documents/upload",
        files={"file": ("soat-t3x456.pdf", soat_bytes, "application/pdf")},
        data={
            "name": "SOAT Bus T3X-456",
            "category": "SOAT",
            "related_vehicle_id": str(vehicle["id"]),
            "expires_at": (today + timedelta(days=120)).isoformat(),
        },
    )

    # Create audit requesting SOAT (present) and STR (missing!)
    audit_resp = client.post(
        "/api/v1/audits",
        json={
            "name": "Auditoria Noviembre 2026",
            "request_date": today.isoformat(),
            "deadline": (today + timedelta(days=15)).isoformat(),
            "period": "Noviembre 2026",
            "status": "Activa",
            "vehicle_ids": [vehicle["id"]],
            "worker_ids": [],
            "requirements": [
                {"id": "soat", "label": "SOAT", "scope": "Unidad", "custom": False},
                {"id": "str", "label": "STR", "scope": "Unidad", "custom": False},
            ],
        },
    )
    assert audit_resp.status_code == 201
    audit = audit_resp.json()
    statuses = {ev["requirement"]: ev["status"] for ev in audit["evidence"]}
    assert statuses["SOAT"] == "Disponible"
    assert statuses["STR"] == "Faltante"

    # Generate real ZIP export
    export_resp = client.post(f"/api/v1/audits/{audit['id']}/exports")
    assert export_resp.status_code == 201
    export_data = export_resp.json()
    assert export_data["included_count"] == 1
    assert export_data["missing_count"] == 1

    # Download and inspect real ZIP contents
    zip_resp = client.get(export_data["download_url"])
    assert zip_resp.status_code == 200
    assert zip_resp.headers.get("content-type") == "application/zip"

    with zipfile.ZipFile(io.BytesIO(zip_resp.content), "r") as zf:
        names = zf.namelist()
        csv_name = next(n for n in names if n.endswith("00_INDICE/indice.csv"))
        pdf_name = next(n for n in names if n.endswith("soat-t3x456.pdf"))
        assert "SOAT" in pdf_name
        assert "T3X-456" in pdf_name
        assert zf.read(pdf_name) == soat_bytes
        csv_text = zf.read(csv_name).decode("utf-8-sig")
        assert "soat-t3x456.pdf" in csv_text
        assert "T3X-456" in csv_text
