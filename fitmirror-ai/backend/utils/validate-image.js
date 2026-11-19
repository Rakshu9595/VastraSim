/**
 * FitMirror AI
 * Image Validation Utility
 *
 * Responsibilities:
 * 1. Validate image file types.
 * 2. Validate image size.
 * 3. Validate image dimensions.
 * 4. Validate image buffers.
 * 5. Validate image URLs.
 * 6. Validate image formats.
 */

import sharp from "sharp";
import axios from "axios";

const ALLOWED_IMAGE_FORMATS = ["jpeg", "jpg", "png", "webp"];

const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp"
];

const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10 MB

const MAX_IMAGE_WIDTH = 4096;
const MAX_IMAGE_HEIGHT = 4096;

const MIN_IMAGE_WIDTH = 100;
const MIN_IMAGE_HEIGHT = 100;

const IMAGE_TIMEOUT = 10000;

/**
 * Validate image MIME type.
 */
export const validateImageMimeType = (mimeType) => {
  if (!mimeType || typeof mimeType !== "string") {
    return false;
  }

  return ALLOWED_MIME_TYPES.includes(mimeType.toLowerCase());
};

/**
 * Validate image file extension.
 */
export const validateImageExtension = (filename) => {
  if (!filename || typeof filename !== "string") {
    return false;
  }

  const extension = filename
    .split(".")
    .pop()
    .toLowerCase();

  return ALLOWED_IMAGE_FORMATS.includes(extension);
};

/**
 * Validate image file size.
 */
export const validateImageSize = (size) => {
  return (
    Number.isFinite(size) &&
    size > 0 &&
    size <= MAX_IMAGE_SIZE
  );
};

/**
 * Validate image dimensions.
 */
export const validateImageDimensions = (width, height) => {
  return (
    Number.isInteger(width) &&
    Number.isInteger(height) &&
    width >= MIN_IMAGE_WIDTH &&
    height >= MIN_IMAGE_HEIGHT &&
    width <= MAX_IMAGE_WIDTH &&
    height <= MAX_IMAGE_HEIGHT
  );
};

/**
 * Validate image buffer.
 *
 * Uses Sharp to inspect the actual image content.
 * Does not trust only the file extension or MIME type.
 */
export const validateImageBuffer = async (buffer) => {
  if (!Buffer.isBuffer(buffer) || buffer.length === 0) {
    throw new Error("Invalid or empty image buffer.");
  }

  if (!validateImageSize(buffer.length)) {
    throw new Error("Image size must be between 1 byte and 10 MB.");
  }

  let metadata;

  try {
    metadata = await sharp(buffer, {
      limitInputPixels: MAX_IMAGE_WIDTH * MAX_IMAGE_HEIGHT
    }).metadata();
  } catch {
    throw new Error("Invalid or corrupted image file.");
  }

  if (!ALLOWED_IMAGE_FORMATS.includes(metadata.format)) {
    throw new Error("Only JPEG, PNG, and WebP images are supported.");
  }

  if (!validateImageDimensions(metadata.width, metadata.height)) {
    throw new Error(
      `Image dimensions must be between ${MIN_IMAGE_WIDTH}x${MIN_IMAGE_HEIGHT} and ${MAX_IMAGE_WIDTH}x${MAX_IMAGE_HEIGHT}.`
    );
  }

  return {
    valid: true,
    format: metadata.format,
    width: metadata.width,
    height: metadata.height,
    size: buffer.length,
    hasAlpha: metadata.hasAlpha || false
  };
};

/**
 * Validate uploaded image.
 *
 * Checks both declared MIME type and actual image content.
 */
export const validateUploadedImage = async (file) => {
  if (!file) {
    throw new Error("Image file is required.");
  }

  if (!validateImageMimeType(file.mimetype)) {
    throw new Error("Unsupported image MIME type.");
  }

  if (!validateImageExtension(file.originalname)) {
    throw new Error("Unsupported image file extension.");
  }

  if (!validateImageSize(file.size)) {
    throw new Error("Image exceeds the maximum allowed size of 10 MB.");
  }

  const metadata = await validateImageBuffer(file.buffer);

  const expectedFormats = {
    "image/jpeg": ["jpeg"],
    "image/png": ["png"],
    "image/webp": ["webp"]
  };

  if (!expectedFormats[file.mimetype].includes(metadata.format)) {
    throw new Error("Image MIME type does not match its actual format.");
  }

  return metadata;
};

/**
 * Validate an image URL's syntax.
 *
 * This function does not establish that the remote
 * server is safe to contact.
 */
export const validateImageUrl = (imageUrl) => {
  if (!imageUrl || typeof imageUrl !== "string") {
    return false;
  }

  try {
    const parsedUrl = new URL(imageUrl);

    if (!["http:", "https:"].includes(parsedUrl.protocol)) {
      return false;
    }

    if (parsedUrl.username || parsedUrl.password) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
};

/**
 * Fetch and validate a remote image.
 *
 * IMPORTANT:
 * Use only with a URL obtained through a secure,
 * SSRF-protected fetching layer.
 */
export const validateRemoteImage = async (imageUrl) => {
  if (!validateImageUrl(imageUrl)) {
    throw new Error("Invalid image URL.");
  }

  const response = await axios.get(imageUrl, {
    responseType: "arraybuffer",
    timeout: IMAGE_TIMEOUT,
    maxRedirects: 0,
    maxContentLength: MAX_IMAGE_SIZE,
    maxBodyLength: MAX_IMAGE_SIZE,
    headers: {
      Accept: "image/jpeg,image/png,image/webp"
    }
  });

  const buffer = Buffer.from(response.data);

  const metadata = await validateImageBuffer(buffer);

  return {
    buffer,
    metadata
  };
};

/**
 * Get image format from MIME type.
 */
export const getImageFormat = (mimeType) => {
  const formats = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp"
  };

  return formats[mimeType?.toLowerCase()] || null;
};

/**
 * Get allowed image formats.
 */
export const getAllowedImageFormats = () => {
  return [...ALLOWED_IMAGE_FORMATS];
};

/**
 * Get maximum image size.
 */
export const getMaxImageSize = () => {
  return MAX_IMAGE_SIZE;
};

export default {
  validateImageMimeType,
  validateImageExtension,
  validateImageSize,
  validateImageDimensions,
  validateImageBuffer,
  validateUploadedImage,
  validateImageUrl,
  validateRemoteImage,
  getImageFormat,
  getAllowedImageFormats,
  getMaxImageSize
};