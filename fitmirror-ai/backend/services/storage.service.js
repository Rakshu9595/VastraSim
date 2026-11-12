import cloudinary from "cloudinary";
import { randomUUID } from "node:crypto";
import { Readable } from "node:stream";

import "../config/storage.js";

const cloudinaryV2 = cloudinary.v2;

// Storage folders
const STORAGE_FOLDERS = {
  PERSON: "fitmirror-ai/persons",
  GARMENT: "fitmirror-ai/garments",
  RESULT: "fitmirror-ai/results",
};

// Allowed image formats
const ALLOWED_FORMATS = ["jpg", "jpeg", "png", "webp"];

// Maximum image size: 10 MB
const MAX_FILE_SIZE = 10 * 1024 * 1024;

// Validate image buffer
const validateImage = (buffer, format) => {
  if (!Buffer.isBuffer(buffer) || buffer.length === 0) {
    throw new Error("Valid image buffer is required");
  }

  if (buffer.length > MAX_FILE_SIZE) {
    throw new Error("Image size exceeds the 10 MB limit");
  }

  if (!ALLOWED_FORMATS.includes(format?.toLowerCase())) {
    throw new Error("Unsupported image format");
  }
};

// Upload image buffer to Cloudinary
const uploadBuffer = (buffer, folder, format) => {
  return new Promise((resolve, reject) => {
    const publicId = randomUUID();

    const uploadStream = cloudinaryV2.uploader.upload_stream(
      {
        folder,
        public_id: publicId,
        resource_type: "image",
        type: "authenticated",
        format: format === "jpeg" ? "jpg" : format,
        overwrite: false,
        unique_filename: false,
        use_filename: false,
      },
      (error, result) => {
        if (error) {
          return reject(error);
        }

        if (!result) {
          return reject(
            new Error("Cloudinary did not return an upload result")
          );
        }

        resolve({
          publicId: result.public_id,
          imageRef: result.public_id,
          format: result.format,
          width: result.width,
          height: result.height,
          bytes: result.bytes,
          resourceType: result.resource_type,
          deliveryType: result.type,
        });
      }
    );

    Readable.from(buffer)
      .pipe(uploadStream)
      .on("error", reject);
  });
};

// Upload person's photograph
export const uploadPersonImage = async (buffer, format) => {
  validateImage(buffer, format);

  return uploadBuffer(
    buffer,
    STORAGE_FOLDERS.PERSON,
    format.toLowerCase()
  );
};

// Upload manually selected garment image
export const uploadGarmentImage = async (buffer, format) => {
  validateImage(buffer, format);

  return uploadBuffer(
    buffer,
    STORAGE_FOLDERS.GARMENT,
    format.toLowerCase()
  );
};

// Upload generated try-on result
export const uploadTryOnResult = async (buffer, format = "jpg") => {
  validateImage(buffer, format);

  return uploadBuffer(
    buffer,
    STORAGE_FOLDERS.RESULT,
    format.toLowerCase()
  );
};

// Generate a temporary authenticated image URL
export const generateSecureImageUrl = (
  imageRef,
  expiresInSeconds = 300
) => {
  if (!imageRef || typeof imageRef !== "string") {
    throw new Error("Valid image reference is required");
  }

  if (
    !Number.isInteger(expiresInSeconds) ||
    expiresInSeconds < 1 ||
    expiresInSeconds > 3600
  ) {
    throw new Error("Invalid image URL expiration time");
  }

  const expiresAt = Math.floor(Date.now() / 1000) + expiresInSeconds;

  return cloudinaryV2.utils.private_download_url(
    imageRef,
    "jpg",
    {
      resource_type: "image",
      type: "authenticated",
      expires_at: expiresAt,
      attachment: false,
    }
  );
};

// Delete an image from Cloudinary
export const deleteImage = async (imageRef) => {
  if (!imageRef || typeof imageRef !== "string") {
    throw new Error("Valid image reference is required");
  }

  const result = await cloudinaryV2.uploader.destroy(imageRef, {
    resource_type: "image",
    type: "authenticated",
    invalidate: true,
  });

  if (result.result !== "ok" && result.result !== "not found") {
    throw new Error("Failed to delete image from Cloudinary");
  }

  return {
    success: true,
    imageRef,
    result: result.result,
  };
};

// Delete multiple images
export const deleteMultipleImages = async (imageRefs = []) => {
  if (!Array.isArray(imageRefs)) {
    throw new Error("Image references must be an array");
  }

  const results = await Promise.allSettled(
    imageRefs
      .filter((ref) => typeof ref === "string" && ref.trim())
      .map((ref) => deleteImage(ref))
  );

  return results.map((result) => {
    if (result.status === "fulfilled") {
      return result.value;
    }

    return {
      success: false,
      error: result.reason?.message || "Image deletion failed",
    };
  });
};

// Check whether an image exists in Cloudinary
export const getImageDetails = async (imageRef) => {
  if (!imageRef || typeof imageRef !== "string") {
    throw new Error("Valid image reference is required");
  }

  const result = await cloudinaryV2.api.resource(imageRef, {
    resource_type: "image",
    type: "authenticated",
  });

  return {
    publicId: result.public_id,
    format: result.format,
    width: result.width,
    height: result.height,
    bytes: result.bytes,
    createdAt: result.created_at,
    resourceType: result.resource_type,
    deliveryType: result.type,
  };
};

export default {
  uploadPersonImage,
  uploadGarmentImage,
  uploadTryOnResult,
  generateSecureImageUrl,
  deleteImage,
  deleteMultipleImages,
  getImageDetails,
};