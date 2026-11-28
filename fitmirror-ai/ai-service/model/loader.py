import logging
import os
import threading
from pathlib import Path
from typing import Optional

import torch
from fashn_vton import TryOnPipeline


logger = logging.getLogger(__name__)


# --------------------------------------------------
# Configuration
# --------------------------------------------------

BASE_DIR = Path(__file__).resolve().parents[1]

DEFAULT_WEIGHTS_DIR = BASE_DIR / "weights"

WEIGHTS_DIR = Path(
    os.getenv(
        "VTON_WEIGHTS_DIR",
        str(DEFAULT_WEIGHTS_DIR)
    )
).expanduser().resolve()

DEVICE_CONFIG = os.getenv(
    "VTON_DEVICE",
    "auto"
).strip().lower()


# --------------------------------------------------
# Shared pipeline state
# --------------------------------------------------

_pipeline: Optional[TryOnPipeline] = None

_pipeline_lock = threading.Lock()


# --------------------------------------------------
# Device detection
# --------------------------------------------------

def get_device() -> str:
    """
    Detect the device used for inference.

    VTON_DEVICE values:
        auto
        cuda
        cpu

    Auto selects CUDA when available.
    """

    if DEVICE_CONFIG == "cpu":
        logger.info("Using CPU for inference.")
        return "cpu"

    if DEVICE_CONFIG == "cuda":
        if not torch.cuda.is_available():
            raise RuntimeError(
                "VTON_DEVICE is set to cuda, "
                "but CUDA is not available."
            )

        logger.info("Using CUDA for inference.")
        return "cuda"

    if DEVICE_CONFIG != "auto":
        raise ValueError(
            "Invalid VTON_DEVICE value. "
            "Use auto, cuda, or cpu."
        )

    if torch.cuda.is_available():
        logger.info(
            "CUDA detected: %s",
            torch.cuda.get_device_name(0)
        )

        return "cuda"

    logger.warning(
        "CUDA is unavailable. Using CPU. "
        "Inference may be very slow."
    )

    return "cpu"


# --------------------------------------------------
# CUDA optimization
# --------------------------------------------------

def configure_device(device: str) -> None:
    """
    Configure optional CUDA performance settings.
    """

    if device != "cuda":
        return

    try:
        properties = torch.cuda.get_device_properties(0)

        # Enable TF32 on Ampere and newer GPUs.
        if properties.major >= 8:
            torch.backends.cuda.matmul.allow_tf32 = True
            torch.backends.cudnn.allow_tf32 = True

            logger.info(
                "TF32 enabled for GPU acceleration."
            )

    except Exception:
        logger.warning(
            "Could not configure CUDA optimizations.",
            exc_info=True
        )


# --------------------------------------------------
# Weight validation
# --------------------------------------------------

def validate_weights_directory() -> None:
    """
    Check that the configured model weights directory exists.

    The official pipeline performs detailed validation
    of the required model and DWPose files.
    """

    if not WEIGHTS_DIR.exists():
        raise FileNotFoundError(
            f"Model weights directory not found: {WEIGHTS_DIR}\n"
            "Download the FASHN VTON v1.5 weights "
            "before starting inference."
        )

    if not WEIGHTS_DIR.is_dir():
        raise NotADirectoryError(
            f"Model weights path is not a directory: "
            f"{WEIGHTS_DIR}"
        )


# --------------------------------------------------
# Pipeline loading
# --------------------------------------------------

def load_pipeline() -> TryOnPipeline:
    """
    Load the FASHN VTON pipeline.

    This function should only be called once during
    normal application startup.
    """

    logger.info(
        "Loading FASHN VTON pipeline from: %s",
        WEIGHTS_DIR
    )

    validate_weights_directory()

    device = get_device()

    configure_device(device)

    try:
        pipeline = TryOnPipeline(
            weights_dir=str(WEIGHTS_DIR),
            device=device
        )

        logger.info(
            "FASHN VTON pipeline loaded successfully "
            "on %s.",
            device
        )

        return pipeline

    except Exception as error:
        logger.exception(
            "Failed to load FASHN VTON pipeline."
        )

        raise RuntimeError(
            "Unable to initialize the FASHN VTON model. "
            "Check the model weights, dependencies, "
            "and available memory."
        ) from error


# --------------------------------------------------
# Get shared pipeline
# --------------------------------------------------

def get_pipeline() -> TryOnPipeline:
    """
    Return the shared model pipeline.

    Loads the model on the first call.
    Reuses the same instance for later requests.
    """

    global _pipeline

    if _pipeline is not None:
        return _pipeline

    with _pipeline_lock:

        # Check again after acquiring the lock.
        if _pipeline is not None:
            return _pipeline

        _pipeline = load_pipeline()

        return _pipeline


# --------------------------------------------------
# Model readiness
# --------------------------------------------------

def is_model_loaded() -> bool:
    """
    Return True if the model pipeline is loaded.
    """

    return _pipeline is not None


def get_model_status() -> dict:
    """
    Return model loading and device information.
    """

    return {
        "model_name": "FASHN VTON v1.5",
        "loaded": is_model_loaded(),
        "device": (
            str(_pipeline.device)
            if _pipeline is not None
            else DEVICE_CONFIG
        ),
        "weights_dir": str(WEIGHTS_DIR)
    }


# --------------------------------------------------
# Cleanup
# --------------------------------------------------

def unload_pipeline() -> None:
    """
    Release the shared model from memory.

    Intended for controlled shutdown or testing.
    Do not call this after every request.
    """

    global _pipeline

    with _pipeline_lock:

        if _pipeline is None:
            return

        logger.info(
            "Unloading FASHN VTON pipeline."
        )

        _pipeline = None

        if torch.cuda.is_available():
            torch.cuda.empty_cache()

        logger.info(
            "FASHN VTON pipeline unloaded."
        )