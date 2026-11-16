from fastapi.testclient import TestClient

from tests.conftest import TEST_MANAGER_EMAIL, TEST_MANAGER_PASSWORD


def _login(client: TestClient) -> None:
    resp = client.post(
        "/api/v1/auth/login",
        json={"email": TEST_MANAGER_EMAIL, "password": TEST_MANAGER_PASSWORD},
    )
    assert resp.status_code == 200


def test_workers_companies_manifests_and_invoices_lifecycle(client: TestClient) -> None:
    _login(client)

    worker_resp = client.post(
        "/api/v1/workers",
        json={
            "code": "tr-001",
            "name": "Carlos Ramos",
            "role": "Conductor",
            "status": "Activo",
            "phone": "999888777",
            "template_categories": ["Licencias", "Certificados"],
        },
    )
    assert worker_resp.status_code == 201
    worker = worker_resp.json()
    assert worker["code"] == "TR-001"
    assert worker["initials"] == "CR"
    assert worker["folder_id"] is not None

    company_resp = client.post(
        "/api/v1/companies",
        json={
            "mode": "company",
            "name": "Minera Norte",
            "legal_name": "Minera Norte S.A.C.",
            "kind": "Minería",
            "contact": "Lucía Torres",
        },
    )
    assert company_resp.status_code == 201
    assert company_resp.json()["mode"] == "company"

    supplier_resp = client.post(
        "/api/v1/companies",
        json={
            "mode": "supplier",
            "name": "Taller Trujillo",
            "legal_name": "Taller Trujillo E.I.R.L.",
            "kind": "Mantenimiento",
        },
    )
    assert supplier_resp.status_code == 201
    assert len(client.get("/api/v1/companies?mode=supplier").json()) == 1
    assert len(client.get("/api/v1/companies?mode=company").json()) == 1

    manifest_resp = client.post(
        "/api/v1/manifests",
        json={
            "number": "man-2026-01",
            "service_date": "2026-11-16",
            "company_name": "Minera Norte",
            "service": "Traslado de personal",
            "period": "Noviembre 2026",
        },
    )
    assert manifest_resp.status_code == 201
    assert manifest_resp.json()["number"] == "MAN-2026-01"

    invoice_resp = client.post(
        "/api/v1/invoices",
        json={
            "number": "f001-00912",
            "company_name": "Minera Norte S.A.C.",
            "issued_date": "2026-11-16",
            "amount": "4500.50",
            "currency": "PEN",
            "status": "Pendiente",
        },
    )
    assert invoice_resp.status_code == 201
    assert invoice_resp.json()["amount"] == 4500.5
