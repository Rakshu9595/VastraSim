import multer from "multer";
import sharp from "sharp";

/**
 * FitMirror AI
 * Image Upload Middleware
 *
 * Responsibilities:
 * 1. Receive image uploads
 * 2. Validate file size
 * 3. Validate image format
 * 4. Inspect actual image content
 * 5. Normalize images
 * 6. Forward validated images to controllers
 */

// Maximum upload size: 10 MB
const MAX_FILE_SIZE = 10 * 1024 * 1024;

// Maximum allowed image dimensions
const MAX_IMAGE_WIDTH = 4096;
const MAX_IMAGE_HEIGHT = 4096;

// Supported MIME types
const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
];

// Supported decoded image formats
const ALLOWED_FORMATS = [
  "jpeg",
  "png",
  "webp",
];

/**
 * Configure Multer memory storage.
 *
 * Images are temporarily stored in memory
 * instead of being saved to the local disk.
 */
const storage = multer.memoryStorage();

/**
 * Validate the MIME type supplied with the upload.
 *
 * This is only an initial check.
 * Actual image validation happens using Sharp.
 */
const fileFilter = (req, file, callback) => {
  if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    const error = new Error(
      "Only JPEG, PNG, and WebP images are allowed."
    );

    error.statusCode = 400;
    error.code = "INVALID_IMAGE_FORMAT";

    return callback(error);
  }

  callback(null, true);
};

/**
 * Configure Multer.
 */
const upload = multer({
  storage,

  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 1,
    fields: 5,
    parts: 6,
  },

  fileFilter,
});

/**
 * Validate and normalize uploaded image.
 *
 * Sharp decodes the image to ensure that
 * the uploaded content is actually an image.
 */
export const validateUploadedImage = async (
  req,
  res,
  next
) => {
  try {
    // Step 1: Check whether an image was uploaded
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Please upload an image.",
        errorCode: "IMAGE_REQUIRED",
      });
    }

    const file = req.file;

    // Step 2: Check the image buffer
    if (!file.buffer || file.buffer.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Uploaded image is empty.",
        errorCode: "EMPTY_IMAGE",
      });
    }

    // Step 3: Check image size
    if (file.size > MAX_FILE_SIZE) {
      return res.status(413).json({
        success: false,
        message: "Image size must not exceed 10 MB.",
        errorCode: "IMAGE_TOO_LARGE",
      });
    }

    // Step 4: Read actual image metadata
    let metadata;

    try {
      metadata = await sharp(file.buffer, {
        limitInputPixels: MAX_IMAGE_WIDTH * MAX_IMAGE_HEIGHT,
        failOn: "error",
      }).metadata();
    } catch {
      return res.status(400).json({
        success: false,
        message: "Invalid or corrupted image.",
        errorCode: "INVALID_IMAGE",
      });
    }

    // Step 5: Validate decoded image format
    if (!ALLOWED_FORMATS.includes(metadata.format)) {
      return res.status(400).json({
        success: false,
        message: "Unsupported image format.",
        errorCode: "UNSUPPORTED_IMAGE_FORMAT",
      });
    }

    // Step 6: Validate image dimensions
    if (
      !metadata.width ||
      !metadata.height ||
      metadata.width > MAX_IMAGE_WIDTH ||
      metadata.height > MAX_IMAGE_HEIGHT
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Image dimensions must not exceed 4096 × 4096 pixels.",
        errorCode: "INVALID_IMAGE_DIMENSIONS",
      });
    }

    // Step 7: Normalize image using Sharp
    let processedBuffer;

    try {
      processedBuffer = await sharp(file.buffer, {
        limitInputPixels: MAX_IMAGE_WIDTH * MAX_IMAGE_HEIGHT,
        failOn: "error",
      })
        .rotate()
        .flatten({ background: "#ffffff" })
        .jpeg({
          quality: 90,
          mozjpeg: true,
        })
        .toBuffer();
    } catch {
      return res.status(400).json({
        success: false,
        message: "Unable to process uploaded image.",
        errorCode: "IMAGE_PROCESSING_FAILED",
      });
    }

    // Step 8: Replace the original buffer
    // with the validated, normalized image
    req.file.buffer = processedBuffer;

    // Step 9: Update file metadata
    req.file.size = processedBuffer.length;
    req.file.mimetype = "image/jpeg";
    req.file.originalname = "fitmirror-upload.jpg";

    // Step 10: Continue to upload controller
    next();

  } catch (error) {
    next(error);
  }
};

/**
 * Multer middleware for uploading one image.
 *
 * The frontend must send the file using
 * the form-data field name: image
 */
export const uploadSingleImage = upload.single("image");

/**
 * Middleware for person photograph uploads.
 */
export const uploadPerson = [
  uploadSingleImage,
  validateUploadedImage,
];

/**
 * Middleware for garment image uploads.
 */
export const uploadGarment = [
  uploadSingleImage,
  validateUploadedImage,
];

export default upload;