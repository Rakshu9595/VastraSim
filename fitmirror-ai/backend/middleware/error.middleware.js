import multer from "multer";

/**
 * Custom application error class
 */
export class AppError extends Error {
  constructor(message, statusCode = 500, code = "APP_ERROR") {
    super(message);

    this.name = "AppError";
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;

    Error.captureStackTrace?.(this, this.constructor);
  }
}

/**
 * Handle routes that do not exist
 */
export const notFound = (req, res, next) => {
  const error = new AppError(
    `Route not found: ${req.method} ${req.path}`,
    404,
    "ROUTE_NOT_FOUND"
  );

  next(error);
};

/**
 * Global error handling middleware
 */
export const errorHandler = (err, req, res, next) => {
  let statusCode = 500;
  let message = "Internal server error.";
  let errorCode = "INTERNAL_SERVER_ERROR";

  // Custom application errors
  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
    errorCode = err.code;
  }

  // MongoDB invalid ObjectId
  else if (err.name === "CastError") {
    statusCode = 400;
    message = "Invalid resource ID.";
    errorCode = "INVALID_ID";
  }

  // Mongoose validation errors
  else if (err.name === "ValidationError") {
    statusCode = 400;
    message = "Invalid data provided.";
    errorCode = "VALIDATION_ERROR";
  }

  // MongoDB duplicate key error
  else if (err.code === 11000) {
    statusCode = 409;
    message = "A record with this information already exists.";
    errorCode = "DUPLICATE_RECORD";
  }

  // Multer upload errors
  else if (err instanceof multer.MulterError) {
    statusCode = 400;
    errorCode = "UPLOAD_ERROR";

    switch (err.code) {
      case "LIMIT_FILE_SIZE":
        statusCode = 413;
        message = "Image size must not exceed 10 MB.";
        break;

      case "LIMIT_FILE_COUNT":
        message = "Too many files uploaded.";
        break;

      case "LIMIT_UNEXPECTED_FILE":
        message = "Unexpected upload field. Use 'image'.";
        break;

      case "LIMIT_PART_COUNT":
      case "LIMIT_FIELD_COUNT":
        message = "Too many form fields.";
        break;

      default:
        message = "File upload failed.";
    }
  }

  // Invalid JSON request body
  else if (
    err instanceof SyntaxError &&
    err.status === 400 &&
    "body" in err
  ) {
    statusCode = 400;
    message = "Invalid JSON format.";
    errorCode = "INVALID_JSON";
  }

  // Request body too large
  else if (err.type === "entity.too.large") {
    statusCode = 413;
    message = "Request body is too large.";
    errorCode = "PAYLOAD_TOO_LARGE";
  }

  // Unsupported image format
  else if (
    err.message === "Only JPEG, PNG, and WebP images are allowed."
  ) {
    statusCode = 400;
    message = err.message;
    errorCode = "INVALID_IMAGE_FORMAT";
  }

  // AI service errors
  else if (err.code === "AI_SERVICE_UNAVAILABLE") {
    statusCode = 503;
    message = "AI service is temporarily unavailable.";
    errorCode = "AI_SERVICE_UNAVAILABLE";
  }

  else if (err.code === "AI_PROCESSING_FAILED") {
    statusCode = 502;
    message = "Virtual try-on processing failed.";
    errorCode = "AI_PROCESSING_FAILED";
  }

  // Product extraction errors
  else if (err.code === "PRODUCT_EXTRACTION_FAILED") {
    statusCode = 422;
    message = "Unable to extract product information.";
    errorCode = "PRODUCT_EXTRACTION_FAILED";
  }

  // Log error details on the server
  console.error("=================================");
  console.error("FitMirror AI Backend Error");
  console.error("Message:", err.message);
  console.error("Method:", req.method);
  console.error("Path:", req.originalUrl);
  console.error("Status:", statusCode);

  if (process.env.NODE_ENV === "development") {
    console.error("Stack:", err.stack);
  }

  console.error("=================================");

  // Avoid attempting a second response
  if (res.headersSent) {
    return next(err);
  }

  // Send consistent JSON error response
  const response = {
    success: false,
    message,
    errorCode,
  };

  // Show stack trace only in development
  if (process.env.NODE_ENV === "development") {
    response.stack = err.stack;
  }

  return res.status(statusCode).json(response);
};