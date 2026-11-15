import pytest
import base64

from fastapi.testclient import TestClient
from unittest.mock import patch

from main import app


# --------------------------------------------------
# TEST CLIENT
# --------------------------------------------------

client = TestClient(app)


# --------------------------------------------------
# SAMPLE REQUEST DATA
# Must match backend/services/tryon.service.js
# --------------------------------------------------

VALID_PAYLOAD = {
    "session_id": "test-session-123",
    "person_image_url": "https://example.com/person.jpg",
    "garment_image_url": "https://example.com/shirt.jpg",
    "category": "upper_body"
}


# Fake image data for testing
FAKE_IMAGE = base64.b64encode(
    b"fake-image-data"
).decode("utf-8")


# --------------------------------------------------
# 1. SUCCESSFUL TRY-ON
# --------------------------------------------------

def test_successful_tryon():

    with patch(
        "api.routes.run_tryon"
    ) as mock_inference:

        mock_inference.return_value = {
            "result_image_base64": FAKE_IMAGE,
            "format": "jpg"
        }

        response = client.post(
            "/api/tryon",
            json=VALID_PAYLOAD
        )

        assert response.status_code == 200

        data = response.json()

        assert data["success"] is True

        assert data["result_image_base64"] == FAKE_IMAGE

        assert data["format"] == "jpg"

        mock_inference.assert_called_once()


# --------------------------------------------------
# 2. MISSING SESSION ID
# --------------------------------------------------

def test_missing_session_id():

    payload = VALID_PAYLOAD.copy()

    del payload["session_id"]

    response = client.post(
        "/api/tryon",
        json=payload
    )

    assert response.status_code == 422


# --------------------------------------------------
# 3. MISSING PERSON IMAGE
# --------------------------------------------------

def test_missing_person_image():

    payload = VALID_PAYLOAD.copy()

    del payload["person_image_url"]

    response = client.post(
        "/api/tryon",
        json=payload
    )

    assert response.status_code == 422


# --------------------------------------------------
# 4. MISSING GARMENT IMAGE
# --------------------------------------------------

def test_missing_garment_image():

    payload = VALID_PAYLOAD.copy()

    del payload["garment_image_url"]

    response = client.post(
        "/api/tryon",
        json=payload
    )

    assert response.status_code == 422


# --------------------------------------------------
# 5. MISSING CATEGORY
# --------------------------------------------------

def test_missing_category():

    payload = VALID_PAYLOAD.copy()

    del payload["category"]

    response = client.post(
        "/api/tryon",
        json=payload
    )

    assert response.status_code == 422


# --------------------------------------------------
# 6. INVALID CATEGORY
# --------------------------------------------------

@pytest.mark.parametrize(
    "category",
    [
        "invalid",
        "shoes",
        "accessories",
        "unknown"
    ]
)
def test_invalid_category(category):

    payload = VALID_PAYLOAD.copy()

    payload["category"] = category

    response = client.post(
        "/api/tryon",
        json=payload
    )

    assert response.status_code == 422


# --------------------------------------------------
# 7. EMPTY REQUEST BODY
# --------------------------------------------------

def test_empty_request():

    response = client.post(
        "/api/tryon",
        json={}
    )

    assert response.status_code == 422


# --------------------------------------------------
# 8. INVALID PERSON IMAGE URL
# --------------------------------------------------

@pytest.mark.parametrize(
    "image_url",
    [
        "invalid-url",
        "ftp://example.com/person.jpg",
        "http://localhost/person.jpg"
    ]
)
def test_invalid_person_image_url(image_url):

    payload = VALID_PAYLOAD.copy()

    payload["person_image_url"] = image_url

    response = client.post(
        "/api/tryon",
        json=payload
    )

    assert response.status_code >= 400


# --------------------------------------------------
# 9. INVALID GARMENT IMAGE URL
# --------------------------------------------------

def test_invalid_garment_image_url():

    payload = VALID_PAYLOAD.copy()

    payload["garment_image_url"] = "invalid-url"

    response = client.post(
        "/api/tryon",
        json=payload
    )

    assert response.status_code >= 400


# --------------------------------------------------
# 10. MODEL INFERENCE FAILURE
# --------------------------------------------------

def test_inference_failure():

    with patch(
        "api.routes.run_tryon"
    ) as mock_inference:

        mock_inference.side_effect = RuntimeError(
            "Model inference failed"
        )

        response = client.post(
            "/api/tryon",
            json=VALID_PAYLOAD
        )

        assert response.status_code >= 500


# --------------------------------------------------
# 11. UNSUPPORTED HTTP METHOD
# --------------------------------------------------

def test_unsupported_http_method():

    response = client.get("/api/tryon")

    assert response.status_code == 405


# --------------------------------------------------
# 12. WRONG CONTENT TYPE
# --------------------------------------------------

def test_wrong_content_type():

    response = client.post(
        "/api/tryon",
        data="invalid request"
    )

    assert response.status_code >= 400