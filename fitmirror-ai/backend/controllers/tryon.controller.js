import mongoose from "mongoose";

import Product from "../models/Product.js";
import TryOnSession from "../models/TryOnSession.js";

import { processTryOn } from "../services/tryon.service.js";

/**
 * Get the verified owner of the current request.
 *
 * The authentication or guest-session middleware
 * must populate one of these values.
 */
const getSessionOwner = (req) => {
  if (req.user?.id) {
    return {
      userId: req.user.id,
    };
  }

  if (req.guestSessionId) {
    return {
      guestSessionId: req.guestSessionId,
    };
  }

  return null;
};

/**
 * Validate garment category.
 */
const validCategories = [
  "tops",
  "bottoms",
  "one-pieces",
];

/**
 * @desc    Create a virtual try-on session
 * @route   POST /api/tryon
 * @access  Authenticated user or verified guest
 */
export const createTryOn = async (req, res) => {
  try {
    // Step 1: Verify the session owner
    const owner = getSessionOwner(req);

    if (!owner) {
      return res.status(401).json({
        success: false,
        message:
          "Authentication or a valid guest session is required.",
      });
    }

    // Step 2: Read request data
    const {
      productId,
      personImageRef,
      garmentImageRef,
      category,
    } = req.body || {};

    // Step 3: Validate the garment category
    if (!validCategories.includes(category)) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid garment category. Choose tops, bottoms, or one-pieces.",
      });
    }

    // Step 4: Validate person image reference
    if (
      typeof personImageRef !== "string" ||
      !personImageRef.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "A valid person image reference is required.",
      });
    }

    // Step 5: Validate garment image reference
    if (
      typeof garmentImageRef !== "string" ||
      !garmentImageRef.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "A valid garment image reference is required.",
      });
    }

    // Step 6: Validate optional product ID
    if (
      productId &&
      !mongoose.isValidObjectId(productId)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID.",
      });
    }

    // Step 7: Check whether the product exists
    if (productId) {
      const productExists = await Product.exists({
        _id: productId,
      });

      if (!productExists) {
        return res.status(404).json({
          success: false,
          message: "Selected product was not found.",
        });
      }
    }

    /*
     * IMPORTANT SECURITY REQUIREMENT
     *
     * Before enabling this endpoint, image references
     * must be verified against storage records.
     *
     * A user must not be able to submit another
     * user's private image reference.
     *
     * The current controller expects image references
     * that have already been authorized by trusted
     * upload/session middleware.
     */

    // Step 8: Create the try-on session
    const session = await TryOnSession.create({
      ...owner,

      productId: productId || null,

      personImageRef: personImageRef.trim(),

      garmentImageRef: garmentImageRef.trim(),

      category,

      status: "pending",

      resultImageRef: null,

      errorCode: null,

      completedAt: null,
    });

    // Step 9: Start AI processing
    try {
      await processTryOn({
        sessionId: session._id.toString(),

        personImageRef: session.personImageRef,

        garmentImageRef: session.garmentImageRef,

        category: session.category,
      });
    } catch (processingError) {
      console.error(
        "Try-On Processing Error:",
        processingError.message
      );

      // Mark the session as failed
      await TryOnSession.updateOne(
        { _id: session._id },
        {
          $set: {
            status: "failed",
            errorCode: "TRYON_PROCESSING_FAILED",
            completedAt: new Date(),
          },
        }
      );

      return res.status(502).json({
        success: false,
        message:
          "Virtual try-on processing failed. Please try again.",
        sessionId: session._id,
      });
    }

    // Step 10: Retrieve updated session
    const updatedSession =
      await TryOnSession.findById(session._id).lean();

    // Step 11: Return the result or current status
    return res.status(200).json({
      success: true,

      message:
        updatedSession?.status === "completed"
          ? "Virtual try-on completed successfully."
          : "Virtual try-on request processed.",

      data: {
        sessionId: session._id,

        status: updatedSession?.status || "pending",

        resultImageRef:
          updatedSession?.resultImageRef || null,

        completedAt:
          updatedSession?.completedAt || null,
      },
    });

  } catch (error) {
    console.error(
      "Create Try-On Error:",
      error.message
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to create virtual try-on session.",
    });
  }
};

/**
 * @desc    Retrieve try-on session status
 * @route   GET /api/tryon/:id
 * @access  Authenticated user or verified guest
 */
export const getTryOnStatus = async (req, res) => {
  try {
    // Step 1: Verify the session owner
    const owner = getSessionOwner(req);

    if (!owner) {
      return res.status(401).json({
        success: false,
        message:
          "Authentication or a valid guest session is required.",
      });
    }

    // Step 2: Read session ID
    const { id } = req.params;

    // Step 3: Validate MongoDB ObjectId
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid try-on session ID.",
      });
    }

    // Step 4: Retrieve only an authorized session
    const session = await TryOnSession.findOne({
      _id: id,
      ...owner,
    })
      .populate(
        "productId",
        "productName productUrl category imageUrl"
      )
      .lean();

    // Step 5: Handle missing session
    if (!session) {
      return res.status(404).json({
        success: false,
        message: "Try-on session not found.",
      });
    }

    // Step 6: Return session status
    return res.status(200).json({
      success: true,

      message: "Try-on session retrieved successfully.",

      data: {
        sessionId: session._id,

        status: session.status,

        category: session.category,

        product: session.productId || null,

        resultImageRef:
          session.status === "completed"
            ? session.resultImageRef
            : null,

        errorCode: session.errorCode || null,

        createdAt: session.createdAt,

        completedAt: session.completedAt || null,
      },
    });

  } catch (error) {
    console.error(
      "Get Try-On Status Error:",
      error.message
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to retrieve try-on session status.",
    });
  }
};