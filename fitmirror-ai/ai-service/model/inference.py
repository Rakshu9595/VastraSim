import logging
import os
from typing import Literal

from PIL import Image

from model.loader import get_pipeline


logger = logging.getLogger(__name__)


# --------------------------------------------------
# Inference configuration
# --------------------------------------------------

NUM_SAMPLES = 1

# 20 = faster, 30 = balanced, 50 = higher quality/slower.
NUM_TIMESTEPS = int(
    os.getenv("VTON_NUM_TIMESTEPS", "30")
)

GUIDANCE_SCALE = float(
    os.getenv("VTON_GUIDANCE_SCALE", "1.5")
)

DEFAULT_SEED = int(
    os.getenv("VTON_SEED", "42")
)

# Product images are commonly flat-lay images.
# Use "model" when the garment image shows a person
# wearing the garment.
GARMENT_PHOTO_TYPE = os.getenv(
    "VTON_GARMENT_PHOTO_TYPE",
    "flat-lay"
)

SEGMENTATION_FREE = True


# --------------------------------------------------
# Supported categories
# --------------------------------------------------

SUPPORTED_CATEGORIES = {
    "tops",
    "bottoms",
    "one-pieces"
}


# --------------------------------------------------
# Image validation
# --------------------------------------------------

def _validate_image(
    image: Image.Image,
    image_name: str
) -> None:
    """
    Validate that the input is a usable PIL image.
    """

    if not isinstance(image, Image.Image):
        raise TypeError(
            f"{image_name} must be a PIL Image."
        )

    if image.width <= 0 or image.height <= 0:
        raise ValueError(
            f"{image_name} has invalid dimensions."
        )

    if image.width < 100 or image.height < 100:
        raise ValueError(
            f"{image_name} is too small for inference."
        )


# --------------------------------------------------
# Main inference function
# --------------------------------------------------

def run_inference(
    person_image: Image.Image,
    garment_image: Image.Image,
    category: Literal[
        "tops",
        "bottoms",
        "one-pieces"
    ],
    seed: int = DEFAULT_SEED
) -> Image.Image:
    """
    Run FASHN VTON v1.5 inference.

    Args:
        person_image:
            RGB image of the person.

        garment_image:
            RGB image of the clothing item.

        category:
            "tops", "bottoms", or "one-pieces".

        seed:
            Random seed for reproducible inference.

    Returns:
        Generated PIL RGB image.

    Raises:
        ValueError:
            If inputs or category are invalid.

        RuntimeError:
            If model inference fails.
    """

    # Validate images.
    _validate_image(
        person_image,
        "Person image"
    )

    _validate_image(
        garment_image,
        "Garment image"
    )

    # Validate category.
    if category not in SUPPORTED_CATEGORIES:
        raise ValueError(
            f"Unsupported category: {category}"
        )

    # Convert images to RGB.
    person_image = person_image.convert("RGB")
    garment_image = garment_image.convert("RGB")

    # Load the shared model pipeline.
    # The loader should initialize the model only once.
    pipeline = get_pipeline()

    logger.info(
        "Starting FASHN inference: category=%s",
        category
    )

    try:
        # Run pretrained FASHN VTON pipeline.
        result = pipeline(
            person_image=person_image,
            garment_image=garment_image,
            category=category,
            garment_photo_type=GARMENT_PHOTO_TYPE,
            num_samples=NUM_SAMPLES,
            num_timesteps=NUM_TIMESTEPS,
            guidance_scale=GUIDANCE_SCALE,
            seed=seed,
            segmentation_free=SEGMENTATION_FREE
        )

        # The pipeline returns a list of generated images.
        if not result or not result.images:
            raise RuntimeError(
                "The model did not return any images."
            )

        generated_image = result.images[0]

        if not isinstance(
            generated_image,
            Image.Image
        ):
            raise RuntimeError(
                "The model returned an invalid image."
            )

        generated_image = generated_image.convert("RGB")

        logger.info(
            "FASHN inference completed successfully."
        )

        return generated_image

    except Exception as error:
        logger.exception(
            "FASHN VTON inference failed."
        )

        raise RuntimeError(
            "Virtual try-on inference failed."
        ) from error