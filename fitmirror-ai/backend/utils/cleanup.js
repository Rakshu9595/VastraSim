import {
  deleteImage,
  deleteMultipleImages
} from "../services/storage.service.js";

/**
 * Clean up a single Cloudinary image.
 *
 * @param {string} imageRef - Cloudinary public ID
 * @returns {Promise<boolean>}
 */
export const cleanupImage = async (imageRef) => {
  if (!imageRef || typeof imageRef !== "string") {
    return false;
  }

  try {
    await deleteImage(imageRef);

    console.log(`[Cleanup] Image deleted: ${imageRef}`);

    return true;
  } catch (error) {
    console.error(
      `[Cleanup] Failed to delete image: ${imageRef}`,
      error.message
    );

    return false;
  }
};


/**
 * Clean up multiple Cloudinary images.
 *
 * @param {string[]} imageRefs - Array of Cloudinary public IDs
 * @returns {Promise<object>}
 */
export const cleanupImages = async (imageRefs = []) => {
  if (!Array.isArray(imageRefs) || imageRefs.length === 0) {
    return {
      success: true,
      deleted: 0,
      failed: 0
    };
  }

  // Remove empty values and duplicate references.
  const validRefs = [
    ...new Set(
      imageRefs.filter(
        (ref) => typeof ref === "string" && ref.trim() !== ""
      )
    )
  ];

  if (validRefs.length === 0) {
    return {
      success: true,
      deleted: 0,
      failed: 0
    };
  }

  try {
    await deleteMultipleImages(validRefs);

    console.log(
      `[Cleanup] Successfully processed ${validRefs.length} images.`
    );

    return {
      success: true,
      deleted: validRefs.length,
      failed: 0
    };
  } catch (error) {
    console.error(
      "[Cleanup] Multiple image deletion failed:",
      error.message
    );

    return {
      success: false,
      deleted: 0,
      failed: validRefs.length,
      error: error.message
    };
  }
};


/**
 * Clean up images after a failed operation.
 *
 * This function intentionally does not throw an error,
 * so the original operation error is preserved.
 *
 * @param {string[]} imageRefs
 */
export const cleanupAfterFailure = async (imageRefs = []) => {
  console.warn("[Cleanup] Cleaning up images after operation failure.");

  return await cleanupImages(imageRefs);
};


/**
 * Clean up a temporary image reference.
 *
 * @param {string} imageRef
 */
export const cleanupTemporaryImage = async (imageRef) => {
  return await cleanupImage(imageRef);
};


export default {
  cleanupImage,
  cleanupImages,
  cleanupAfterFailure,
  cleanupTemporaryImage
};