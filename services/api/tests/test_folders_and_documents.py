from fastapi.testclient import TestClient

from tests.conftest import TEST_MANAGER_EMAIL, TEST_MANAGER_PASSWORD


def _login(client: TestClient) -> None:
    resp = client.post(
        "/api/v1/auth/login",
        json={"email": TEST_MANAGER_EMAIL, "password": TEST_MANAGER_PASSWORD},
    )
    assert resp.status_code == 200


def test_folder_hierarchy_cycle_prevention_and_trash(client: TestClient) -> None:
    _login(client)

    parent_resp = client.post(
        "/api/v1/folders",
        json={"name": "Unidades", "color": "emerald"},
    )
    assert parent_resp.status_code == 201
    parent = parent_resp.json()

    child_resp = client.post(
        "/api/v1/folders",
        json={"name": "Bus T3X-456", "parent_id": parent["id"], "color": "teal"},
    )
    assert child_resp.status_code == 201
    child = child_resp.json()

    # Prevent moving parent inside its child (cycle)
    cycle_resp = client.patch(
        f"/api/v1/folders/{parent['id']}",
        json={"parent_id": child["id"]},
    )
    assert cycle_resp.status_code == 400

    # Soft delete parent moves both to trash
    del_resp = client.delete(f"/api/v1/folders/{parent['id']}")
    assert del_resp.status_code == 200
    assert client.get("/api/v1/folders").json() == []

    # Restore brings both back
    restore_resp = client.post(f"/api/v1/folders/{parent['id']}/restore")
    assert restore_resp.status_code == 200
    assert len(client.get("/api/v1/folders").json()) == 2


def test_upload_rejects_executable_and_spoofed_pdf(client: TestClient) -> None:
    _login(client)

    exe_resp = client.post(
        "/api/v1/documents/upload",
        files={"file": ("malware.exe", b"MZ\x90\x00", "application/octet-stream")},
        data={"category": "Otros"},
    )
    assert exe_resp.status_code == 400

    spoof_pdf_resp = client.post(
        "/api/v1/documents/upload",
        files={"file": ("fake.pdf", b"not-actually-a-pdf", "application/pdf")},
        data={"category": "SOAT"},
    )
    assert spoof_pdf_resp.status_code == 400


def test_document_upload_download_inbox_and_versioning(client: TestClient) -> None:
    _login(client)

    folder_id = client.post(
        "/api/v1/folders",
        json={"name": "SOAT Flota", "color": "emerald"},
    ).json()["id"]

    pdf_v1 = b"%PDF-1.4\n1 0 obj\n<<>>\nendobj\ntrailer\n<<>>\n%%EOF"
    upload_resp = client.post(
        "/api/v1/documents/upload",
        files={"file": ("soat-2026.pdf", pdf_v1, "application/pdf")},
        data={
            "name": "SOAT Bus T3X-456",
            "category": "SOAT",
            "is_inbox": "true",
            "inbox_source": "WhatsApp",
            "expires_at": "2026-12-31",
        },
    )
    assert upload_resp.status_code == 201
    doc = upload_resp.json()
    assert doc["is_inbox"] is True
    assert doc["folder_id"] is None
    assert doc["current_version"]["version_number"] == 1

    # Organize from inbox into target folder
    org_resp = client.patch(
        f"/api/v1/documents/{doc['id']}",
        json={"folder_id": folder_id, "is_inbox": False, "is_favorite": True},
    )
    assert org_resp.status_code == 200
    organized = org_resp.json()
    assert organized["is_inbox"] is False
    assert organized["folder_id"] == folder_id
    assert organized["is_favorite"] is True

    # Download v1 inline preview check
    dl_resp = client.get(f"/api/v1/documents/{doc['id']}/download?inline=true")
    assert dl_resp.status_code == 200
    assert dl_resp.content == pdf_v1
    assert dl_resp.headers.get("x-content-type-options") == "nosniff"
    assert "inline;" in dl_resp.headers.get("content-disposition", "")

    # Upload v2 preserves v1
    pdf_v2 = b"%PDF-1.7\n%renovado\n%%EOF"
    v2_resp = client.post(
        f"/api/v1/documents/{doc['id']}/versions",
        files={"file": ("soat-2027.pdf", pdf_v2, "application/pdf")},
        data={"expires_at": "2027-12-31"},
    )
    assert v2_resp.status_code == 201
    v2_doc = v2_resp.json()
    assert v2_doc["current_version"]["version_number"] == 2
    assert len(v2_doc["versions"]) == 2
    assert sum(1 for v in v2_doc["versions"] if v["is_current"]) == 1

    # Soft delete and restore
    assert client.delete(f"/api/v1/documents/{doc['id']}").status_code == 200
    assert client.get("/api/v1/documents").json() == []
    assert client.post(f"/api/v1/documents/{doc['id']}/restore").status_code == 200
    assert len(client.get("/api/v1/documents").json()) == 1
