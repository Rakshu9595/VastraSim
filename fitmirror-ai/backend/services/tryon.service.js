import axios from "axios";

import TryOnSession from "../models/TryOnSession.js";
import Product from "../models/Product.js";

import {
  generateSecureImageUrl,
  uploadTryOnResult,
} from "./storage.service.js";

// AI service configuration
const AI_SERVICE_URL = process.env.AI_SERVICE_URL;

const AI_TIMEOUT = 180000; // 3 minutes

// Supported clothing categories
const ALLOWED_CATEGORIES = [
  "upper_body",
  "lower_body",
  "dress",
  "outerwear",
  "one_piece",
  "unknown",
];

// Validate session ownership information
const validateOwner = ({ userId, guestSessionId }) => {
  if (Boolean(userId) === Boolean(guestSessionId)) {
    throw new Error(
      "Provide either a registered user ID or a guest session ID"
    );
  }
};

// Build ownership filter
const getOwnerFilter = ({ userId, guestSessionId }) => {
  validateOwner({ userId, guestSessionId });

  if (userId) {
    return { userId };
  }

  return { guestSessionId };
};

// Validate category
const validateCategory = (category) => {
  if (!ALLOWED_CATEGORIES.includes(category)) {
    throw new Error("Invalid clothing category");
  }

  return category;
};

// Validate image reference
const validateImageReference = (imageRef) => {
  if (
    !imageRef ||
    typeof imageRef !== "string" ||
    !imageRef.startsWith("fitmirror-ai/")
  ) {
    throw new Error("Invalid image reference");
  }
};

// Send images to FastAPI AI service
const generateAIResult = async ({
  sessionId,
  personImageUrl,
  garmentImageUrl,
  category,
}) => {
  if (!AI_SERVICE_URL) {
    throw new Error("AI_SERVICE_URL is not configured");
  }

  const response = await axios.post(
    `${AI_SERVICE_URL}/api/tryon`,
    {
      session_id: sessionId,
      person_image_url: personImageUrl,
      garment_image_url: garmentImageUrl,
      category,
    },
    {
      timeout: AI_TIMEOUT,
      maxContentLength: 20 * 1024 * 1024,
      maxBodyLength: 20 * 1024 * 1024,
      headers: {
        "Content-Type": "application/json",

        // Configure a shared secret on both services.
        ...(process.env.AI_SERVICE_SECRET && {
          "x-ai-service-secret": process.env.AI_SERVICE_SECRET,
        }),
      },
    }
  );

  if (!response.data || response.data.success !== true) {
    throw new Error("AI service failed to generate the try-on result");
  }

  return response.data;
};

// Convert base64 image into a Buffer
const decodeResultImage = (base64Image) => {
  if (
    typeof base64Image !== "string" ||
    base64Image.length === 0
  ) {
    throw new Error("AI service returned an invalid image");
  }

  // Support both raw base64 and data URLs.
  const cleanedBase64 = base64Image.replace(
    /^data:image\/(?:jpeg|jpg|png|webp);base64,/i,
    ""
  );

  const buffer = Buffer.from(cleanedBase64, "base64");

  if (!buffer.length) {
    throw new Error("Generated image is empty");
  }

  // Maximum generated image size: 10 MB.
  if (buffer.length > 10 * 1024 * 1024) {
    throw new Error("Generated image exceeds the size limit");
  }

  return buffer;
};

// Main virtual try-on function
export const createTryOnSession = async ({
  productId,
  personImageRef,
  userId = null,
  guestSessionId = null,
  category = "unknown",
}) => {
  validateOwner({ userId, guestSessionId });

  validateImageReference(personImageRef);

  validateCategory(category);

  if (!productId) {
    throw new Error("Product ID is required");
  }

  // Check whether AI service is configured.
  if (!AI_SERVICE_URL) {
    throw new Error("AI service URL is not configured");
  }

  // Find selected product.
  const product = await Product.findById(productId);

  if (!product) {
    throw new Error("Selected product was not found");
  }

  // Create a new try-on session.
  const session = await TryOnSession.create({
    userId,
    guestSessionId,
    productId: product._id,
    personImageRef,
    category: category || product.category,
    status: "pending",
  });

  try {
    // Mark session as processing.
    session.status = "processing";
    session.startedAt = new Date();

    await session.save();

    // Generate temporary access URL for person's image.
    const personImageUrl = generateSecureImageUrl(
      personImageRef,
      600
    );

    // Product image must be a valid, accessible image URL.
    const garmentImageUrl = product.imageUrl;

    if (!garmentImageUrl) {
      throw new Error("Product garment image is unavailable");
    }

    // Send images to the Python AI service.
    const aiResult = await generateAIResult({
      sessionId: session._id.toString(),
      personImageUrl,
      garmentImageUrl,
      category: session.category,
    });

    // Convert AI-generated image into a Buffer.
    const resultBuffer = decodeResultImage(
      aiResult.result_image_base64
    );

    // Upload generated image to Cloudinary.
    const uploadedResult = await uploadTryOnResult(
      resultBuffer,
      aiResult.format || "jpg"
    );

    // Calculate processing time.
    const completedAt = new Date();

    const processingTime =
      completedAt.getTime() - session.startedAt.getTime();

    // Update session with generated result.
    session.resultImageRef = uploadedResult.imageRef;
    session.status = "completed";
    session.completedAt = completedAt;
    session.processingTime = processingTime;

    session.errorCode = null;
    session.errorMessage = null;

    await session.save();

    return {
      success: true,
      message: "Virtual try-on generated successfully",

      data: {
        sessionId: session._id,
        status: session.status,
        category: session.category,
        resultImageRef: session.resultImageRef,
        processingTime: session.processingTime,
        completedAt: session.completedAt,
      },
    };
  } catch (error) {
    console.error("Try-on generation failed:", error.message);

    // Update session when generation fails.
    session.status = "failed";
    session.errorCode = "TRYON_GENERATION_FAILED";
    session.errorMessage =
      "Unable to generate the virtual try-on. Please try again.";

    session.completedAt = new Date();

    if (session.startedAt) {
      session.processingTime =
        session.completedAt.getTime() -
        session.startedAt.getTime();
    }

    await session.save();

    throw error;
  }
};

// Get try-on session by ID
export const getTryOnSession = async ({
  sessionId,
  userId = null,
  guestSessionId = null,
}) => {
  const ownerFilter = getOwnerFilter({
    userId,
    guestSessionId,
  });

  if (!sessionId) {
    throw new Error("Try-on session ID is required");
  }

  const session = await TryOnSession.findOne({
    _id: sessionId,
    ...ownerFilter,
  })
    .populate("productId")
    .lean();

  if (!session) {
    throw new Error("Try-on session not found");
  }

  return {
    success: true,
    data: session,
  };
};

// Get try-on session status
export const getTryOnStatus = async ({
  sessionId,
  userId = null,
  guestSessionId = null,
}) => {
  const ownerFilter = getOwnerFilter({
    userId,
    guestSessionId,
  });

  const session = await TryOnSession.findOne({
    _id: sessionId,
    ...ownerFilter,
  }).select(
    "status errorCode errorMessage processingTime createdAt completedAt"
  );

  if (!session) {
    throw new Error("Try-on session not found");
  }

  return {
    success: true,
    data: session,
  };
};

export default {
  createTryOnSession,
  getTryOnSession,
  getTryOnStatus,
};