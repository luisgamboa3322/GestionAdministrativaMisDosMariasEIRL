from fastapi.testclient import TestClient

from tests.conftest import TEST_MANAGER_EMAIL, TEST_MANAGER_PASSWORD


def _login(client: TestClient) -> None:
    resp = client.post(
        "/api/v1/auth/login",
        json={"email": TEST_MANAGER_EMAIL, "password": TEST_MANAGER_PASSWORD},
    )
    assert resp.status_code == 200


def test_create_vehicle_generates_dossier_and_prevents_duplicate_plate(client: TestClient) -> None:
    _login(client)

    create_resp = client.post(
        "/api/v1/vehicles",
        json={
            "plate": "t3x-456",
            "internal_code": "un-001",
            "brand": "Mercedes-Benz",
            "model": "Sprinter",
            "year": 2024,
            "capacity": 19,
            "template_categories": ["SOAT", "STR", "GPS"],
        },
    )
    assert create_resp.status_code == 201
    vehicle = create_resp.json()
    assert vehicle["plate"] == "T3X-456"
    assert vehicle["folder_id"] is not None

    # Verify dossier folders created: Unidades -> T3X-456 -> SOAT, STR, GPS
    folders = client.get("/api/v1/folders").json()
    names = {f["name"] for f in folders}
    assert {"Unidades", "T3X-456", "SOAT", "STR", "GPS"}.issubset(names)

    # Reject duplicate plate
    dup_resp = client.post(
        "/api/v1/vehicles",
        json={
            "plate": "T3X-456",
            "internal_code": "UN-002",
            "brand": "Hyundai",
            "model": "County",
            "year": 2023,
            "capacity": 28,
        },
    )
    assert dup_resp.status_code == 409


def test_vehicle_photos_cover_rotation_and_plate_rename(client: TestClient) -> None:
    _login(client)

    vehicle = client.post(
        "/api/v1/vehicles",
        json={
            "plate": "A1B-234",
            "internal_code": "UN-010",
            "brand": "Volvo",
            "model": "B270F",
            "year": 2023,
            "capacity": 42,
            "template_categories": ["SOAT"],
        },
    ).json()
    vid = vehicle["id"]

    # Reject non-image uploads (e.g. PDF)
    bad_photo = client.post(
        f"/api/v1/vehicles/{vid}/photos",
        files={"file": ("doc.pdf", b"%PDF-1.4\n%%EOF", "application/pdf")},
    )
    assert bad_photo.status_code == 400

    png_bytes = b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR"
    p1 = client.post(
        f"/api/v1/vehicles/{vid}/photos",
        files={"file": ("exterior.png", png_bytes, "image/png")},
    )
    assert p1.status_code == 201
    photo1 = p1.json()
    assert photo1["is_cover"] is True

    jpg_bytes = b"\xff\xd8\xff\xe0\x00\x10JFIF"
    p2 = client.post(
        f"/api/v1/vehicles/{vid}/photos",
        files={"file": ("interior.jpg", jpg_bytes, "image/jpeg")},
    )
    assert p2.status_code == 201
    photo2 = p2.json()
    assert photo2["is_cover"] is False

    # Serve authenticated image bytes
    img_resp = client.get(photo1["url"])
    assert img_resp.status_code == 200
    assert img_resp.content == png_bytes
    assert img_resp.headers.get("x-content-type-options") == "nosniff"

    # Switch cover to photo2, then delete photo2 -> promotes photo1 back
    switch_resp = client.patch(f"/api/v1/vehicles/{vid}/photos/{photo2['id']}/cover")
    assert switch_resp.status_code == 200
    assert any(p["id"] == photo2["id"] and p["is_cover"] for p in switch_resp.json()["photos"])

    del_resp = client.delete(f"/api/v1/vehicles/{vid}/photos/{photo2['id']}")
    assert del_resp.status_code == 200
    remaining = del_resp.json()["photos"]
    assert len(remaining) == 1
    assert remaining[0]["id"] == photo1["id"]
    assert remaining[0]["is_cover"] is True

    # Rename plate syncs dossier folder name
    patch_resp = client.patch(f"/api/v1/vehicles/{vid}", json={"plate": "A1B-999"})
    assert patch_resp.status_code == 200
    assert patch_resp.json()["plate"] == "A1B-999"
    folders = client.get("/api/v1/folders").json()
    dossier = next(f for f in folders if f["id"] == vehicle["folder_id"])
    assert dossier["name"] == "A1B-999"
