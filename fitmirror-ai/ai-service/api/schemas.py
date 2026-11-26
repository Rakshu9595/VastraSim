from typing import Literal

from pydantic import BaseModel, Field, HttpUrl, ConfigDict


# --------------------------------------------------
# Clothing categories
# --------------------------------------------------

ClothingCategory = Literal[
    "upper_body",
    "lower_body",
    "dress",
    "outerwear",
    "one_piece",
    "tops",
    "bottoms",
    "one-pieces"
]


# --------------------------------------------------
# Virtual Try-On Request
# --------------------------------------------------

class TryOnRequest(BaseModel):
    """
    Request sent from the Node.js backend
    to the Python AI service.
    """

    model_config = ConfigDict(
        str_strip_whitespace=True,
        extra="forbid"
    )

    session_id: str = Field(
        ...,
        min_length=1,
        max_length=128,
        description="Unique try-on session ID"
    )

    person_image_url: HttpUrl = Field(
        ...,
        description="Secure URL of the user's person image"
    )

    garment_image_url: HttpUrl = Field(
        ...,
        description="Secure URL of the clothing image"
    )

    category: ClothingCategory = Field(
        ...,
        description="Clothing category for virtual try-on"
    )


# --------------------------------------------------
# Virtual Try-On Response
# --------------------------------------------------

class TryOnResponse(BaseModel):
    """
    Response returned after successful inference.
    """

    success: bool = Field(
        ...,
        description="Whether try-on generation succeeded"
    )

    session_id: str = Field(
        ...,
        min_length=1,
        max_length=128
    )

    result_image_base64: str = Field(
        ...,
        min_length=1,
        description="Generated try-on image encoded as Base64"
    )

    format: Literal["jpg"] = Field(
        default="jpg",
        description="Generated image format"
    )


# --------------------------------------------------
# Health Check Response
# --------------------------------------------------

class HealthResponse(BaseModel):
    """
    Basic AI service health response.
    """

    success: bool

    service: str = "FitMirror AI"

    status: Literal[
        "running",
        "ready",
        "unavailable"
    ]


# --------------------------------------------------
# Error Response
# --------------------------------------------------

class ErrorResponse(BaseModel):
    """
    Standard API error response.
    """

    success: bool = False

    detail: str = Field(
        ...,
        min_length=1,
        max_length=500
    )


# --------------------------------------------------
# Model Readiness Response
# --------------------------------------------------

class ModelStatusResponse(BaseModel):
    """
    Model loading and readiness status.
    """

    success: bool

    model_name: str = "FASHN VTON v1.5"

    loaded: bool

    device: str = Field(
        default="unknown",
        description="Inference device: cpu, cuda, or other"
    )

    message: str = Field(
        default="",
        max_length=300
    )
