import { rateLimit } from "express-rate-limit";

/**
 * Create a consistent rate-limit error response.
 */
const createLimitHandler = (message) => {
  return (req, res) => {
    return res.status(429).json({
      success: false,
      message,
      errorCode: "RATE_LIMIT_EXCEEDED",
      retryAfter: res.getHeader("Retry-After") || null,
    });
  };
};

/**
 * 1. General API Rate Limiter
 *
 * Maximum: 100 requests per 15 minutes per IP.
 */
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,

  limit: 100,

  standardHeaders: "draft-8",

  legacyHeaders: false,

  message: "Too many API requests.",

  handler: createLimitHandler(
    "Too many requests. Please try again after 15 minutes."
  ),
});

/**
 * 2. Product Extraction Rate Limiter
 *
 * Maximum: 20 requests per 15 minutes per IP.
 *
 * Prevents excessive requests to shopping websites.
 */
export const productLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,

  limit: 20,

  standardHeaders: "draft-8",

  legacyHeaders: false,

  handler: createLimitHandler(
    "Too many product extraction requests. Please try again later."
  ),
});

/**
 * 3. Image Upload Rate Limiter
 *
 * Maximum: 15 requests per 15 minutes per IP.
 *
 * Helps prevent excessive Cloudinary uploads.
 */
export const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,

  limit: 15,

  standardHeaders: "draft-8",

  legacyHeaders: false,

  handler: createLimitHandler(
    "Image upload limit reached. Please try again later."
  ),
});

/**
 * 4. Virtual Try-On Rate Limiter
 *
 * Maximum: 5 requests per 15 minutes per IP.
 *
 * Protects expensive AI inference operations.
 */
export const tryOnLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,

  limit: 5,

  standardHeaders: "draft-8",

  legacyHeaders: false,

  handler: createLimitHandler(
    "Virtual try-on limit reached. Please wait before generating another image."
  ),
});

/**
 * 5. History Rate Limiter
 *
 * Maximum: 60 requests per 15 minutes per IP.
 *
 * Prevents excessive database queries.
 */
export const historyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,

  limit: 60,

  standardHeaders: "draft-8",

  legacyHeaders: false,

  handler: createLimitHandler(
    "Too many history requests. Please try again later."
  ),
});