
"""
FitMirror AI
AI Service API Routes

Endpoints:
    GET  /health
    POST /api/tryon

The Express backend calls the try-on endpoint.
The AI service verifies the shared secret, validates
the request, runs inference, and returns a Base64 image.
"""

import base64
import hmac
import logging
import os
from io import BytesIO
from typing import Literal

from fastapi import APIRouter, Depends, Header, HTTPException, status
from pydantic import BaseModel, Field, HttpUrl

from services.tryon_service import generate_tryon_from_urls


logger = logging.getLogger(__name__)

# Routers
router = APIRouter(
    prefix="/api/tryon",
    tags=["Virtual Try-On"],
)

health_router = APIRouter(
    tags=["Health"],
)

# Limit simultaneous inference requests.
# GPU inference should not run without concurrency control.
MAX_CONCURRENT_INFERENCES = int(
    os.getenv("MAX_CONCURRENT_INFERENCES", "1")
)

# Shared secret used by the Node.js backend.
AI_SERVICE_SECRET = os.getenv("AI_SERVICE_SECRET", "")

# Model categories
MODEL_CATEGORIES = {
    "upper_body": "tops",
    "lower_body": "bottoms",
    "dress": "one-pieces",
    "outerwear": "tops",
    "one_piece": "one-pieces",
    "tops": "tops",
    "bottoms": "bottoms",
    "one-pieces": "one-pieces",
}

# Inference semaphore is initialized at module level.
import asyncio

inference_semaphore = asyncio.Semaphore(
    MAX_CONCURRENT_INFERENCES
)


# --------------------------------------------------
# Request and response schemas
# --------------------------------------------------

class TryOnRequest(BaseModel):
    session_id: str = Field(
        ...,
        min_length=1,
        max_length=128
    )

    person_image_url: HttpUrl

    garment_image_url: HttpUrl

    category: Literal[
        "upper_body",
        "lower_body",
        "dress",
        "outerwear",
        "one_piece",
        "tops",
        "bottoms",
        "one-pieces"
    ]


class TryOnResponse(BaseModel):
    success: bool
    session_id: str
    result_image_base64: str
    format: Literal["jpg"] = "jpg"


class HealthResponse(BaseModel):
    success: bool
    service: str
    status: str


# --------------------------------------------------
# Authentication
# --------------------------------------------------

async def verify_ai_service_secret(
    x_ai_service_secret: str = Header(
        default="",
        alias="x-ai-service-secret"
    )
):
    """
    Verify that the request comes from the trusted backend.

    The secret must be configured in both:
        backend/.env
        ai-service/.env
    """

    if not AI_SERVICE_SECRET:
        logger.error("AI_SERVICE_SECRET is not configured.")

        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="AI service authentication is not configured."
        )

    if not hmac.compare_digest(
        x_ai_service_secret,
        AI_SERVICE_SECRET
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid AI service authentication."
        )


# --------------------------------------------------
# Health endpoint
# --------------------------------------------------

@health_router.get(
    "/health",
    response_model=HealthResponse
)
async def health_check():
    """
    Check whether the AI service API is running.

    This does not guarantee that model weights
    are loaded or GPU inference is ready.
    """

    return HealthResponse(
        success=True,
        service="FitMirror AI",
        status="running"
    )


# --------------------------------------------------
# Virtual try-on endpoint
# --------------------------------------------------

@router.post(
    "",
    response_model=TryOnResponse,
    dependencies=[
        Depends(verify_ai_service_secret)
    ]
)
async def generate_tryon(
    request: TryOnRequest
):
    """
    Generate a virtual try-on image.

    The backend sends:
        session_id
        person_image_url
        garment_image_url
        category

    The AI service returns:
        result_image_base64
        format
    """

    # Convert backend category to model category.
    model_category = MODEL_CATEGORIES.get(
        request.category
    )

    if not model_category:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Unsupported clothing category."
        )

    try:
        # Limit simultaneous GPU inference.
        async with inference_semaphore:

            logger.info(
                "Starting try-on inference for session %s",
                request.session_id
            )

            # This service function will download,
            # preprocess, and run the model.
            result_image = await generate_tryon_from_urls(
                person_image_url=str(
                    request.person_image_url
                ),
                garment_image_url=str(
                    request.garment_image_url
                ),
                category=model_category
            )

            # Convert generated PIL image to JPEG bytes.
            image_buffer = BytesIO()

            result_image.convert("RGB").save(
                image_buffer,
                format="JPEG",
                quality=90,
                optimize=True
            )

            image_bytes = image_buffer.getvalue()

            # Encode image as Base64 for Express backend.
            image_base64 = base64.b64encode(
                image_bytes
            ).decode("utf-8")

            logger.info(
                "Try-on completed for session %s",
                request.session_id
            )

            return TryOnResponse(
                success=True,
                session_id=request.session_id,
                result_image_base64=image_base64,
                format="jpg"
            )

    except HTTPException:
        raise

    except Exception as error:
        logger.exception(
            "Try-on failed for session %s",
            request.session_id
        )

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Virtual try-on generation failed."
        ) from error
