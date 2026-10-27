import { v2 as cloudinary } from "cloudinary";
import { Readable } from "node:stream";
import { randomUUID } from "node:crypto";

// Import Cloudinary configuration
import "../config/storage.js";

/**
 * Allowed image formats
 */
const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
];

/**
 * Maximum image size: 10 MB
 */
const MAX_FILE_SIZE = 10 * 1024 * 1024;

/**
 * Get verified request owner.
 *
 * Authentication or guest-session middleware must
 * populate req.user.id or req.guestSessionId.
 */
const getUploadOwner = (req) => {
  if (req.user?.id) {
    return {
      type: "user",
      id: String(req.user.id),
    };
  }

  if (req.guestSessionId) {
    return {
      type: "guest",
      id: String(req.guestSessionId),
    };
  }

  return null;
};

/**
 * Validate uploaded image.
 *
 * Note: MIME type alone cannot establish that a file
 * is a safe, valid image. Upload middleware must also
 * inspect the file signature and decode the image.
 */
const validateImage = (file) => {
  if (!file) {
    return "Please upload an image.";
  }

  if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    return "Only JPEG, PNG, and WebP images are allowed.";
  }

  if (file.size > MAX_FILE_SIZE) {
    return "Image size must not exceed 10 MB.";
  }

  if (!file.buffer || file.buffer.length === 0) {
    return "Invalid image data.";
  }

  return null;
};

/**
 * Upload an image buffer to Cloudinary.
 *
 * Images are stored using authenticated delivery
 * rather than public delivery.
 */
const uploadToCloudinary = (file, folder) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        public_id: randomUUID(),
        resource_type: "image",
        type: "authenticated",
        overwrite: false,
        invalidate: true,
      },
      (error, result) => {
        if (error) {
          return reject(error);
        }

        if (!result) {
          return reject(
            new Error("Cloudinary returned no upload result.")
          );
        }

        resolve(result);
      }
    );

    Readable.from(file.buffer).pipe(uploadStream);
  });
};

/**
 * @desc    Upload user's photograph
 * @route   POST /api/uploads/person
 * @access  Authenticated user or verified guest
 */
export const uploadPersonImage = async (req, res) => {
  try {
    // Step 1: Verify request owner
    const owner = getUploadOwner(req);

    if (!owner) {
      return res.status(401).json({
        success: false,
        message:
          "Authentication or a valid guest session is required.",
      });
    }

    // Step 2: Get uploaded image
    const file = req.file;

    // Step 3: Validate image
    const validationError = validateImage(file);

    if (validationError) {
      return res.status(400).json({
        success: false,
        message: validationError,
      });
    }

    // Step 4: Upload to Cloudinary
    const result = await uploadToCloudinary(
      file,
      "fitmirror-ai/persons"
    );

    // Step 5: Return image reference
    return res.status(201).json({
      success: true,
      message: "Person image uploaded successfully.",
      data: {
        imageRef: result.public_id,
        publicId: result.public_id,
        format: result.format,
        width: result.width,
        height: result.height,
        bytes: result.bytes,
        resourceType: result.resource_type,
        deliveryType: result.type,
      },
    });

  } catch (error) {
    console.error(
      "Person Image Upload Error:",
      error.message
    );

    return res.status(500).json({
      success: false,
      message: "Failed to upload person image.",
    });
  }
};

/**
 * @desc    Upload garment image
 * @route   POST /api/uploads/garment
 * @access  Authenticated user or verified guest
 */
export const uploadGarmentImage = async (req, res) => {
  try {
    // Step 1: Verify request owner
    const owner = getUploadOwner(req);

    if (!owner) {
      return res.status(401).json({
        success: false,
        message:
          "Authentication or a valid guest session is required.",
      });
    }

    // Step 2: Get uploaded garment
    const file = req.file;

    // Step 3: Validate image
    const validationError = validateImage(file);

    if (validationError) {
      return res.status(400).json({
        success: false,
        message: validationError,
      });
    }

    // Step 4: Upload garment image
    const result = await uploadToCloudinary(
      file,
      "fitmirror-ai/garments"
    );

    // Step 5: Return garment reference
    return res.status(201).json({
      success: true,
      message: "Garment image uploaded successfully.",
      data: {
        imageRef: result.public_id,
        publicId: result.public_id,
        format: result.format,
        width: result.width,
        height: result.height,
        bytes: result.bytes,
        resourceType: result.resource_type,
        deliveryType: result.type,
      },
    });

  } catch (error) {
    console.error(
      "Garment Image Upload Error:",
      error.message
    );

    return res.status(500).json({
      success: false,
      message: "Failed to upload garment image.",
    });
  }
};